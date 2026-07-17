import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Agent {
  id: string;
  user_id: string;
  agent_name: string;
  agent_avatar?: string;
  agent_color: string;
  provider: 'vapi' | 'retell' | 'telnyx';
  agent_provider_id?: string;
  voice_id: string;
  voice_provider: string;
  llm_model: string;
  system_prompt: string;
  temperature: number;
  phone_number?: string;
  phone_number_provider_id?: string;
  daily_minutes_limit: number;
  allocated_credits: number;
  minutes_used_today: number;
  calls_made_today: number;
  last_reset_date: string;
  status: 'idle' | 'calling' | 'paused' | 'disabled' | 'error' | 'scheduled';
  scheduled_at?: string;
  current_call_id?: string;
  current_contact_id?: string;
  last_call_at?: string;
  table_position: number;
  max_concurrent_calls: number;
  call_interval_seconds: number;
  retry_failed_calls: boolean;
  max_retry_attempts: number;
  total_calls_made: number;
  total_minutes_used: number;
  total_credits_spent: number;
  success_rate: number;
  first_message?: string;
  webhook_url?: string;
  is_active: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  agent_id: string;
  date: string;
  calls_made: number;
  calls_completed: number;
  calls_failed: number;
  minutes_used: number;
  credits_spent: number;
  avg_call_duration: number;
  success_rate: number;
}

