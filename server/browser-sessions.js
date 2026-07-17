/**
 * Kito - Gerenciador de Navegadores Remotos (Agente de Negociações / aba Outros)
 *
 * Backend que cria/matém/mata um navegador (Xvfb + Chromium + x11vnc + noVNC)
 * POR USUÁRIO. Os processos rodam na VM e sobrevivem ao fechamento da página.
 * Só param quando o usuário chama /api/browser/stop ("Fechar navegador").
 *
 * Stack por usuário:
 *   Xvfb :N                  -> display virtual
 *   chromium --display :N    -> navegador real
 *   x11vnc -display :N       -> expõe VNC na porta 5900+N
 *   websockify (noVNC)       -> transmite VNC via WebSocket (token por arquivo)
 *
 * Uso na VM:  KITO_API_KEY=... MAX_CONCURRENT=2 node server/browser-sessions.js
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;
const APP_DIR = '/opt/kito-browser';
const SESSIONS_DIR = `${APP_DIR}/sessions`;
const TOKENS_DIR = `${APP_DIR}/tokens`;
const NOVNC_DIR = `${APP_DIR}/novnc`;
const WS_PORT_START = 6080;
const WS_PORT_END = 6500;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '2', 10);
const API_KEY = process.env.KITO_API_KEY || 'CHANGE_ME';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// sessions: userId -> { vncPort, wsPort, display, token, pids:[], startedAt }
let sessions = {};
function load() { try { sessions = JSON.parse(fs.readFileSync(`${APP_DIR}/sessions.json`, 'utf8')); } catch { sessions = {}; } }
function save() { try { fs.writeFileSync(`${APP_DIR}/sessions.json`, JSON.stringify(sessions)); } catch {} }

fs.mkdirSync(SESSIONS_DIR, { recursive: true });
fs.mkdirSync(TOKENS_DIR, { recursive: true });
load();

function requireKey(req, res, next) {
  if (req.header('x-api-key') !== API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function freeWsPort() {
  for (let p = WS_PORT_START; p <= WS_PORT_END; p++) {
    if (!Object.values(sessions).some((s) => s.wsPort === p)) return p;
  }
  return null;
}

function freeDisplay() {
  const used = new Set(Object.values(sessions).map((s) => s.display));
  let d = 10;
  while (used.has(d)) d++;
  return d;
}

function startSession(userId) {
  if (sessions[userId]) return sessions[userId];
  if (Object.keys(sessions).length >= MAX_CONCURRENT) {
    throw new Error('Limite de navegadores simultâneos atingido');
  }
  const wsPort = freeWsPort();
  if (!wsPort) throw new Error('Sem portas livres');
  const display = freeDisplay();
  const vncPort = 5900 + display;
  const token = crypto.randomBytes(16).toString('hex');
  const disp = `:${display}`;
  const home = `${SESSIONS_DIR}/${userId}`;
  fs.mkdirSync(home, { recursive: true });

  const xvfb = spawn('Xvfb', [disp, '-screen', '0', '1280x800x24', '-nolisten', 'tcp'], { detached: true, stdio: 'ignore' });
  const chromium = spawn('google-chrome-stable', [
    '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    `--user-data-dir=${home}/profile`, '--start-maximized', 'about:blank',
  ], { detached: true, stdio: 'ignore', env: { ...process.env, DISPLAY: disp } });
  const x11vnc = spawn('x11vnc', [
    '-display', disp, '-rfbport', String(vncPort), '-localhost', '-nopw',
    '-forever', '-shared', '-bg',
  ], { detached: true, stdio: 'ignore' });
  const ws = spawn('/opt/kito-browser/wsenv/bin/websockify', [
    '--web', NOVNC_DIR,
    '--token-plugin', 'TokenFileName',
    '--token-source', TOKENS_DIR,
    `127.0.0.1:${wsPort}`,
  ], { detached: true, stdio: 'ignore' });

  // Arquivo de token: nome=token, conteúdo=host:port do VNC
  fs.writeFileSync(path.join(TOKENS_DIR, token), `127.0.0.1:${vncPort}`);

  sessions[userId] = {
    vncPort, wsPort, display, token,
    pids: [xvfb.pid, chromium.pid, x11vnc.pid, ws.pid],
    startedAt: Date.now(),
  };
  save();
  return sessions[userId];
}

function stopSession(userId) {
  const s = sessions[userId];
  if (!s) return false;
  for (const pid of s.pids || []) {
    try { process.kill(-pid, 'SIGKILL'); } catch {}
    try { process.kill(pid, 'SIGKILL'); } catch {}
  }
  try { fs.unlinkSync(path.join(TOKENS_DIR, s.token)); } catch {}
  delete sessions[userId];
  save();
  return true;
}

app.post('/api/browser/start', requireKey, (req, res) => {
  try {
    const userId = String(req.body.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });
    const s = startSession(userId);
    res.json({
      active: true,
      wsPort: s.wsPort,
      display: s.display,
      token: s.token,
      wsPath: `/ws/${s.wsPort}/websockify?token=${s.token}`,
      startedAt: s.startedAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/browser/stop', requireKey, (req, res) => {
  const userId = String(req.body.userId || '').trim();
  if (!userId) return res.status(400).json({ error: 'userId obrigatório' });
  const ok = stopSession(userId);
  res.json({ active: false, stopped: ok });
});

// Navega o navegador remoto para uma URL (ou página interna chrome://).
// O Chrome repassa a URL para a instância já aberta (comportamento single-instance),
// abrindo uma nova aba no navegador que está sendo transmitido via noVNC.
function normalizeUrl(url) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  if (url.startsWith('chrome://') || url.startsWith('about:')) return url;
  return `https://${url}`;
}

app.post('/api/browser/navigate', requireKey, (req, res) => {
  try {
    const userId = String(req.body.userId || '').trim();
    const rawUrl = String(req.body.url || '').trim();
    if (!userId || !rawUrl) return res.status(400).json({ error: 'userId e url obrigatórios' });
    const s = sessions[userId];
    if (!s) return res.status(404).json({ error: 'sessão não encontrada (abra o navegador primeiro)' });
    const url = normalizeUrl(rawUrl);
    const home = `${SESSIONS_DIR}/${userId}`;
    const disp = `:${s.display}`;
    // Segunda instância com a mesma profile: o Chrome abre a URL numa nova aba.
    spawn('google-chrome-stable', [
      '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      `--user-data-dir=${home}/profile`, url,
    ], { detached: true, stdio: 'ignore', env: { ...process.env, DISPLAY: disp } });
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/browser/status', requireKey, (req, res) => {
  const userId = String(req.query.userId || '').trim();
  const s = sessions[userId];
  res.json(s
    ? { active: true, wsPort: s.wsPort, startedAt: s.startedAt }
    : { active: false });
});

app.get('/api/browser/list', requireKey, (_req, res) => {
  res.json({ active: Object.keys(sessions), max: MAX_CONCURRENT });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', active: Object.keys(sessions).length, max: MAX_CONCURRENT });
});

app.listen(PORT, () => {
  console.log(`[Kito-Browser] Gerenciador de navegadores na porta ${PORT} | max=${MAX_CONCURRENT}`);
});

export default app;
