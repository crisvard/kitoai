import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  sector?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  callId?: string;
  lastCallTime?: string;
  duration?: number;
  notes?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'stopped' | 'running' | 'paused';
  contacts: Contact[];
  completedCalls: number;
  failedCalls: number;
  totalCalls: number;
  startTime?: string;
  settings: {
    callInterval: number;
    maxConcurrentCalls: number;
    retryAttempts: number;
    callTask?: string;
  };
}

interface DialerState {
  campaigns: Campaign[];
  currentCampaign?: Campaign;
  isRunning: boolean;
  settings: {
    blandApiKey: string;
    googleSheetsId: string;
    googleApiKey: string;
  };
}

type DialerAction =
  | { type: 'START_CAMPAIGN'; campaignId: string }
  | { type: 'STOP_CAMPAIGN' }
  | { type: 'PAUSE_CAMPAIGN' }
  | { type: 'UPDATE_CONTACT'; contactId: string; updates: Partial<Contact> }
  | { type: 'ADD_CAMPAIGN'; campaign: Campaign }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<DialerState['settings']> }
  | { type: 'LOAD_CONTACTS'; contacts: Contact[] }
  | { type: 'UPDATE_CAMPAIGN_STATS'; stats: { completed: number; failed: number; total: number } };

const STORAGE_KEYS = {
  SETTINGS: 'bland-dialer-settings',
  CAMPAIGNS: 'bland-dialer-campaigns',
  IS_RUNNING: 'bland-dialer-is-running',
};

// Funções de persistência
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Erro ao salvar no localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Erro ao carregar do localStorage:', error);
    return defaultValue;
  }
};

const initialState: DialerState = {
  campaigns: loadFromStorage(STORAGE_KEYS.CAMPAIGNS, []),
  isRunning: loadFromStorage(STORAGE_KEYS.IS_RUNNING, false),
  settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {
    blandApiKey: '',
    googleSheetsId: '',
    googleApiKey: '',
  }),
};

function dialerReducer(state: DialerState, action: DialerAction): DialerState {
  let newState: DialerState;

  switch (action.type) {
    case 'START_CAMPAIGN':
      const campaign = state.campaigns.find(c => c.id === action.campaignId);
      newState = {
        ...state,
        currentCampaign: campaign ? { ...campaign, status: 'running', startTime: new Date().toISOString() } : undefined,
        isRunning: true,
      };
      saveToStorage(STORAGE_KEYS.IS_RUNNING, newState.isRunning);
      return newState;

    case 'STOP_CAMPAIGN':
      newState = {
        ...state,
        currentCampaign: state.currentCampaign ? { ...state.currentCampaign, status: 'stopped' } : undefined,
        isRunning: false,
      };
      saveToStorage(STORAGE_KEYS.IS_RUNNING, newState.isRunning);
      return newState;

    case 'PAUSE_CAMPAIGN':
      newState = {
        ...state,
        currentCampaign: state.currentCampaign ? { ...state.currentCampaign, status: 'paused' } : undefined,
        isRunning: false,
      };
      saveToStorage(STORAGE_KEYS.IS_RUNNING, newState.isRunning);
      return newState;

    case 'UPDATE_CONTACT':
      newState = {
        ...state,
        campaigns: state.campaigns.map(campaign => ({
          ...campaign,
          contacts: campaign.contacts.map(contact =>
            contact.id === action.contactId ? { ...contact, ...action.updates } : contact
          ),
        })),
        currentCampaign: state.currentCampaign ? {
          ...state.currentCampaign,
          contacts: state.currentCampaign.contacts.map(contact =>
            contact.id === action.contactId ? { ...contact, ...action.updates } : contact
          ),
        } : undefined,
      };
      saveToStorage(STORAGE_KEYS.CAMPAIGNS, newState.campaigns);
      return newState;

    case 'ADD_CAMPAIGN':
      newState = {
        ...state,
        campaigns: [...state.campaigns, action.campaign],
        currentCampaign: action.campaign,
      };
      saveToStorage(STORAGE_KEYS.CAMPAIGNS, newState.campaigns);
      return newState;

    case 'UPDATE_SETTINGS':
      newState = {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };
      saveToStorage(STORAGE_KEYS.SETTINGS, newState.settings);
      return newState;

    case 'LOAD_CONTACTS':
      if (!state.currentCampaign) return state;
      newState = {
        ...state,
        currentCampaign: {
          ...state.currentCampaign,
          contacts: action.contacts,
          totalCalls: action.contacts.length,
        },
      };
      saveToStorage(STORAGE_KEYS.CAMPAIGNS, newState.campaigns);
      return newState;

    case 'UPDATE_CAMPAIGN_STATS':
      if (!state.currentCampaign) return state;
      newState = {
        ...state,
        currentCampaign: {
          ...state.currentCampaign,
          completedCalls: action.stats.completed,
          failedCalls: action.stats.failed,
          totalCalls: action.stats.total,
        },
      };
      saveToStorage(STORAGE_KEYS.CAMPAIGNS, newState.campaigns);
      return newState;

    default:
      return state;
  }
}

