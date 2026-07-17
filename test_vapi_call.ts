import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

async function run() {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');

    if (!SUPABASE_URL || !VAPI_API_KEY) {
        console.log("Missing env vars");
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY as string);

    console.log("Creating outbound call via VAPI...");

    const payload = {
        // type: "outboundPhoneCall", // Let's try without type first, web search says it's not needed if we provide phoneNumberId
        assistantId: "ca07817e-3ce2-47de-9b04-a2ed40e4abcb", // Dummy valid format or I fetch the real one
        phoneNumberId: "a8b413b2-e8d3-46d5-b1cb-3989a5de77e7", // From DB
        customer: {
            number: "+5511999998888",
            name: "Test"
        }
    };

    // We need the actual assistant ID from VAPI for this user's agent
    const { data: agent } = await supabase.from('user_agents').select('agent_provider_id').eq('id', 'be167094-abac-437d-87bd-ffc0694a08b1').single();
    if (agent && agent.agent_provider_id) {
        payload.assistantId = agent.agent_provider_id;
    }

    const res = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY: ${text}`);
}

run();
