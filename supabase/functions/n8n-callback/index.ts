// n8n-callback Edge Function
// Recebe resultado de workflows n8n (check_availability, book_appointment)
// e processa o resultado no banco

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload = await req.json();
    const { callId, toolCallId, functionName, result, agentId, error } = payload;

    console.log(`[N8N CALLBACK] Received result for ${functionName} (toolCallId: ${toolCallId})`);
    console.log(`[N8N CALLBACK] Result:`, result);

    if (!callId || !toolCallId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing callId or toolCallId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status em pending_tool_calls
    const { error: updateError } = await supabase
      .from('pending_tool_calls')
      .update({
        result: { text: result, error },
        status: error ? 'failed' : 'completed',
      })
      .eq('call_id', callId)
      .eq('tool_call_id', toolCallId);

    if (updateError) {
      console.error('[N8N CALLBACK] Error updating pending_tool_calls:', updateError);
    } else {
      console.log('[N8N CALLBACK] Updated pending_tool_calls with result');
    }

    // OPTIONAL: Enviar feedback para VAPI (experimental)
    // VAPI pode suportar PUT /call/{callId}/tool-call-result com a resposta final
    if (VAPI_API_KEY && callId) {
      try {
        // Tentar enviar feedback para VAPI (se suportar)
        const vapiUrl = `https://api.vapi.ai/call/${callId}/tool-call-result`;
        
        const vapiRes = await fetch(vapiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toolCallId,
            result: error ? `Erro: ${error}` : result,
          }),
        }).catch(() => null);

        if (vapiRes && !vapiRes.ok) {
          console.warn(`[N8N CALLBACK] VAPI feedback failed (${vapiRes.status}). Resultado salvo em DB.`);
        } else if (vapiRes) {
          console.log(`[N8N CALLBACK] VAPI feedback enviado com sucesso`);
        }
      } catch (vapiErr) {
        console.warn(`[N8N CALLBACK] Could not send feedback to VAPI:`, vapiErr);
        // Sem problema - resultado foi salvo no banco de qualquer forma
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Callback processado com sucesso',
        callId,
        toolCallId,
        functionName,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[N8N CALLBACK] Error:', error);
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
