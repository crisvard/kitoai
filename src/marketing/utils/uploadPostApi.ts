import { UPLOAD_POST_CONFIG, getAuthHeaders, getUploadHeaders, validateConfig } from '../../config/uploadPost';

// Modo mock para desenvolvimento
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Tipos para a API
export interface PostData {
  platforms: string[];
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
  platforms: string[];
}

export interface StatusResponse {
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  publishedAt?: string;
  error?: string;
}

// Validação da configuração na inicialização
try {
  validateConfig();
} catch (error) {
  console.error('❌ Erro na configuração Upload-Post:', error.message);
}

// Função auxiliar para fazer requests com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = UPLOAD_POST_CONFIG.TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Upload de mídia para as redes sociais
export const uploadMedia = async (file: File): Promise<string> => {
  if (USE_MOCK_API) {
    console.log('📤 [MOCK] Upload de mídia:', file.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `https://mock-cdn.upload-post.com/${Date.now()}_${file.name}`;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'media');

    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.UPLOAD}`,
      {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Mídia enviada:', data.url);
    return data.url;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw new Error(`Falha no upload: ${error.message}`);
  }
};

// Agendamento de post
export const schedulePost = async (postData: PostData): Promise<PostResponse> => {
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

    // Salvar no localStorage para simulação
    const posts = JSON.parse(localStorage.getItem('upload_post_scheduled') || '[]');
    posts.push({ ...response, ...postData, createdAt: new Date().toISOString() });
    localStorage.setItem('upload_post_scheduled', JSON.stringify(posts));

    return response;
  }

  try {
    // Validar dados obrigatórios
    if (!postData.platforms || postData.platforms.length === 0) {
      throw new Error('Pelo menos uma plataforma deve ser selecionada');
    }
    if (!postData.content || postData.content.trim().length === 0) {
      throw new Error('Conteúdo do post é obrigatório');
    }
    if (!postData.scheduledAt) {
      throw new Error('Data de agendamento é obrigatória');
    }

    const payload = {
      platforms: postData.platforms,
      content: postData.content.trim(),
      title: postData.title?.trim(),
      hashtags: postData.hashtags || [],
      mediaUrls: postData.mediaUrls || [],
      scheduledAt: postData.scheduledAt,
    };

    console.log('📤 Enviando post para API:', payload);

    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.SCHEDULE}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agendamento falhou (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Post agendado:', data);
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
    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.STATUS}/${postId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

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

// Obter plataformas disponíveis
export const getAvailablePlatforms = async (): Promise<string[]> => {
  if (USE_MOCK_API) {
    return ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
  }

  try {
    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.PLATFORMS}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Falha ao obter plataformas (${response.status})`);
    }

    const data = await response.json();
    return data.platforms || [];
  } catch (error) {
    console.error('❌ Erro ao obter plataformas:', error);
    // Retornar plataformas padrão em caso de erro
    return ['instagram', 'facebook', 'twitter'];
  }
};

// Cancelar agendamento de post
export const cancelPost = async (postId: string): Promise<boolean> => {
  if (USE_MOCK_API) {
    console.log('🗑️ [MOCK] Cancelando post:', postId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  try {
    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}${UPLOAD_POST_CONFIG.ENDPOINTS.SCHEDULE}/${postId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao cancelar post:', error);
    return false;
  }
};

// Função para testar conexão com a API
export const testConnection = async (): Promise<boolean> => {
  if (USE_MOCK_API) {
    console.log('🔗 [MOCK] Conexão testada com sucesso');
    return true;
  }

  try {
    const response = await fetchWithTimeout(
      `${UPLOAD_POST_CONFIG.BASE_URL}/health`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      },
      5000 // 5 segundos timeout para teste
    );

    const isConnected = response.ok;
    console.log('🔗 Conexão com API:', isConnected ? '✅ OK' : '❌ Falhou');
    return isConnected;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
};