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
    blandApiKey: string; // kept for redux compatibility, not used
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
  SETTINGS: 'vapi-dialer-settings',
  CAMPAIGNS: 'vapi-dialer-campaigns',
  IS_RUNNING: 'vapi-dialer-is-running',
};

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
  clearCache: () => void;
} | null>(null);

export function DialerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dialerReducer, initialState);

  const startCampaign = (campaignId: string) => {
    dispatch({ type: 'START_CAMPAIGN', campaignId });
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

      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${state.settings.googleSheetsId}/values/A:E?key=${state.settings.googleApiKey}`;
      const response = await fetch(sheetUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        if (response.status === 404) {
          throw new Error('Planilha não encontrada. Verifique se o ID está correto e se é pública.');
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Verifique a API key e se a planilha está pública.');
        } else {
          throw new Error(`Erro na API do Google Sheets (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`);
        }
      }

      const data = await response.json();

      if (!data.values || data.values.length <= 1) {
        throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
      }

      const headers = data.values[0];
      const rows = data.values.slice(1);

      const headerMap: { [key: string]: number } = {};
      headers.forEach((header: string, index: number) => {
        const normalized = header?.toLowerCase().trim();
        if (normalized === 'contato' || normalized === 'nome') headerMap.name = index;
        if (normalized === 'telefone' || normalized === 'phone') headerMap.phone = index;
        if (normalized === 'email') headerMap.email = index;
        if (normalized === 'empresa' || normalized === 'company') headerMap.company = index;
        if (normalized === 'setor' || normalized === 'sector') headerMap.sector = index;
      });

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

      dispatch({ type: 'LOAD_CONTACTS', contacts });
      alert(`Contatos carregados com sucesso! Total: ${contacts.length}`);
    } catch (error) {
      console.error('Error loading contacts:', error);
      alert(`Erro ao carregar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
      localStorage.removeItem(STORAGE_KEYS.IS_RUNNING);
      dispatch({ type: 'UPDATE_SETTINGS', settings: { blandApiKey: '', googleSheetsId: '', googleApiKey: '' } });
      alert('Cache limpo com sucesso! Recarregue a página para ver as mudanças.');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      alert('Erro ao limpar cache.');
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