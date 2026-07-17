import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken } from '../_shared/wbCrypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // GET: verificação de webhook pelo Facebook
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expectedToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? 'kito_webhook_token';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ [WEBHOOK] Verificação de webhook aprovada');
      return new Response(challenge, { status: 200 });
    }

    console.log('❌ [WEBHOOK] Token de verificação inválido');
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📨 [WEBHOOK] Payload recebido:', JSON.stringify(body).substring(0, 500));

      if (body.object !== 'whatsapp_business_account') {
        return new Response('OK', { status: 200 });
      }

      // Supabase com service role para operações server-side
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          const businessAccountId = entry.id;

          // Buscar usuário pelo business account ID
          const { data: creds } = await supabase
            .from('whatsapp_business_credentials')
            .select('user_id, access_token, phone_number_id')
            .eq('business_account_id', businessAccountId)
            .eq('is_active', true)
            .maybeSingle();

          if (!creds) {
            console.warn('⚠️ [WEBHOOK] Credenciais não encontradas para account:', businessAccountId);
            continue;
          }

          const userId = creds.user_id;

          // Buscar configuração do agente deste usuário (n8n_webhook_url + agent_type)
          const { data: agentConfig } = await supabase
            .from('agent_configs')
            .select('n8n_webhook_url, agent_type, system_prompt')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const userN8nWebhookUrl = agentConfig?.n8n_webhook_url ?? Deno.env.get('N8N_WHATSAPP_WEBHOOK_URL');

          // Processar mensagens recebidas
          for (const message of value.messages ?? []) {
            console.log('💬 [WEBHOOK] Mensagem recebida:', message.id, 'de:', message.from);

            const customerPhone = message.from;
            const messageText = message.text?.body ?? '';
            const messageType = message.type ?? 'text';
            const messageTimestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();

            // Buscar ou criar conversa
            let { data: conv } = await supabase
              .from('whatsapp_business_conversations')
              .select('id')
              .eq('user_id', userId)
              .eq('customer_phone', customerPhone)
              .maybeSingle();

            if (!conv) {
              const { data: newConv, error: convErr } = await supabase
                .from('whatsapp_business_conversations')
                .insert({
                  user_id: userId,
                  customer_phone: customerPhone,
                  last_message_at: messageTimestamp,
                })
                .select('id')
                .single();

              if (convErr) {
                console.error('❌ [WEBHOOK] Erro ao criar conversa:', convErr);
                continue;
              }
              conv = newConv;
            } else {
              // Atualizar timestamp da última mensagem
              await supabase
                .from('whatsapp_business_conversations')
                .update({ last_message_at: messageTimestamp })
                .eq('id', conv.id);
            }

            // Salvar mensagem
            await supabase.from('whatsapp_business_messages').insert({
              conversation_id: conv.id,
              wa_message_id: message.id,
              message_type: messageType,
              content: messageText,
              direction: 'inbound',
              status: 'delivered',
              sent_at: messageTimestamp,
            });

            // Log de auditoria
            await supabase.from('whatsapp_audit_logs').insert({
              user_id: userId,
              action: 'message_received',
              details: { messageId: message.id, from: customerPhone, type: messageType },
            });

            // Encaminhar para N8N do usuário para processamento pela IA
            if (userN8nWebhookUrl && messageText) {
              console.log('🔄 [WEBHOOK] Encaminhando para N8N do usuário:', userId);
              try {
                const n8nResp = await fetch(userN8nWebhookUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId,
                  },
                  body: JSON.stringify({
                    userId,
                    conversationId: conv.id,
                    agentType: agentConfig?.agent_type ?? 'commercial',
                    message: {
                      id: message.id,
                      from: customerPhone,
                      type: messageType,
                      text: messageText,
                      timestamp: message.timestamp,
                    },
                  }),
                });

                if (!n8nResp.ok) {
                  console.error('❌ [WEBHOOK] N8N retornou erro:', n8nResp.status);
                } else {
                  console.log('✅ [WEBHOOK] Mensagem encaminhada ao N8N');
                }
              } catch (n8nErr) {
                console.error('❌ [WEBHOOK] Erro ao chamar N8N:', n8nErr);
              }
            }
          }

          // Processar atualizações de status de mensagens enviadas
          for (const statusUpdate of value.statuses ?? []) {
            const { status, id: waMessageId, timestamp: ts } = statusUpdate;
            console.log('📊 [WEBHOOK] Status update:', waMessageId, '->', status);

            const updateFields: Record<string, string> = { status };
            if (status === 'delivered') updateFields.delivered_at = new Date(parseInt(ts) * 1000).toISOString();
            if (status === 'read') updateFields.read_at = new Date(parseInt(ts) * 1000).toISOString();

            await supabase
              .from('whatsapp_business_messages')
              .update(updateFields)
              .eq('wa_message_id', waMessageId);
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('💥 [WEBHOOK] Erro:', err);
      return new Response('Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
