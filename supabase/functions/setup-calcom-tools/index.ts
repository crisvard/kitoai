// setup-calcom-tools Edge Function
// Creates two VAPI function tools (check_availability + book_appointment)
// and links them to the agent's VAPI assistant.
// This is intentionally minimal — no voice/model changes, just tools.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cal.com config — change these to adjust the target calendar/event
const CAL_COM_USERNAME = 'cristopher-ramos-vieira-kitoexpert';
const CAL_COM_EVENT_SLUG = 'demo-app-academia';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
};

function ok(data: unknown) {
    return new Response(JSON.stringify({ success: true, ...(data as object) }), { headers: CORS });
}
function err(message: string, details?: string, status = 400) {
    return new Response(JSON.stringify({ success: false, error: message, details }), { status, headers: CORS });
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return err('Missing authorization header', undefined, 401);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return err('Unauthorized', undefined, 401);

        if (!VAPI_API_KEY) return err('VAPI_API_KEY não configurada no servidor', undefined, 500);

        const body = await req.json();
        const { agentId } = body;

        if (!agentId) return err('agentId é obrigatório');

        // 1. Buscar o agente no banco para obter o vapiAssistantId
        const { data: agent, error: agentError } = await supabase
            .from('user_agents')
            .select('id, agent_provider_id, agent_name')
            .eq('id', agentId)
            .eq('user_id', user.id)
            .single();

        if (agentError || !agent) return err('Agente não encontrado');
        if (!agent.agent_provider_id) return err('Este agente não está sincronizado com a VAPI. Salve as configurações primeiro.');

        const vapiAssistantId = agent.agent_provider_id;
        const webhookUrl = `${SUPABASE_URL}/functions/v1/vapi-webhook`;

        console.log(`[setup-calcom-tools] Setting up tools for agent ${agentId}, VAPI assistant: ${vapiAssistantId}`);

        // 2. Criar (ou reutilizar) a tool check_availability
        const checkAvailabilityToolId = await createOrGetTool('check_availability', {
            name: 'check_availability',
            description: `Verifica os horários disponíveis na agenda (${CAL_COM_USERNAME}/${CAL_COM_EVENT_SLUG}). Use quando o cliente quiser agendar uma reunião ou demo. Passe a data desejada no formato YYYY-MM-DD.`,
            parameters: {
                type: 'object',
                properties: {
                    date: {
                        type: 'string',
                        description: 'Data desejada no formato YYYY-MM-DD (ex: 2026-04-29)',
                    },
                },
                required: ['date'],
            },
        }, webhookUrl);

        // 3. Criar (ou reutilizar) a tool book_appointment
        const bookAppointmentToolId = await createOrGetTool('book_appointment', {
            name: 'book_appointment',
            description: `Agenda uma reunião/demo no horário escolhido pelo cliente. Use após o cliente confirmar o horário escolhido. Precisa de: datetime (ISO 8601 com fuso horário, ex: 2026-04-29T14:00:00-03:00) e nome do cliente. Email é opcional.`,
            parameters: {
                type: 'object',
                properties: {
                    datetime: {
                        type: 'string',
                        description: 'Data e hora no formato ISO 8601 com fuso horário (ex: 2026-04-29T14:00:00-03:00)',
                    },
                    name: {
                        type: 'string',
                        description: 'Nome completo do cliente',
                    },
                    email: {
                        type: 'string',
                        description: 'Email do cliente (opcional)',
                    },
                },
                required: ['datetime', 'name'],
            },
        }, webhookUrl);

        console.log(`[setup-calcom-tools] Tool IDs: check=${checkAvailabilityToolId}, book=${bookAppointmentToolId}`);

        // 4. Vincular as tools ao assistente via PATCH mínimo
        // Busca o model atual para preservar provider/model e adicionar toolIds
        const currentRes = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
            headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
        });

        if (!currentRes.ok) {
            const errText = await currentRes.text();
            return err(`Erro ao buscar assistente VAPI (${currentRes.status})`, errText);
        }

        const currentAssistant = await currentRes.json();
        const currentModel = currentAssistant.model || {};

        // Remove inline tools (Google Calendar and any other legacy tools)
        // We use toolIds exclusively — inline tools cause conflicts and duplication
        const cleanModel = { ...currentModel };
        delete cleanModel['tools'];

        // Get existing toolIds from model, filter out our tools to avoid duplicates
        const existingModelToolIds: string[] = ((currentModel.toolIds as string[]) || [])
            .filter((id: string) => id !== checkAvailabilityToolId && id !== bookAppointmentToolId);

        const finalToolIds = [...existingModelToolIds, checkAvailabilityToolId, bookAppointmentToolId];

        // Inject today's date into the system prompt so the LLM knows the actual date
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const isoDate = today.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

        const currentSystemPrompt = currentModel.messages?.[0]?.content || currentAssistant.firstMessage || '';
        const datePrefix = `[CONTEXTO DO SISTEMA]\nData atual: ${dateStr} (${isoDate}). Use esta data para calcular "amanhã", "hoje" e outros termos relativos.\nFuso horário: America/Sao_Paulo (UTC-3).\n\n`;

        // Build the updated system prompt if it doesn't already have the date injected
        let updatedMessages = currentModel.messages;
        if (Array.isArray(updatedMessages) && updatedMessages.length > 0) {
            const firstMsg = updatedMessages[0];
            if (firstMsg.role === 'system' && !String(firstMsg.content).startsWith('[CONTEXTO DO SISTEMA]')) {
                updatedMessages = [
                    { ...firstMsg, content: datePrefix + String(firstMsg.content) },
                    ...updatedMessages.slice(1),
                ];
            }
        }

        // PATCH with model.toolIds (official VAPI way) + clean model (no Google Calendar tools)
        const patchPayload: Record<string, unknown> = {
            model: {
                ...cleanModel,
                toolIds: finalToolIds,
                ...(updatedMessages ? { messages: updatedMessages } : {}),
            },
            // Always ensure tool-calls events are forwarded to our webhook
            serverMessages: [
                'end-of-call-report',
                'status-update',
                'hang',
                'function-call',
                'tool-calls',
            ],
        };

        console.log(`[setup-calcom-tools] Patching assistant model.toolIds:`, finalToolIds);
        console.log(`[setup-calcom-tools] Cleared model.tools (Google Calendar removed). Date injected: ${isoDate}`);

        const patchRes = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchPayload),
        });

        const patchText = await patchRes.text();
        console.log(`[setup-calcom-tools] PATCH response (${patchRes.status}):`, patchText.slice(0, 800));

        if (!patchRes.ok) {
            return err(
                `Erro ao vincular tools ao assistente VAPI (Status ${patchRes.status})`,
                patchText,
                400,
            );
        }

        const patchResult = JSON.parse(patchText);
        const appliedToolIds: string[] = patchResult?.model?.toolIds || patchResult?.toolIds || finalToolIds;

        return ok({
            message: 'Tools Cal.com configuradas com sucesso!',
            toolIds: {
                checkAvailability: checkAvailabilityToolId,
                bookAppointment: bookAppointmentToolId,
            },
            patch: {
                status: patchRes.status,
                result: patchResult,
                promptUpdated: true,
                serverMessagesUpdated: true,
                appliedToolIds,
            },
        });

    } catch (error) {
        console.error('[setup-calcom-tools] Error:', error);
        return err(error instanceof Error ? error.message : 'Unknown error', undefined, 500);
    }
});

