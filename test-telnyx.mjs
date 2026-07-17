import fetch from 'node-fetch';

const TELNYX_API_KEY = "8dd62c5680295717f9d69ecc516a1df9fbedeccb50190d3bc814c48a30680941";

const assistantConfig = {
    name: "Test Agent",
    instructions: "Você é um assistente de teste.",
    model: {
        name: "anthropic/claude-3-5-sonnet",
        temperature: 0.7,
    },
    voice: {
        voice_id: "AWS.Polly.Vitoria-Neural",
        provider: "aws",
    },
    transcriber: {
        provider: "telnyx",
        language: "pt-BR",
    },
    first_message: "Olá! Como posso ajudar você hoje?",
};

async function test() {
    try {
        console.log("Sending payload:", JSON.stringify(assistantConfig, null, 2));
        const resp = await fetch('https://api.telnyx.com/v2/ai/assistants', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TELNYX_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assistantConfig)
        });

        const body = await resp.json();
        console.log("Status:", resp.status);
        console.log("Response:", JSON.stringify(body, null, 2));
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

test();
