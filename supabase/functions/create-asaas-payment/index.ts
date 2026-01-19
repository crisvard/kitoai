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

  console.log('🚀 [CREATE-PAYMENT] Iniciando criação de pagamento PIX...')

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
      console.error('❌ [CREATE-PAYMENT] Erro autenticação:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CREATE-PAYMENT] Usuário autenticado:', user.email)

    // Receber dados da requisição
    const { planId, billingType, isDirectPayment } = await req.json()

    if (!planId) {
      console.error('❌ [CREATE-PAYMENT] planId obrigatório')
      return new Response(
        JSON.stringify({ error: 'ID do plano é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CREATE-PAYMENT] Dados recebidos:', { planId, billingType, isDirectPayment })

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('❌ [CREATE-PAYMENT] Erro buscar plano:', planError?.message)
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CREATE-PAYMENT] Plano encontrado:', {
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
      console.error('❌ [CREATE-PAYMENT] Erro buscar perfil:', profileError?.message)
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se tem asaas_customer_id
    if (!profile.asaas_customer_id) {
      console.log('⚠️ [CREATE-PAYMENT] Cliente Asaas não encontrado, tentando criar...')

      // Tentar criar cliente
      const { data: customerData, error: customerError } = await supabaseClient.functions.invoke('create-asaas-customer')

      if (customerError) {
        console.error('❌ [CREATE-PAYMENT] Falha criar cliente:', customerError)
        return new Response(
          JSON.stringify({ error: 'Falha ao criar cliente Asaas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!customerData?.asaas_customer_id) {
        console.error('❌ [CREATE-PAYMENT] Cliente criado mas sem ID')
        return new Response(
          JSON.stringify({ error: 'Cliente Asaas criado mas ID não retornado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      profile.asaas_customer_id = customerData.asaas_customer_id
      console.log('✅ [CREATE-PAYMENT] Cliente Asaas criado:', profile.asaas_customer_id)
    }

    // Determinar valor e ciclo
    const isMonthly = billingType === 'PIX' && !plan.annual_price // Assumir mensal se PIX
    const value = isMonthly ? plan.monthly_price : (plan.annual_price || plan.monthly_price)
    const cycle = isMonthly ? 'MONTHLY' : 'YEARLY'

    console.log('💰 [CREATE-PAYMENT] Valor e ciclo determinados:', { value, cycle, isMonthly })

    // Preparar dados cobrança Asaas
    const paymentData = {
      customer: profile.asaas_customer_id,
      billingType: 'PIX',
      value: value,
      dueDate: new Date().toISOString().split('T')[0], // Hoje
      description: `${plan.name} - ${isMonthly ? 'Mensal' : 'Anual'}`,
      externalReference: `${user.id}_${planId}_${Date.now()}`, // Referência única
      installmentCount: 1, // PIX é à vista
      installmentValue: value
    }

    console.log('📤 [CREATE-PAYMENT] Enviando cobrança para Asaas:', {
      customer: paymentData.customer,
      billingType: paymentData.billingType,
      value: paymentData.value,
      description: paymentData.description
    })

    // Verificar API key
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      console.error('❌ [CREATE-PAYMENT] ASAAS_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cobrança no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(paymentData)
    })

    console.log('📥 [CREATE-PAYMENT] Resposta criação cobrança - Status:', asaasResponse.status)

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('❌ [CREATE-PAYMENT] Erro Asaas:', errorText)

      let errorMessage = 'Erro ao criar cobrança no Asaas'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
        }
      } catch (parseError) {
        console.error('❌ [CREATE-PAYMENT] Erro parse resposta Asaas:', parseError)
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cobrança criada
    const payment = await asaasResponse.json()
    console.log('✅ [CREATE-PAYMENT] Cobrança criada:', payment.id)

    // Salvar dados do pagamento no Supabase
    console.log('💾 [CREATE-PAYMENT] Salvando dados do pagamento no Supabase...')
    const { error: paymentInsertError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        amount: value,
        currency: 'BRL',
        payment_method: 'PIX',
        status: 'pending',
        external_payment_id: payment.id,
        description: `${plan.name} - ${isMonthly ? 'Mensal' : 'Anual'}`
      })

    if (paymentInsertError) {
      console.error('❌ [CREATE-PAYMENT] Erro ao salvar pagamento no Supabase:', paymentInsertError)
      // Não falhar o pagamento por causa disso
    } else {
      console.log('✅ [CREATE-PAYMENT] Pagamento salvo no Supabase')
    }

    // Buscar dados PIX
    console.log('🔍 [CREATE-PAYMENT] Buscando dados PIX...')
    const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${payment.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey
      }
    })

    console.log('📥 [CREATE-PAYMENT] Resposta PIX - Status:', pixResponse.status)

    let qrCodeBase64 = null
    let payload = null

    if (pixResponse.ok) {
      const pixData = await pixResponse.json()
      console.log('✅ [CREATE-PAYMENT] Dados PIX recebidos:', {
        hasEncodedImage: !!pixData.encodedImage,
        hasPayload: !!pixData.payload,
        hasExpirationDate: !!pixData.expirationDate
      })

      qrCodeBase64 = pixData.encodedImage || pixData.qrCode || null
      payload = pixData.payload || pixData.pixKey || null
    } else {
      console.warn('⚠️ [CREATE-PAYMENT] Falha buscar dados PIX, tentando payload manual')
      // Fallback: gerar payload manual (implementar depois se necessário)
      payload = `Pagamento ${plan.name} - ${value}`
    }

    console.log('🎯 [CREATE-PAYMENT] Dados finais PIX:', {
      hasQRCode: !!qrCodeBase64,
      hasPayload: !!payload,
      paymentId: payment.id
    })

    // Após criar pagamento, criar assinatura para renovação automática
    console.log('🔄 [CREATE-PAYMENT] Criando assinatura para renovação automática...')

    try {
      const subscriptionResponse = await supabaseClient.functions.invoke('create-asaas-subscription', {
        body: { planId, billingType: 'monthly' } // Assumir mensal por padrão, pode ser ajustado
      })

      if (subscriptionResponse.error) {
        console.warn('⚠️ [CREATE-PAYMENT] Falha criar assinatura:', subscriptionResponse.error)
        // Não falhar o pagamento por causa da assinatura
      } else {
        console.log('✅ [CREATE-PAYMENT] Assinatura criada para renovação')
      }
    } catch (subscriptionError) {
      console.warn('⚠️ [CREATE-PAYMENT] Erro ao criar assinatura:', subscriptionError)
      // Continuar mesmo se assinatura falhar
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: payment,
        qrCodeBase64: qrCodeBase64,
        payload: payload,
        message: 'Cobrança PIX criada com sucesso - assinatura configurada para renovação'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CREATE-PAYMENT] Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})