const DialerContext = createContext<{
  state: DialerState;
  dispatch: React.Dispatch<DialerAction>;
  startCampaign: (campaignId: string) => void;
  stopCampaign: () => void;
  pauseCampaign: () => void;
  loadContactsFromSheets: () => Promise<void>;
  makeCall: (contactId: string) => Promise<void>;
  clearCache: () => void;
} | null>(null);

export function DialerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dialerReducer, initialState);

  const startCampaign = async (campaignId: string) => {
    dispatch({ type: 'START_CAMPAIGN', campaignId });
    
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      processDialingQueue(campaign);
    }
  };

  const stopCampaign = () => {
    dispatch({ type: 'STOP_CAMPAIGN' });
  };

  const pauseCampaign = () => {
    dispatch({ type: 'PAUSE_CAMPAIGN' });
  };

  const loadContactsFromSheets = async () => {
    try {
      if (!state.settings.googleSheetsId || !state.settings.googleApiKey) {
        alert('Configure o ID da planilha e a API key do Google primeiro.');
        return;
      }

      // Fetch data directly from Google Sheets API
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${state.settings.googleSheetsId}/values/A:E?key=${state.settings.googleApiKey}`;

      const response = await fetch(sheetUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        console.error('Google Sheets API error:', errorData);

        if (response.status === 404) {
          throw new Error('Planilha não encontrada. Verifique se o ID da planilha está correto e se a planilha está pública ou compartilhada.');
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Verifique se:\n1. A API key do Google Sheets está correta\n2. A planilha está configurada como "Pública" (Compartilhar → Qualquer pessoa com o link pode visualizar)\n3. A API do Google Sheets está ativada no Google Cloud Console');
        } else if (response.status === 400) {
          throw new Error('Requisição inválida. Verifique os parâmetros da API.');
        } else {
          throw new Error(`Erro na API do Google Sheets (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`);
        }
      }

      const data = await response.json();

      if (!data.values || data.values.length <= 1) {
        throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
      }

      // Validate headers
      const headers = data.values[0];
      console.log('Cabeçalhos encontrados:', headers);

      // Parse the data (skip header row)
      const rows = data.values.slice(1);

      // Map columns based on headers
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header: string, index: number) => {
        const normalized = header?.toLowerCase().trim();
        if (normalized === 'contato' || normalized === 'nome') headerMap.name = index;
        if (normalized === 'telefone' || normalized === 'phone') headerMap.phone = index;
        if (normalized === 'email') headerMap.email = index;
        if (normalized === 'empresa' || normalized === 'company') headerMap.company = index;
        if (normalized === 'setor' || normalized === 'sector') headerMap.sector = index;
        if (normalized === 'status') headerMap.status = index;
      });

      console.log('Mapeamento de colunas:', headerMap);

      const contacts: Contact[] = rows
        .map((row: string[], index: number) => ({
          id: `contact-${Date.now()}-${index}`,
          name: headerMap.name !== undefined ? row[headerMap.name] || '' : row[0] || '',
          company: headerMap.company !== undefined ? row[headerMap.company] || '' : row[3] || '',
          phone: headerMap.phone !== undefined ? row[headerMap.phone] || '' : row[1] || '',
          sector: headerMap.sector !== undefined ? row[headerMap.sector] || '' : '',
          status: 'pending' as const,
        }))
        .filter((contact: Contact) => contact.name.trim() && contact.phone.trim());

      console.log('Contatos finais após filtro:', contacts);

      dispatch({ type: 'LOAD_CONTACTS', contacts });
      alert(`Contatos carregados com sucesso! Total: ${contacts.length}`);
    } catch (error) {
      console.error('Error loading contacts:', error);
      alert(`Erro ao carregar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const makeCall = async (contactId: string) => {
    const contact = state.currentCampaign?.contacts.find(c => c.id === contactId);
    if (!contact) return;

    if (!state.settings.blandApiKey) {
      alert('Configure a API key do Bland primeiro.');
      return;
    }

    console.log('Iniciando ligação para:', contact.name, contact.phone);
    console.log('Usando configuração direta da agente Isa da Agente Zap');

    dispatch({ type: 'UPDATE_CONTACT', contactId, updates: { status: 'calling' } });

    try {
      // Make real call using Bland API directly from browser with full configuration
      const blandResponse = await fetch('https://api.bland.ai/v1/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.settings.blandApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: contact.phone.startsWith('+') ? contact.phone : `+${contact.phone}`,
          voice: "June",
          wait_for_greeting: true,
          record: true,
          answered_by_enabled: true,
          noise_cancellation: true,
          interruption_threshold: 50,
          block_interruptions: false,
          max_duration: 8,
          model: "base",
          language: "pt-BR",
          background_track: "office",
          voicemail_action: "hangup",
          task: "Você é Isabela, uma agente de vendas simpática e experiente da Agente Zap, especializada em ligações frias para promover nosso agente de atendimento automatizado. Seu objetivo é entender o negócio do prospect, identificar dores com agendamentos manuais, oferecer o Agente Zap de forma personalizada, contornar objeções e fechar vendas ou agendamentos de demonstração. Seja cordial, empática e direta – mantenha conversas naturais, como uma ligação amigável no Brasil.\n\n**Instruções Gerais:**\n- IMPORTANTE: Aguarde sempre o prospect dizer \"alô\" ou fazer uma saudação antes de começar a falar\n- Após ouvir a saudação do prospect, inicie a ligação se apresentando: \"Oi, estamos ligando Estamos ligando para ajudar empresas como a sua a automatizarem agendamentos pelo WhatsApp. Você tem um minutinho?\"\n- Use dados da planilha (Google Sheets) fornecidos: nome do prospect, empresa, telefone e detalhes do negócio (ex.: setor como clínica médica ou salão de beleza). Personalize: \"Vi que você trabalha com [setor, ex.: atendimento em clínicas], e o Agente Zap resolve problemas como agendamentos manuais caóticos.\"\n- Foque em entender necessidades: Faça perguntas simples como \"Como vocês cuidam dos agendamentos hoje? É tudo manual ou tem muita remarcação?\" ou \"Quais dificuldades vocês têm com horários e calendários?\"\n- Ofereça o Agente Zap: Destaque benefícios e preço: \"O Agente Zap é um agente no WhatsApp que deixa os clientes marcarem, remarcarem e cancelarem atendimentos sozinhos, 24 horas por dia. Integra com o Google Calendar (se conectar com o Gmail) ou mostra tudo na nossa interface: total de clientes agendados, dias e horários na palma da mão. Libera a secretária para focar na recepção, sem responder mensagens o dia todo. Custa apenas R$100 por mês ou R$300 por ano – praticamente nada comparado ao tempo que economiza. E tem teste gratuito de 2 dias!\"\n- Contorne objeções comuns:\n  - \"Não uso WhatsApp para negócios\": \"Muitas clientes começaram assim, mas é fácil e prático. Podemos mostrar rapidinho como funciona.\"\n  - \"Já tenho um sistema\": \"Que bom, o Agente Zap integra sem problema e adiciona automação. Como é o que vocês usam?\"\n  - \"Custo alto\": \"O investimento é de apenas R$100 por mês – menos que o salário de uma secretária por algumas horas. Com atendimento 24/7, você economiza tempo e evita erros, e o investimento volta rapidinho. Faça o teste de 2 dias grátis para ver!\"\n  - \"Não confio em automação\": \"Entendo perfeitamente, mas eu aqui sou treinada para conversas naturais. Experimente o teste gratuito e veja.\"\n- Feche a venda: Se positivo, diga \"Que tal agendarmos uma demonstração hoje? Ou prefere o teste de 2 dias?\" ou \"Posso mandar um link para você testar grátis agora?\". Registre o resultado (ex.: demo agendada, rejeição) para atualizar a planilha.\n- Se o prospect não estiver disponível, peça para ligar de volta ou deixe mensagem: \"Oi, é a Isa da Agente Zap, retornando sobre a automação de agendamentos.\"\n- Mantenha conversas curtas (máx. 3-4 minutos). Seja direta e responda rapidamente às perguntas. Encerre com: \"Valeu pela atenção. Se precisar de algo, é só chamar!\"\n\n**Regras Técnicas:**\n- Use português brasileiro, linguagem cordial e profissional, como uma conversa amigável.\n- Adapte-se ao tom: para clínicas, seja mais cuidadosa; para salões, um pouco mais leve.\n- Registre logs: Envie transcrição e status (ex.: \"Demo agendada\", \"Objeção: custo\") via webhook para n8n/Google Sheets.\n- Evite pressão – foque em ajudar e mostrar valor.\n\n**Exemplo de Conversa Inicial:**\nIsa: \"Oi, Dra. Ana da Clínica XYZ. Sou Isa da Agente Zap. Vi que vocês atendem pacientes e nosso agente no WhatsApp automatiza agendamentos 24/7, integrando com o Google Calendar. Custa R$100 por mês e libera a secretária. Tem um minutinho?\"\nProspect: \"Quanto custa mesmo?\"\nIsa: \"Só R$100 por mês ou R$300 por ano – obsoleto comparado aos benefícios. Teste grátis por 2 dias!\"\n[Continue baseado na resposta...]\n\n- Aguarde o prospect dizer \"alô\" ou uma saudação antes de iniciar. Se houver silêncio, diga \"Alô?\" para confirmar.\n- Sempre inicie a ligação se apresentando: \"Oi, estamos ligando Estamos ligando para ajudar empresas como a sua a automatizarem agendamentos pelo WhatsApp. Você tem um minutinho?\"\n[resto do prompt...]\n",
          temperature: 0.4,
          ivr_mode: true,
          metadata: {
            contact_name: contact.name,
            contact_email: contact.email || '',
            contact_company: contact.company || '',
            contact_sector: contact.sector || '',
          },
        }),
      });

      if (!blandResponse.ok) {
        const errorData = await blandResponse.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        console.error('Bland API error:', errorData);

        let errorMessage = 'Erro na ligação';
        if (blandResponse.status === 401) {
          errorMessage = 'API key do Bland inválida';
        } else if (blandResponse.status === 404) {
          errorMessage = 'Agent ID não encontrado';
        } else if (blandResponse.status === 400) {
          const errorDetails = await blandResponse.json().catch(() => ({ error: { message: 'Dados inválidos' } }));
          errorMessage = 'Dados inválidos para a ligação';

          if (errorDetails.error?.message) {
            errorMessage += `: ${errorDetails.error.message}`;
          }

          // Check for common issues
          if (errorDetails.error?.message?.includes('agent_id')) {
            errorMessage = 'Agent ID inválido ou não encontrado. Verifique se o Agent ID está correto.';
          } else if (errorDetails.error?.message?.includes('phone_number') || errorDetails.error?.message?.includes('TOO_LONG')) {
            errorMessage = 'Número de telefone inválido. Use apenas números sem + ou espaços, ex: 5519995126321';
          }
        } else if (blandResponse.status === 429) {
          errorMessage = 'Limite de requisições excedido';
        }

        dispatch({
          type: 'UPDATE_CONTACT',
          contactId,
          updates: {
            status: 'failed',
            lastCallTime: new Date().toISOString(),
            notes: errorMessage,
          }
        });
        return;
      }

      const callData = await blandResponse.json();
      console.log('Call initiated:', callData);

      // For now, we'll mark as completed immediately since we don't have real-time status updates
      // In a production app, you'd want to poll the call status or use webhooks
      dispatch({
        type: 'UPDATE_CONTACT',
        contactId,
        updates: {
          status: 'completed',
          callId: callData.call_id || `call-${Date.now()}`,
          lastCallTime: new Date().toISOString(),
          duration: callData.duration || Math.floor(Math.random() * 300) + 30, // Fallback for demo
        }
      });

    } catch (error) {
      console.error('Error making call:', error);
      dispatch({
        type: 'UPDATE_CONTACT',
        contactId,
        updates: {
          status: 'failed',
          lastCallTime: new Date().toISOString(),
          notes: error instanceof Error ? error.message : 'Erro na ligação',
        }
      });
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
      localStorage.removeItem(STORAGE_KEYS.IS_RUNNING);

      // Reset state to initial values
      dispatch({ type: 'UPDATE_SETTINGS', settings: { blandApiKey: '', googleSheetsId: '', googleApiKey: '' } });
      // Note: We can't directly reset campaigns and isRunning through dispatch since they don't have specific actions
      // The page will need to be refreshed to see the full reset

      alert('Cache limpo com sucesso! Recarregue a página para ver as mudanças.');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      alert('Erro ao limpar cache.');
    }
  };

  const processDialingQueue = async (campaign: Campaign) => {
    const pendingContacts = campaign.contacts.filter(c => c.status === 'pending');

    for (const contact of pendingContacts) {
      if (!state.isRunning) break;

      await makeCall(contact.id);

      if (campaign.settings.callInterval > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.settings.callInterval * 1000));
      }
    }
  };

  return (
    <DialerContext.Provider
      value={{
        state,
        dispatch,
        startCampaign,
        stopCampaign,
        pauseCampaign,
        loadContactsFromSheets,
        makeCall,
        clearCache,
      }}
    >
      {children}
    </DialerContext.Provider>
  );
}

export function useDialer() {
  const context = useContext(DialerContext);
  if (!context) {
    throw new Error('useDialer must be used within a DialerProvider');
  }
  return context;
}