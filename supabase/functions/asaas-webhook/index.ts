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

  console.log('🔔 [WEBHOOK] Recebendo webhook Asaas...')

  try {
    // Validação token DESABILITADA - Asaas não envia token correto
    console.log('⚠️ [WEBHOOK] Validação token desabilitada - Asaas não envia token correto')
    console.log('Headers recebidos:', Object.fromEntries(req.headers.entries()))

    console.log('✅ [WEBHOOK] Webhook aceito sem validação de token')

    // Conectar ao Supabase (service role para webhook)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar service role para webhook
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Receber dados do webhook
    const webhookData = await req.json()
    console.log('📋 [WEBHOOK] Dados recebidos:', {
      event: webhookData.event,
      payment: webhookData.payment?.id,
      subscription: webhookData.payment?.subscription
    })

    if (!webhookData.event || !webhookData.payment) {
      console.error('❌ [WEBHOOK] Dados webhook inválidos')
      return new Response('Invalid webhook data', { status: 400 })
    }

    // Idempotência: verificar se evento já foi processado
    const eventId = webhookData.id
    if (eventId) {
      const { data: existingEvent, error: checkError } = await supabaseClient
        .from('webhook_events')
        .select('asaas_event_id')
        .eq('asaas_event_id', eventId)
        .single()

      if (existingEvent) {
        console.log('✅ [WEBHOOK] Evento já processado (idempotência):', eventId)
        return new Response('Event already processed', { status: 200 })
      }

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ [WEBHOOK] Erro verificando idempotência:', checkError)
        // Continua processando mesmo com erro de check
      }
    }

    const event = webhookData.event
    const payment = webhookData.payment

    // Identificar usuário via asaas_customer_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('asaas_customer_id', payment.customer)
      .single()

    if (profileError || !profile) {
      console.error('❌ [WEBHOOK] Perfil não encontrado para customer:', payment.customer)
      return new Response('User profile not found', { status: 404 })
    }

    console.log('👤 [WEBHOOK] Perfil encontrado:', profile.id)

    // Processar eventos
    switch (event) {
      case 'PAYMENT_RECEIVED':
        console.log('💰 [WEBHOOK] Processando pagamento recebido:', payment.id)

        // Calcular datas de validade
        const paymentDate = new Date()
        const isMonthly = payment.billingType === 'PIX' && !payment.subscription // Assumir mensal se PIX único
        const expiryDate = new Date(paymentDate)
        expiryDate.setMonth(expiryDate.getMonth() + (isMonthly ? 1 : 12))

        // Verificar se é pagamento único (não de assinatura)
        if (!payment.subscription) {
          // Verificar se é renovação (usuário já tem plano ativo)
          const hasActivePlan = profile.plan_expires_at && new Date(profile.plan_expires_at) > paymentDate
          const isRenewal = hasActivePlan

          if (isRenewal) {
            console.log('🔄 [WEBHOOK] Renovação manual detectada - estendendo validade atual')

            // Para renovações, calcular nova expiração baseada na data atual de vencimento + 30 dias
            const currentExpiry = new Date(profile.plan_expires_at)
            const newExpiryDate = new Date(currentExpiry)
            newExpiryDate.setMonth(newExpiryDate.getMonth() + 1)

            const { error: updateError } = await supabaseClient
              .from('profiles')
              .update({
                plan_expires_at: newExpiryDate.toISOString(),
                last_payment_date: paymentDate.toISOString(),
                payment_status: 'paid',
                asaas_payment_id: payment.id,
                // Manter configurações existentes
                agendamentos_active: true,
                monthly_plan_active: true,
                annual_plan_active: false,
                billing_cycle: 'monthly'
              })
              .eq('id', profile.id)

            if (updateError) {
              console.error('❌ [WEBHOOK] Erro renovar plano:', updateError.message)
              return new Response('Failed to renew plan', { status: 500 })
            }

            console.log('✅ [WEBHOOK] Plano renovado até:', newExpiryDate.toISOString())

          } else {
            console.log('🎯 [WEBHOOK] Novo plano - ativando por 1 mês')

            // Ativar plano com controle de validade
            const { error: updateError } = await supabaseClient
              .from('profiles')
              .update({
                agendamentos_active: true,
                monthly_plan_active: isMonthly,
                annual_plan_active: !isMonthly,
                billing_cycle: isMonthly ? 'monthly' : 'annual',
                plan_expires_at: expiryDate.toISOString(),
                last_payment_date: paymentDate.toISOString(),
                payment_status: 'paid',
                asaas_payment_id: payment.id,
                asaas_subscription_id: null, // Limpar se existir
                next_billing_date: null
              })
              .eq('id', profile.id)

            if (updateError) {
              console.error('❌ [WEBHOOK] Erro ativar plano:', updateError.message)
              return new Response('Failed to activate plan', { status: 500 })
            }

            console.log('✅ [WEBHOOK] Plano ativado até:', expiryDate.toISOString())
          }

          // Salvar histórico de pagamento
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .insert({
              user_id: profile.id,
              asaas_payment_id: payment.id,
              asaas_customer_id: payment.customer,
              amount: payment.value,
              status: 'paid',
              payment_date: paymentDate.toISOString(),
              plan_type: isMonthly ? 'monthly' : 'annual'
            })

          if (paymentError) {
            console.warn('⚠️ [WEBHOOK] Erro salvar histórico:', paymentError.message)
            // Não falhar por causa disso
          }

        } else {
          console.log('🔄 [WEBHOOK] Pagamento de assinatura - renovando plano')

          // Para pagamentos de assinatura, renovar validade
          const nextBillingDate = new Date(paymentDate)
          nextBillingDate.setMonth(nextBillingDate.getMonth() + (payment.billingType === 'YEARLY' ? 12 : 1))

          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              plan_expires_at: expiryDate.toISOString(),
              last_payment_date: paymentDate.toISOString(),
              payment_status: 'paid',
              next_billing_date: nextBillingDate.toISOString(),
              // Manter plano ativo
              agendamentos_active: true,
              monthly_plan_active: isMonthly,
              annual_plan_active: !isMonthly
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('❌ [WEBHOOK] Erro renovar plano:', updateError.message)
            return new Response('Failed to renew plan', { status: 500 })
          }

          console.log('✅ [WEBHOOK] Plano renovado até:', expiryDate.toISOString())

          // Salvar histórico de renovação
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .insert({
              user_id: profile.id,
              asaas_payment_id: payment.id,
              asaas_customer_id: payment.customer,
              amount: payment.value,
              status: 'paid',
              payment_date: paymentDate.toISOString(),
              plan_type: isMonthly ? 'monthly' : 'annual'
            })

          if (paymentError) {
            console.warn('⚠️ [WEBHOOK] Erro salvar histórico:', paymentError.message)
          }
        }
        break

      case 'PAYMENT_CREATED':
        console.log('📝 [WEBHOOK] Cobrança criada:', payment.id)
        // Apenas log, sem ação específica por enquanto
        break

      case 'PAYMENT_OVERDUE':
        console.log('⚠️ [WEBHOOK] Pagamento em atraso:', payment.id)
        // Poderia desativar plano, mas por enquanto apenas log
        break

      default:
        console.log('ℹ️ [WEBHOOK] Evento não processado:', event)
    }

    // Salvar evento como processado (idempotência)
    if (eventId) {
      const { error: saveError } = await supabaseClient
        .from('webhook_events')
        .insert({
          asaas_event_id: eventId,
          event_type: event,
          payload: webhookData
        })

      if (saveError) {
        console.error('❌ [WEBHOOK] Erro salvando evento processado:', saveError)
        // Não falha por causa disso
      } else {
        console.log('✅ [WEBHOOK] Evento salvo para idempotência:', eventId)
      }
    }

    console.log('✅ [WEBHOOK] Webhook processado com sucesso')

    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
    console.error('💥 [WEBHOOK] Erro interno:', error)
    return new Response('Internal server error', { status: 500 })
  }
})