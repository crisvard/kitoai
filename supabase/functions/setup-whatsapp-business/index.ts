import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/wbCrypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log('🚀 [SETUP-WB] Iniciando setup WhatsApp Business...');

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

    // Autenticar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado');
    console.log('✅ [SETUP-WB] Usuário autenticado:', user.id);

    // Ler número do usuário do body
    const { phoneNumber } = await req.json();
    if (!phoneNumber) throw new Error('Número de telefone obrigatório');

    // Buscar credenciais master do environment
    const masterToken = Deno.env.get('WHATSAPP_BUSINESS_ACCESS_TOKEN');
    const masterPhoneNumberId = Deno.env.get('WHATSAPP_BUSINESS_PHONE_NUMBER_ID');
    const masterBusinessAccountId = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID');

    if (!masterToken || !masterPhoneNumberId || !masterBusinessAccountId) {
      throw new Error('Credenciais master do WhatsApp Business não configuradas no Supabase Secrets');
    }

    console.log('🔐 [SETUP-WB] Criptografando access token...');
    const encryptedToken = await encryptToken(masterToken);

    // Verificar se usuário já tem credenciais
    const { data: existing } = await supabase
      .from('whatsapp_business_credentials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Atualizar existente
      const { error: updateError } = await supabase
        .from('whatsapp_business_credentials')
        .update({
          access_token: encryptedToken,
          phone_number_id: masterPhoneNumberId,
          business_account_id: masterBusinessAccountId,
          phone_number: phoneNumber.replace(/\D/g, ''),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      console.log('📝 [SETUP-WB] Credenciais atualizadas');
    } else {
      // Inserir novo
      const { error: insertError } = await supabase
        .from('whatsapp_business_credentials')
        .insert({
          user_id: user.id,
          access_token: encryptedToken,
          phone_number_id: masterPhoneNumberId,
          business_account_id: masterBusinessAccountId,
          phone_number: phoneNumber.replace(/\D/g, ''),
          webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-business-webhook`,
          verify_token: Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? 'kito_webhook_token',
          is_active: true,
        });

      if (insertError) throw insertError;
      console.log('🆕 [SETUP-WB] Credenciais criadas');
    }

    // Validar conexão com a API do Facebook
    console.log('🧪 [SETUP-WB] Validando token na API do Facebook...');
    const testResp = await fetch(
      `https://graph.facebook.com/v19.0/${masterPhoneNumberId}?fields=id,display_phone_number,quality_rating`,
      {
        headers: { Authorization: `Bearer ${masterToken}` },
      }
    );

    const testData = await testResp.json();
    console.log('📊 [SETUP-WB] Resposta Facebook:', testData);

    if (!testResp.ok) {
      throw new Error(`Validação Facebook falhou: ${testData.error?.message ?? 'Erro desconhecido'}`);
    }

    // Log de auditoria
    await supabase.from('whatsapp_audit_logs').insert({
      user_id: user.id,
      action: 'whatsapp_business_setup',
      details: {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        phoneNumberId: masterPhoneNumberId,
        facebookResponse: testData,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp Business configurado com sucesso',
        phoneNumberId: masterPhoneNumberId,
        displayPhone: testData.display_phone_number,
        qualityRating: testData.quality_rating ?? 'GREEN',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('💥 [SETUP-WB] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
