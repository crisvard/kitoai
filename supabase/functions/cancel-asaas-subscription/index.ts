import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚫 [CANCEL-SUBSCRIPTION] Iniciando cancelamento de assinatura...')

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Autenticação usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('❌ [CANCEL-SUBSCRIPTION] Erro autenticação:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CANCEL-SUBSCRIPTION] Usuário autenticado:', user.email)

    // Buscar perfil usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ [CANCEL-SUBSCRIPTION] Erro buscar perfil:', profileError?.message)
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.asaas_subscription_id) {
      console.log('⚠️ [CANCEL-SUBSCRIPTION] Usuário não tem assinatura ativa')
      return new Response(
        JSON.stringify({ error: 'Usuário não possui assinatura ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CANCEL-SUBSCRIPTION] Assinatura a cancelar:', profile.asaas_subscription_id)

    // Verificar API key
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      console.error('❌ [CANCEL-SUBSCRIPTION] ASAAS_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cancelar assinatura no Asaas (definir status INACTIVE)
    const cancelData = {
      status: 'INACTIVE'
    }

    console.log('📤 [CANCEL-SUBSCRIPTION] Enviando cancelamento para Asaas...')

    const asaasResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${profile.asaas_subscription_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(cancelData)
    })

    console.log('📥 [CANCEL-SUBSCRIPTION] Resposta cancelamento - Status:', asaasResponse.status)

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('❌ [CANCEL-SUBSCRIPTION] Erro Asaas:', errorText)

      let errorMessage = 'Erro ao cancelar assinatura no Asaas'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
        }
      } catch (parseError) {
        console.error('❌ [CANCEL-SUBSCRIPTION] Erro parse resposta Asaas:', parseError)
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assinatura cancelada
    const cancelledSubscription = await asaasResponse.json()
    console.log('✅ [CANCEL-SUBSCRIPTION] Assinatura cancelada:', cancelledSubscription.id)

    // Atualizar perfil: remover subscription_id e desativar plano se necessário
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        asaas_subscription_id: null,
        next_billing_date: null,
        // Manter plano ativo até expirar, ou desativar imediatamente?
        // Por enquanto, manter ativo até o final do período pago
        // agendamentos_active: false, // Descomentar se quiser desativar imediatamente
        // monthly_plan_active: false
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ [CANCEL-SUBSCRIPTION] Erro atualizar perfil:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Assinatura cancelada mas falha ao atualizar perfil' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CANCEL-SUBSCRIPTION] Perfil atualizado - assinatura removida')

    return new Response(
      JSON.stringify({
        success: true,
        subscription: cancelledSubscription,
        message: 'Assinatura cancelada com sucesso - renovação automática desativada'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CANCEL-SUBSCRIPTION] Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})