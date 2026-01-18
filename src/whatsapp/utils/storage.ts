import { AppConfig, AIAgent } from '../types';

const STORAGE_KEY = 'whatsapp_ai_config';

export const defaultAgent: AIAgent = {
  name: 'Assistente Virtual',
  personality: 'Amigável, profissional e prestativo',
  company_presentation: 'Bem-vindo à nossa empresa! Somos especializados em soluções inovadoras.',
  company_knowledge: 'Somos uma empresa dedicada a fornecer soluções de alta qualidade para nossos clientes.',
  product_knowledge: 'Nossos produtos são desenvolvidos com tecnologia de ponta para atender às necessidades do mercado.',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 150,
  enabled: true,
  response_type: 'text',
  elevenlabs_api_key: '',
};

export const defaultConfig: AppConfig = {
  wahaUrl: 'http://whats.kitoai.online:3001',
  wahaApiKey: '1261a25254e14a0493a9fb448f343cfd',
  sessionName: 'default',
  agent: defaultAgent,
  isRunning: false,
};

export const saveConfig = (config: Partial<AppConfig>): void => {
  try {
    const currentConfig = loadConfig();
    const updatedConfig = { ...currentConfig, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
  } catch (error) {
    console.error('Error saving config:', error);
  }
};

export const loadConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return defaultConfig;
};

export const clearConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing config:', error);
  }
};