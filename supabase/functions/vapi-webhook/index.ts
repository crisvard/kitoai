// VAPI Webhook Edge Function
// Receives webhook events from VAPI and processes call events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');

// Custo por minuto em créditos
const COST_PER_MINUTE = 0.50;

// Cal.com configuration
const CAL_COM_API_KEY = Deno.env.get('CAL_COM_API_KEY') || 'cal_live_bdf1a128849d80a5529c336314bc8381';
const CAL_COM_USERNAME = 'cristopher-ramos-vieira-kitoexpert';
const CAL_COM_EVENT_SLUG = 'demo-app-academia';
const CAL_COM_API_BASE = 'https://api.cal.com/v2';

serve(async (req) => {
  // GET ping for keep-alive (called by cron to avoid cold starts)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', ts: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const payload = await req.json();
    const message = payload.message;

    if (!message) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('[VAPI WEBHOOK] Event type:', message.type);

    switch (message.type) {
      case 'status-update':
        await handleStatusUpdate(supabase, message);
        break;

      case 'end-of-call-report':
        await handleEndOfCall(supabase, message);
        break;

      case 'transcript':
        await handleTranscript(supabase, message);
        break;

      case 'tool-calls': {
        const toolCallResult = await handleToolCalls(message);
        return new Response(JSON.stringify(toolCallResult), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      default:
        console.log('[VAPI WEBHOOK] Unhandled message type:', message.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 200, // Return 200 to prevent VAPI from retrying
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});

// ================================================================
// STATUS UPDATE
// Apenas atualiza o histórico com status intermediário.
// NÃO finaliza contatos — isso é responsabilidade exclusiva do end-of-call-report.
// Exceção: status 'failed' que pode chegar sem end-of-call-report (ex: número inválido).
// ================================================================
async function handleStatusUpdate(supabase: any, message: any) {
  const call = message.call;
  if (!call?.id) return;

  // Atualizar status intermediário no histórico
  const statusToRecord = message.status ?? call.status;
  await supabase
    .from('agent_call_history')
    .update({ status: statusToRecord })
    .eq('vapi_call_id', call.id);

  console.log(`[VAPI WEBHOOK] status-update: callId=${call.id} status=${statusToRecord}`);

  // Tratar SOMENTE o status 'failed' — chamadas que falharam antes de conectar
  // (ex: número inválido, créditos insuficientes no VAPI)
  // status 'ended' NÃO é tratado aqui — o end-of-call-report cuida disso com o endedReason correto
  if (message.status === 'failed') {
    const { data: history } = await supabase
      .from('agent_call_history')
      .select('contact_id, agent_id, user_id')
      .eq('vapi_call_id', call.id)
      .maybeSingle();

    const contactId = history?.contact_id ?? call.metadata?.contactId;
    const agentId = history?.agent_id ?? call.metadata?.agentId;
    const userId = history?.user_id ?? call.metadata?.userId;

    if (contactId) {
      await supabase
        .from('agent_contacts')
        .update({
          status: 'failed',
          last_call_at: new Date().toISOString(),
          last_call_status: 'failed',
        })
        .eq('id', contactId)
        .eq('status', 'calling'); // Guard: só atualiza se ainda estiver 'calling'

      console.log(`[VAPI WEBHOOK] status-update 'failed': contact ${contactId} marked as failed`);
    }

    // Chamada falhou sem end-of-call-report → disparar próxima da lista
    if (agentId) {
      await triggerNextCall(supabase, agentId, userId);
    }
  }
}

// ================================================================
// TRANSCRIPT
// ================================================================
async function handleTranscript(supabase: any, message: any) {
  const call = message.call;
  if (!call?.id || !message.transcript) return;
  await supabase
    .from('agent_call_history')
    .update({ transcript: message.transcript })
    .eq('vapi_call_id', call.id);
}

// ================================================================
// CLASSIFICAÇÃO DE endedReason → STATUS FINAL DO CONTATO
// Baseado na documentação oficial do VAPI:
// https://docs.vapi.ai/calls/call-ended-reason
// ================================================================
function classifyEndedReason(endedReason: string): 'completed' | 'no-answer' | 'voicemail' | 'failed' {
  // ── Não atendeu ─────────────────────────────────────────────────
  if (endedReason === 'customer-did-not-answer' ||
    endedReason === 'customer-busy' ||
    endedReason === 'no-answer') {
    return 'no-answer';
  }

  // ── Voicemail ────────────────────────────────────────────────────
  if (endedReason === 'voicemail') return 'voicemail';

  // ── Completada com sucesso ───────────────────────────────────────
  // Assistente encerrou normalmente, cliente desligou após conversar,
  // ou transferência bem-sucedida
  if (
    endedReason === 'assistant-ended-call' ||
    endedReason === 'assistant-ended-call-after-message-spoken' ||
    endedReason === 'assistant-ended-call-with-hangup-task' ||
    endedReason === 'assistant-said-end-call-phrase' ||
    endedReason === 'assistant-forwarded-call' ||
    endedReason === 'customer-ended-call' ||
    endedReason === 'exceeded-max-duration' ||
    endedReason === 'call.ending.hook-executed-say' ||
    endedReason === 'call.ending.hook-executed-transfer'
  ) {
    return 'completed';
  }

  // ── Falhas de infraestrutura / pipeline / configuração ───────────
  // Tudo com prefixo de erro, silence timeout, etc.
  if (
    endedReason.includes('error') ||
    endedReason.includes('failed') ||
    endedReason.includes('fault') ||
    endedReason.startsWith('call.start.') ||
    endedReason.startsWith('call.in-progress.') ||
    endedReason === 'silence-timed-out' ||
    endedReason === 'assistant-join-timed-out' ||
    endedReason === 'phone-call-provider-closed-websocket' ||
    endedReason === 'manually-canceled' ||
    endedReason === 'worker-shutdown' ||
    endedReason === 'call-deleted' ||
    endedReason === 'unknown'
  ) {
    return 'failed';
  }

  // Default: ligação ocorreu normalmente
  return 'completed';
}

// ================================================================
// END OF CALL REPORT
// Evento principal que finaliza contatos e dispara próxima chamada.
// ================================================================
async function handleEndOfCall(supabase: any, message: any) {
  const call = message.call;
  if (!call?.id) {
    console.error('[VAPI WEBHOOK] end-of-call-report missing call id');
    return;
  }

  const callId = call.id;
  const now = new Date().toISOString();

  // ── Diagnóstico: log imediato para confirmar que o evento chegou ──────────
  console.log(`[VAPI WEBHOOK] ▶ end-of-call-report RECEIVED callId=${callId}`);

  try {
    const durationSeconds = Math.round(message.durationSeconds ?? 0);
    const durationMinutes = durationSeconds / 60;
    const creditCost = durationMinutes * COST_PER_MINUTE;

    // ⚠️ CAMPO CORRETO conforme docs VAPI:
    // endedReason está em message.endedReason (não em call.endedReason)
    // Ref: https://docs.vapi.ai/server-url/events
    const endedReason = message.endedReason ?? call.endedReason ?? 'unknown';
    const finalStatus = classifyEndedReason(endedReason);

    console.log(`[VAPI WEBHOOK] end-of-call: callId=${callId} endedReason="${endedReason}" → finalStatus="${finalStatus}" duration=${durationSeconds}s`);

    // ── Passo 1: Buscar histórico pelo callId ─────────────────────────────
    const { data: callHistory } = await supabase
      .from('agent_call_history')
      .select('agent_id, contact_id, user_id')
      .eq('vapi_call_id', callId)
      .maybeSingle();

    let agentId = callHistory?.agent_id ?? call.metadata?.agentId;
    let contactId = callHistory?.contact_id ?? call.metadata?.contactId;
    let userId = callHistory?.user_id ?? call.metadata?.userId;

    // ── Passo 2: Fallback — buscar pelo contactId em agent_contacts ───────
    // Cobre o caso em que call_history não foi inserido (race condition no start)
    if (!agentId && contactId) {
      console.warn(`[VAPI WEBHOOK] end-of-call: no history record for callId=${callId}, recovering agentId via contactId=${contactId}`);
      const { data: contactRow } = await supabase
        .from('agent_contacts')
        .select('agent_id, user_id')
        .eq('id', contactId)
        .maybeSingle();
      if (contactRow) {
        agentId = agentId ?? contactRow.agent_id;
        userId = userId ?? contactRow.user_id;
      }
    }

    // ── Passo 3: Guard explícito — sem agentId não tem como continuar ─────
    if (!agentId) {
      console.error(`[VAPI WEBHOOK] ❌ end-of-call FATAL: could not determine agentId for callId=${callId}. metadata=${JSON.stringify(call.metadata)}. Dialing chain ABORTED.`);
    }

    // Extrair URLs e transcrição
    const recordingUrl = message.recordingUrl
      ?? message.stereoRecordingUrl
      ?? message.artifact?.recordingUrl
      ?? message.artifact?.stereoRecordingUrl
      ?? null;

    const transcript = message.transcript ?? message.artifact?.transcript ?? null;

    // 1. Atualizar histórico da chamada
    await supabase
      .from('agent_call_history')
      .update({
        status: finalStatus,
        ended_at: now,
        duration_seconds: durationSeconds,
        end_reason: endedReason,
        transcript,
        summary: message.summary ?? null,
        credits_used: creditCost,
        recording_url: recordingUrl,
      })
      .eq('vapi_call_id', callId);

    // 2. Atualizar contato com status final
    if (contactId) {
      await supabase
        .from('agent_contacts')
        .update({
          status: finalStatus,
          last_call_at: now,
          last_call_duration: durationSeconds,
          last_call_status: endedReason,
        })
        .eq('id', contactId);

      console.log(`[VAPI WEBHOOK] Contact ${contactId} → ${finalStatus} (${endedReason})`);
    }

    if (!agentId) {
      // Já logado acima; encerra sem travar o agente
      return;
    }

    // 3. Debitar créditos do agente
    if (creditCost > 0) {
      const { data: agentData } = await supabase
        .from('user_agents')
        .select('allocated_credits')
        .eq('id', agentId)
        .maybeSingle();

      if (agentData) {
        const newBalance = Math.max(0, (agentData.allocated_credits ?? 0) - creditCost);
        await supabase
          .from('user_agents')
          .update({ allocated_credits: newBalance })
          .eq('id', agentId);
        console.log(`[VAPI WEBHOOK] Debited ${creditCost.toFixed(4)} credits from agent ${agentId}. Balance: ${newBalance.toFixed(4)}`);
      }
    }

    // 4. Atualizar estatísticas diárias
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = finalStatus === 'completed' ? 1 : 0;

    const { data: stats } = await supabase
      .from('agent_daily_stats')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .maybeSingle();

    if (stats) {
      const newCallsMade = stats.calls_made + 1;
      const newCompleted = stats.calls_completed + isCompleted;
      await supabase
        .from('agent_daily_stats')
        .update({
          calls_made: newCallsMade,
          calls_completed: newCompleted,
          calls_failed: (stats.calls_failed ?? 0) + (isCompleted ? 0 : 1),
          minutes_used: (stats.minutes_used ?? 0) + durationMinutes,
          credits_spent: (stats.credits_spent ?? 0) + creditCost,
          success_rate: newCallsMade > 0 ? (newCompleted / newCallsMade) * 100 : 0,
          updated_at: now,
        })
        .eq('id', stats.id);
    } else {
      await supabase.from('agent_daily_stats').insert({
        agent_id: agentId,
        date: today,
        calls_made: 1,
        calls_completed: isCompleted,
        calls_failed: isCompleted ? 0 : 1,
        minutes_used: durationMinutes,
        credits_spent: creditCost,
        avg_call_duration: durationSeconds,
        success_rate: isCompleted * 100,
      });
    }

    // 5. Atualizar totais do agente e decidir próxima ação
    const { data: agent } = await supabase
      .from('user_agents')
      .select('total_calls_made, total_minutes_used, total_credits_spent, calls_made_today, minutes_used_today, success_rate, daily_minutes_limit, status')
      .eq('id', agentId)
      .maybeSingle();

    if (agent) {
      const parsedTotalCalls = agent.total_calls_made ?? 0;
      const newTotalCalls = parsedTotalCalls + 1;
      const newMinutesToday = (agent.minutes_used_today ?? 0) + durationMinutes;
      const newSuccessRate = (((agent.success_rate ?? 0) * parsedTotalCalls) + isCompleted * 100) / newTotalCalls;
      const limitReached = newMinutesToday >= agent.daily_minutes_limit;

      await supabase
        .from('user_agents')
        .update({
          total_calls_made: newTotalCalls,
          total_minutes_used: (agent.total_minutes_used ?? 0) + durationMinutes,
          total_credits_spent: (agent.total_credits_spent ?? 0) + creditCost,
          calls_made_today: (agent.calls_made_today ?? 0) + 1,
          minutes_used_today: newMinutesToday,
          last_call_at: now,
          success_rate: newSuccessRate,
          updated_at: now,
        })
        .eq('id', agentId);

      if (limitReached) {
        console.log(`[VAPI WEBHOOK] Agent ${agentId} reached daily limit (${newMinutesToday.toFixed(1)} min). Setting idle.`);
        await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId);
      } else {
        // Tentar disparar próxima chamada da lista
        await triggerNextCall(supabase, agentId, userId);
      }
    }

    console.log(`[VAPI WEBHOOK] ✅ end-of-call done: ${callId} → ${finalStatus}`);

  } catch (error: any) {
    console.error(`[VAPI WEBHOOK] CRITICAL ERROR processing call ${call.id}:`, error);
    await supabase
      .from('agent_call_history')
      .update({ end_reason: `WEBHOOK_CRASH: ${error.message}` })
      .eq('vapi_call_id', call.id);
  }
}

// ================================================================
// CONTINUOUS DIALING
// Busca o próximo contato pendente e dispara chamada VAPI.
// Chamada por: handleEndOfCall e handleStatusUpdate (status=failed)
// ================================================================
async function triggerNextCall(supabase: any, agentId: string, userId: string) {
  // Re-ler status do agente — respeita pause/stop feito pelo usuário
  const { data: freshAgent } = await supabase
    .from('user_agents')
    .select('status, agent_provider_id, phone_number_provider_id')
    .eq('id', agentId)
    .maybeSingle();

  if (!freshAgent || freshAgent.status !== 'calling') {
    console.log(`[VAPI WEBHOOK] triggerNextCall: agent ${agentId} is "${freshAgent?.status}" — not calling. Skipping.`);
    return;
  }

  // ── Auto-reset de contatos "zumbis" ─────────────────────────────────────────
  // Contatos em status 'calling' há mais de 5 minutos (ou sem last_attempt_at)
  // indicam que o webhook end-of-call não chegou. Resetamos para 'failed'.
  // IMPORTANTE: usar .or() para cobrir NULLs — .lt() ignora linhas com NULL no PG.
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min atrás
  const { data: staleContacts } = await supabase
    .from('agent_contacts')
    .select('id')
    .eq('agent_id', agentId)
    .eq('status', 'calling')
    .or(`last_attempt_at.is.null,last_attempt_at.lt.${staleThreshold}`);

  if (staleContacts && staleContacts.length > 0) {
    const staleIds = staleContacts.map((c: any) => c.id);
    console.warn(`[VAPI WEBHOOK] triggerNextCall: [AUTO-RESET] ${staleIds.length} stale contact(s) stuck in 'calling' for agent ${agentId}. Marking as failed.`);
    await supabase
      .from('agent_contacts')
      .update({ status: 'failed' })
      .eq('agent_id', agentId)
      .in('id', staleIds);
  }

  // Buscar próximo contato pendente
  const { data: pendingContacts } = await supabase
    .from('agent_contacts')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  const nextContact = pendingContacts && pendingContacts.length > 0 ? pendingContacts[0] : null;

  if (!nextContact) {
    // Sem pendentes — verificar se ainda há ativos em andamento
    const { count: activeCount } = await supabase
      .from('agent_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'calling');

    if ((activeCount ?? 0) === 0) {
      console.log(`[VAPI WEBHOOK] triggerNextCall: no pending or active contacts for agent ${agentId}. Setting idle.`);
      await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId);
    }
    return;
  }

  // Formatar número para E.164
  let formattedPhone = nextContact.phone.replace(/[\s\-\(\)]/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.length <= 11 ? `+55${formattedPhone}` : `+${formattedPhone}`;
  }

  if (!freshAgent.agent_provider_id) {
    console.error(`[VAPI WEBHOOK] triggerNextCall: agent ${agentId} missing agent_provider_id. Setting idle.`);
    await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId);
    return;
  }

  // Marcar como 'calling' com guard .eq('status','pending') para evitar double-dial
  await supabase
    .from('agent_contacts')
    .update({ status: 'calling', last_attempt_at: new Date().toISOString() })
    .eq('id', nextContact.id)
    .eq('status', 'pending');

  // Verificar se o update funcionou (outro processo pode ter pego antes)
  const { data: verifyContact } = await supabase
    .from('agent_contacts')
    .select('status')
    .eq('id', nextContact.id)
    .maybeSingle();

  if (verifyContact?.status !== 'calling') {
    console.warn(`[VAPI WEBHOOK] triggerNextCall: contact ${nextContact.id} already picked (status: ${verifyContact?.status}).`);
    return;
  }

  // O server.url e serverMessages já estão configurados no assistente VAPI.
  // NÃO usar assistantOverrides para não sobrescrever as configurações do agente.
  const vapiCallBody: Record<string, any> = {
    assistantId: freshAgent.agent_provider_id,
    customer: { number: formattedPhone, name: nextContact.name },
    metadata: { agentId, contactId: nextContact.id, userId },
  };
  if (freshAgent.phone_number_provider_id) {
    vapiCallBody.phoneNumberId = freshAgent.phone_number_provider_id;
  }

  console.log(`[VAPI WEBHOOK] triggerNextCall: → ${formattedPhone} (contact ${nextContact.id})`);

  const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vapiCallBody),
  });

  if (vapiResponse.ok) {
    const callData = await vapiResponse.json();
    console.log(`[VAPI WEBHOOK] triggerNextCall: ✅ call_id=${callData.id}`);
    if (callData.id) {
      await supabase.from('agent_call_history').insert({
        agent_id: agentId,
        user_id: userId,
        contact_id: nextContact.id,
        vapi_call_id: callData.id,
        phone_number: nextContact.phone,
        status: 'in-progress',
        started_at: new Date().toISOString(),
      });
    }
  } else {
    const errText = await vapiResponse.text().catch(() => 'unknown');
    console.error(`[VAPI WEBHOOK] triggerNextCall: ❌ VAPI ${vapiResponse.status}: ${errText}`);
    // Contato não pode ficar preso em 'calling'
    await supabase
      .from('agent_contacts')
      .update({ status: 'failed', attempt_count: (nextContact.attempt_count || 0) + 1 })
      .eq('id', nextContact.id);
    await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId);
  }
}

