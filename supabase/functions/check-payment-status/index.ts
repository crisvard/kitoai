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
    // Conectar ao Supabase (service role para função interna)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 [CHECK-PAYMENT] Iniciando verificação de status de pagamentos...')

    // Buscar todos os perfis com planos ativos (não trial)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .or('monthly_plan_active.eq.true,annual_plan_active.eq.true')
      .not('next_billing_date', 'is', null)

    if (profilesError) {
      console.error('❌ [CHECK-PAYMENT] Erro ao buscar perfis:', profilesError)
      return new Response('Failed to fetch profiles', { status: 500 })
    }

    console.log(`📊 [CHECK-PAYMENT] Verificando ${profiles.length} perfis com planos ativos`)

    const now = new Date()
    let processedCount = 0
    let blockedCount = 0
    let alertedCount = 0

    for (const profile of profiles) {
      try {
        const result = await checkUserPaymentStatus(supabaseClient, profile, now)
        processedCount++

        if (result.blocked) blockedCount++
        if (result.alerted) alertedCount++

      } catch (error) {
        console.error(`❌ [CHECK-PAYMENT] Erro ao processar perfil ${profile.id}:`, error)
      }
    }

    console.log(`✅ [CHECK-PAYMENT] Verificação concluída:`)
    console.log(`   - Perfis processados: ${processedCount}`)
    console.log(`   - Acessos bloqueados: ${blockedCount}`)
    console.log(`   - Alertas enviados: ${alertedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        blocked: blockedCount,
        alerted: alertedCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CHECK-PAYMENT] Erro interno:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

async function checkUserPaymentStatus(supabaseClient: any, profile: any, now: Date) {
  const userId = profile.id
  const billingDate = new Date(profile.next_billing_date)
  const daysOverdue = Math.floor((now.getTime() - billingDate.getTime()) / (1000 * 60 * 60 * 24))

  // Se não está vencido, apenas atualizar last_overdue_check
  if (daysOverdue <= 0) {
    await supabaseClient
      .from('profiles')
      .update({
        last_overdue_check: now.toISOString(),
        payment_overdue_days: 0,
        access_blocked: false,
        access_blocked_reason: null
      })
      .eq('id', userId)

    return { blocked: false, alerted: false }
  }

  // Calcular período de carência baseado no ciclo de cobrança
  const gracePeriodDays = profile.billing_cycle === 'annual' ? 365 : 30
  const gracePeriodEnd = new Date(billingDate)
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays)

  // Atualizar dias em atraso e período de carência
  await supabaseClient
    .from('profiles')
    .update({
      payment_overdue_days: daysOverdue,
      grace_period_end: gracePeriodEnd.toISOString(),
      last_overdue_check: now.toISOString()
    })
    .eq('id', userId)

  // Se ainda está no período de carência, enviar alertas
  if (now <= gracePeriodEnd) {
    const alerted = await sendPaymentAlert(supabaseClient, profile, daysOverdue, gracePeriodDays)
    return { blocked: false, alerted }
  }

  // Período de carência expirou - BLOQUEAR ACESSO
  console.log(`🚫 [CHECK-PAYMENT] Bloqueando acesso para usuário ${userId} - ${daysOverdue} dias em atraso`)

  await supabaseClient
    .from('profiles')
    .update({
      access_blocked: true,
      access_blocked_reason: `Pagamento em atraso há ${daysOverdue} dias. Período de carência (${gracePeriodDays} dias) expirado.`,
      agendamentos_active: false, // Desativar acesso ao plano
      monthly_plan_active: false,
      annual_plan_active: false
    })
    .eq('id', userId)

  // Enviar alerta final de bloqueio
  await sendBlockAlert(supabaseClient, profile)

  return { blocked: true, alerted: true }
}

async function sendPaymentAlert(supabaseClient: any, profile: any, daysOverdue: number, gracePeriodDays: number) {
  const daysRemaining = gracePeriodDays - daysOverdue

  // Alertas em marcos específicos
  const alertTriggers = [7, 3, 1, 0] // dias antes do bloqueio

  if (!alertTriggers.includes(daysRemaining)) {
    return false
  }

  console.log(`📧 [CHECK-PAYMENT] Enviando alerta para ${profile.email} - ${daysRemaining} dias restantes`)

  // Aqui você pode integrar com serviço de email
  // Por enquanto, apenas log
  const alertMessage = daysRemaining === 0
    ? `ATENÇÃO: Seu pagamento venceu hoje. Você tem ${gracePeriodDays} dias de carência antes do bloqueio.`
    : `ATENÇÃO: Seu pagamento vence em ${daysRemaining} dias. Regularize para evitar bloqueio.`

  // TODO: Implementar envio real de email/notificação
  console.log(`📧 Alerta para ${profile.email}: ${alertMessage}`)

  return true
}

async function sendBlockAlert(supabaseClient: any, profile: any) {
  console.log(`🚫 [CHECK-PAYMENT] Enviando alerta de BLOQUEIO para ${profile.email}`)

  const blockMessage = `Seu acesso foi BLOQUEADO devido a pagamento em atraso. Regularize o pagamento para reativar seu plano.`

  // TODO: Implementar envio real de email/notificação
  console.log(`🚫 Alerta de bloqueio para ${profile.email}: ${blockMessage}`)
}