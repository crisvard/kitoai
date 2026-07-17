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

  try {
    // Conectar ao Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { paymentMethod, planType } = await req.json()

    if (!paymentMethod || !planType) {
      return new Response(
        JSON.stringify({ error: 'Payment method and plan type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔄 [RENEW] Renovando assinatura para usuário ${user.id} - ${planType} via ${paymentMethod}`)

    // Buscar perfil atual
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ [RENEW] Perfil não encontrado:', profileError)
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular nova data de vencimento
    const now = new Date()
    const nextBillingDate = new Date(now)

    if (planType === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else if (planType === 'annual') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simular processamento de pagamento (em produção, integrar com gateway)
    const paymentAmount = planType === 'annual' ? 1500 : 195 // Valores de exemplo
    const simulatedPaymentId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`💰 [RENEW] Processando pagamento simulado: R$ ${paymentAmount}`)

    // Atualizar perfil com nova assinatura
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        // Reativar planos
        agendamentos_active: true,
        monthly_plan_active: planType === 'monthly',
        annual_plan_active: planType === 'annual',
        billing_cycle: planType,

        // Atualizar datas de pagamento
        next_billing_date: nextBillingDate.toISOString(),
        last_payment_date: now.toISOString(),
        plan_expires_at: nextBillingDate.toISOString(),

        // Limpar status de atraso
        payment_status: 'paid',
        payment_overdue_days: 0,
        grace_period_end: null,
        last_overdue_check: now.toISOString(),

        // Desbloquear acesso se estava bloqueado
        access_blocked: false,
        access_blocked_reason: null,

        // Manter subscription ID se existir
        asaas_payment_id: simulatedPaymentId
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ [RENEW] Erro ao atualizar perfil:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Registrar pagamento no histórico
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        asaas_payment_id: simulatedPaymentId,
        asaas_customer_id: profile.asaas_customer_id || 'manual',
        amount: paymentAmount,
        status: 'paid',
        payment_date: now.toISOString(),
        plan_type: planType
      })

    if (paymentError) {
      console.warn('⚠️ [RENEW] Erro ao registrar pagamento:', paymentError)
      // Não falhar por causa disso
    }

    console.log(`✅ [RENEW] Assinatura renovada com sucesso até ${nextBillingDate.toISOString()}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription renewed successfully',
        next_billing_date: nextBillingDate.toISOString(),
        payment_id: simulatedPaymentId,
        amount: paymentAmount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [RENEW] Erro interno:', error)
    return new Response('Internal server error', { status: 500 })
  }
})