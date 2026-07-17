// manage-vapi-phone-numbers Edge Function
// Gerencia números de telefone VAPI por usuário (multi-tenant)
// Ações: list, add_twilio, add_vapi_id, search_available, delete

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

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, ...data as object }), { headers: CORS });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err('Missing authorization header', 401);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return err('Unauthorized', 401);

    const body = await req.json();
    const { action } = body;

    // ------------------------------------------------------------------
    // LIST — retorna números cadastrados pelo usuário
    // ------------------------------------------------------------------
    if (action === 'list') {
      const { data, error: listError } = await supabase
        .from('user_phone_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) throw listError;
      return ok({ phone_numbers: data ?? [] });
    }

    // ------------------------------------------------------------------
    // ADD_TWILIO — importa número Twilio no VAPI e cadastra no banco
    // ------------------------------------------------------------------
    if (action === 'add_twilio') {
      const { phone_number, twilio_account_sid, twilio_auth_token, nickname } = body;

      if (!phone_number || !twilio_account_sid || !twilio_auth_token) {
        return err('phone_number, twilio_account_sid e twilio_auth_token são obrigatórios');
      }

      // E.164 validation simples
      if (!/^\+\d{7,15}$/.test(phone_number)) {
        return err('Número deve estar no formato E.164, ex: +5511999998888');
      }

      // Importar no VAPI
      const vapiRes = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'twilio',
          number: phone_number,
          twilioAccountSid: twilio_account_sid,
          twilioAuthToken: twilio_auth_token,
          name: nickname || phone_number,
        }),
      });

      if (!vapiRes.ok) {
        const vapiErr = await vapiRes.json().catch(() => ({ message: 'Erro desconhecido no VAPI' }));
        throw new Error(`VAPI: ${vapiErr.message || JSON.stringify(vapiErr)}`);
      }

      const vapiData = await vapiRes.json();

      // Verificar se usuário já cadastrou este número
      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('id')
        .eq('user_id', user.id)
        .eq('vapi_phone_number_id', vapiData.id)
        .maybeSingle();

      if (existing) return err('Este número já está cadastrado na sua conta.');

      // Salvar no banco
      const { data: inserted, error: insertError } = await supabase
        .from('user_phone_numbers')
        .insert({
          user_id: user.id,
          vapi_phone_number_id: vapiData.id,
          phone_number: phone_number,
          provider: 'twilio',
          nickname: nickname || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return ok({ phone_number: inserted, vapi_id: vapiData.id });
    }

    // ------------------------------------------------------------------
    // ADD_VAPI_ID — cadastra ID VAPI já existente (usuário já registrou
    //               o número diretamente no dashboard do VAPI)
    // ------------------------------------------------------------------
    if (action === 'add_vapi_id') {
      const { vapi_phone_number_id, phone_number, nickname } = body;

      if (!vapi_phone_number_id || !phone_number) {
        return err('vapi_phone_number_id e phone_number são obrigatórios');
      }

      // Verificar se o ID existe no VAPI
      const vapiRes = await fetch(`https://api.vapi.ai/phone-number/${vapi_phone_number_id}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      });

      if (!vapiRes.ok) {
        return err('ID de número VAPI não encontrado. Verifique o ID no dashboard do VAPI.');
      }

      const vapiData = await vapiRes.json();

      // Verificar duplicata para este usuário
      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('id')
        .eq('user_id', user.id)
        .eq('vapi_phone_number_id', vapi_phone_number_id)
        .maybeSingle();

      if (existing) return err('Este número já está cadastrado na sua conta.');

      const { data: inserted, error: insertError } = await supabase
        .from('user_phone_numbers')
        .insert({
          user_id: user.id,
          vapi_phone_number_id: vapi_phone_number_id,
          phone_number: vapiData.number || phone_number,
          provider: vapiData.provider || 'vapi',
          nickname: nickname || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return ok({ phone_number: inserted });
    }

    // ------------------------------------------------------------------
    // DELETE — remove do banco (NÃO deleta do VAPI para evitar quebrar
    //          outros agentes; usuário gerencia no dashboard VAPI)
    // ------------------------------------------------------------------
    if (action === 'delete') {
      const { phone_number_id } = body; // ID da tabela user_phone_numbers

      if (!phone_number_id) return err('phone_number_id é obrigatório');

      // Verificar se pertence ao usuário
      const { data: record, error: fetchError } = await supabase
        .from('user_phone_numbers')
        .select('id, vapi_phone_number_id')
        .eq('id', phone_number_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !record) return err('Número não encontrado ou não pertence ao usuário.');

      // Verificar se algum agente ainda usa este número
      const { count } = await supabase
        .from('user_agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('phone_number_provider_id', record.vapi_phone_number_id);

      if ((count ?? 0) > 0) {
        return err(`Este número está sendo usado por ${count} agente(s). Remova-os primeiro.`);
      }

      const { error: deleteError } = await supabase
        .from('user_phone_numbers')
        .delete()
        .eq('id', phone_number_id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      return ok({ deleted: true });
    }

    return err('Ação inválida. Use: list, add_twilio, add_vapi_id, delete');

  } catch (error) {
    console.error('[manage-vapi-phone-numbers]', error);
    return err(error instanceof Error ? error.message : 'Erro interno', 500);
  }
});
