// Configuração da API Upload-Post
export const UPLOAD_POST_CONFIG = {
  BASE_URL: import.meta.env.VITE_UPLOAD_POST_BASE_URL || 'https://api.upload-post.com',
  API_KEY: import.meta.env.VITE_UPLOAD_POST_API_KEY,
  ENDPOINTS: {
    UPLOAD: '/api/upload',
    SCHEDULE: '/api/schedule',
    STATUS: '/api/status',
    PLATFORMS: '/api/platforms',
  },
  TIMEOUT: 30000, // 30 segundos
};

export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${UPLOAD_POST_CONFIG.API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export const getUploadHeaders = () => ({
  'Authorization': `Bearer ${UPLOAD_POST_CONFIG.API_KEY}`,
  // Não definir Content-Type para FormData - deixar o browser definir
});

export const validateConfig = () => {
  if (!UPLOAD_POST_CONFIG.API_KEY) {
    throw new Error('❌ UPLOAD_POST_API_KEY não configurada no .env');
  }
  if (!UPLOAD_POST_CONFIG.BASE_URL) {
    throw new Error('❌ UPLOAD_POST_BASE_URL não configurada no .env');
  }
  console.log('✅ Configuração Upload-Post validada');
};