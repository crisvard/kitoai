// Configuração do backend de navegadores remotos (orquestrador GCP multi-tenant).
// Valores lidos de variáveis de ambiente no build (VITE_*). Em produção apontam
// para o domínio servido pelo Load Balancer (ex.: https://navegador.seudominio.com).
const env = import.meta.env;

export const BROWSER_API_BASE = (env.VITE_BROWSER_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
export const BROWSER_API_KEY = env.VITE_BROWSER_API_KEY || 'CHANGE_ME';

// Identificador do "usuário" da aba Outros para o teto de 8 navegadores.
// Em produção, viria do auth (ex.: id da sessão). Por enquanto é fixo por instância.
export const BROWSER_USER_ID = env.VITE_BROWSER_USER_ID || 'kito-app-user';

// Teto de navegadores por usuário (deve casar com MAX_BROWSERS_PER_USER do orquestrador).
export const MAX_BROWSERS_PER_USER = parseInt(env.VITE_MAX_BROWSERS_PER_USER || '8', 10);
