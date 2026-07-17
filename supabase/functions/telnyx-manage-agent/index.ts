// telnyx-manage-agent/index.ts
// Unified Edge Function for Telnyx voice AI agent management
// Actions: create_assistant, update_assistant, delete_assistant,
//          list_phone_numbers, start_calls, stop_calls

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY')!;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
};

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, ...data as Record<string, unknown> }), { headers: CORS });
const err = (message: string, status = 200) => new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS });

// ─── Helper: authenticate user ───────────────────────────────────────────────
async function authenticate(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    return { user, supabase };
}

// ─── Helper: Telnyx API call ────────────────────────────────────────────────
async function telnyxFetch(apiKey: string, path: string, options: RequestInit = {}) {
    const resp = await fetch(`https://api.telnyx.com${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        },
    });
    const body = await resp.json();
    if (!resp.ok) {
        const msg = body?.errors?.[0]?.detail || body?.error?.message || JSON.stringify(body);
        throw new Error(`Telnyx API error: ${msg}`);
    }
    return body;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CREATE ASSISTANT ───────────────────────────────────────────────────────
async function handleCreateAssistant(
    supabase: ReturnType<typeof createClient>,
    user: { id: string },
    apiKey: string,
    body: Record<string, unknown>
) {
    const { agentId, name, systemPrompt, voiceId, model, temperature, firstMessage } = body;

    if (!agentId || !name || !systemPrompt) {
        throw new Error('Missing required fields: agentId, name, systemPrompt');
    }

    const actualVoiceId = (voiceId as string) || 'Telnyx.Valentina';
    let voiceProvider = 'telnyx';
    if (actualVoiceId.startsWith('AWS.')) voiceProvider = 'aws';
    else if (actualVoiceId.startsWith('Azure.')) voiceProvider = 'azure';
    else if (actualVoiceId.startsWith('ElevenLabs.')) voiceProvider = 'elevenlabs';

    // Create Telnyx AI Assistant
    const assistantConfig: Record<string, unknown> = {
        name: name as string,
        instructions: systemPrompt as string,
        model: (model as string) || 'anthropic/claude-3-5-sonnet',
        temperature: (temperature as number) ?? 0.7,
        voice: {
            voice_id: actualVoiceId,
            provider: voiceProvider,
        },
        transcriber: {
            provider: 'telnyx',
            language: 'pt-BR',
        },
        first_message: (firstMessage as string) || 'Olá! Como posso ajudar você hoje?',
    };

    const result = await telnyxFetch(apiKey, '/v2/ai/assistants', {
        method: 'POST',
        body: JSON.stringify(assistantConfig),
    });

    const assistantId = result.id || result.data?.id;
    if (!assistantId) {
        throw new Error(`Failed to create Telnyx assistant – no ID returned. Raw response: ${JSON.stringify(result)}`);
    }

    // Update agent in database
    const { error: updateError } = await supabase
        .from('user_agents')
        .update({
            agent_provider_id: assistantId,
            provider: 'telnyx',
            updated_at: new Date().toISOString(),
        })
        .eq('id', agentId as string)
        .eq('user_id', user.id);

    if (updateError) {
        // Rollback: delete the assistant
        try {
            await telnyxFetch(apiKey, `/v2/ai/assistants/${assistantId}`, { method: 'DELETE' });
        } catch (_) { /* ignore rollback errors */ }
        throw new Error(`DB update failed: ${updateError.message}`);
    }

    return ok({ assistant_id: assistantId });
}

// ─── UPDATE ASSISTANT ───────────────────────────────────────────────────────
async function handleUpdateAssistant(
    supabase: ReturnType<typeof createClient>,
    user: { id: string },
    apiKey: string,
    body: Record<string, unknown>
) {
    const { agentId, assistantId, name, systemPrompt, voiceId, model, temperature } = body;

    if (!agentId || !assistantId) {
        throw new Error('Missing agentId or assistantId');
    }

    const updatePayload: Record<string, unknown> = {};
    if (name) updatePayload.name = name;
    if (systemPrompt) updatePayload.instructions = systemPrompt;
    if (model) updatePayload.model = model;
    if (temperature !== undefined) updatePayload.temperature = temperature;
    if (voiceId) {
        let voiceProvider = 'telnyx';
        const vId = voiceId as string;
        if (vId.startsWith('AWS.')) voiceProvider = 'aws';
        else if (vId.startsWith('Azure.')) voiceProvider = 'azure';
        else if (vId.startsWith('ElevenLabs.')) voiceProvider = 'elevenlabs';

        updatePayload.voice = {
            voice_id: vId,
            provider: voiceProvider,
        };
    }

    await telnyxFetch(apiKey, `/v2/ai/assistants/${assistantId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
    });

    return ok({ message: 'Assistant updated' });
}

