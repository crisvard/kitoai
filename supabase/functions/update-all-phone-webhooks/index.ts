// Update ALL existing phone numbers with webhook configuration
// Execute via: supabase functions invoke update-all-phone-webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    // Buscar todos os números Twilio/VAPI
    const { data: numbers, error: fetchError } = await supabase
      .from('user_phone_numbers')
      .select('id, vapi_phone_number_id, phone_number, provider')
      .in('provider', ['twilio', 'vapi']);

    if (fetchError) throw fetchError;

    console.log(`Encontrados ${numbers?.length || 0} números para atualizar`);

    const results = [];
    for (const num of numbers || []) {
      const vapiRes = await fetch(`https://api.vapi.ai/phone-number/${num.vapi_phone_number_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: { url: `${SUPABASE_URL}/functions/v1/vapi-webhook` },
          serverMessages: ['end-of-call-report', 'status-update', 'hang', 'function-call', 'tool-calls']
        }),
      });

      if (vapiRes.ok) {
        console.log(`✅ Webhook adicionado a ${num.phone_number}`);
        results.push({ number: num.phone_number, status: 'updated' });
      } else {
        const errText = await vapiRes.text();
        console.error(`❌ Falha em ${num.phone_number}:`, errText);
        results.push({ number: num.phone_number, status: 'failed', error: errText });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: results.filter(r => r.status === 'updated').length,
        failed: results.filter(r => r.status === 'failed').length,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});