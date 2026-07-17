/**
 * Kito - Orquestrador de Navegadores Remotos (aba "Outros")
 *
 * Evolução do browser-sessions.js para multi-tenant GCP:
 *   - Um orquestrador (VM fixa, PM2) gere N VMs de navegador.
 *   - Cada NAV = 1 navegador (Xvfb + Chrome + x11vnc + websockify) numa VM browser.
 *   - 1 VM = vários NAVs de vários usuários (BROWSERS_PER_VM).
 *   - Teto de MAX_BROWSERS_PER_USER por usuário (o 9º NAV -> 403).
 *   - Fechar NAV mata SÓ aquele stack na VM (stop-browser.sh); NÃO destrói a VM.
 *   - Sem slot livre -> clona nova VM via gcloud.
 *   - /ws/<port>/ é tunelado (TCP) até a VM browser interna que hospeda o NAV.
 *
 * Stack por NAV (rodado na VM browser via /opt/kito-browser/launch-browser.sh):
 *   Xvfb :D -> google-chrome-stable (--display :D) -> x11vnc (:D) -> websockify (--web-token)
 *
 * Uso:
 *   KITO_API_KEY=xxx BROWSERS_PER_VM=12 MAX_BROWSERS_PER_USER=8 \
 *   GCP_PROJECT=... GCP_ZONE=us-central1-a \
 *   WARM_POOL=kito-browser-fast \
 *   node server/browser-orchestrator.js
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import net from 'net';
import http from 'http';
import os from 'os';
import dns from 'dns';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import fsync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';


const execP = promisify(exec);
const execFileP = promisify(execFile);

const __dirname = decodeURI(path.dirname(new URL(import.meta.url).pathname));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ===================== Configuração =====================
const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.KITO_API_KEY || 'CHANGE_ME';
const BROWSERS_PER_VM = parseInt(process.env.BROWSERS_PER_VM || '12', 10);
const MAX_BROWSERS_PER_USER = parseInt(process.env.MAX_BROWSERS_PER_USER || '8', 10);
const GCP_PROJECT = process.env.GCP_PROJECT || '';
const GCP_ZONE = process.env.GCP_ZONE || 'southamerica-east1-a';
const BROWSER_IMAGE_FAMILY = process.env.BROWSER_IMAGE_FAMILY || 'kito-browser';
const BROWSER_MACHINE_TYPE = process.env.BROWSER_MACHINE_TYPE || 'e2-standard-4';
const ORCH_SERVICE_ACCOUNT = process.env.ORCHESTRATOR_SERVICE_ACCOUNT || '';
const HOSTNAME = os.hostname();
// VMs pré-quentes (nomes separados por vírgula). Sem slot livre em nenhuma -> clona.
const WARM_POOL = (process.env.WARM_POOL || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const USE_IAP = (process.env.USE_IAP || 'true') === 'true';
const LOCAL_MODE = (process.env.LOCAL_MODE || 'false') === 'true';
const APP_DIR = process.env.APP_DIR || (LOCAL_MODE ? path.join(PROJECT_ROOT, 'infra') : '/opt/kito-browser');
const WS_PORT_START = 6080;
const WS_PORT_END = 6500;
const DISPLAY_START = 10;
// Comando remoto usa sudo (browser VM); em LOCAL_MODE roda como o próprio usuário.
const SUDO = LOCAL_MODE ? '' : 'sudo ';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);
const supabase = useSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ===================== Estado =====================
// sessions: navId -> { navId, userId, vmName, vmIp, wsPort, token, display, vncPort, status, startedAt }
let sessions = {};
const knownVms = new Set(WARM_POOL);

const SESSIONS_FILE = path.join(APP_DIR, 'sessions.json');

function isLocalVmName(vmName) {
  if (!vmName) return false;
  return vmName === 'localhost' || vmName === '127.0.0.1' || vmName === HOSTNAME || vmName.startsWith(`${HOSTNAME}.`);
}

function loadSessions() {
  if (useSupabase) return; // estado vem do Supabase
  try {
    sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
  } catch {
    sessions = {};
  }
  for (const s of Object.values(sessions)) {
    if (!LOCAL_MODE && isLocalVmName(s.vmName)) continue;
    knownVms.add(s.vmName);
  }
}
function saveSessions() {
  if (useSupabase) return;
  try {
    fs.mkdirSync(APP_DIR, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch { }
}
loadSessions();

// ===================== Store (Supabase ou JSON local) =====================
async function storeGet(navId) {
  if (useSupabase) {
    const { data } = await supabase.from('browser_sessions').select('*').eq('nav_id', navId).maybeSingle();
    return data ? rowToSession(data) : null;
  }
  return sessions[navId] || null;
}
async function storeAll() {
  if (useSupabase) {
    const { data } = await supabase.from('browser_sessions').select('*');
    return (data || []).map(rowToSession);
  }
  return Object.values(sessions);
}
async function storeUpsert(s) {
  if (useSupabase) {
    await supabase.from('browser_sessions').upsert(sessionToRow(s), { onConflict: 'nav_id' });
    return;
  }
  sessions[s.navId] = s;
  saveSessions();
}
async function storeRemove(navId) {
  if (useSupabase) {
    await supabase.from('browser_sessions').delete().eq('nav_id', navId);
    return;
  }
  delete sessions[navId];
  saveSessions();
}
async function storeCountByUser(userId) {
  if (useSupabase) {
    const { count } = await supabase.from('browser_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    return count || 0;
  }
  return Object.values(sessions).filter((s) => s.userId === userId).length;
}
async function storeCountByVm(vmName) {
  if (useSupabase) {
    const { count } = await supabase.from('browser_sessions').select('*', { count: 'exact', head: true }).eq('vm_name', vmName);
    return count || 0;
  }
  return Object.values(sessions).filter((s) => s.vmName === vmName).length;
}
async function storeGetByWsPort(wsPort) {
  if (useSupabase) {
    const { data } = await supabase.from('browser_sessions').select('*').eq('ws_port', wsPort).maybeSingle();
    return data ? rowToSession(data) : null;
  }
  return Object.values(sessions).find((s) => s.wsPort === wsPort) || null;
}

function rowToSession(r) {
  return {
    navId: r.nav_id, userId: r.user_id, vmName: r.vm_name, vmIp: r.vm_ip,
    wsPort: r.ws_port, token: r.token, display: r.display, vncPort: r.vnc_port,
    status: r.status, startedAt: r.started_at, extensions: r.extensions || []
  };
}
function sessionToRow(s) {
  return {
    nav_id: s.navId, user_id: s.userId, vm_name: s.vmName, vm_ip: s.vmIp,
    ws_port: s.wsPort, token: s.token, display: s.display, vnc_port: s.vncPort,
    status: s.status || 'active', started_at: s.startedAt, extensions: s.extensions || []
  };
}

// ===================== Helpers GCP/SSH =====================
function gcloudArgs(extra) {
  return GCP_PROJECT ? ['--project', GCP_PROJECT, ...extra] : extra;
}
async function vmInternalIp(vmName) {
  if (LOCAL_MODE) return '127.0.0.1';

  if (isLocalVmName(vmName)) {
    try {
      const { stdout } = await execFileP('curl', ['-fsSL', '-H', 'Metadata-Flavor: Google', 'http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip']);
      const ip = String(stdout || '').trim();
      if (ip) return ip;
      console.warn(`[orchestrator] metadata lookup returned empty IP for local host ${vmName}`);
    } catch (metadataErr) {
      console.warn(`[orchestrator] local metadata IP lookup failed for ${vmName}: ${metadataErr.message}`);
    }
  }

  if (!GCP_PROJECT) {
    throw new Error('GCP_PROJECT não está configurado');
  }

  const token = await getGcpMetadataToken();
  if (token) {
    try {
      const endpoint = `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(GCP_PROJECT)}/zones/${encodeURIComponent(GCP_ZONE)}/instances/${encodeURIComponent(vmName)}?fields=networkInterfaces/0/networkIP`;
      const { stdout } = await execFileP('curl', ['-fsSL', '-H', `Authorization: Bearer ${token}`, endpoint]);
      const body = JSON.parse(stdout);
      const ip = body?.networkInterfaces?.[0]?.networkIP;
      if (ip) return ip;
      console.warn(`[orchestrator] compute API returned no network IP for ${vmName}`);
    } catch (apiErr) {
      console.warn(`[orchestrator] compute API describe failed for ${vmName}: ${apiErr.message}`);
    }
  }

  const args = ['compute', 'instances', 'describe', vmName,
    '--zone', GCP_ZONE,
    '--format=get(networkInterfaces[0].networkIP)',
    ...gcloudArgs([]),
  ];
  try {
    const { stdout } = await execFileP('gcloud', args);
    return stdout.trim();
  } catch (gcloudErr) {
    console.warn(`[orchestrator] gcloud describe failed for ${vmName}: ${gcloudErr.message}`);
    try {
      const { stdout } = await sshVm(vmName, 'curl -fsSL -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip');
      const ip = String(stdout || '').trim();
      if (ip) return ip;
      console.warn('[orchestrator] SSH metadata lookup returned empty IP; attempting DNS fallback');
    } catch (sshErr) {
      console.warn(`[orchestrator] SSH metadata fallback failed: ${sshErr.message}`);
    }
  }

  try {
    const resolve = promisify(dns.lookup);
    const result = await resolve(`${vmName}.c.${GCP_PROJECT}.internal`);
    if (result && result.address) return result.address;
  } catch (dnsErr) {
    console.warn(`[orchestrator] DNS lookup failed for ${vmName}: ${dnsErr.message}`);
  }

  throw new Error(`Falha ao obter IP da VM ${vmName}: sem resposta do metadata/Compute API/gcloud`);
}

async function getGcpMetadataToken() {
  try {
    const { stdout } = await execFileP('curl', ['-fsSL', '-H', 'Metadata-Flavor: Google', 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token']);
    const data = JSON.parse(stdout);
    return data.access_token;
  } catch (err) {
    console.warn(`[orchestrator] não foi possível obter token de metadata: ${err.message}`);
    return null;
  }
}
async function sshVm(vmName, command) {
  if (LOCAL_MODE) {
    const { stdout, stderr } = await execP(command);
    return { stdout, stderr };
  }
  const iap = USE_IAP ? ['--tunnel-through-iap'] : [];
  const args = ['compute', 'ssh', vmName,
    '--zone', GCP_ZONE,
    ...iap,
    '--strict-host-key-checking=no',
    '--command', command,
    ...gcloudArgs([]),
  ];
  return execFileP('gcloud', args);
}
async function waitVmSshReady(vmName, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await sshVm(vmName, 'echo ready');
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error(`Timeout esperando SSH da VM ${vmName}`);
}
async function cloneBrowserVm() {
  const name = `kito-browser-${Date.now()}`;
  const sa = ORCH_SERVICE_ACCOUNT ? ['--service-account', ORCH_SERVICE_ACCOUNT] : [];
  const args = ['compute', 'instances', 'create', name,
    '--zone', GCP_ZONE,
    '--machine-type', BROWSER_MACHINE_TYPE,
    '--image-family', BROWSER_IMAGE_FAMILY,
    '--no-address', // sem IP externo: acesso via IAP
    ...sa, ...gcloudArgs([]),
  ];
  console.log(`[orchestrator] clonando VM: gcloud ${args.join(' ')}`);
  await execFileP('gcloud', args);
  await waitVmSshReady(name);
  knownVms.add(name);
  return name;
}

// ===================== Alocação de portas/displays =====================
function usedWsPorts() {
  return new Set(Object.values(sessions).map((s) => s.wsPort));
}
function usedDisplays() {
  return new Set(Object.values(sessions).map((s) => s.display));
}
function freeWsPort() {
  const used = usedWsPorts();
  for (let p = WS_PORT_START; p <= WS_PORT_END; p++) if (!used.has(p)) return p;
  return null;
}
function freeDisplay() {
  const used = usedDisplays();
  let d = DISPLAY_START;
  while (used.has(d)) d++;
  return d;
}

// ===================== Escolha de VM =====================
async function pickVm() {
  // 1) warm pool / VMs já conhecidas com slot livre
  for (const vm of knownVms) {
    if (!LOCAL_MODE && isLocalVmName(vm)) continue;
    const count = await storeCountByVm(vm);
    if (count < BROWSERS_PER_VM) return vm;
  }
  // 2) clona nova VM
  return cloneBrowserVm();
}

// ===================== Sessão =====================
async function startSession(navId, userId) {
  const existing = await storeGet(navId);
  if (existing && existing.status === 'active') return existing;

  const userCount = await storeCountByUser(userId);
  if (userCount >= MAX_BROWSERS_PER_USER) {
    const err = new Error('Limite de navegadores atingido para este usuário');
    err.status = 403;
    throw err;
  }

  const wsPort = freeWsPort();
  if (!wsPort) throw new Error('Sem portas WebSocket livres no orquestrador');
  const display = freeDisplay();
  const vncPort = 5900 + display;
  const token = crypto.randomBytes(16).toString('hex');

  const vmName = LOCAL_MODE ? 'localhost' : await pickVm();
  let vmIp = '127.0.0.1';
  if (!LOCAL_MODE) {
    try { vmIp = await vmInternalIp(vmName); } catch (e) { throw new Error(`Falha ao obter IP da VM ${vmName}: ${e.message}`); }
  }

  // Preserva extensões se já havia uma sessão
  const extensions = existing && existing.extensions ? [...existing.extensions] : [];

  const session = {
    navId, userId, vmName, vmIp, wsPort, token, display, vncPort,
    status: 'active', startedAt: Date.now(), extensions
  };

  const extArg = extensions.length > 0 ? extensions.join(',') : 'notoken';
  const launchArgs = [`${APP_DIR}/launch-browser.sh`, navId, String(display), String(vncPort), String(wsPort), token, extArg];
  try {
    if (LOCAL_MODE) {
      await execFileP(launchArgs[0], launchArgs.slice(1));
    } else {
      const launch = `${SUDO}${launchArgs.map((arg) => JSON.stringify(arg)).join(' ')}`;
      await sshVm(vmName, launch);
    }
  } catch (e) {
    throw new Error(`Falha ao subir navegador na VM ${vmName}: ${e.message}`);
  }

  await storeUpsert(session);
  return session;
}

async function stopSession(navId) {
  const s = await storeGet(navId);
  if (!s) return false;
  if (s.vmName && s.vmName !== 'localhost') {
    try { await sshVm(s.vmName, `${SUDO}${APP_DIR}/stop-browser.sh ${navId}`); }
    catch (e) { console.error(`[orchestrator] erro ao parar ${navId} na VM ${s.vmName}: ${e.message}`); }
  } else if (LOCAL_MODE) {
    try { await execFileP(`${APP_DIR}/stop-browser.sh`, [navId]); } catch { }
  }
  await storeRemove(navId);
  return true;
}

async function navigateSession(navId, url) {
  const s = await storeGet(navId);
  if (!s) throw new Error('sessão não encontrada (abra o navegador primeiro)');
  const navigateArgs = [`${APP_DIR}/navigate-browser.sh`, String(s.display), url];
  if (s.vmName && s.vmName !== 'localhost') {
    const cmd = `${SUDO}${navigateArgs.map((arg) => JSON.stringify(arg)).join(' ')}`;
    await sshVm(s.vmName, cmd);
  } else if (LOCAL_MODE) {
    await execFileP(navigateArgs[0], navigateArgs.slice(1));
  }
  return { ok: true, url };
}

// ===================== Express =====================
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[orchestrator] JSON parse error:', err.message);
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }
  next(err);
});

function requireKey(req, res, next) {
  if (req.header('x-api-key') !== API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/api/browser/start', requireKey, async (req, res) => {
  try {
    const navId = String(req.body.navId || '').trim();
    const userId = String(req.body.userId || '').trim();
    if (!navId || !userId) return res.status(400).json({ error: 'navId e userId obrigatórios' });
    const s = await startSession(navId, userId);
    res.json({
      active: true,
      navId: s.navId,
      vmName: s.vmName,
      wsPort: s.wsPort,
      token: s.token,
      wsPath: `/ws/${s.wsPort}/websockify?token=${s.token}`,
      startedAt: s.startedAt,
    });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message });
  }
});

app.post('/api/browser/stop', requireKey, async (req, res) => {
  try {
    const navId = String(req.body.navId || '').trim();
    if (!navId) return res.status(400).json({ error: 'navId obrigatório' });
    const ok = await stopSession(navId);
    res.json({ active: false, stopped: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/browser/navigate', requireKey, async (req, res) => {
  try {
    const navId = String(req.body.navId || '').trim();
    const url = String(req.body.url || '').trim();
    if (!navId || !url) return res.status(400).json({ error: 'navId e url obrigatórios' });
    const r = await navigateSession(navId, url);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/browser/extension', requireKey, express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { navId, extName, base64Zip } = req.body;
    if (!navId || !extName || !base64Zip) return res.status(400).json({ error: 'navId, extName e base64Zip obrigatórios' });

    const s = await storeGet(navId);
    if (!s || s.status !== 'active') return res.status(404).json({ error: 'Sessão não encontrada' });

    // Pasta onde ficarão as extensões deste NAV
    const extBaseDir = path.join(APP_DIR, 'sessions', navId, 'extensions');
    const zipPath = path.join(extBaseDir, `${extName}.zip`);
    const extractPath = path.join(extBaseDir, extName);

    await fs.mkdir(extBaseDir, { recursive: true });

    // Decodifica e salva zip
    const buffer = Buffer.from(base64Zip, 'base64');
    await fs.writeFile(zipPath, buffer);

    // Descompacta
    await fs.rm(extractPath, { recursive: true, force: true });
    await execFileP('unzip', ['-o', zipPath, '-d', extractPath]);

    // Adiciona path à lista de extensões na sessão (evita duplicatas)
    if (!s.extensions) s.extensions = [];
    if (!s.extensions.includes(extractPath)) {
      s.extensions.push(extractPath);
      await storeUpsert(s);
    }

    // Recarrega apenas o processo do Chrome
    const extArg = s.extensions.join(',');
    const cmd = `
      pkill -9 -f "chrome.*user-data-dir=${APP_DIR}/sessions/${navId}/profile" || true
      sleep 1
      CHROME_ARGS="--no-sandbox --disable-gpu --disable-dev-shm-usage"
      if [ -n "${extArg}" ] && [ "${extArg}" != "notoken" ]; then CHROME_ARGS="$CHROME_ARGS --load-extension=${extArg}"; fi
      nohup google-chrome-stable $CHROME_ARGS --user-data-dir="${APP_DIR}/sessions/${navId}/profile" --display ":${s.display}" --start-maximized about:blank >/dev/null 2>&1 &
    `;
    if (s.vmName && s.vmName !== 'localhost') {
      await sshVm(s.vmName, `${SUDO}bash -c ${JSON.stringify(cmd)}`);
    } else if (LOCAL_MODE) {
      await execP(cmd);
    }

    res.json({ ok: true, extensions: s.extensions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/browser/status', requireKey, async (req, res) => {
  const navId = String(req.query.navId || '').trim();
  const s = navId ? await storeGet(navId) : null;
  res.json(s ? { active: true, wsPort: s.wsPort, startedAt: s.startedAt } : { active: false });
});

app.get('/api/browser/list', requireKey, async (_req, res) => {
  const all = await storeAll();
  res.json({ active: all.map((s) => ({ navId: s.navId, vmName: s.vmName, wsPort: s.wsPort })), max: MAX_BROWSERS_PER_USER });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', backend: 'orchestrator', vms: [...knownVms], store: useSupabase ? 'supabase' : 'json' });
});

// ===================== Proxy /ws/<port>/ -> VM browser interna =====================
// O prefixo /ws/<port>/ é removido antes de chegar ao websockify (que serve em /).
// Requisições HTTP (vnc.html + assets do noVNC) são proxyadas; upgrades WebSocket também.

function parseWsPath(reqUrl) {
  try {
    const url = new URL(reqUrl, 'http://localhost');
    const match = url.pathname.match(/^(?:\/ws)?\/(\d+)(?:\/.*)?$/);
    if (!match) return null;
    const port = parseInt(match[1], 10);
    const portStr = `/${port}`;
    const portIdx = url.pathname.indexOf(portStr);
    const rest = url.pathname.slice(portIdx + portStr.length) || '/';
    const path = rest + url.search;
    return { port, rest: path.startsWith('/') ? path : `/${path}` };
  } catch {
    return null;
  }
}

// Helper: proxia HTTP estático do noVNC para a VM browser
async function proxyHttpToVm(req, res, port, rest) {
  let session = null;
  try { session = await storeGetByWsPort(port); } catch { }
  if (!session || !session.vmIp) return res.status(404).end();
  const opts = {
    host: session.vmIp, port,
    method: req.method,
    path: rest,
    headers: { ...req.headers, host: `${session.vmIp}:${port}` },
  };
  const upstream = http.request(opts, (upRes) => {
    res.writeHead(upRes.statusCode || 502, upRes.headers);
    upRes.pipe(res);
  });
  upstream.on('error', () => res.status(502).end());
  req.pipe(upstream);
}

// HTTP (arquivos estáticos do noVNC): /ws/<port>/... OU /<port>/...
// O nginx pode ou não fazer strip do prefixo /ws/ dependendo da versão.
app.use('/ws', async (req, res) => {
  const parsed = parseWsPath(req.url);
  if (!parsed) return res.status(404).end();
  await proxyHttpToVm(req, res, parsed.port, parsed.rest);
});

// Handler alternativo para quando o nginx NÃO mantém /ws/ (faz proxy_pass com rewrite)
app.use(/^\/(6[0-9]{3,4})(\/.*)?$/, async (req, res) => {
  const port = parseInt(req.params[0], 10);
  const rest = req.params[1] || '/';
  const fullRest = rest + (Object.keys(req.query).length ? '?' + new URLSearchParams(req.query).toString() : '');
  await proxyHttpToVm(req, res, port, fullRest);
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Kito-Orchestrator] na porta ${PORT} | browsersPerVm=${BROWSERS_PER_VM} maxPerUser=${MAX_BROWSERS_PER_USER} | store=${useSupabase ? 'supabase' : 'json'} | local=${LOCAL_MODE}`);
});

// WebSocket (túnel TCP cru até a VM browser; prefixo /ws/<port>/ removido)
server.on('upgrade', async (req, clientSocket, head) => {
  const parsed = parseWsPath(req.url);
  if (!parsed) { clientSocket.destroy(); return; }
  const { port, rest } = parsed;
  let session = null;
  try { session = await storeGetByWsPort(port); } catch { }
  if (!session || !session.vmIp) {
    clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    clientSocket.destroy();
    return;
  }

  const upstream = net.connect(port, session.vmIp);
  const cleanup = () => { try { upstream.destroy(); } catch { } try { clientSocket.destroy(); } catch { } };
  upstream.on('error', cleanup);
  clientSocket.on('error', cleanup);

  upstream.pipe(clientSocket);
  clientSocket.pipe(upstream);

  upstream.on('connect', () => {
    // Remove o prefixo /ws/<port>/ antes de repassar ao websockify.
    const pathOnly = rest || '/';
    let reqStr = `${req.method} ${pathOnly} HTTP/${req.httpVersion}\r\n`;
    for (const key of Object.keys(req.headers)) {
      const val = req.headers[key];
      reqStr += `${key}: ${Array.isArray(val) ? val.join(', ') : val}\r\n`;
    }
    reqStr += '\r\n';
    upstream.write(reqStr);
    if (head && head.length) upstream.write(head);
  });
});


// Encerra limpo
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

export default app;
