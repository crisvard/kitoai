// Create VAPI Agent Edge Function
// Creates a new VAPI assistant with Claude 3.5 Sonnet + ElevenLabs configuration

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: CORS });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    const body = await req.json();
    const { agentId, name, systemPrompt, voiceId, model, temperature, firstMessage } = body;

    if (!agentId || !name || !systemPrompt || !voiceId || !model) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: agentId, name, systemPrompt, voiceId, model' }), { status: 400, headers: CORS });
    }

    // Sempre usa GPT-4o como modelo
    const forcedModel = 'gpt-4o';
    const provider = 'openai';

    // Build VAPI assistant configuration with correct format
    const vapiConfig: Record<string, unknown> = {
      name,
      model: {
        provider,
        model: forcedModel,
        temperature: temperature ?? 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
        ],
      },
      voice: {
        provider: '11labs',
        voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM', // Rachel
        model: 'eleven_turbo_v2_5', // Mais natural e conversacional para pt-br
        stability: 0.5,
        similarityBoost: 0.5, // Menor similaridade diminui gargalo (picotamento)
        optimizeStreamingLatency: 3, // Nível mais agressivo para telefone
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'pt-BR',
      },
      firstMessage: firstMessage || 'Olá! Como posso ajudar você hoje?',
      recordingEnabled: true,
      server: {
        url: `${SUPABASE_URL}/functions/v1/vapi-webhook`
      },
      serverMessages: [
        'end-of-call-report',
        'status-update',
        'hang',
        'function-call',
        'tool-calls',
      ],
      clientMessages: [
        'status-update',
        'transcript',
        'function-call',
        'hang',
        'speech-update',
      ],
    };

    // Call VAPI API
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiConfig),
    });

    const vapiBody = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error('VAPI error response:', JSON.stringify(vapiBody));
      const vapiMsg = vapiBody?.message || vapiBody?.error || JSON.stringify(vapiBody);
      return new Response(
        JSON.stringify({ success: false, error: `VAPI: ${vapiMsg}`, vapi_details: vapiBody }),
        { status: 400, headers: CORS }
      );
    }

    // Update agent in database with VAPI assistant ID
    const { error: updateError } = await supabase
      .from('user_agents')
      .update({
        agent_provider_id: vapiBody.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)
      .eq('user_id', user.id);

    if (updateError) {
      // Rollback VAPI assistant
      await fetch(`https://api.vapi.ai/assistant/${vapiBody.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      });
      return new Response(
        JSON.stringify({ success: false, error: `DB update failed: ${updateError.message}` }),
        { status: 500, headers: CORS }
      );
    }

    return new Response(
      JSON.stringify({ success: true, agent_id: vapiBody.id, assistantId: vapiBody.id }),
      { headers: CORS }
    );

  } catch (error) {
    console.error('Error creating VAPI agent:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: CORS }
    );
  }
});
