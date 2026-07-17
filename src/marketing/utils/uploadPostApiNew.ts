import { supabase } from '../../lib/supabase';

// Modo mock para desenvolvimento
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Tipos para contas sociais
export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  account_id: string;
  account_name?: string;
  account_username?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes?: string[];
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para posts agendados
export interface ScheduledPost {
  id: string;
  user_id: string;
  upload_post_id?: string;
  title?: string;
  content: string;
  hashtags: string[];
  media_urls: string[];
  platforms: Record<string, string>; // { "instagram": "account_id", "facebook": "account_id" }
  scheduled_at: string;
  status: 'pending' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  error_message?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para a API
export interface PostData {
  platforms: Record<string, string>; // { "instagram": "account_id", "facebook": "account_id" }
  content: string;
  title?: string;
  hashtags: string[];
  mediaUrls: string[];
  scheduledAt: string; // ISO string
}

export interface PostResponse {
  postId: string;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  scheduledAt: string;
  platforms: Record<string, string>;
}

export interface StatusResponse {
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  publishedAt?: string;
  error?: string;
}

// Configuração da API Upload-Post (agora por usuário)
const UPLOAD_POST_CONFIG = {
  BASE_URL: import.meta.env.VITE_UPLOAD_POST_BASE_URL || 'https://api.upload-post.com',
  ENDPOINTS: {
    SCHEDULE: '/api/schedule',
    STATUS: '/api/status',
    CONNECT: '/api/oauth/connect',
    ACCOUNTS: '/api/accounts',
  },
  TIMEOUT: 30000,
};

// Headers de autenticação usando token do usuário
const getAuthHeaders = (accessToken: string) => ({
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// ============================
// CONTAS SOCIAIS
// ============================

// Obter contas sociais conectadas do usuário
export const getUserSocialAccounts = async (): Promise<SocialAccount[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('user_social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar contas sociais:', error);
    return [];
  }

  return data || [];
};

// Conectar conta social (OAuth)
export const connectSocialAccount = async (platform: string, authorizationCode: string): Promise<SocialAccount> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  if (USE_MOCK_API) {
    // Simular conexão OAuth
    console.log('🔗 [MOCK] Conectando conta social:', platform);

    const mockAccount: SocialAccount = {
      id: `mock_${Date.now()}`,
      user_id: user.id,
      platform,
      account_id: `mock_account_${platform}_${Date.now()}`,
      account_name: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
      account_username: `@mock${platform}user`,
      access_token: `mock_token_${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Salvar no banco (usando localStorage por enquanto, já que as tabelas podem não existir)
    const existingAccounts = JSON.parse(localStorage.getItem('user_social_accounts') || '[]');
    existingAccounts.push(mockAccount);
    localStorage.setItem('user_social_accounts', JSON.stringify(existingAccounts));

    return mockAccount;
  }

  try {
    // Em produção, isso seria feito através de um servidor backend
    // que lida com o OAuth flow de forma segura
    const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.CONNECT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        authorizationCode,
        userId: user.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha na conexão OAuth: ${response.statusText}`);
    }

    const accountData = await response.json();

    // Salvar no banco
    const { data, error } = await supabase
      .from('user_social_accounts')
      .insert({
        user_id: user.id,
        platform,
        account_id: accountData.accountId,
        account_name: accountData.accountName,
        account_username: accountData.accountUsername,
        access_token: accountData.accessToken,
        refresh_token: accountData.refreshToken,
        token_expires_at: accountData.tokenExpiresAt,
        scopes: accountData.scopes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar conta social:', error);
      throw new Error('Falha ao salvar conta social');
    }

    return data;
  } catch (error) {
    console.error('Erro na conexão social:', error);
    throw new Error(`Falha ao conectar conta ${platform}: ${error.message}`);
  }
};

// Desconectar conta social
export const disconnectSocialAccount = async (accountId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Usar localStorage por enquanto
  const existingAccounts = JSON.parse(localStorage.getItem('user_social_accounts') || '[]');
  const updatedAccounts = existingAccounts.map((acc: SocialAccount) =>
    acc.id === accountId ? { ...acc, is_active: false } : acc
  );
  localStorage.setItem('user_social_accounts', JSON.stringify(updatedAccounts));

  // Tentar no banco também
  try {
    const { error } = await supabase
      .from('user_social_accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao desconectar conta:', error);
      return false;
    }
  } catch (error) {
    // Ignorar erro do banco por enquanto
  }

  return true;
};

// ============================
// POSTS AGENDADOS
// ============================

