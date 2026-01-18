import { WAHASession, Message } from '../types';

export class WAHAApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  async createSession(name: string): Promise<WAHASession> {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        config: {
          proxy: null,
          webhooks: [
            {
              url: `${window.location.origin}/whatsapp-webhook`,
              events: ['session.status'],
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'waha'
              }
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  async getSession(name: string): Promise<WAHASession> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${name}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found');
      }
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  async startSession(name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${name}/start`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }
  }

  async stopSession(name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${name}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop session: ${response.statusText}`);
    }
  }

  async sendMessage(sessionName: string, to: string, text: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sendText`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        session: sessionName,
        chatId: to,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getScreenshot(sessionName: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/screenshot?session=${sessionName}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get screenshot: ${response.statusText}`);
    }

    // Retorna a imagem como base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Função para extrair apenas o QR code da imagem do screenshot
const extractQRCodeFromScreenshot = (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Criar canvas para processar a imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Definir tamanho do canvas (área do QR code - normalmente central)
      const qrSize = Math.min(img.width, img.height) * 0.6; // 60% da menor dimensão
      canvas.width = qrSize;
      canvas.height = qrSize;

      // Calcular posição central da imagem original
      const centerX = img.width / 2;
      const centerY = img.height / 2;

      // Desenhar apenas a área central (onde fica o QR code)
      ctx.drawImage(
        img,
        centerX - qrSize / 2, // x origem
        centerY - qrSize / 2, // y origem
        qrSize, // largura origem
        qrSize, // altura origem
        0, // x destino
        0, // y destino
        qrSize, // largura destino
        qrSize // altura destino
      );

      // Converter para data URL
      const qrDataUrl = canvas.toDataURL('image/png');
      resolve(qrDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
};

interface AgentContext {
  personality: string;
  company_presentation: string;
  company_knowledge: string;
  product_knowledge: string;
}

export const generateAIResponse = async (message: string, context: AgentContext): Promise<string> => {
  console.log('🔄 [AI RESPONSE] Generating AI response for message:', message);
  console.log('📋 [AI RESPONSE] Context:', context);
  console.log('🚫 [AI RESPONSE] NO REAL AI API INTEGRATION FOUND');
  console.log('🚫 [AI RESPONSE] MISSING: Gemini API calls');
  console.log('🚫 [AI RESPONSE] MISSING: OpenAI API calls');
  console.log('🚫 [AI RESPONSE] MISSING: Claude API calls');

  // Simulação de resposta da IA baseada no contexto - em produção, conectar com API real
  console.warn('⚠️ [AI RESPONSE] Using MOCK responses - not connected to real AI API');
  console.error('❌ [AI RESPONSE] SYSTEM IS NOT INTELLIGENT - responses are pre-programmed templates');

  const responses = [
    `Olá! ${context.company_presentation} Como posso ajudá-lo hoje?`,
    `Entendi sua mensagem. ${context.personality} Vou processar isso para você.`,
    `Obrigado por entrar em contato. ${context.company_knowledge} Em que posso ser útil?`,
    `Recebido! Vou analisar sua solicitação considerando ${context.product_knowledge}`,
    `Oi! ${context.personality} Estou aqui para ajudar no que precisar.`,
  ];

  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
  console.log('✅ [AI RESPONSE] Generated mock response:', selectedResponse);

  return selectedResponse;
};