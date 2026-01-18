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

  console.log('🔄 [UPDATE-SUBSCRIPTION] Iniciando atualização de assinatura...')

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
      console.error('❌ [UPDATE-SUBSCRIPTION] Erro autenticação:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [UPDATE-SUBSCRIPTION] Usuário autenticado:', user.email)

    // Receber dados da requisição
    const { planId, newCycle, updatePendingPayments } = await req.json()

    if (!planId && !newCycle) {
      console.error('❌ [UPDATE-SUBSCRIPTION] planId ou newCycle obrigatório')
      return new Response(
        JSON.stringify({ error: 'ID do plano ou novo ciclo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [UPDATE-SUBSCRIPTION] Dados recebidos:', { planId, newCycle, updatePendingPayments })

    // Buscar perfil usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ [UPDATE-SUBSCRIPTION] Erro buscar perfil:', profileError?.message)
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.asaas_subscription_id) {
      console.log('⚠️ [UPDATE-SUBSCRIPTION] Usuário não tem assinatura ativa')
      return new Response(
        JSON.stringify({ error: 'Usuário não possui assinatura ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [UPDATE-SUBSCRIPTION] Assinatura atual:', profile.asaas_subscription_id)

    // Preparar dados atualização
    const updateData: any = {}

    // Se mudou plano
    if (planId) {
      const { data: newPlan, error: planError } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError || !newPlan) {
        console.error('❌ [UPDATE-SUBSCRIPTION] Erro buscar novo plano:', planError?.message)
        return new Response(
          JSON.stringify({ error: 'Novo plano não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Determinar novo ciclo e valor
      const isMonthly = newCycle === 'monthly' || (!newCycle && profile.billing_cycle === 'monthly')
      updateData.cycle = isMonthly ? 'MONTHLY' : 'YEARLY'
      updateData.value = isMonthly ? newPlan.monthly_price : (newPlan.annual_price || newPlan.monthly_price)
      updateData.description = `${newPlan.name} - ${isMonthly ? 'Mensal' : 'Anual'} (Renovação Automática)`

      console.log('💰 [UPDATE-SUBSCRIPTION] Novos dados plano:', {
        cycle: updateData.cycle,
        value: updateData.value,
        description: updateData.description
      })
    }

    // Se apenas mudou ciclo
    if (newCycle && !planId) {
      updateData.cycle = newCycle === 'monthly' ? 'MONTHLY' : 'YEARLY'

      // Buscar valor atual do plano
      const { data: currentPlan, error: planError } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('name', profile.plan_name || 'Plano Agendamentos') // Ajustar conforme campo real
        .single()

      if (!planError && currentPlan) {
        const isMonthly = newCycle === 'monthly'
        updateData.value = isMonthly ? currentPlan.monthly_price : (currentPlan.annual_price || currentPlan.monthly_price)
      }

      console.log('🔄 [UPDATE-SUBSCRIPTION] Novo ciclo:', updateData.cycle)
    }

    // Adicionar updatePendingPayments se solicitado
    if (updatePendingPayments) {
      updateData.updatePendingPayments = true
    }

    console.log('📤 [UPDATE-SUBSCRIPTION] Enviando atualização para Asaas:', updateData)

    // Verificar API key
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      console.error('❌ [UPDATE-SUBSCRIPTION] ASAAS_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar assinatura no Asaas
    const asaasResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${profile.asaas_subscription_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(updateData)
    })

    console.log('📥 [UPDATE-SUBSCRIPTION] Resposta atualização - Status:', asaasResponse.status)

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('❌ [UPDATE-SUBSCRIPTION] Erro Asaas:', errorText)

      let errorMessage = 'Erro ao atualizar assinatura no Asaas'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
        }
      } catch (parseError) {
        console.error('❌ [UPDATE-SUBSCRIPTION] Erro parse resposta Asaas:', parseError)
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assinatura atualizada
    const updatedSubscription = await asaasResponse.json()
    console.log('✅ [UPDATE-SUBSCRIPTION] Assinatura atualizada:', updatedSubscription.id)

    // Atualizar perfil se necessário
    const profileUpdate: any = {}
    if (updateData.cycle) {
      profileUpdate.billing_cycle = updateData.cycle === 'MONTHLY' ? 'monthly' : 'annual'
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ [UPDATE-SUBSCRIPTION] Erro atualizar perfil:', updateError.message)
        // Não falhar por causa disso
      } else {
        console.log('✅ [UPDATE-SUBSCRIPTION] Perfil atualizado')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSubscription,
        message: 'Assinatura atualizada com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [UPDATE-SUBSCRIPTION] Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})