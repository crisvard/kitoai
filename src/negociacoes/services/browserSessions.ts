import { BROWSER_API_BASE, BROWSER_API_KEY, BROWSER_USER_ID } from '../config';

export interface BrowserSession {
  active: boolean;
  wsPort: number;
  token: string;
  wsPath: string;
  navId: string;
  vmName?: string;
  startedAt: number;
}

export interface BrowserStatus {
  active: boolean;
  wsPort?: number;
  startedAt?: number;
}

export class BrowserLimitError extends Error {
  constructor(message = 'Limite de navegadores atingido') {
    super(message);
    this.name = 'BrowserLimitError';
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BROWSER_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': BROWSER_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // 403 = teto de 8 navegadores por usuário atingido.
    if (res.status === 403) {
      const text = await res.text().catch(() => '');
      throw new BrowserLimitError(text || 'Você atingiu o máximo de 8 navegadores.');
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Inicia (ou retorna a sessão já existente) o navegador do NAV/usuário.
export function startBrowser(navId: string): Promise<BrowserSession> {
  return post<BrowserSession>('/api/browser/start', { navId, userId: BROWSER_USER_ID });
}

export function stopBrowser(navId: string): Promise<{ active: boolean; stopped: boolean }> {
  return post<{ active: boolean; stopped: boolean }>('/api/browser/stop', { navId, userId: BROWSER_USER_ID });
}

export async function getBrowserStatus(navId: string): Promise<BrowserStatus> {
  const res = await fetch(
    `${BROWSER_API_BASE}/api/browser/status?navId=${encodeURIComponent(navId)}&userId=${encodeURIComponent(BROWSER_USER_ID)}`,
    { headers: { 'x-api-key': BROWSER_API_KEY } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<BrowserStatus>;
}

// Monta a URL do noVNC para embutir em um iframe.
// O path /ws/<port>/vnc.html?path=websockify&token=... deve casar com o que o
// nginx do orquestrador + websockify (modo --web-token) servem.
export function buildNovncUrl(session: BrowserSession): string {
  return `${BROWSER_API_BASE}/ws/${session.wsPort}/vnc.html?path=websockify&token=${session.token}&autoconnect=true&reconnect=true&resize=scale`;
}
