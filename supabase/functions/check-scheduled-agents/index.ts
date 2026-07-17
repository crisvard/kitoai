import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
    // Edge Function triggered by pg_cron (runs every minute ideally, or scheduled via Deno Cron)

    // GET ping for keep-alive
    if (req.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        console.log('[CRON] Starting check for scheduled agents...');
        const now = new Date().toISOString();

        // Buscar agentes com status 'scheduled' cujo horário já passou ou é agora
        const { data: scheduledAgents, error: fetchError } = await supabase
            .from('user_agents')
            .select('id, user_id, agent_provider_id')
            .eq('status', 'scheduled')
            .lte('scheduled_at', now);

        if (fetchError) {
            console.error('[CRON] Error fetching scheduled agents:', fetchError);
            return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
        }

        if (!scheduledAgents || scheduledAgents.length === 0) {
            console.log('[CRON] No scheduled agents ready at', now);
            return new Response(JSON.stringify({ message: 'No scheduled agents found at this time.' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log(`[CRON] Found ${scheduledAgents.length} agent(s) ready to start dialing.`);

        const results = [];

        for (const agent of scheduledAgents) {
            console.log(`[CRON] Waking up Agent: ${agent.id}`);

            // 1. Mudar o status de 'scheduled' para 'calling'
            const { error: updateError } = await supabase
                .from('user_agents')
                .update({
                    status: 'calling',
                    scheduled_at: null, // Limpa o agendamento
                    updated_at: new Date().toISOString(),
                })
                .eq('id', agent.id);

            if (updateError) {
                console.error(`[CRON] Failed to update agent ${agent.id} status:`, updateError);
                results.push({ agentId: agent.id, success: false, error: updateError.message });
                continue;
            }

            // 2. Chamar o start-agent-calls para iniciar o loop de chamadas
            // Como não temos o JWT do usuário (somos o Cron com Server Key),
            // fazemos uma chamada direta usando fetch e o SERVICE_ROLE_KEY caso aceito
            // O start-agent-calls no projeto exige Token de Auth de usuário ativo.
            // Solução: Fazer o insert/fetch direto para a VAPI (simulando a primeira ligação que a start-agent-calls faria)
            // Como a triggerNextCall() será acionada nos webhooks quando terminar a primeira, isso é tudo o que precisamos.

            const { data: contacts } = await supabase
                .from('agent_contacts')
                .select('*')
                .eq('agent_id', agent.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1);

            if (!contacts || contacts.length === 0) {
                console.log(`[CRON] Agent ${agent.id} has no pending contacts. Setting to idle.`);
                await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agent.id);
                results.push({ agentId: agent.id, success: false, error: 'No pending contacts' });
                continue;
            }

            const nextContact = contacts[0];

            // Formatar telefone
            let formattedPhone = nextContact.phone.replace(/[\s\-\(\)]/g, '');
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = formattedPhone.length <= 11 ? `+55${formattedPhone}` : `+${formattedPhone}`;
            }

            // Refresh agent to get full data (like phone provider id)
            const { data: freshAgent } = await supabase
                .from('user_agents')
                .select('agent_provider_id, phone_number_provider_id')
                .eq('id', agent.id)
                .single();

            if (!freshAgent || !freshAgent.agent_provider_id) {
                console.log(`[CRON] Agent ${agent.id} missing provider ID.`);
                await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agent.id);
                continue;
            }

            // Update contact status to calling
            await supabase
                .from('agent_contacts')
                .update({ status: 'calling', last_attempt_at: new Date().toISOString() })
                .eq('id', nextContact.id)
                .eq('status', 'pending');

            const vapiCallBody: Record<string, any> = {
                assistantId: freshAgent.agent_provider_id,
                customer: { number: formattedPhone, name: nextContact.name },
                metadata: { agentId: agent.id, contactId: nextContact.id, userId: agent.user_id },
            };

            if (freshAgent.phone_number_provider_id) {
                vapiCallBody.phoneNumberId = freshAgent.phone_number_provider_id;
            }

            const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.VAPI_API_KEY || Deno.env.get('VAPI_API_KEY')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vapiCallBody),
            });

            if (vapiResponse.ok) {
                const callData = await vapiResponse.json();
                console.log(`[CRON] Successfully started VAPI call ${callData.id} for agent ${agent.id}`);
                await supabase.from('agent_call_history').insert({
                    agent_id: agent.id,
                    user_id: agent.user_id,
                    contact_id: nextContact.id,
                    vapi_call_id: callData.id,
                    phone_number: nextContact.phone,
                    status: 'in-progress',
                    started_at: new Date().toISOString(),
                });
                results.push({ agentId: agent.id, success: true, callId: callData.id });
            } else {
                const errText = await vapiResponse.text().catch(() => 'unknown');
                console.error(`[CRON] VAPI error for agent ${agent.id}: ${vapiResponse.status} ${errText}`);

                // Revert status
                await supabase.from('agent_contacts').update({ status: 'failed', attempt_count: 1 }).eq('id', nextContact.id);
                await supabase.from('user_agents').update({ status: 'idle' }).eq('id', agent.id);

                results.push({ agentId: agent.id, success: false, error: errText });
            }
        }

        return new Response(JSON.stringify({ message: 'Processed scheduled agents', results }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[CRON] Unhandled error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
