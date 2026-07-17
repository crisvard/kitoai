import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/wbCrypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Embedded Signup — cada usuário conecta o PRÓPRIO WABA (WhatsApp Business Account).
 *
 * Fluxo:
 * 1. Frontend abre popup OAuth do Facebook com redirect_uri apontando para /oauth/facebook/callback
 * 2. Facebook redireciona o popup com ?code=...&state=...
 * 3. A página de callback faz postMessage de volta ao frontend
 * 4. Frontend chama esta edge function com { code, redirectUri }
 * 5. Edge function troca code por short-lived token, depois por long-lived (60 dias)
 * 6. Auto-descobre WABA e número de telefone via Graph API
 * 7. Criptografa e salva em whatsapp_business_credentials
 *
 * Secrets necessários:
 *   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET,
 *   WHATSAPP_ENCRYPTION_KEY, WHATSAPP_ENCRYPTION_SALT, WHATSAPP_WEBHOOK_VERIFY_TOKEN
 */
serve(async (req) => {
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

    const { code, redirectUri } = await req.json();

    if (!code) throw new Error('Authorization code obrigatório');
    if (!redirectUri) throw new Error('redirectUri obrigatório');

    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('FACEBOOK_APP_ID e FACEBOOK_APP_SECRET não configurados nos Supabase Secrets');
    }

    // Passo 1: trocar code por short-lived user access token
    console.log('🔑 [CONNECT-WB] Trocando code por access token...');
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResp = await fetch(tokenUrl.toString());
    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || !tokenData.access_token) {
      console.error('❌ [CONNECT-WB] Erro ao trocar code:', tokenData);
      throw new Error(`Erro ao obter access token: ${tokenData.error?.message ?? 'Código inválido ou expirado'}`);
    }

    const shortLivedToken = tokenData.access_token;

    // Passo 2: trocar por long-lived token (60 dias)
    console.log('🔄 [CONNECT-WB] Obtendo long-lived token...');
    const longTokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longTokenUrl.searchParams.set('client_id', appId);
    longTokenUrl.searchParams.set('client_secret', appSecret);
    longTokenUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const longTokenResp = await fetch(longTokenUrl.toString());
    const longTokenData = await longTokenResp.json();

    if (!longTokenResp.ok || !longTokenData.access_token) {
      console.error('❌ [CONNECT-WB] Erro ao obter long-lived token:', longTokenData);
      throw new Error(`Erro ao obter token de longa duração: ${longTokenData.error?.message ?? 'Erro desconhecido'}`);
    }

    const longLivedToken = longTokenData.access_token;
    const tokenExpiresIn = longTokenData.expires_in; // segundos

    // Passo 3: auto-descobrir WABA e número de telefone via Graph API
    console.log('🔍 [CONNECT-WB] Descobrindo WABA e número de telefone...');
    const bizResp = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name,quality_rating}}&access_token=${longLivedToken}`
    );
    const bizData = await bizResp.json();

    console.log('📋 [CONNECT-WB] Dados de negócios:', JSON.stringify(bizData));

    let wabaId: string | null = null;
    let phoneNumberId: string | null = null;
    let displayPhone: string | null = null;
    let verifiedName: string | null = null;
    let qualityRating: string | null = null;

    // Tenta extrair WABA de /me/businesses
    if (bizResp.ok && bizData.data?.length > 0) {
      for (const biz of bizData.data) {
        const wabas = biz.whatsapp_business_accounts?.data ?? [];
        for (const waba of wabas) {
          const phones = waba.phone_numbers?.data ?? [];
          if (phones.length > 0) {
            wabaId = waba.id;
            phoneNumberId = phones[0].id;
            displayPhone = phones[0].display_phone_number;
            verifiedName = phones[0].verified_name;
            qualityRating = phones[0].quality_rating;
            break;
          }
        }
        if (wabaId) break;
      }
    }

    // Fallback: tenta /me/whatsapp_business_accounts diretamente
    if (!wabaId) {
      console.log('🔄 [CONNECT-WB] Tentando /me/whatsapp_business_accounts...');
      const wabaResp = await fetch(
        `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number,verified_name,quality_rating}&access_token=${longLivedToken}`
      );
      const wabaDataDirect = await wabaResp.json();
      console.log('📋 [CONNECT-WB] WABAs diretos:', JSON.stringify(wabaDataDirect));

      if (wabaResp.ok && wabaDataDirect.data?.length > 0) {
        const waba = wabaDataDirect.data[0];
        wabaId = waba.id;
        const phones = waba.phone_numbers?.data ?? [];
        if (phones.length > 0) {
          phoneNumberId = phones[0].id;
          displayPhone = phones[0].display_phone_number;
          verifiedName = phones[0].verified_name;
          qualityRating = phones[0].quality_rating;
        }
      }
    }

    if (!wabaId || !phoneNumberId) {
      throw new Error('Nenhum WABA ou número de telefone encontrado na conta Meta. Verifique se o app tem permissão whatsapp_business_management e se existe um número cadastrado.');
    }

    console.log(`✅ [CONNECT-WB] WABA: ${wabaId} | Phone: ${phoneNumberId} | Número: ${displayPhone}`);

    // Passo 4: criptografar e salvar credenciais
    const encryptedToken = await encryptToken(longLivedToken);

    const tokenExpiresAt = tokenExpiresIn
      ? new Date(Date.now() + tokenExpiresIn * 1000).toISOString()
      : null;

    const { data: existing } = await supabase
      .from('whatsapp_business_credentials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const credentialPayload = {
      access_token: encryptedToken,
      phone_number_id: phoneNumberId,
      business_account_id: wabaId,
      phone_number: (displayPhone ?? '').replace(/\D/g, ''),
      webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-business-webhook`,
      verify_token: Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? 'kito_webhook_token',
      is_active: true,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error: updateErr } = await supabase
        .from('whatsapp_business_credentials')
        .update(credentialPayload)
        .eq('user_id', user.id);
      if (updateErr) throw updateErr;
      console.log('📝 [CONNECT-WB] Credenciais atualizadas');
    } else {
      const { error: insertErr } = await supabase
        .from('whatsapp_business_credentials')
        .insert({ user_id: user.id, ...credentialPayload });
      if (insertErr) throw insertErr;
      console.log('🆕 [CONNECT-WB] Credenciais criadas');
    }

    await supabase.from('whatsapp_audit_logs').insert({
      user_id: user.id,
      action: 'whatsapp_embedded_signup',
      details: {
        wabaId,
        phoneNumberId,
        displayPhone,
        verifiedName,
        qualityRating,
        tokenExpiresAt,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp Business conectado com sucesso',
        phoneNumberId,
        displayPhone,
        qualityRating: qualityRating ?? 'GREEN',
        verifiedName: verifiedName ?? null,
        tokenExpiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('💥 [CONNECT-WB] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
