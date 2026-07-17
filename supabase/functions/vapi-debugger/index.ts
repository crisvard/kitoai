import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { callId } = await req.json();
    if (!callId) {
      return new Response(JSON.stringify({ error: 'Missing callId' }), { status: 400 });
    }

    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify({ vapiResponse: data }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
