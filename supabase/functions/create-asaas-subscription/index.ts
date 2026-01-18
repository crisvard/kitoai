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

  console.log('🚀 [CREATE-SUBSCRIPTION] Iniciando criação de assinatura Asaas...')

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
      console.error('❌ [CREATE-SUBSCRIPTION] Erro autenticação:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CREATE-SUBSCRIPTION] Usuário autenticado:', user.email)

    // Receber dados da requisição
    const { planId, billingType } = await req.json()

    if (!planId) {
      console.error('❌ [CREATE-SUBSCRIPTION] planId obrigatório')
      return new Response(
        JSON.stringify({ error: 'ID do plano é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CREATE-SUBSCRIPTION] Dados recebidos:', { planId, billingType })

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('❌ [CREATE-SUBSCRIPTION] Erro buscar plano:', planError?.message)
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CREATE-SUBSCRIPTION] Plano encontrado:', {
      name: plan.name,
      monthly_price: plan.monthly_price,
      annual_price: plan.annual_price
    })

    // Buscar perfil usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ [CREATE-SUBSCRIPTION] Erro buscar perfil:', profileError?.message)
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se tem asaas_customer_id
    if (!profile.asaas_customer_id) {
      console.log('⚠️ [CREATE-SUBSCRIPTION] Cliente Asaas não encontrado, tentando criar...')

      // Tentar criar cliente
      const { data: customerData, error: customerError } = await supabaseClient.functions.invoke('create-asaas-customer')

      if (customerError) {
        console.error('❌ [CREATE-SUBSCRIPTION] Falha criar cliente:', customerError)
        return new Response(
          JSON.stringify({ error: 'Falha ao criar cliente Asaas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!customerData?.asaas_customer_id) {
        console.error('❌ [CREATE-SUBSCRIPTION] Cliente criado mas sem ID')
        return new Response(
          JSON.stringify({ error: 'Cliente Asaas criado mas ID não retornado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      profile.asaas_customer_id = customerData.asaas_customer_id
      console.log('✅ [CREATE-SUBSCRIPTION] Cliente Asaas criado:', profile.asaas_customer_id)
    }

    // Verificar se já tem assinatura ativa
    if (profile.asaas_subscription_id) {
      console.log('⚠️ [CREATE-SUBSCRIPTION] Usuário já tem assinatura:', profile.asaas_subscription_id)
      return new Response(
        JSON.stringify({
          error: 'Usuário já possui assinatura ativa',
          subscriptionId: profile.asaas_subscription_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determinar ciclo e valor
    const isMonthly = billingType === 'monthly' || !plan.annual_price
    const cycle = isMonthly ? 'MONTHLY' : 'YEARLY'
    const value = isMonthly ? plan.monthly_price : (plan.annual_price || plan.monthly_price)

    console.log('💰 [CREATE-SUBSCRIPTION] Ciclo e valor determinados:', { cycle, value, isMonthly })

    // Calcular nextDueDate (próxima cobrança)
    const nextDueDate = new Date()
    if (isMonthly) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    } else {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
    }

    // Preparar dados assinatura Asaas
    const subscriptionData = {
      customer: profile.asaas_customer_id,
      billingType: 'PIX',
      nextDueDate: nextDueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      value: value,
      cycle: cycle,
      description: `${plan.name} - ${isMonthly ? 'Mensal' : 'Anual'} (Renovação Automática)`,
      externalReference: `${user.id}_${planId}_subscription_${Date.now()}`
    }

    console.log('📤 [CREATE-SUBSCRIPTION] Enviando assinatura para Asaas:', {
      customer: subscriptionData.customer,
      billingType: subscriptionData.billingType,
      value: subscriptionData.value,
      cycle: subscriptionData.cycle,
      nextDueDate: subscriptionData.nextDueDate,
      description: subscriptionData.description
    })

    // Verificar API key
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      console.error('❌ [CREATE-SUBSCRIPTION] ASAAS_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar assinatura no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(subscriptionData)
    })

    console.log('📥 [CREATE-SUBSCRIPTION] Resposta criação assinatura - Status:', asaasResponse.status)

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('❌ [CREATE-SUBSCRIPTION] Erro Asaas:', errorText)

      let errorMessage = 'Erro ao criar assinatura no Asaas'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
        }
      } catch (parseError) {
        console.error('❌ [CREATE-SUBSCRIPTION] Erro parse resposta Asaas:', parseError)
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assinatura criada
    const subscription = await asaasResponse.json()
    console.log('✅ [CREATE-SUBSCRIPTION] Assinatura criada:', subscription.id)

    // Salvar subscription_id no perfil
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        asaas_subscription_id: subscription.id,
        billing_cycle: isMonthly ? 'monthly' : 'annual',
        next_billing_date: nextDueDate.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ [CREATE-SUBSCRIPTION] Erro salvar subscription_id:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Assinatura criada mas falha ao salvar referência' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CREATE-SUBSCRIPTION] Assinatura salva no perfil')

    return new Response(
      JSON.stringify({
        success: true,
        subscription: subscription,
        message: 'Assinatura criada com sucesso - renovação automática ativada'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CREATE-SUBSCRIPTION] Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})