// Upload de mídia
export const uploadMedia = async (file: File): Promise<string> => {
  if (USE_MOCK_API) {
    console.log('📤 [MOCK] Upload de mídia:', file.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `https://mock-cdn.upload-post.com/${Date.now()}_${file.name}`;
  }

  // Em produção, isso seria feito com o token do usuário
  const accounts = await getUserSocialAccounts();
  if (accounts.length === 0) {
    throw new Error('Nenhuma conta social conectada');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'media');

  const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accounts[0].access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
};

// Agendamento de post usando contas conectadas
export const schedulePost = async (postData: PostData): Promise<PostResponse> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  if (USE_MOCK_API) {
    console.log('📤 [MOCK] Agendando post:', postData);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const postId = `mock_${Date.now()}`;
    const response: PostResponse = {
      postId,
      status: 'pending',
      scheduledAt: postData.scheduledAt,
      platforms: postData.platforms,
    };

    // Salvar no localStorage
    const existingPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]');
    existingPosts.push({
      id: postId,
      user_id: user.id,
      upload_post_id: postId,
      title: postData.title,
      content: postData.content,
      hashtags: postData.hashtags,
      media_urls: postData.mediaUrls,
      platforms: postData.platforms,
      scheduled_at: postData.scheduledAt,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem('scheduled_posts', JSON.stringify(existingPosts));

    return response;
  }

  try {
    // Validar se o usuário tem as contas conectadas
    const userAccounts = await getUserSocialAccounts();
    const connectedPlatforms = userAccounts.map(acc => acc.platform);

    for (const [platform, accountId] of Object.entries(postData.platforms)) {
      if (!connectedPlatforms.includes(platform)) {
        throw new Error(`Conta ${platform} não conectada. Conecte sua conta primeiro.`);
      }

      // Verificar se a conta específica existe
      const account = userAccounts.find(acc => acc.platform === platform && acc.account_id === accountId);
      if (!account) {
        throw new Error(`Conta ${platform} não encontrada.`);
      }

      // Verificar se o token não expirou
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        throw new Error(`Token da conta ${platform} expirou. Reconecte sua conta.`);
      }
    }

    // Preparar payload para múltiplas plataformas
    const payload = {
      platforms: postData.platforms,
      content: postData.content.trim(),
      title: postData.title?.trim(),
      hashtags: postData.hashtags || [],
      mediaUrls: postData.mediaUrls || [],
      scheduledAt: postData.scheduledAt,
    };

    console.log('📤 Enviando post para API:', payload);

    // Usar o token da primeira conta
    const firstAccount = userAccounts.find(acc => acc.platform === Object.keys(postData.platforms)[0]);
    if (!firstAccount) {
      throw new Error('Nenhuma conta válida encontrada');
    }

    const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.SCHEDULE}`, {
      method: 'POST',
      headers: getAuthHeaders(firstAccount.access_token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agendamento falhou (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Post agendado:', data);

    // Salvar no localStorage por enquanto
    const existingPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]');
    existingPosts.push({
      id: data.postId,
      user_id: user.id,
      upload_post_id: data.postId,
      title: postData.title,
      content: postData.content,
      hashtags: postData.hashtags,
      media_urls: postData.mediaUrls,
      platforms: postData.platforms,
      scheduled_at: postData.scheduledAt,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem('scheduled_posts', JSON.stringify(existingPosts));

    return data;
  } catch (error) {
    console.error('❌ Erro no agendamento:', error);
    throw new Error(`Falha no agendamento: ${error.message}`);
  }
};

// Verificar status do post
export const getPostStatus = async (postId: string): Promise<StatusResponse> => {
  if (USE_MOCK_API) {
    // Simular status baseado no tempo
    const now = Date.now();
    const postTime = parseInt(postId.split('_')[1] || '0');
    const elapsed = now - postTime;

    let status: 'pending' | 'scheduled' | 'published' | 'failed' = 'pending';
    if (elapsed > 10000) status = 'scheduled';
    if (elapsed > 20000) status = 'published';

    console.log('📊 [MOCK] Status do post:', status);
    return { status };
  }

  try {
    // Buscar token de uma conta conectada
    const accounts = await getUserSocialAccounts();
    if (accounts.length === 0) {
      throw new Error('Nenhuma conta social conectada');
    }

    const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.STATUS}/${postId}`, {
      method: 'GET',
      headers: getAuthHeaders(accounts[0].access_token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'failed', error: 'Post não encontrado' };
      }
      const errorText = await response.text();
      throw new Error(`Verificação de status falhou (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Status do post:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    throw new Error(`Falha na verificação de status: ${error.message}`);
  }
};

// Obter posts agendados do usuário
export const getUserScheduledPosts = async (): Promise<ScheduledPost[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Usar localStorage por enquanto
  const posts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]');
  return posts.filter((post: ScheduledPost) => post.user_id === user.id);
};

// Cancelar agendamento de post
export const cancelScheduledPost = async (postId: string): Promise<boolean> => {
  if (USE_MOCK_API) {
    console.log('🗑️ [MOCK] Cancelando post:', postId);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Atualizar no localStorage
    const posts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]');
    const updatedPosts = posts.map((post: ScheduledPost) =>
      post.upload_post_id === postId ? { ...post, status: 'cancelled' } : post
    );
    localStorage.setItem('scheduled_posts', JSON.stringify(updatedPosts));

    return true;
  }

  try {
    const accounts = await getUserSocialAccounts();
    if (accounts.length === 0) return false;

    const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.SCHEDULE}/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(accounts[0].access_token),
    });

    if (response.ok) {
      // Atualizar no localStorage
      const posts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]');
      const updatedPosts = posts.map((post: ScheduledPost) =>
        post.upload_post_id === postId ? { ...post, status: 'cancelled' } : post
      );
      localStorage.setItem('scheduled_posts', JSON.stringify(updatedPosts));
    }

    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao cancelar post:', error);
    return false;
  }
};

// Testar conexão com a API usando conta do usuário
export const testConnection = async (): Promise<boolean> => {
  if (USE_MOCK_API) {
    console.log('🔗 [MOCK] Conexão testada com sucesso');
    return true;
  }

  try {
    const accounts = await getUserSocialAccounts();
    if (accounts.length === 0) return false;

    const response = await fetch(`${UPLOAD_POST_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      headers: getAuthHeaders(accounts[0].access_token),
    });

    const isConnected = response.ok;
    console.log('🔗 Conexão com API:', isConnected ? '✅ OK' : '❌ Falhou');
    return isConnected;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
};