// ================================================================
// TOOL CALLS HANDLER (Cal.com + n8n Async Pattern)
// ================================================================

const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL')
  || 'https://seu-n8n.com/webhook/calcom-tool-dispatcher';

async function handleToolCalls(message: any) {
  const toolCalls = message.toolWithToolCallList
    ? message.toolWithToolCallList.map((item: any) => item.toolCall)
    : (message.toolCallList || []);

  console.log(`[VAPI WEBHOOK] Received ${toolCalls.length} tool call(s)`);

  const results = [];
  const callId = message.call?.id;

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function?.name;
    let args = toolCall.function?.arguments || {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch (e) { /* noop */ }
    }
    const toolCallId = toolCall.id;
    const agentId = message.call?.metadata?.agentId;

    let result: string;
    try {
      if (functionName === 'check_availability') {
        result = 'Verificando horários disponíveis. Um momento...';
      } else if (functionName === 'book_appointment') {
        result = 'Processando agendamento. Um momento...';
      } else {
        result = `Função desconhecida: ${functionName}`;
      }
      dispatchToN8nAsync(callId, toolCallId, functionName, args, agentId);
    } catch (error: any) {
      result = `Erro: ${error.message}`;
    }
    results.push({ toolCallId, result });
  }

  return { results };
}

async function dispatchToN8nAsync(
  callId: string,
  toolCallId: string,
  functionName: string,
  args: any,
  agentId: string
) {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase.from('pending_tool_calls').insert({
      call_id: callId,
      tool_call_id: toolCallId,
      agent_id: agentId,
      tool_name: functionName,
      input_data: args,
      status: 'pending',
    }).catch((err: any) => console.warn('[VAPI WEBHOOK] Failed to insert pending_tool_call:', err));

    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, toolCallId, functionName, arguments: args, agentId, timestamp: new Date().toISOString() }),
    }).catch((err: any) => console.error('[VAPI WEBHOOK] Failed to dispatch to n8n:', err));

  } catch (error: any) {
    console.error('[VAPI WEBHOOK] dispatchToN8nAsync error:', error);
  }
}
