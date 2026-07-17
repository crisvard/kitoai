import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken } from '../_shared/wbCrypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log('🧪 [TEST-WB] Testando conexão WhatsApp Business...');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Sem header de autorização');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado');

    // Buscar credenciais
    const { data: creds } = await supabase
      .from('whatsapp_business_credentials')
      .select('access_token, phone_number_id, phone_number')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!creds) {
      return new Response(
        JSON.stringify({ connected: false, error: 'Credenciais não configuradas. Execute o setup primeiro.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const accessToken = await decryptToken(creds.access_token);

    // Testar via API do Facebook - buscar info do número
    const phoneResp = await fetch(
      `https://graph.facebook.com/v19.0/${creds.phone_number_id}?fields=id,display_phone_number,quality_rating,verified_name,account_mode`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const phoneData = await phoneResp.json();
    console.log('📊 [TEST-WB] Dados do número:', phoneData);

    if (!phoneResp.ok) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: `Erro de conexão com Facebook: ${phoneData.error?.message ?? 'Token inválido ou expirado'}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        connected: true,
        phoneNumber: phoneData.display_phone_number ?? creds.phone_number,
        qualityRating: phoneData.quality_rating ?? 'UNKNOWN',
        verifiedName: phoneData.verified_name ?? null,
        accountMode: phoneData.account_mode ?? null,
        phoneNumberId: creds.phone_number_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('💥 [TEST-WB] Erro:', err);
    return new Response(
      JSON.stringify({ connected: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