// ─── DELETE ASSISTANT ───────────────────────────────────────────────────────
async function handleDeleteAssistant(
    supabase: ReturnType<typeof createClient>,
    user: { id: string },
    apiKey: string,
    body: Record<string, unknown>
) {
    const { agentId, assistantId } = body;

    if (!agentId) throw new Error('Missing agentId');

    // Delete from Telnyx if an assistant ID exists
    if (assistantId) {
        try {
            await telnyxFetch(apiKey, `/v2/ai/assistants/${assistantId}`, { method: 'DELETE' });
        } catch (e) {
            console.warn('Failed to delete Telnyx assistant (may already be gone):', e);
        }
    }

    // Delete agent from database
    const { error: deleteError } = await supabase
        .from('user_agents')
        .delete()
        .eq('id', agentId as string)
        .eq('user_id', user.id);

    if (deleteError) throw new Error(`DB deletion failed: ${deleteError.message}`);

    return ok({ message: 'Agent deleted' });
}

// ─── LIST PHONE NUMBERS ────────────────────────────────────────────────────
async function handleListPhoneNumbers(apiKey: string) {
    const result = await telnyxFetch(apiKey, '/v2/phone_numbers?page[size]=100&filter[status]=active');

    const numbers = (result.data || []).map((num: Record<string, unknown>) => ({
        id: num.id,
        number: num.phone_number,
        name: (num as any).connection_name || null,
        provider: 'telnyx',
        connection_id: (num as any).connection_id,
    }));

    return ok({ telnyx_numbers: numbers });
}

