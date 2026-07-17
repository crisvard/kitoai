// Start Agent Calls Edge Function
// Initiates outbound calls for an agent using VAPI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StartCallsRequest {
  agentId: string;
  vapiAssistantId: string;
  contactIds?: string[]; // Optional: specific contacts to call
  maxConcurrent?: number; // Max concurrent calls for this agent
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  attempt_count: number;
  data?: Record<string, any>;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: StartCallsRequest = await req.json();
    const { agentId, contactIds, maxConcurrent = 1 } = body;
    let { vapiAssistantId } = body;

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('user_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Use agent_provider_id from DB if not supplied in request
    if (!vapiAssistantId) {
      vapiAssistantId = agent.agent_provider_id;
    }

    if (!agentId || !vapiAssistantId) {
      throw new Error('Missing agentId or vapiAssistantId – configure the VAPI assistant first');
    }

    // Alertar se agente não tem número de telefone configurado
    if (!agent.phone_number_provider_id) {
      throw new Error(
        'Agente sem número de telefone configurado. ' +
        'Vá em "Números" na Central de Ligações, cadastre um número e depois ' +
        'acesse as Configurações do agente para selecioná-lo.'
      );
    }

    // Check if agent is already running
    if (agent.status === 'calling') {
      throw new Error('Agent is already calling');
    }

    // Check if the agent has allocated credits
    if (agent.allocated_credits !== undefined && agent.allocated_credits <= 0) {
      throw new Error('Agente sem saldo de créditos. Recarregue nas configurações do agente para continuar ligando.');
    }

    // Check daily limit
    const { data: stats } = await supabase
      .from('agent_daily_stats')
      .select('minutes_used')
      .eq('agent_id', agentId)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (stats && stats.minutes_used >= agent.daily_minutes_limit) {
      throw new Error('Agent has reached daily limit');
    }

    // ── Reset contatos travados de sessões anteriores ──────────────────────────
    // Se um agente foi parado abruptamente, contatos podem ter ficado em 'calling'.
    // Ao iniciar uma nova campanha, resetamos esses contatos para 'pending'
    // para garantir que a fila começa limpa e a discagem funciona normalmente.
    const { count: stuckCount } = await supabase
      .from('agent_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'calling');

    if ((stuckCount ?? 0) > 0) {
      console.log(`[start-agent-calls] Resetting ${stuckCount} stuck 'calling' contacts to 'pending' for agent ${agentId}`);
      await supabase
        .from('agent_contacts')
        .update({ status: 'pending' })
        .eq('agent_id', agentId)
        .eq('status', 'calling');
    }

    // Get contacts to call
    let contactsQuery = supabase
      .from('agent_contacts')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(maxConcurrent);

    if (contactIds && contactIds.length > 0) {
      contactsQuery = contactsQuery.in('id', contactIds);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      throw new Error('No pending contacts to call');
    }

    // Update agent status to calling
    const { error: statusError } = await supabase
      .from('user_agents')
      .update({
        status: 'calling',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (statusError) {
      throw new Error(`Error updating agent status: ${statusError.message}`);
    }

    // Initiate calls via VAPI
    const callPromises = contacts.map(async (contact: Contact) => {
      try {
        // Mark contact as calling
        await supabase
          .from('agent_contacts')
          .update({
            status: 'calling',
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', contact.id);

        // Format phone to E.164 (VAPI requirement)
        let formattedPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
        if (!formattedPhone.startsWith('+')) {
          // Assume Brazilian number if no country code
          if (formattedPhone.length <= 11) {
            formattedPhone = `+55${formattedPhone}`;
          } else {
            formattedPhone = `+${formattedPhone}`;
          }
        }

        // Create VAPI phone call
        // O server.url e serverMessages já estão configurados no assistente VAPI via create/update-vapi-agent.
        // NÃO usar assistantOverrides — isso sobrescreveria as configurações do assistente.
        const vapiCallBody: Record<string, unknown> = {
          assistantId: vapiAssistantId,
          customer: {
            number: formattedPhone,
            name: contact.name,
          },
          metadata: {
            agentId: agentId,
            contactId: contact.id,
            userId: user.id,
          },
        };

        // Adicionar phoneNumberId se configurado no agente
        if (agent.phone_number_provider_id) {
          vapiCallBody.phoneNumberId = agent.phone_number_provider_id;
        } else {
          // Sem número configurado, a chamada vai falhar no VAPI.
          console.warn(`[start-agent-calls] Agent ${agentId} has no phone_number_provider_id configured.`);
        }

        console.log(`[start-agent-calls] Calling contact ${contact.id} at ${formattedPhone} with assistant ${vapiAssistantId}, phoneNumberId: ${agent.phone_number_provider_id || 'NONE'}`);
        console.log(`[start-agent-calls] VAPI call payload: ${JSON.stringify(vapiCallBody)}`);

        const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vapiCallBody),
        });

        if (!vapiResponse.ok) {
          const errorText = await vapiResponse.text();
          let parsedError = errorText;
          try {
            const errorData = JSON.parse(errorText);
            parsedError = JSON.stringify(errorData);
          } catch (e) {
            // Not a JSON response, maybe HTML (e.g. 502 Bad Gateway or 404)
            console.warn(`[start-agent-calls] VAPI returned non-JSON response: ${vapiResponse.status} - ${errorText.substring(0, 100)}...`);
          }
          throw new Error(`VAPI call failed (Status ${vapiResponse.status}): ${parsedError}`);
        }

        const callData = await vapiResponse.json();

        // Create call history record
        await supabase
          .from('agent_call_history')
          .insert({
            agent_id: agentId,
            user_id: user.id,
            contact_id: contact.id,
            vapi_call_id: callData.id,
            phone_number: contact.phone,
            status: 'in-progress',
            started_at: new Date().toISOString(),
          });

        return { success: true, contactId: contact.id, callId: callData.id };
      } catch (error) {
        // Mark contact as failed
        await supabase
          .from('agent_contacts')
          .update({
            status: 'failed',
            attempt_count: (contact.attempt_count ?? 0) + 1,
          })
          .eq('id', contact.id);

        return {
          success: false,
          contactId: contact.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(callPromises);

    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    const failedCount = results.filter((r: { success: boolean }) => !r.success).length;

    // Se TODAS as chamadas falharam (ex: erro de saldo VAPI, formato de telefone)
    // Retornamos um erro 400 para que o frontend exiba o Alerta.
    if (successCount === 0 && failedCount > 0) {
      // Reverter o status do agente para idle
      await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId);

      const firstError = results.find((r: any) => !r.success)?.error;
      throw new Error(`Falha na VAPI ao iniciar chamada: ${firstError}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Started ${successCount} calls, ${failedCount} failed`,
        results: results,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error starting agent calls:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
