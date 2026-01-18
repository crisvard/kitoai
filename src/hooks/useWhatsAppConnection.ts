import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface WhatsAppConnection {
  waha_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  waha_session_name?: string;
  n8n_workflow_id?: string;
  n8n_webhook_url?: string;
  n8n_status: 'not_created' | 'creating' | 'created' | 'validated' | 'active' | 'loaded' | 'error';
  gemini_status: 'not_configured' | 'configured' | 'error';
}

interface WhatsAppActions {
  validateWAHA: (params?: any) => Promise<any>;
  connectWAHA: (params?: any) => Promise<any>;
  reconnectWAHA: (params?: any) => Promise<any>;
  disconnectWAHA: (params?: any) => Promise<any>;
  createN8NWorkflow: (params?: any) => Promise<any>;
  cloneN8NWorkflow: (params?: any) => Promise<any>;
  configureN8NWebhook: (params?: any) => Promise<any>;
  // Appointment tools
  getAppointments: (params?: any) => Promise<any>;
  createAppointment: (params?: any) => Promise<any>;
  rescheduleAppointment: (params?: any) => Promise<any>;
  cancelAppointment: (params?: any) => Promise<any>;
  getAvailableSlots: (params?: any) => Promise<any>;
  getProfessionals: (params?: any) => Promise<any>;
  getServices: (params?: any) => Promise<any>;
}

