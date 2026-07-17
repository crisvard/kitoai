import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken } from '../_shared/wbCrypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log('📤 [SEND-MSG] Iniciando envio de mensagem...');

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

    const { to, message, conversationId } = await req.json();
    if (!to || !message) throw new Error('Destinatário e mensagem são obrigatórios');

    const cleanPhone = to.replace(/\D/g, '');
    console.log('📱 [SEND-MSG] Enviando para:', cleanPhone);

    // Buscar credenciais do usuário
    const { data: creds, error: credsErr } = await supabase
      .from('whatsapp_business_credentials')
      .select('access_token, phone_number_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (credsErr || !creds) throw new Error('Credenciais WhatsApp Business não encontradas');

    // Descriptografar token
    const accessToken = await decryptToken(creds.access_token);

    // Enviar mensagem via WhatsApp Business API v19.0
    const apiUrl = `https://graph.facebook.com/v19.0/${creds.phone_number_id}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { preview_url: false, body: message },
    };

    const apiResp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const apiData = await apiResp.json();
    console.log('📥 [SEND-MSG] Resposta API:', apiData);

    if (!apiResp.ok) {
      throw new Error(`WhatsApp API erro: ${apiData.error?.message ?? 'Erro desconhecido'}`);
    }

    const waMessageId = apiData.messages?.[0]?.id;

    // Buscar ou criar conversa para salvar a mensagem enviada
    let convId = conversationId;
    if (!convId) {
      const { data: existingConv } = await supabase
        .from('whatsapp_business_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('customer_phone', cleanPhone)
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const { data: newConv } = await supabase
          .from('whatsapp_business_conversations')
          .insert({
            user_id: user.id,
            customer_phone: cleanPhone,
            last_message_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        convId = newConv?.id;
      }
    }

    // Salvar mensagem enviada
    if (convId) {
      await supabase.from('whatsapp_business_messages').insert({
        conversation_id: convId,
        wa_message_id: waMessageId,
        message_type: 'text',
        content: message,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Atualizar timestamp da conversa
      await supabase
        .from('whatsapp_business_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);
    }

    // Log de auditoria
    await supabase.from('whatsapp_audit_logs').insert({
      user_id: user.id,
      action: 'message_sent',
      details: { messageId: waMessageId, to: cleanPhone },
    });

    return new Response(
      JSON.stringify({ success: true, messageId: waMessageId, status: 'sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('💥 [SEND-MSG] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