// Helper: Creates or reuses a VAPI function tool by name
async function createOrGetTool(
    name: string,
    functionDef: { name: string; description: string; parameters: unknown },
    serverUrl: string,
): Promise<string> {
    // First, check if tool already exists
    const listRes = await fetch('https://api.vapi.ai/tool?limit=100', {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
    });

    if (listRes.ok) {
        const listData = await listRes.json();
        const tools = Array.isArray(listData) ? listData : (listData.results ?? []);
        const existing = tools.find(
            (t: Record<string, unknown>) =>
                t.type === 'function' &&
                (t as any).function?.name === name
        );
        if (existing) {
            console.log(`[setup-calcom-tools] Reusing existing tool "${name}": ${existing.id}`);
            return existing.id as string;
        }
    }

    // Create new tool
    const createRes = await fetch('https://api.vapi.ai/tool', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'function',
            function: functionDef,
            server: { url: serverUrl },
            async: false,
            messages: [
                {
                    type: 'request-start',
                    content: name === 'check_availability'
                        ? 'Um momento, vou verificar a agenda...'
                        : 'Um momento, estou agendando...',
                },
            ],
        }),
    });

    const createText = await createRes.text();
    if (!createRes.ok) {
        throw new Error(`Erro ao criar tool "${name}" (${createRes.status}): ${createText}`);
    }

    const created = JSON.parse(createText);
    console.log(`[setup-calcom-tools] Created tool "${name}": ${created.id}`);
    return created.id as string;
}