// ─── START CALLS ────────────────────────────────────────────────────────────
async function handleStartCalls(
    supabase: ReturnType<typeof createClient>,
    user: { id: string },
    apiKey: string,
    body: Record<string, unknown>
) {
    const { agentId, maxConcurrent = 1 } = body;
    if (!agentId) throw new Error('Missing agentId');

    // Get agent details
    const { data: agent, error: agentError } = await supabase
        .from('user_agents')
        .select('*')
        .eq('id', agentId as string)
        .eq('user_id', user.id)
        .single();

    if (agentError || !agent) throw new Error('Agent not found');

    if (!agent.agent_provider_id) {
        throw new Error('Agente sem assistant Telnyx configurado. Configure o agente primeiro.');
    }

    if (!agent.phone_number_provider_id) {
        throw new Error(
            'Agente sem número de telefone configurado. ' +
            'Vá em "Números" na Central de Ligações, importe um número da Telnyx e ' +
            'selecione-o nas Configurações do agente.'
        );
    }

    if (agent.status === 'calling') throw new Error('Agent is already calling');

    // Check daily limit
    const { data: stats } = await supabase
        .from('agent_daily_stats')
        .select('minutes_used')
        .eq('agent_id', agentId as string)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

    if (stats && stats.minutes_used >= agent.daily_minutes_limit) {
        throw new Error('Agent has reached daily limit');
    }

    // Get pending contacts
    const { data: contacts, error: contactsError } = await supabase
        .from('agent_contacts')
        .select('*')
        .eq('agent_id', agentId as string)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(maxConcurrent as number);

    if (contactsError) throw new Error(`Error fetching contacts: ${contactsError.message}`);
    if (!contacts || contacts.length === 0) throw new Error('No pending contacts to call');

    // Update agent status
    await supabase
        .from('user_agents')
        .update({ status: 'calling', updated_at: new Date().toISOString() })
        .eq('id', agentId as string);

    // Look up the Voice API Application from Telnyx to get a valid connection_id with webhook
    // This is more reliable than using the phone number's stored connection_id which can be stale
    let connectionId = agent.phone_number_provider_id;
    try {
        const appsResult = await telnyxFetch(apiKey, '/v2/call_control_applications?page[size]=10');
        const apps = appsResult?.data || [];
        // Pick the first app that has a webhook URL configured 
        const validApp = apps.find((app: any) => app.webhook_event_url || app.webhook_url);
        if (validApp) {
            connectionId = validApp.id;
            console.log('[telnyx-manage-agent] Using Voice API App connection_id:', connectionId, 'app name:', validApp.friendly_name);
        } else if (apps.length > 0) {
            // No app with webhook found, use the first app anyway
            connectionId = apps[0].id;
            console.warn('[telnyx-manage-agent] No app with webhook found, using first app:', connectionId);
        } else {
            console.warn('[telnyx-manage-agent] No Voice API Apps found, using stored connection_id:', connectionId);
        }
    } catch (lookupError) {
        console.warn('[telnyx-manage-agent] Failed to look up Voice API Apps, using stored value:', connectionId);
    }

    // Initiate calls via Telnyx Call Control + AI Assistant
    const callPromises = contacts.map(async (contact: Record<string, unknown>) => {
        try {
            // Mark contact as calling
            await supabase
                .from('agent_contacts')
                .update({ status: 'calling', last_attempt_at: new Date().toISOString() })
                .eq('id', contact.id as string);

            // Format phone to E.164
            let phone = (contact.phone as string).replace(/[\s\-\(\)]/g, '');
            if (!phone.startsWith('+')) {
                phone = phone.length <= 11 ? `+55${phone}` : `+${phone}`;
            }

            // Create call via Telnyx Call Control
            console.log(`[telnyx-manage-agent] Initiating call to ${phone} from ${agent.phone_number} with connection_id=${connectionId}`);
            const callResult = await telnyxFetch(apiKey, '/v2/calls', {
                method: 'POST',
                body: JSON.stringify({
                    connection_id: connectionId,
                    to: phone,
                    from: agent.phone_number || phone,
                    answering_machine_detection: 'detect',
                    webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-manage-agent`,
                    webhook_url_method: 'POST',
                    client_state: btoa(JSON.stringify({
                        action: 'call_webhook',
                        agentId,
                        contactId: contact.id,
                        userId: user.id,
                        assistantId: agent.agent_provider_id,
                    })),
                }),
            });

            const callControlId = callResult.data?.call_control_id;
            const callLegId = callResult.data?.call_leg_id;

            // Start AI assistant on the call
            if (callControlId) {
                try {
                    await telnyxFetch(apiKey, `/v2/calls/${callControlId}/actions/ai_assistant_start`, {
                        method: 'POST',
                        body: JSON.stringify({
                            assistant_id: agent.agent_provider_id,
                        }),
                    });
                } catch (aiErr) {
                    console.warn('Failed to start AI assistant on call, call will proceed without AI:', aiErr);
                }
            }

            // Create call history record
            await supabase.from('agent_call_history').insert({
                agent_id: agentId,
                user_id: user.id,
                contact_id: contact.id,
                vapi_call_id: callControlId || callLegId || 'unknown',
                phone_number: contact.phone,
                status: 'in-progress',
                started_at: new Date().toISOString(),
            });

            return { success: true, contactId: contact.id, callId: callControlId };
        } catch (error) {
            await supabase
                .from('agent_contacts')
                .update({ status: 'failed', attempt_count: ((contact.attempt_count as number) ?? 0) + 1 })
                .eq('id', contact.id as string);

            return {
                success: false,
                contactId: contact.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    const results = await Promise.all(callPromises);
    const successCount = results.filter((r: any) => r.success).length;
    const failedCount = results.filter((r: any) => !r.success).length;

    if (successCount === 0 && failedCount > 0) {
        await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agentId as string);
        const firstError = results.find((r: any) => !r.success)?.error;
        throw new Error(`Falha na Telnyx ao iniciar chamada: ${firstError}`);
    }

    return ok({ message: `Started ${successCount} calls, ${failedCount} failed`, results });
}

// ─── STOP CALLS ─────────────────────────────────────────────────────────────
async function handleStopCalls(
    supabase: ReturnType<typeof createClient>,
    user: { id: string },
    apiKey: string,
    body: Record<string, unknown>
) {
    const { agentId } = body;
    if (!agentId) throw new Error('Missing agentId');

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
        .from('user_agents')
        .select('*')
        .eq('id', agentId as string)
        .eq('user_id', user.id)
        .single();

    if (agentError || !agent) throw new Error('Agent not found');

    // Get active calls
    const { data: activeCalls } = await supabase
        .from('agent_call_history')
        .select('vapi_call_id')
        .eq('agent_id', agentId as string)
        .eq('status', 'in-progress');

    // Hang up each call via Telnyx
    const results = await Promise.all(
        (activeCalls || []).map(async (call: { vapi_call_id: string }) => {
            try {
                await telnyxFetch(apiKey, `/v2/calls/${call.vapi_call_id}/actions/hangup`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                });
                await supabase
                    .from('agent_call_history')
                    .update({ status: 'ended', ended_at: new Date().toISOString(), end_reason: 'stopped_by_user' })
                    .eq('vapi_call_id', call.vapi_call_id);
                return { success: true, callId: call.vapi_call_id };
            } catch (e) {
                console.error(`Error ending Telnyx call ${call.vapi_call_id}:`, e);
                return { success: false, callId: call.vapi_call_id };
            }
        })
    );

    // Update agent status
    await supabase
        .from('user_agents')
        .update({ status: 'idle', updated_at: new Date().toISOString() })
        .eq('id', agentId as string);

    // Reset calling contacts
    await supabase
        .from('agent_contacts')
        .update({ status: 'pending' })
        .eq('agent_id', agentId as string)
        .eq('status', 'calling');

    return ok({ message: 'Calls stopped', results });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: CORS });
    }

    try {
        if (!TELNYX_API_KEY) {
            return err('TELNYX_API_KEY secret não configurado no servidor. Acesse: Supabase Dashboard → Edge Functions → telnyx-manage-agent → Secrets → adicione TELNYX_API_KEY');
        }

        const { user, supabase } = await authenticate(req);
        const body = await req.json();
        const { action } = body;

        if (!action) {
            return err('Missing action parameter');
        }

        switch (action) {
            case 'create_assistant':
                return await handleCreateAssistant(supabase, user, TELNYX_API_KEY, body);
            case 'update_assistant':
                return await handleUpdateAssistant(supabase, user, TELNYX_API_KEY, body);
            case 'delete_assistant':
                return await handleDeleteAssistant(supabase, user, TELNYX_API_KEY, body);
            case 'list_phone_numbers':
                return await handleListPhoneNumbers(TELNYX_API_KEY);
            case 'start_calls':
                return await handleStartCalls(supabase, user, TELNYX_API_KEY, body);
            case 'stop_calls':
                return await handleStopCalls(supabase, user, TELNYX_API_KEY, body);
            default:
                return err(`Unknown action: ${action}`);
        }
    } catch (error) {
        console.error('telnyx-manage-agent error:', error);
        return err(error instanceof Error ? error.message : 'Unknown error');
    }
});

