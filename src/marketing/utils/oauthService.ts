import { supabase } from '../../lib/supabase';

// Configuração OAuth para diferentes plataformas
const OAUTH_CONFIG = {
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'user_profile,user_media',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'pages_manage_posts,pages_read_engagement',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'tweet.write,users.read',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'w_member_social,r_liteprofile',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize',
    clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'user.info.basic,video.publish',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'https://www.googleapis.com/auth/youtube.upload',
  },
};

// Estado global para controlar popups OAuth
let oauthPopup: Window | null = null;
let oauthState: string | null = null;

// Gerar state único para segurança OAuth
const generateState = (): string => {
  const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem('oauth_state', state);
  return state;
};

// Verificar se o state é válido
const validateState = (state: string): boolean => {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return storedState === state;
};

// Iniciar fluxo OAuth
export const initiateOAuth = async (platform: keyof typeof OAUTH_CONFIG): Promise<void> => {
  const config = OAUTH_CONFIG[platform];
  if (!config) {
    throw new Error(`Plataforma ${platform} não suportada`);
  }

  if (!config.clientId) {
    throw new Error(`Client ID não configurado para ${platform}. Configure VITE_${platform.toUpperCase()}_CLIENT_ID`);
  }

  // Gerar state para segurança
  oauthState = generateState();

  // Construir URL de autorização
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', oauthState);

  // Para Twitter e LinkedIn, adicionar PKCE
  if (platform === 'twitter' || platform === 'linkedin') {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
  }

  // Abrir popup
  const popupWidth = 600;
  const popupHeight = 700;
  const left = (window.innerWidth - popupWidth) / 2;
  const top = (window.innerHeight - popupHeight) / 2;

  oauthPopup = window.open(
    authUrl.toString(),
    'oauth-popup',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!oauthPopup) {
    throw new Error('Popup bloqueado. Permita popups para este site.');
  }

  // Retornar promise que resolve quando o OAuth for concluído
  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (oauthPopup?.closed) {
        clearInterval(checkClosed);
        reject(new Error('Popup fechado pelo usuário'));
      }
    }, 1000);

    // Escutar mensagens da popup
    const handleMessage = (event: MessageEvent) => {
      // Verificar origem para segurança
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);

        const { code, state, platform: returnedPlatform } = event.data;

        if (!validateState(state)) {
          reject(new Error('Estado OAuth inválido - possível ataque CSRF'));
          return;
        }

        if (returnedPlatform !== platform) {
          reject(new Error('Plataforma retornada não corresponde'));
          return;
        }

        resolve();
      } else if (event.data.type === 'OAUTH_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        reject(new Error(event.data.error || 'Erro no OAuth'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout após 5 minutos
    setTimeout(() => {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      if (oauthPopup && !oauthPopup.closed) {
        oauthPopup.close();
      }
      reject(new Error('Timeout no OAuth'));
    }, 5 * 60 * 1000);
  });
};

// Gerar code verifier para PKCE
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

// Gerar code challenge para PKCE
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
};

// Codificar para base64 URL-safe
const base64URLEncode = (array: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Processar callback OAuth (usado na página de callback)
export const processOAuthCallback = async (code: string, state: string, platform: string): Promise<void> => {
  try {
    // Validar state
    if (!validateState(state)) {
      throw new Error('Estado OAuth inválido');
    }

    // Obter code verifier se necessário
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_code_verifier');

    // Trocar code por tokens via API UploadPost
    const tokens = await exchangeCodeForTokens(code, platform, codeVerifier);

    // Salvar conta no banco
    await saveSocialAccount(platform, tokens);

    // Notificar popup de sucesso
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_SUCCESS',
        code,
        state,
        platform
      }, window.location.origin);
    }

  } catch (error) {
    console.error('Erro no processamento OAuth:', error);

    // Notificar popup de erro
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: error.message
      }, window.location.origin);
    }
  }
};

// Trocar authorization code por tokens
const exchangeCodeForTokens = async (code: string, platform: string, codeVerifier?: string | null) => {
  const UPLOAD_POST_BASE_URL = import.meta.env.VITE_UPLOAD_POST_BASE_URL || 'https://api.upload-post.com';

  const response = await fetch(`${UPLOAD_POST_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      platform,
      redirectUri: `${window.location.origin}/oauth/callback`,
      codeVerifier: codeVerifier || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na troca de tokens: ${response.statusText}`);
  }

  return await response.json();
};

// Salvar conta social conectada
const saveSocialAccount = async (platform: string, tokens: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('user_social_accounts')
    .insert({
      user_id: user.id,
      platform,
      account_id: tokens.accountId,
      account_name: tokens.accountName,
      account_username: tokens.accountUsername,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokens.expiresAt,
      scopes: tokens.scopes,
    });

  if (error) {
    console.error('Erro ao salvar conta social:', error);
    throw new Error('Falha ao salvar conta social');
  }
};

// Verificar se uma plataforma tem client ID configurado
export const isPlatformConfigured = (platform: string): boolean => {
  const config = OAUTH_CONFIG[platform as keyof typeof OAUTH_CONFIG];
  return !!(config && config.clientId);
};

// Obter plataformas suportadas e configuradas
export const getSupportedPlatforms = (): string[] => {
  return Object.keys(OAUTH_CONFIG).filter(platform => isPlatformConfigured(platform));
};