export function useAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os agentes do usuário
  const loadAgents = useCallback(async (silent = false) => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('table_position', { ascending: true });

      if (fetchError) throw fetchError;

      setAgents(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar agentes:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  // Criar novo agente
  const createAgent = async (agentData: Partial<Agent> & { initial_credits?: number }) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Encontrar próxima posição disponível na mesa (0-11)
      const occupiedPositions = agents.map(a => a.table_position);
      let nextPosition = 0;
      for (let i = 0; i < 12; i++) {
        if (!occupiedPositions.includes(i)) {
          nextPosition = i;
          break;
        }
      }

      if (occupiedPositions.length >= 12) {
        throw new Error('Limite de 12 agentes atingido');
      }

      // Criar agente no banco primeiro
      const { data, error: insertError } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_name: agentData.agent_name || 'Novo Agente',
          agent_color: agentData.agent_color || '#c4d82e',
          provider: agentData.provider || 'vapi',
          agent_provider_id: null,
          voice_id: (agentData as any).voice_id || '21m00Tcm4TlvDq8ikWAM',
          voice_provider: (agentData as any).voice_provider || 'elevenlabs',
          llm_model: agentData.llm_model || 'claude-3-5-sonnet-20241022',
          system_prompt: agentData.system_prompt || 'Você é um assistente útil.',
          temperature: agentData.temperature || 0.7,
          table_position: nextPosition,
          daily_minutes_limit: agentData.daily_minutes_limit || 150
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Criar agente no provedor depois (passando o UUID do banco)
      if (agentData.system_prompt) {
        if (agentData.provider === 'vapi') {
          const { data: { session } } = await supabase.auth.getSession();
          const fnUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co'}/functions/v1/create-vapi-agent`;
          const fnRes = await fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({
              agentId: data.id,
              name: agentData.agent_name,
              systemPrompt: agentData.system_prompt,
              voiceId: (agentData as any).voice_id || '21m00Tcm4TlvDq8ikWAM',
              model: (agentData as any).llm_model || 'claude-3-5-sonnet-20241022',
              temperature: (agentData as any).temperature || 0.7,
              firstMessage: (agentData as any).first_message || 'Olá! Como posso ajudar você hoje?',
            }),
          });

          const fnData = await fnRes.json().catch(() => ({}));
          console.log('[createAgent] create-vapi-agent response:', fnRes.status, JSON.stringify(fnData));

          if (!fnRes.ok) {
            await supabase.from('user_agents').delete().eq('id', data.id);
            const detail = fnData?.error || fnData?.vapi_details?.message || fnData?.message || `HTTP ${fnRes.status}`;
            throw new Error(`VAPI: ${detail}`);
          }

        } else if (agentData.provider === 'telnyx') {
          const { data: telnyxData, error: telnyxError } = await supabase.functions.invoke(
            'telnyx-manage-agent',
            {
              body: {
                action: 'create_assistant',
                agentId: data.id,
                name: agentData.agent_name,
                systemPrompt: agentData.system_prompt,
                voiceId: agentData.voice_id || 'Telnyx.Valentina',
                model: agentData.llm_model || 'claude-3-5-sonnet-20241022',
                temperature: agentData.temperature || 0.7,
              }
            }
          );

          if (telnyxError || (telnyxData && !telnyxData.success)) {
            await supabase.from('user_agents').delete().eq('id', data.id);
            const detail = (telnyxData as any)?.error || telnyxError?.message || 'Erro desconhecido';
            throw new Error(detail);
          }
        }
      }

      // Alocar créditos iniciais se fornecido e maior que zero
      if (agentData.initial_credits && agentData.initial_credits > 0) {
        const { error: allocateError } = await supabase.rpc('allocate_agent_credits', {
          p_agent_id: data.id,
          p_user_id: user.id,
          p_amount: agentData.initial_credits
        });
        if (allocateError) {
          console.error('[createAgent] Erro ao alocar créditos iniciais:', allocateError);
          // O fluxo de criação continua, mas o agente será criado com 0 saldo.
        }
      }

      await loadAgents();
      return data;
    } catch (err: any) {
      console.error('Erro ao criar agente:', err);
      throw err;
    }
  };

  // Atualizar agente
  const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
    try {
      // Se atualizou configurações críticas, sincronizar com o provedor
      const agent = agents.find(a => a.id === agentId);
      const hasCriticalUpdate = updates.system_prompt || updates.voice_id || updates.llm_model || updates.temperature !== undefined;

      if (agent?.agent_provider_id && hasCriticalUpdate) {
        if (agent.provider === 'vapi') {
          // Usar fetch direto para ter controle total sobre o erro e o corpo da resposta
          const { data: { session } } = await supabase.auth.getSession();
          const functionUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co'}/functions/v1/update-vapi-agent`;

          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({
              agentId: agentId,
              vapiAssistantId: agent.agent_provider_id,
              name: updates.agent_name,
              systemPrompt: updates.system_prompt,
              voiceId: updates.voice_id,
              model: updates.llm_model,
              temperature: updates.temperature,
              firstMessage: updates.first_message,
            })
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const errorMsg = errorBody.error || errorBody.details || `HTTP ${response.status} ${response.statusText}`;
            console.error('❌ [VAPI-SYNC-ERROR] Erro na atualização da VAPI (Status 400)', errorBody);
            console.error('❌ [VAPI-SYNC-DETAILS]', errorBody.details || 'sem detalhes');
            throw new Error(`Sincronização VAPI: ${errorMsg}`);
          }
          console.log('✅ [VAPI-SYNC-SUCCESS]');
        }
        else if (agent.provider === 'telnyx') {
          const { data, error: telnyxError } = await supabase.functions.invoke('telnyx-manage-agent', {
            body: {
              action: 'update_assistant',
              agentId: agentId,
              assistantId: agent.agent_provider_id,
              name: updates.agent_name,
              systemPrompt: updates.system_prompt,
              voiceId: updates.voice_id,
              model: updates.llm_model,
              temperature: updates.temperature,
            }
          });

          if (telnyxError || (data && !data.success)) {
            const msg = data?.error || telnyxError?.message || 'Erro ao sincronizar com Telnyx';
            throw new Error(msg);
          }
        }
      }

      const { error: updateError } = await supabase
        .from('user_agents')
        .update(updates)
        .eq('id', agentId)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao atualizar agente:', err);
      throw err;
    }
  };

  // Deletar agente
  const deleteAgent = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);

      // 1. Deletar registros filhos primeiro (evita FK constraint)
      await supabase.from('agent_contacts').delete().eq('agent_id', agentId);
      await supabase.from('agent_call_history').delete().eq('agent_id', agentId);
      await supabase.from('agent_daily_stats').delete().eq('agent_id', agentId);

      // 2. Devolver saldo restante (não bloqueia se RPC falhar)
      if (user) {
        const { error: refundErr } = await supabase.rpc('refund_agent_credits', {
          p_agent_id: agentId,
          p_user_id: user.id
        });
        if (refundErr) console.warn('[deleteAgent] refund_agent_credits falhou (ignorado):', refundErr.message);
      }

      // 3. Deletar no provedor se existir (não bloqueia se falhar)
      if (agent?.agent_provider_id) {
        if (agent.provider === 'vapi') {
          const { error: vapiErr } = await supabase.functions.invoke('delete-vapi-agent', {
            body: { agentId: agentId, vapiAssistantId: agent.agent_provider_id }
          });
          if (vapiErr) console.warn('[deleteAgent] delete-vapi-agent falhou (ignorado):', vapiErr.message);
        } else if (agent.provider === 'telnyx') {
          await supabase.functions.invoke('telnyx-manage-agent', {
            body: { action: 'delete_assistant', agentId: agentId, assistantId: agent.agent_provider_id }
          }).catch(e => console.warn('[deleteAgent] telnyx delete falhou (ignorado):', e.message));
        }
      }

      // 4. Deletar agente no banco (garantido)
      const { error: deleteError } = await supabase
        .from('user_agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao deletar agente:', err);
      throw err;
    }
  };


  // Iniciar agente (começar campanha)
  const startAgent = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);

      if (!agent?.agent_provider_id) {
        throw new Error(`Agente não configurado no ${agent?.provider === 'telnyx' ? 'Telnyx' : 'VAPI'}. Configure o assistente primeiro.`);
      }

      // Não atualizar status aqui — a edge function faz isso internamente
      let data: any;
      let fnError: any;

      if (agent.provider === 'telnyx') {
        const result = await supabase.functions.invoke('telnyx-manage-agent', {
          body: { action: 'start_calls', agentId }
        });
        data = result.data;
        fnError = result.error;
      } else {
        const result = await supabase.functions.invoke('start-agent-calls', {
          body: { agentId, vapiAssistantId: agent.agent_provider_id }
        });
        data = result.data;
        fnError = result.error;
      }

      if (fnError) throw fnError;

      // Update success case: optimistically update UI
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'calling' } : a));
      await loadAgents();
      if (data && data.success === false) {
        let errorMsg = data.error || 'Erro desconhecido ao iniciar chamadas.';
        if (errorMsg.includes('Free Vapi numbers do not support international calls')) {
          errorMsg = 'O número atual do agente é gratuito (Teste) e não suporta ligações internacionais (ex: para o Brasil +55).\n\nPara resolver isso, você precisa adicionar um cartão de crédito na sua conta da VAPI e comprar um número pago, ou importar um número da sua própria conta da Twilio nas configurações de Números.';
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Erro ao iniciar agente:', err);
      // Reverter alteração otimista
      await loadAgents();
      throw err;
    }
  };

  // Pausar agente
  const pauseAgent = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'paused' } : a));

      if (agent?.provider === 'telnyx') {
        await supabase.functions.invoke('telnyx-manage-agent', {
          body: { action: 'stop_calls', agentId }
        });
      } else {
        await supabase.functions.invoke('stop-agent-calls', {
          body: { agentId }
        });
      }
      await updateAgent(agentId, { status: 'paused' });
    } catch (err: any) {
      console.error('Erro ao pausar agente:', err);
      await loadAgents();
      throw err;
    }
  };

  // Parar agente
  const stopAgent = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'idle' } : a));

      if (agent?.provider === 'telnyx') {
        await supabase.functions.invoke('telnyx-manage-agent', {
          body: { action: 'stop_calls', agentId }
        });
      } else {
        await supabase.functions.invoke('stop-agent-calls', {
          body: { agentId }
        });
      }
      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao parar agente:', err);
      await loadAgents();
      throw err;
    }
  };

  // Obter estatísticas de um agente
  const getAgentStats = async (agentId: string, days: number = 7): Promise<AgentStats[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error: statsError } = await supabase
        .from('agent_daily_stats')
        .select('*')
        .eq('agent_id', agentId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statsError) throw statsError;

      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
      return [];
    }
  };

  // Mover agente para outra posição
  const moveAgent = async (agentId: string, newPosition: number) => {
    if (newPosition < 0 || newPosition > 11) {
      throw new Error('Posição deve estar entre 0 e 11');
    }

    try {
      // Verificar se posição está ocupada
      const occupant = agents.find(a => a.table_position === newPosition);
      const mover = agents.find(a => a.id === agentId);

      if (!mover) throw new Error('Agente não encontrado');

      if (occupant && occupant.id !== agentId) {
        // Trocar posições
        await supabase
          .from('user_agents')
          .update({ table_position: mover.table_position })
          .eq('id', occupant.id);
      }

      await updateAgent(agentId, { table_position: newPosition });
    } catch (err: any) {
      console.error('Erro ao mover agente:', err);
      throw err;
    }
  };

  // Transferir saldo da conta global para o agente
  const allocateCredits = async (agentId: string, amount: number) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (amount <= 0) throw new Error('O valor precisa ser maior que zero.');

    try {
      const { error } = await supabase.rpc('allocate_agent_credits', {
        p_agent_id: agentId,
        p_user_id: user.id,
        p_amount: amount
      });

      if (error) {
        console.error('RPC Error details:', error);
        throw error;
      }

      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao transferir créditos:', err);
      // Extrair mensagem caso seja retorno via pg exception
      const msg = err.message || err.details || 'Falha na transferência de créditos.';
      throw new Error(msg);
    }
  };

  // Subscrever mudanças em tempo real
  useEffect(() => {
    if (!user) return;

    loadAgents();

    // Custom event para fallback polling - silent para não piscar a tela
    const handleForceRefresh = () => {
      loadAgents(true);
    };
    window.addEventListener('kito_refresh_agents', handleForceRefresh);

    // Canal 1: mudanças nos agentes (status, créditos, etc.)
    const agentsChannel = supabase
      .channel('user-agents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_agents',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadAgents(true);
        }
      )
      .subscribe();

    // Canal 2: término de chamadas (end-of-call-report atualiza agent_call_history)
    // Garante que o front detecta imediatamente quando uma ligação acaba
    // e dispara o refresh de contatos + agentes sem depender do polling.
    const historyChannel = supabase
      .channel(`call-history-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_call_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          // Só reage quando a chamada TERMINA (status final)
          if (['completed', 'failed', 'no-answer', 'voicemail'].includes(newStatus)) {
            console.log('[Realtime] Call ended with status:', newStatus, '→ refreshing agents & contacts');
            loadAgents(true);
            window.dispatchEvent(new Event('kito_refresh_contacts'));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] call-history channel status:', status);
      });

    return () => {
      agentsChannel.unsubscribe();
      historyChannel.unsubscribe();
      window.removeEventListener('kito_refresh_agents', handleForceRefresh);
    };
  }, [user, loadAgents]);

  // Polling persistente de contatos: ativo quando qualquer agente estiver ligando,
  // mesmo que o modal esteja fechado. Garante que o front atualiza após ligação terminar.
  const wasCallingRef = useRef(false);
  useEffect(() => {
    const hasCallingAgent = agents.some(a => a.status === 'calling');

    // Quando o agente para de ligar (calling -> idle): dispara refreshes com delay
    // para garantir que pegamos o status final do webhook (pode demorar 1-5s)
    if (wasCallingRef.current && !hasCallingAgent) {
      console.log('[POLLING] Agent went idle → firing final contact refreshes');
      const t1 = setTimeout(() => window.dispatchEvent(new Event('kito_refresh_contacts')), 500);
      const t2 = setTimeout(() => window.dispatchEvent(new Event('kito_refresh_contacts')), 2000);
      const t3 = setTimeout(() => window.dispatchEvent(new Event('kito_refresh_contacts')), 5000);
      wasCallingRef.current = false;
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    wasCallingRef.current = hasCallingAgent;
    if (!hasCallingAgent || !user) return;

    const syncContacts = async () => {
      // Dispara refresh de contatos para qualquer listener ativo (ex: modal aberto)
      window.dispatchEvent(new Event('kito_refresh_contacts'));
      // Também atualiza agentes silenciosamente para capturar transição idle
      loadAgents(true);
    };

    const interval = setInterval(syncContacts, 2000);
    return () => clearInterval(interval);
  }, [agents, loadAgents, user]);

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    startAgent,
    pauseAgent,
    stopAgent,
    getAgentStats,
    moveAgent,
    allocateCredits,
    refresh: loadAgents
  };
}

// ─── Contatos de um agente específico ───────────────────────────────────────

export interface AgentContact {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  sector?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'skipped' | 'voicemail' | 'no-answer';
  attempt_count: number;
  last_call_at?: string;
  last_call_duration?: number;
  last_call_status?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useAgentContacts(agentId: string | null) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<AgentContact[]>([]);
  const [loading, setLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!agentId || !user) {
      setContacts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agent_contacts')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar contatos:', err);
    }
  }, [agentId, user]);

  const addContacts = async (newContacts: Pick<AgentContact, 'name' | 'phone' | 'email' | 'company' | 'sector'>[]) => {
    if (!agentId || !user) throw new Error('Agente ou usuário não definido');

    const rows = newContacts.map(c => ({
      agent_id: agentId,
      user_id: user.id,
      name: c.name,
      phone: c.phone,
      email: c.email || null,
      company: c.company || null,
      sector: c.sector || null,
      status: 'pending' as const,
    }));

    const { error } = await supabase.from('agent_contacts').insert(rows);
    if (error) throw error;
    await loadContacts();
  };

  const deleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('agent_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user?.id);
    if (error) throw error;
    await loadContacts();
  };

  const deleteAllContacts = async () => {
    if (!agentId || !user) return;
    const { error } = await supabase
      .from('agent_contacts')
      .delete()
      .eq('agent_id', agentId)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadContacts();
  };

  const resetContacts = async () => {
    if (!agentId || !user) return;
    const { error } = await supabase
      .from('agent_contacts')
      .update({ status: 'pending', attempt_count: 0 })
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'failed', 'skipped']);
    if (error) throw error;
    await loadContacts();
  };

  const updateContactsStatus = async (contactIds: string[], newStatus: AgentContact['status']) => {
    if (!user || contactIds.length === 0) return;

    // Se estiver voltando para a fila pendente, reseta as tentativas
    const updateData = newStatus === 'pending'
      ? { status: newStatus, attempt_count: 0 }
      : { status: newStatus };

    // Fazer update em lotes ou usando .in()
    const { error } = await supabase
      .from('agent_contacts')
      .update(updateData)
      .eq('user_id', user.id)
      .in('id', contactIds);

    if (error) throw error;
    await loadContacts();
  };

  // CSV import: "nome,telefone,email,empresa,setor" (header opcional)
  const importFromCSV = async (csvText: string) => {
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) throw new Error('Arquivo CSV vazio');

    // Detectar se primeira linha é cabeçalho
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('nome') || firstLine.includes('name') ||
      firstLine.includes('telefone') || firstLine.includes('phone');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed = dataLines
      .map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        return {
          name: cols[0] || '',
          phone: cols[1] || '',
          email: cols[2] || undefined,
          company: cols[3] || undefined,
          sector: cols[4] || undefined,
        };
      })
      .filter(c => c.name && c.phone);

    if (parsed.length === 0) throw new Error('Nenhum contato válido encontrado no CSV');

    await addContacts(parsed);
    return parsed.length;
  };

  useEffect(() => {
    setLoading(true);
    loadContacts().finally(() => setLoading(false));

    if (!user || !agentId) return;

    // Assina atualizações realtime da tabela de contatos
    const channel = supabase.channel(`contacts_${agentId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_contacts', filter: `agent_id=eq.${agentId}` },
        (payload) => {
          console.log(`[Realtime] Contact update for agent ${agentId}:`, payload.eventType);
          loadContacts();
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for contacts: ${status}`);
      });

    // Polling direto: atualiza contatos a cada 5s.
    const pollInterval = setInterval(() => {
      console.log('[POLL] Refreshing contacts...');
      loadContacts();
    }, 5000);

    // Evento dedicado para refresh imediato
    const handleContactsRefresh = () => loadContacts();
    window.addEventListener('kito_refresh_contacts', handleContactsRefresh);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener('kito_refresh_contacts', handleContactsRefresh);
    };
  }, [user, agentId]); // Removed loadContacts from deps to prevent re-subscription loop

  // Buscar histórico de uma ligação específica (para download de áudio/transcrição)
  const getCallHistory = async (contactId: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('agent_call_history')
      .select('id, vapi_call_id, status, duration_seconds, transcript, summary, recording_url, credits_used, started_at, ended_at')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[getCallHistory] Error:', error.message);
      return null;
    }
    return data;
  };

  const stats = {
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    completed: contacts.filter(c => c.status === 'completed').length,
    unanswered: contacts.filter(c => c.status === 'no-answer' || c.status === 'voicemail' || c.status === 'failed').length,
    calling: contacts.filter(c => c.status === 'calling').length,
    skipped: contacts.filter(c => c.status === 'skipped').length,
  };

  return { contacts, loading, stats, loadContacts, addContacts, deleteContact, deleteAllContacts, resetContacts, importFromCSV, updateContactsStatus, getCallHistory };
}

export function useAgentHistoryList(agentId: string | null) {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!agentId || !user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('agent_call_history')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setHistoryList(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [agentId, user]);

  useEffect(() => {
    loadHistory();
    const handleRefresh = () => loadHistory();
    window.addEventListener('kito_refresh_contacts', handleRefresh);
    return () => window.removeEventListener('kito_refresh_contacts', handleRefresh);
  }, [loadHistory]);

  return { historyList, loadingHistory, loadHistory };
}
