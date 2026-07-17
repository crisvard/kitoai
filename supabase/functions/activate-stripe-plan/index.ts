import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🔔 [ACTIVATE STRIPE] Recebendo ativação...')

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-11-20.acacia',
    })

    const { userId, paymentIntentId, planId, isRenewal = false } = await req.json()

    console.log('📋 [ACTIVATE STRIPE] Dados recebidos:', { userId, paymentIntentId, planId, isRenewal })

    if (!userId || !paymentIntentId) {
      throw new Error('userId e paymentIntentId são obrigatórios')
    }

    // Verificar se o PaymentIntent foi pago no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    console.log('💰 [ACTIVATE STRIPE] PaymentIntent status:', paymentIntent.status)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Pagamento não confirmado. Status: ${paymentIntent.status}`)
    }

    // Buscar perfil do usuário para cálculo de datas
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ [ACTIVATE STRIPE] Erro buscar perfil:', profileError)
      throw new Error('Perfil do usuário não encontrado')
    }

    console.log('👤 [ACTIVATE STRIPE] Perfil encontrado:', profile.id)

    // Calcular datas EXATAMENTE como no PIX (DirectPaymentPage.tsx:416-474)
    const now = new Date()

    let nextBillingDate: Date
    if (isRenewal && profile?.plan_expires_at) {
      // Para renovações: calcular a partir da data de vencimento atual + 30 dias
      nextBillingDate = new Date(profile.plan_expires_at)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      console.log('🔄 [ACTIVATE STRIPE] Renovação: calculando nova expiração baseada em vencimento atual')
    } else {
      // Para novas contratações: calcular a partir de agora + 30 dias
      nextBillingDate = new Date(now)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    }

    console.log('📅 [ACTIVATE STRIPE] Datas calculadas:', {
      now: now.toISOString(),
      nextBillingDate: nextBillingDate.toISOString(),
      isRenewal
    })

    // Atualizar perfil do usuário - MESMOS CAMPOS QUE PIX
    const updateData = {
      // Ativar plano
      agendamentos_active: true,
      monthly_plan_active: true,
      annual_plan_active: false,
      billing_cycle: 'monthly',

      // Sistema de recorrência
      payment_status: 'paid',
      stripe_payment_id: paymentIntentId, // Stripe ao invés de asaas_payment_id
      stripe_subscription_id: null,
      next_billing_date: nextBillingDate.toISOString(),
      last_payment_date: now.toISOString(),
      plan_expires_at: nextBillingDate.toISOString(),

      // Limpar bloqueios e atrasos
      access_blocked: false,
      access_blocked_reason: null,
      payment_overdue_days: 0,
      grace_period_end: null,
      last_overdue_check: now.toISOString()
    }

    console.log('🔄 [ACTIVATE STRIPE] Atualizando perfil:', updateData)
    console.log('🔍 [ACTIVATE STRIPE] UserId para update:', userId)
    console.log('🔍 [ACTIVATE STRIPE] Verificando se user existe antes do update...')

    // Verificar se o usuário existe antes do update
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      console.error('❌ [ACTIVATE STRIPE] Usuário não encontrado para update:', { userId, checkError, existingUser })
      throw new Error(`Usuário ${userId} não encontrado para atualização`)
    }

    console.log('✅ [ACTIVATE STRIPE] Usuário encontrado:', existingUser.id)

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('❌ [ACTIVATE STRIPE] Erro ao atualizar perfil:', updateError)
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)
    }

    // Limpar cache do perfil
    console.log('🧹 [ACTIVATE STRIPE] Cache do perfil será limpo no frontend')

    // Salvar histórico de pagamento
    const paymentData = {
      user_id: userId,
      plan_id: planId || 'plan-agendamentos',
      amount: paymentIntent.amount / 100, // Converter centavos para reais
      status: 'paid',
      payment_date: now.toISOString(),
      plan_type: 'monthly',
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: paymentIntent.customer as string || null,
      is_renewal: isRenewal
    }

    console.log('💾 [ACTIVATE STRIPE] Salvando histórico:', paymentData)

    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert(paymentData)

    if (paymentError) {
      console.warn('⚠️ [ACTIVATE STRIPE] Erro ao salvar histórico:', paymentError)
      // Não falhar o processo por isso
    } else {
      console.log('✅ [ACTIVATE STRIPE] Histórico salvo com sucesso')
    }

    console.log('🎉 [ACTIVATE STRIPE] Plano ativado com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Plano ativado com sucesso',
        expiryDate: nextBillingDate.toISOString(),
        isRenewal,
        activatedAt: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 [ACTIVATE STRIPE] Erro:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})