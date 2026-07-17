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

  console.log('🚀 [CREATE-CUSTOMER] Iniciando criação de cliente Asaas...')

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
      console.error('❌ [CREATE-CUSTOMER] Erro autenticação:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CREATE-CUSTOMER] Usuário autenticado:', user.email)

    // Buscar perfil usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [CREATE-CUSTOMER] Erro buscar perfil:', profileError.message)
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [CREATE-CUSTOMER] Perfil encontrado:', {
      hasAsaasId: !!profile.asaas_customer_id,
      cpf: !!profile.cpf,
      phone: !!profile.phone
    })

    // Verificar se já tem cliente Asaas
    if (profile.asaas_customer_id) {
      console.log('✅ [CREATE-CUSTOMER] Cliente Asaas já existe:', profile.asaas_customer_id)
      return new Response(
        JSON.stringify({
          success: true,
          asaas_customer_id: profile.asaas_customer_id,
          message: 'Cliente já existe'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar dados obrigatórios
    if (!profile.cpf || !profile.phone || !user.email) {
      console.error('❌ [CREATE-CUSTOMER] Dados obrigatórios faltando')
      return new Response(
        JSON.stringify({ error: 'Dados pessoais incompletos (CPF, telefone, email)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar dados cliente Asaas
    const customerData = {
      name: profile.name || user.email.split('@')[0], // Fallback para nome
      email: user.email,
      phone: profile.phone.replace(/\D/g, ''), // Apenas números
      mobilePhone: profile.phone.replace(/\D/g, ''),
      cpfCnpj: profile.cpf.replace(/\D/g, ''),
      postalCode: profile.cep?.replace(/\D/g, '') || undefined,
      address: profile.logradouro || undefined,
      addressNumber: profile.numero || undefined,
      complement: profile.complemento || undefined,
      province: profile.bairro || undefined,
      city: profile.cidade || undefined,
      state: profile.estado || undefined,
      externalReference: user.id, // Referência para identificar usuário
      observations: 'Cliente criado via Kito Expert Dashboard'
    }

    console.log('📤 [CREATE-CUSTOMER] Enviando dados para Asaas:', {
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj ? '***' + customerData.cpfCnpj.slice(-3) : undefined
    })

    // Verificar API key
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      console.error('❌ [CREATE-CUSTOMER] ASAAS_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(customerData)
    })

    console.log('📥 [CREATE-CUSTOMER] Resposta Asaas - Status:', asaasResponse.status)

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('❌ [CREATE-CUSTOMER] Erro Asaas:', errorText)

      let errorMessage = 'Erro ao criar cliente no Asaas'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
        }
      } catch (parseError) {
        console.error('❌ [CREATE-CUSTOMER] Erro parse resposta Asaas:', parseError)
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso
    const asaasCustomer = await asaasResponse.json()
    console.log('✅ [CREATE-CUSTOMER] Cliente criado:', asaasCustomer.id)

    // Salvar asaas_customer_id no perfil
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ asaas_customer_id: asaasCustomer.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ [CREATE-CUSTOMER] Erro salvar asaas_customer_id:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Cliente criado mas falha ao salvar referência' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CREATE-CUSTOMER] Processo concluído com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        asaas_customer_id: asaasCustomer.id,
        message: 'Cliente criado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CREATE-CUSTOMER] Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})