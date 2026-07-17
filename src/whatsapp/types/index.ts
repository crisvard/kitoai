export interface WAHASession {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  qr?: string;
  me?: {
    id: string;
    pushName: string;
  };
}

export interface AIAgent {
  name: string;
  personality: string;
  company_presentation: string;
  company_knowledge: string;
  product_knowledge: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  response_type: 'text' | 'voice';
  elevenlabs_api_key?: string;
}

export interface AppConfig {
  wahaUrl: string;
  wahaApiKey: string;
  sessionName: string;
  session?: WAHASession;
  agent: AIAgent;
  isRunning: boolean;
}

export interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
}