export const useWhatsAppConnection = () => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connection data
  const loadConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading connection:', error);
        return;
      }

      setConnection(data || {
        waha_status: 'disconnected',
        n8n_status: 'not_created',
        gemini_status: 'configured'
      });
    } catch (err) {
      console.error('Error in loadConnection:', err);
    }
  }, []);

  // Load connection on mount
  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // Auto-refresh status when connecting (with timeout)
  useEffect(() => {
    if (connection?.waha_status === 'connecting') {
      console.log('🔄 [AUTO-REFRESH] Starting auto-refresh for connection status...');
      console.log('🔄 [AUTO-REFRESH] Current connection state:', connection);

      const interval = setInterval(async () => {
        console.log('🔄 [AUTO-REFRESH] Auto-refreshing connection status...');
        await loadConnection();

        // Check if connection became 'connected' and capture WhatsApp user ID
        const { data: currentConnection } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (currentConnection?.waha_status === 'connected') {
          console.log('🎯 [AUTO-REFRESH] Connection established! Capturing WhatsApp user ID...');

          try {
            // Get franchise_id from user's context
            const { data: { user } } = await supabase.auth.getUser();
            let franchiseId = null;

            if (user) {
              // Try to get franchise_id from localStorage (set by FranchiseContext)
              const franchiseData = localStorage.getItem('currentFranchise');
              if (franchiseData) {
                try {
                  const franchise = JSON.parse(franchiseData);
                  franchiseId = franchise.id;
                  console.log('🏢 [AUTO-REFRESH] Found franchise_id from localStorage:', franchiseId);
                } catch (parseError) {
                  console.log('⚠️ [AUTO-REFRESH] Error parsing franchise data from localStorage');
                }
              }

              // If not found in localStorage, try to get from professionals table (following PermissionsContext logic)
              if (!franchiseId) {
                const { data: professionals, error: profError } = await supabase
                  .from('professionals')
                  .select('id, franchise_id, role')
                  .eq('user_id', user.id)
                  .eq('active', true);

                if (profError) {
                  console.log('⚠️ [AUTO-REFRESH] Error fetching professionals:', profError);
                } else {
                  // Find professional with franchise_id (prioritize this)
                  const professionalWithFranchise = professionals?.find(p => p.franchise_id);
                  const anyProfessional = professionals?.[0];

                  if (professionalWithFranchise) {
                    franchiseId = professionalWithFranchise.franchise_id;
                    console.log('🏢 [AUTO-REFRESH] Found franchise_id from professional:', franchiseId);
                  } else if (anyProfessional) {
                    // Professional exists but no franchise_id - use default
                    franchiseId = 'default-franchise-id';
                    console.log('🏢 [AUTO-REFRESH] Professional found but no franchise_id, using default');
                  } else {
                    // No professionals found - use default
                    franchiseId = 'default-franchise-id';
                    console.log('🏢 [AUTO-REFRESH] No professionals found, using default franchise_id');
                  }
                }
              }
            }

            // Call capture-whatsapp-user-id function
            const { data, error } = await supabase.functions.invoke('capture-whatsapp-user-id', {
              body: {
                sessionName: currentConnection.waha_session_name || 'default',
                franchiseId: franchiseId
              }
            });

            if (error) {
              console.error('❌ [AUTO-REFRESH] Error capturing WhatsApp user ID:', error);
            } else if (data?.success) {
              console.log('✅ [AUTO-REFRESH] WhatsApp user ID captured successfully:', data.whatsappUserId);
              console.log('🏢 [AUTO-REFRESH] Franchise ID used:', franchiseId);
            } else {
              console.log('⚠️ [AUTO-REFRESH] WhatsApp user ID capture failed:', data?.error);
            }
          } catch (captureError) {
            console.error('💥 [AUTO-REFRESH] Exception capturing WhatsApp user ID:', captureError);
          }

          // Stop the interval once connected
          clearInterval(interval);
        }
      }, 3000); // Check every 3 seconds

      // Stop polling after 5 minutes to avoid infinite polling
      const timeout = setTimeout(() => {
        console.log('⏰ [AUTO-REFRESH] Stopping auto-refresh after timeout');
        clearInterval(interval);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        console.log('🧹 [AUTO-REFRESH] Cleaning up auto-refresh interval');
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [connection?.waha_status, loadConnection]);

  // Generic function caller
  const callEdgeFunction = async (functionName: string, params?: any) => {
    console.log(`🚀 Calling Edge Function: ${functionName}`, params);
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params || {}
      });

      console.log(`📥 Response from ${functionName}:`, { data, error });

      if (error) {
        console.error(`❌ Edge Function error:`, error);
        throw new Error(error.message);
      }

      if (!data) {
        console.error(`❌ No data returned from ${functionName}`);
        throw new Error('No data returned from function');
      }

      if (!data.success) {
        console.error(`❌ Function returned success=false:`, data);
        throw new Error(data.message || 'Operation failed');
      }

      console.log(`✅ ${functionName} completed successfully`);

      // Reload connection data
      await loadConnection();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`💥 Error in ${functionName}:`, errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // WAHA Actions - Mapeadas para as Edge Functions corretas
  const validateWAHA = useCallback(async (params?: any) => {
    return callEdgeFunction('test-waha-connection', params);
  }, [callEdgeFunction]);

  const connectWAHA = useCallback(async (params?: any) => {
    const result = await callEdgeFunction('create-waha-session', {
      sessionName: 'default',
      ...params
    });

    // Se conexão foi bem-sucedida e temos phoneNumber, salvar chatId
    if (result?.success && result?.phoneNumber) {
      try {
        console.log('📱 [CHATID] Iniciando salvamento do chatId...');
        console.log('📱 [CHATID] Phone number recebido:', result.phoneNumber);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('❌ [CHATID] Usuário não autenticado para salvar chatId:', userError);
          return result;
        }

        // Criar chatId no formato WhatsApp: "551199999999@c.us"
        const chatId = `${result.phoneNumber}@c.us`;
        console.log('🔧 [CHATID] ChatId gerado:', chatId);

        // Verificar se já existe uma configuração para este usuário
        const { data: existingConfig, error: fetchError } = await supabase
          .from('agent_configs')
          .select('id, chatid')
          .eq('user_id', user.id)
          .single();

        console.log('📊 [CHATID] Configuração existente:', existingConfig);

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('❌ [CHATID] Erro ao buscar configuração existente:', fetchError);
        }

        // Salvar chatId na tabela agent_configs
        const updateData = {
          chatid: chatId,
          updated_at: new Date().toISOString()
        };

        let saveResult;
        if (existingConfig) {
          console.log('🔄 [CHATID] Atualizando configuração existente...');
          saveResult = await supabase
            .from('agent_configs')
            .update(updateData)
            .eq('user_id', user.id);
        } else {
          console.log('🆕 [CHATID] Criando nova configuração...');
          saveResult = await supabase
            .from('agent_configs')
            .insert({
              user_id: user.id,
              ...updateData
            });
        }

        if (saveResult.error) {
          console.error('❌ [CHATID] Erro ao salvar chatId:', saveResult.error);
        } else {
          console.log('✅ [CHATID] chatId salvo com sucesso:', chatId);
          console.log('📋 [CHATID] Resultado da operação:', saveResult.data);
        }
      } catch (error) {
        console.error('❌ [CHATID] Erro inesperado ao salvar chatId:', error);
        console.error('❌ [CHATID] Stack trace:', error);
      }
    } else {
      console.log('⚠️ [CHATID] Não foi possível salvar chatId - success:', result?.success, 'phoneNumber:', result?.phoneNumber);
    }

    return result;
  }, [callEdgeFunction]);

  const reconnectWAHA = useCallback(async (params?: any) => {
    return callEdgeFunction('create-waha-session', { sessionName: 'default', ...params });
  }, [callEdgeFunction]);

  const disconnectWAHA = useCallback(async (params?: any) => {
    try {
      // First call the edge function to reset status
      const result = await callEdgeFunction('reset-whatsapp-status', { sessionName: 'default', ...params });

      // Then clean up the database tables as requested
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🧹 [DISCONNECT] Cleaning up WhatsApp tables...');

      // Reset whatsapp_connections table
      const { error: connectionsError } = await supabase
        .from('whatsapp_connections')
        .update({
          waha_status: 'disconnected',
          waha_session_name: null,
          n8n_status: 'not_created',
          n8n_workflow_id: null,
          n8n_webhook_url: null,
          gemini_status: 'not_configured',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (connectionsError) {
        console.error('❌ [DISCONNECT] Error cleaning whatsapp_connections:', connectionsError);
      } else {
        console.log('✅ [DISCONNECT] whatsapp_connections cleaned successfully');
      }

      // Optionally delete whatsapp_sessions (commented out as per user's script)
      // const { error: sessionsError } = await supabaseClient
      //   .from('whatsapp_sessions')
      //   .delete()
      //   .eq('user_id', user.id);

      // if (sessionsError) {
      //   console.error('❌ [DISCONNECT] Error deleting whatsapp_sessions:', sessionsError);
      // } else {
      //   console.log('✅ [DISCONNECT] whatsapp_sessions cleaned successfully');
      // }

      console.log('🎉 [DISCONNECT] WhatsApp disconnection and cleanup completed successfully');

      return result;
    } catch (error) {
      console.error('💥 [DISCONNECT] Error during disconnection cleanup:', error);
      throw error;
    }
  }, [callEdgeFunction]);

  // Função para configurar webhook no WAHA automaticamente
  const configureWAHAWebhook = useCallback(async (webhookUrl: string, agentType: string = 'commercial') => {
    console.log('🔄 [HOOK] Iniciando configuração do webhook WAHA...');
    console.log('🎯 [HOOK] Agent type:', agentType);

    try {
      // Obter configurações WAHA do banco de dados (não localStorage)
      console.log('🔍 [HOOK] Buscando configurações WAHA no banco de dados...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar credenciais WAHA na tabela user_credentials
      const { data: userCredentials, error: configError } = await supabase
        .from('user_credentials')
        .select('waha_url, waha_api_key')
        .eq('user_id', user.id)
        .single();

      console.log('📊 [HOOK] Credenciais WAHA encontradas:', {
        hasConfig: !!userCredentials,
        hasUrl: !!userCredentials?.waha_url,
        hasApiKey: !!userCredentials?.waha_api_key
      });

      if (configError && configError.code !== 'PGRST116') {
        console.error('❌ [HOOK] Erro ao buscar credenciais WAHA:', configError);
        throw new Error('Credenciais WAHA não encontradas');
      }

      const wahaUrl = userCredentials?.waha_url;
      const wahaApiKey = userCredentials?.waha_api_key;
      const sessionName = 'default'; // Sempre usar 'default' como no resto do código

      if (!wahaUrl) {
        console.error('❌ [HOOK] WAHA URL não configurada no banco de dados');
        throw new Error('WAHA URL não encontrada. Configure a conexão WhatsApp primeiro.');
      }

      if (!wahaApiKey) {
        console.error('❌ [HOOK] WAHA API Key não configurada no banco de dados');
        throw new Error('WAHA API Key não encontrada. Configure a conexão WhatsApp primeiro.');
      }

      console.log('🔧 [HOOK] Configurando webhook no WAHA...');
      console.log('🔑 [HOOK] Session:', sessionName);

      // Primeiro, verificar se já existe configuração de webhook
      try {
        console.log('🔍 [HOOK] Verificando configuração existente de webhook...');
        const checkResponse = await fetch(`${wahaUrl}/api/sessions/${sessionName}`, {
          method: 'GET',
          headers: {
            'X-API-Key': wahaApiKey,
          },
        });

        if (checkResponse.ok) {
          const currentConfig = await checkResponse.json();
          const existingWebhooks = currentConfig?.config?.webhooks || [];

          // Verificar se já existe um webhook com a mesma URL
          const webhookExists = existingWebhooks.some((wh: any) => wh.url === webhookUrl);

          if (webhookExists) {
            console.log('✅ [HOOK] Webhook já está configurado no WAHA');
            return; // Já está configurado, não fazer nada
          }
        }
      } catch (checkError) {
        console.log('⚠️ [HOOK] Não foi possível verificar configuração existente:', checkError);
        // Continuar com a configuração mesmo se não conseguir verificar
      }

      // Configurar webhook no WAHA
      const updateData = {
        config: {
          webhooks: [
            {
              url: webhookUrl,
              events: ['message', 'session.status'],
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'kito-expert'
              }
            }
          ]
        }
      };

      console.log('📤 [HOOK] Enviando configuração para WAHA');

      const response = await fetch(`${wahaUrl}/api/sessions/${sessionName}`, {
        method: 'PUT',
        headers: {
          'X-API-Key': wahaApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('📡 [HOOK] Resposta WAHA - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [HOOK] WAHA webhook configuration failed:', response.status, errorText);
        throw new Error(`Falha ao configurar webhook WAHA: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ [HOOK] WAHA webhook configurado com sucesso');
      console.log('🔗 [HOOK] Webhook configurado no WAHA');

    } catch (error) {
      console.error('❌ [HOOK] Falha na configuração do webhook WAHA:', error);
      console.error('❌ [HOOK] Detalhes do erro:', error instanceof Error ? error.message : error);

      // Se for erro de conflito (409), não falhar completamente
      if (error instanceof Error && error.message.includes('409')) {
        console.log('⚠️ [HOOK] WAHA webhook configuration skipped due to conflict');
        return; // Não lançar erro
      }

      throw error;
    }
  }, []);

  // N8N Actions - Mapeadas para as Edge Functions corretas
  const createN8NWorkflow = useCallback(async (params?: any) => {
    return callEdgeFunction('create-n8n-workflow', params);
  }, [callEdgeFunction]);

  const cloneN8NWorkflow = useCallback(async (params?: any) => {
    console.log('🔄 [HOOK] Cloning N8N workflow...');

    // Determinar qual workflow template usar baseado no modo
    const isSchedulerMode = params?.isSchedulerMode || false;
    const workflowTemplateId = isSchedulerMode ? 'u0CCNjw9JMS1iTav' : 'br1jZz0y1gU6EmOg';

    console.log('🎯 [HOOK] Using workflow template:', workflowTemplateId, 'for mode:', isSchedulerMode ? 'scheduler' : 'dashboard');

    const result = await callEdgeFunction('create-n8n-workflow', {
      ...params,
      workflowTemplateId
    });

    // Após clonar workflow, verificar se sessão WAHA ainda está ativa
    if (result && result.success) {
      console.log('✅ [HOOK] Workflow cloned successfully, configuring webhooks...');

      try {
        // 1. Buscar a URL do webhook criada durante create-n8n-workflow
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data: workflowData, error: workflowError } = await supabase
          .from('n8n_workflows')
          .select('webhook_url')
          .eq('user_id', user.id)
          .eq('status', 'created')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (workflowError || !workflowData?.webhook_url) {
          console.error('❌ [HOOK] Could not retrieve webhook URL from database:', workflowError);
          throw new Error('Webhook URL not found in database');
        }

        console.log('🔗 [HOOK] Retrieved webhook URL from database:', workflowData.webhook_url);

        // 2. Configurar webhook no WAHA ANTES de ativar o workflow
        const agentType = isSchedulerMode ? 'scheduling' : 'commercial';
        await configureWAHAWebhook(workflowData.webhook_url, agentType);
        console.log('✅ [HOOK] WAHA webhook configured before workflow activation');

        // 3. Agora validar/ativar o workflow N8N
        const webhookResult = await callEdgeFunction('validate-n8n-workflow', params);
        console.log('✅ [HOOK] N8N workflow validated and activated successfully');

        console.log('✅ [HOOK] All webhooks configured and workflow activated');
      } catch (webhookError) {
        console.error('❌ [HOOK] Failed to configure webhooks:', webhookError);
        // Não falhar o clone por causa dos webhooks
      }
    }

    return result;
  }, [callEdgeFunction, configureWAHAWebhook]);

  const configureN8NWebhook = useCallback(async (params?: any) => {
    console.log('🔄 [HOOK] configureN8NWebhook calling validate-n8n-workflow');
    return callEdgeFunction('validate-n8n-workflow', params);
  }, [callEdgeFunction]);

  // Appointment Tools - Mapeadas para a Edge Function appointment-tools
  const getAppointments = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'get_appointments', data: params });
  }, [callEdgeFunction]);

  const createAppointment = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'create_appointment', data: params });
  }, [callEdgeFunction]);

  const rescheduleAppointment = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'reschedule_appointment', data: params });
  }, [callEdgeFunction]);

  const cancelAppointment = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'cancel_appointment', data: params });
  }, [callEdgeFunction]);

  const getAvailableSlots = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'get_available_slots', data: params });
  }, [callEdgeFunction]);

  const getProfessionals = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'get_professionals', data: params });
  }, [callEdgeFunction]);

  const getServices = useCallback(async (params?: any) => {
    return callEdgeFunction('appointment-tools', { action: 'get_services', data: params });
  }, [callEdgeFunction]);

  const actions: WhatsAppActions = {
    validateWAHA,
    connectWAHA,
    reconnectWAHA,
    disconnectWAHA,
    createN8NWorkflow,
    cloneN8NWorkflow,
    configureN8NWebhook,
    // Appointment tools
    getAppointments,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAvailableSlots,
    getProfessionals,
    getServices,
  };

  return {
    connection,
    loading,
    error,
    actions,
    reload: loadConnection,
  };
};