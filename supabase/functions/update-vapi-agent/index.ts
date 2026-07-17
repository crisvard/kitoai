// Update VAPI Agent Edge Function
// Updates an existing VAPI assistant configuration
// Also handles phone number management (action: phone_list | phone_add_twilio | phone_add_vapi_id | phone_delete)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, ...(data as object) }), { headers: CORS });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err('Missing authorization header', 401);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return err('Unauthorized', 401);

    const body = await req.json();
    const { action } = body;

    // ================================================================
    // PHONE NUMBER MANAGEMENT (action: phone_*)
    // ================================================================

    if (action === 'phone_list') {
      const { data, error: listError } = await supabase
        .from('user_phone_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (listError) throw listError;
      return ok({ phone_numbers: data ?? [] });
    }

    if (action === 'phone_add_twilio') {
      const { phone_number, nickname } = body;
      // Use server-side secrets — never from client
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

      if (!twilioAccountSid || !twilioAuthToken) {
        return err('Credenciais Twilio não configuradas no servidor. Contate o administrador.');
      }
      if (!phone_number) {
        return err('phone_number é obrigatório');
      }
      if (!/^\+\d{7,15}$/.test(phone_number)) {
        return err('Número deve estar no formato E.164, ex: +5511999998888');
      }

      console.log('phone_add_twilio: AccountSID prefix:', twilioAccountSid.slice(0, 4), '| number:', phone_number);

      const vapiBody = {
        provider: 'twilio',
        number: phone_number,
        twilioAccountSid,
        twilioAuthToken,
        name: nickname || phone_number,
        server: {
          url: `${SUPABASE_URL}/functions/v1/vapi-webhook`
        },
        serverMessages: [
          'end-of-call-report',
          'status-update',
          'hang',
          'function-call',
          'tool-calls'
        ],
      };

      const vapiRes = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(vapiBody),
      });

      const vapiText = await vapiRes.text();
      console.log('phone_add_twilio: VAPI status:', vapiRes.status, '| body:', vapiText);

      if (!vapiRes.ok) {
        let errMsg: string;
        try {
          const vapiErr = JSON.parse(vapiText);
          errMsg = vapiErr.message || vapiErr.error || vapiText;
        } catch {
          errMsg = vapiText || 'Erro desconhecido no VAPI';
        }
        // Retorna 400 com a mensagem real (não 500) para o frontend mostrar
        return err(`VAPI: ${errMsg}`, 400);
      }

      let vapiData: Record<string, unknown>;
      try {
        vapiData = JSON.parse(vapiText);
      } catch {
        return err('Resposta inválida do VAPI', 500);
      }

      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('id')
        .eq('user_id', user.id)
        .eq('vapi_phone_number_id', vapiData.id)
        .maybeSingle();
      if (existing) return err('Este número já está cadastrado na sua conta.');

      const { data: inserted, error: insertError } = await supabase
        .from('user_phone_numbers')
        .insert({
          user_id: user.id,
          vapi_phone_number_id: vapiData.id,
          phone_number,
          provider: 'twilio',
          nickname: nickname || null,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Update the phone number with webhook configuration (required for VAPI to send events)
      const webhookUpdate = {
        server: {
          url: `${SUPABASE_URL}/functions/v1/vapi-webhook`
        },
        serverMessages: [
          'end-of-call-report',
          'status-update',
          'hang',
          'function-call',
          'tool-calls'
        ]
      };
      const updateRes = await fetch(`https://api.vapi.ai/phone-number/${vapiData.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookUpdate),
      });
      if (!updateRes.ok) {
        console.warn('phone_add_twilio: Failed to add webhook to phone number, events may not be received:', await updateRes.text());
      }

      return ok({ phone_number: inserted, vapi_id: vapiData.id });
    }

    // ------------------------------------------------------------------
    // PHONE_FETCH_FROM_TWILIO — lista todos os números comprados na conta Twilio
    // usando as credenciais do servidor.
    // ------------------------------------------------------------------
    if (action === 'phone_fetch_from_twilio') {
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

      if (!twilioAccountSid || !twilioAuthToken) {
        return err('Credenciais Twilio não configuradas no servidor.', 500);
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json`;
      const authHeader = `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`;

      const twilioRes = await fetch(twilioUrl, {
        headers: { 'Authorization': authHeader }
      });

      if (!twilioRes.ok) {
        let errMsg = await twilioRes.text();
        try { errMsg = JSON.parse(errMsg).message || errMsg; } catch { /* ignore */ }
        return err(`Erro na API da Twilio: ${errMsg}`, 400);
      }

      const data = await twilioRes.json();
      const numbers = (data.incoming_phone_numbers || []).map((n: Record<string, unknown>) => ({
        id: n.sid as string,
        number: n.phone_number as string,
        name: (n.friendly_name as string) || null,
        provider: 'twilio',
      }));

      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('phone_number')
        .eq('user_id', user.id)
        .eq('provider', 'twilio');

      const importedNumbers = new Set((existing ?? []).map((n: Record<string, unknown>) => n.phone_number as string));

      const enrichedNumbers = numbers.map((n: Record<string, unknown>) => ({
        ...n,
        already_imported: importedNumbers.has(n.number as string),
      }));

      return ok({ twilio_numbers: enrichedNumbers });
    }

    // ------------------------------------------------------------------
    // PHONE_FETCH_FROM_VAPI — lista todos os números da conta VAPI usando
    // a chave secreta do servidor. Nunca expõe a chave ao frontend.
    // Retorna cada número com o flag already_imported indicando se o
    // usuário já importou aquele número para o sistema.
    // ------------------------------------------------------------------
    if (action === 'phone_fetch_from_vapi') {
      if (!VAPI_API_KEY) return err('VAPI_API_KEY não configurada no servidor.', 500);

      const vapiRes = await fetch('https://api.vapi.ai/phone-number', {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      });

      const vapiText = await vapiRes.text();
      if (!vapiRes.ok) {
        let errMsg: string;
        try { errMsg = JSON.parse(vapiText).message || vapiText; } catch { errMsg = vapiText; }
        return err(`VAPI: ${errMsg}`, 400);
      }

      let rawData: unknown;
      try { rawData = JSON.parse(vapiText); } catch { return err('Resposta inválida do VAPI', 500); }

      const rawList: unknown[] = Array.isArray(rawData)
        ? rawData
        : ((rawData as Record<string, unknown>).results as unknown[] ?? []);

      // IDs já importados por este usuário
      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('vapi_phone_number_id')
        .eq('user_id', user.id);
      const importedIds = new Set((existing ?? []).map((n: Record<string, unknown>) => n.vapi_phone_number_id as string));

      const numbers = rawList.map((n: unknown) => {
        const item = n as Record<string, unknown>;
        return {
          id: item.id as string,
          number: (item.number || item.phoneNumber || '') as string,
          name: (item.name as string | null) ?? null,
          provider: (item.provider as string) || 'vapi',
          already_imported: importedIds.has(item.id as string),
        };
      });

      return ok({ vapi_numbers: numbers });
    }

    if (action === 'phone_add_vapi_id') {
      const { vapi_phone_number_id, phone_number, nickname } = body;
      if (!vapi_phone_number_id || !phone_number) {
        return err('vapi_phone_number_id e phone_number são obrigatórios');
      }

      const vapiRes = await fetch(`https://api.vapi.ai/phone-number/${vapi_phone_number_id}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      });
      if (!vapiRes.ok) return err('ID de número VAPI não encontrado. Verifique no dashboard do VAPI.');
      const vapiData = await vapiRes.json();

      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('id')
        .eq('user_id', user.id)
        .eq('vapi_phone_number_id', vapi_phone_number_id)
        .maybeSingle();
      if (existing) return err('Este número já está cadastrado na sua conta.');

      const { data: inserted, error: insertError } = await supabase
        .from('user_phone_numbers')
        .insert({
          user_id: user.id,
          vapi_phone_number_id,
          phone_number: vapiData.number || phone_number,
          provider: vapiData.provider || 'vapi',
          nickname: nickname || null,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Ensure webhook is configured on the phone number (required for /call/phone to send events)
      const hookUpdate = {
        server: { url: `${SUPABASE_URL}/functions/v1/vapi-webhook` },
        serverMessages: ['end-of-call-report', 'status-update', 'hang', 'function-call', 'tool-calls']
      };
      await fetch(`https://api.vapi.ai/phone-number/${vapi_phone_number_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(hookUpdate),
      }).catch(() => { }); // Ignore errors - webhook may already be set

      return ok({ phone_number: inserted });
    }

    // ------------------------------------------------------------------
    // PHONE_BUY_VAPI — provisiona número direto pela VAPI (billing VAPI)
    // A VAPI atribui o número automaticamente com base em país/área.
    // Não existe endpoint de busca — o provisionamento é direto.
    // ------------------------------------------------------------------
    if (action === 'phone_buy_vapi') {
      const { area_code, country_code = 'US', nickname } = body;

      // Campos corretos da API VAPI para provisionamento
      const buyBody: Record<string, unknown> = {
        provider: 'vapi',
        server: {
          url: `${SUPABASE_URL}/functions/v1/vapi-webhook`
        },
        serverMessages: [
          'end-of-call-report',
          'status-update',
          'hang',
          'function-call',
          'tool-calls'
        ]
      };
      if (country_code) buyBody.countryCode = country_code;
      if (area_code) buyBody.areaCode = area_code;
      if (nickname) buyBody.name = nickname;

      console.log('phone_buy_vapi payload:', JSON.stringify(buyBody));

      const vapiRes = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buyBody),
      });

      const vapiText = await vapiRes.text();
      console.log('phone_buy_vapi VAPI response:', vapiRes.status, vapiText);

      if (!vapiRes.ok) {
        let errMsg: string;
        try {
          const vapiErr = JSON.parse(vapiText);
          errMsg = vapiErr.message || vapiErr.error || vapiText;
        } catch {
          errMsg = vapiText || 'Erro ao provisionar número no VAPI';
        }
        return err(`VAPI: ${errMsg}`, 400);
      }

      let vapiData: Record<string, unknown>;
      try { vapiData = JSON.parse(vapiText); } catch { return err('Resposta inválida do VAPI', 500); }

      const vapiId = (vapiData.id as string) || '';
      const phoneNumber = (vapiData.number as string) || (vapiData.phoneNumber as string) || '';

      if (!vapiId) {
        console.error('phone_buy_vapi: VAPI não retornou ID:', vapiText);
        return err('VAPI não retornou ID do número provisionado', 500);
      }

      const { data: inserted, error: insertError } = await supabase
        .from('user_phone_numbers')
        .insert({
          user_id: user.id,
          vapi_phone_number_id: vapiId,
          phone_number: phoneNumber,
          provider: 'vapi',
          nickname: nickname || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return ok({ phone_number: inserted, vapi_id: vapiId, number: phoneNumber });
    }

    if (action === 'phone_delete') {
      const { phone_number_id } = body;
      if (!phone_number_id) return err('phone_number_id é obrigatório');

      const { data: record, error: fetchError } = await supabase
        .from('user_phone_numbers')
        .select('id, vapi_phone_number_id')
        .eq('id', phone_number_id)
        .eq('user_id', user.id)
        .single();
      if (fetchError || !record) return err('Número não encontrado ou não pertence ao usuário.');

      const { count } = await supabase
        .from('user_agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('phone_number_provider_id', record.vapi_phone_number_id);
      if ((count ?? 0) > 0) {
        return err(`Este número está sendo usado por ${count} agente(s). Remova-os primeiro.`);
      }

      const { error: deleteError } = await supabase
        .from('user_phone_numbers')
        .delete()
        .eq('id', phone_number_id)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;
      return ok({ deleted: true });
    }

    // ------------------------------------------------------------------
    // PHONE_UPDATE_WEBHOOK — atualiza webhook em números existentes
    // Útil para números Twilio/VAPI já importados que não recebem eventos
    // ------------------------------------------------------------------
    if (action === 'phone_update_webhook') {
      const { phone_number_id } = body;
      if (!phone_number_id) return err('phone_number_id é obrigatório');

      const { data: record, error: fetchError } = await supabase
        .from('user_phone_numbers')
        .select('vapi_phone_number_id, phone_number')
        .eq('id', phone_number_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !record) return err('Número não encontrado');

      const webhookUpdate = {
        server: { url: `${SUPABASE_URL}/functions/v1/vapi-webhook` },
        serverMessages: ['end-of-call-report', 'status-update', 'hang', 'function-call', 'tool-calls']
      };

      const vapiRes = await fetch(`https://api.vapi.ai/phone-number/${record.vapi_phone_number_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookUpdate),
      });

      if (!vapiRes.ok) {
        return err(`Falha ao atualizar webhook: ${await vapiRes.text()}`, 400);
      }

      return ok({ message: `Webhook atualizado para número ${record.phone_number}` });
    }

    // ================================================================
    // AGENT UPDATE (VAPI Sync)
    // ================================================================
    const { agentId, vapiAssistantId, ...updates } = body;

    if (!agentId || !vapiAssistantId) {
      throw new Error('Missing agentId or vapiAssistantId');
    }

    if (!VAPI_API_KEY) {
      console.error('[update-vapi-agent] VAPI_API_KEY is not set');
      return new Response(JSON.stringify({
        error: 'Erro de Configuração: VAPI_API_KEY não encontrada.',
        details: 'Configure a chave VAPI_API_KEY nos secrets do Supabase.'
      }), {
        status: 500,
        headers: CORS
      });
    }

    // 1. Fetch current agent data from VAPI to merge
    console.log(`[update-vapi-agent] Fetching current config for assistant: ${vapiAssistantId}`);
    const currentRes = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });

    if (!currentRes.ok) {
      const errorMsg = await currentRes.text();
      console.error(`[update-vapi-agent] VAPI Retrieve Error: ${currentRes.status}`, errorMsg);
      return new Response(JSON.stringify({
        error: `Erro ao buscar agente na VAPI (Status ${currentRes.status})`,
        details: errorMsg
      }), {
        status: 400,
        headers: CORS
      });
    }

    const currentAgent = await currentRes.json();

    // 2. Prepare the update payload
    const vapiUpdates: Record<string, unknown> = {};
    if (updates.name) vapiUpdates.name = updates.name;

    // Handle Model Updates
    if (updates.systemPrompt || updates.model || updates.temperature !== undefined) {
      const modelObj: Record<string, unknown> = { ...(currentAgent.model || {}) };
      if (updates.model) {
        modelObj.model = updates.model;
        modelObj.provider = (updates.model as string).includes('claude') ? 'anthropic' : 'openai';
      }
      if (updates.temperature !== undefined) modelObj.temperature = updates.temperature;
      if (updates.systemPrompt) {
        modelObj.messages = [{ role: 'system', content: updates.systemPrompt }];
      }
      vapiUpdates.model = modelObj;
    }

    // Handle Voice Updates - Fix: Use '11labs' and valid voiceId
    if (updates.voiceId) {
      vapiUpdates.voice = {
        provider: '11labs',
        voiceId: updates.voiceId,
        model: 'eleven_turbo_v2_5', // Mais natural e conversacional que o multilingual normal
        stability: 0.5, // Mantém dinamismo e emoção
        similarityBoost: 0.5, // Reduzido para 0.5 para parar de picotar a geração
        optimizeStreamingLatency: 3 // Nível 3 é recomendado para latência de telefone real-time
      };
    }

    // ================================================================
    // NOTE: Cal.com tools are registered via setup-calcom-tools (toolIds approach).
    // Do NOT set model.tools here — that creates duplicates and conflicts with toolIds.
    // ================================================================
    // Clear BOTH inline tools AND toolIds to avoid inheriting Google Calendar tools
    {
      const modelObj = (vapiUpdates.model as Record<string, unknown>) ?? { ...(currentAgent.model || {}) };
      // Remove inline tools
      delete modelObj['tools'];
      // Remove inherited toolIds — Google Calendar tools live here and must be cleared
      // Tools are re-registered by clicking "Configurar Cal.com no Agente" (setup-calcom-tools)
      delete modelObj['toolIds'];
      vapiUpdates.model = modelObj;
      console.log('[update-vapi-agent] Cleared model.tools AND model.toolIds — no Google Calendar tools will persist.');
    }

    // Note: tools are set via model.tools with server.url — do NOT send toolIds (not a valid field)

    // Sempre forçar Deepgram nova-2 pt-BR para transcrição
    vapiUpdates.transcriber = {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'pt-BR',
    };
    // Respeitar o modelo escolhido pelo usuário (já configurado acima se updates.model foi enviado)
    // NÃO forçar GPT-4o — usar o modelo selecionado pelo usuário
    const modelObj = (vapiUpdates.model as Record<string, unknown>) ?? { ...(currentAgent.model || {}) };
    vapiUpdates.model = modelObj;
    vapiUpdates.silenceTimeoutSeconds = 30;
    // A VAPI tornou voicemailDetection opcional (objeto ou omitido).
    // NÃO enviar null: a API rejeita null e pode corromper o agente.

    if (updates.firstMessage) {
      vapiUpdates.firstMessage = updates.firstMessage;
    } else if (!currentAgent.firstMessage) {
      vapiUpdates.firstMessage = 'Olá! Sou seu assistente virtual. Como posso ajudar?';
    }

    // Always enforce the Webhook URL so we never lose Call events (Credits / UI updates)
    vapiUpdates.server = {
      url: `${SUPABASE_URL}/functions/v1/vapi-webhook`
    };
    vapiUpdates.serverMessages = [
      'end-of-call-report',
      'status-update',
      'hang',
      'function-call',
      'tool-calls'
    ];

    // 3. Send UPDATE to VAPI
    const payloadJson = JSON.stringify(vapiUpdates);
    console.log('[update-vapi-agent] Full VAPI payload:', payloadJson.slice(0, 2000));
    const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: payloadJson,
    });

    if (!vapiResponse.ok) {
      const errorDetail = await vapiResponse.text();
      console.error('[update-vapi-agent] VAPI Update Error:', errorDetail);
      return new Response(JSON.stringify({
        error: `Erro na atualização da VAPI (Status ${vapiResponse.status})`,
        details: errorDetail
      }), {
        status: 400,
        headers: CORS
      });
    }

    const updatedVapiAgent = await vapiResponse.json();
    console.log('[update-vapi-agent] Success updating vapi assistant');

    return new Response(JSON.stringify({ success: true, vapi_agent: updatedVapiAgent }), {
      status: 200,
      headers: CORS,
    });

  } catch (error) {
    console.error('Error in update-vapi-agent:', error);
    return err(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});

