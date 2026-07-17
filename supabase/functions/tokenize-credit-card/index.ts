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

  console.log('💳 [TOKENIZE] Iniciando processo de tokenização de cartão...');

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

    // Autenticação do usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('💳 [TOKENIZE] Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({
          error: 'Autenticação necessária',
          code: 'AUTH_REQUIRED'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 [TOKENIZE] Usuário autenticado:', user.email);

    // Validar corpo da requisição
    const body = await req.json()
    const { holderName, number, expiryMonth, expiryYear, ccv } = body

    // Validações obrigatórias conforme documentação Asaas
    if (!holderName?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Nome do portador é obrigatório',
          code: 'MISSING_HOLDER_NAME'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!number?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Número do cartão é obrigatório',
          code: 'MISSING_CARD_NUMBER'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiryMonth || !expiryYear) {
      return new Response(
        JSON.stringify({
          error: 'Data de expiração é obrigatória',
          code: 'MISSING_EXPIRY_DATE'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ccv?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'CVV é obrigatório',
          code: 'MISSING_CVV'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validações de formato
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return new Response(
        JSON.stringify({
          error: 'Número do cartão inválido',
          code: 'INVALID_CARD_NUMBER'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const month = parseInt(expiryMonth);
    if (month < 1 || month > 12) {
      return new Response(
        JSON.stringify({
          error: 'Mês de expiração inválido',
          code: 'INVALID_EXPIRY_MONTH'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const year = parseInt(expiryYear);
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 20) {
      return new Response(
        JSON.stringify({
          error: 'Ano de expiração inválido',
          code: 'INVALID_EXPIRY_YEAR'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (ccv.length < 3 || ccv.length > 4) {
      return new Response(
        JSON.stringify({
          error: 'CVV inválido',
          code: 'INVALID_CVV'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 [TOKENIZE] Validações de entrada passaram');

    // Buscar perfil do usuário para dados adicionais
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('cpf, cep, numero, phone')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('💳 [TOKENIZE] Perfil não encontrado, continuando sem dados adicionais:', profileError.message);
    }

    // Preparar dados para tokenização conforme documentação Asaas
    const tokenizationData = {
      creditCard: {
        holderName: holderName.trim(),
        number: cleanNumber,
        expiryMonth: expiryMonth.padStart(2, '0'), // Garantir 2 dígitos
        expiryYear: expiryYear,
        ccv: ccv.trim()
      },
      // Dados opcionais do portador (creditCardHolderInfo)
      ...(profile && {
        creditCardHolderInfo: {
          name: holderName.trim(),
          email: user.email,
          ...(profile.cpf && { cpfCnpj: profile.cpf }),
          ...(profile.cep && { postalCode: profile.cep }),
          ...(profile.numero && { addressNumber: profile.numero }),
          ...(profile.phone && { phone: profile.phone })
        }
      })
    }

    console.log('💳 [TOKENIZE] Dados preparados para Asaas');
    console.log('💳 [TOKENIZE] Dados do cartão:', {
      holderName: holderName.trim(),
      numberLength: cleanNumber.length,
      expiryMonth: expiryMonth.padStart(2, '0'),
      expiryYear: expiryYear,
      hasCvv: !!ccv.trim()
    });

    // Verificar chave API
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      console.error('💳 [TOKENIZE] ASAAS_API_KEY não configurada');
      return new Response(
        JSON.stringify({
          error: 'Configuração de pagamento incompleta',
          code: 'MISSING_API_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 [TOKENIZE] API Key presente, fazendo requisição...');

    // Fazer chamada para API Asaas
    console.log('💳 [TOKENIZE] Enviando requisição para Asaas...');

    const asaasResponse = await fetch('https://www.asaas.com/v3/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(tokenizationData)
    })

    console.log('💳 [TOKENIZE] Resposta Asaas - Status:', asaasResponse.status);

    // Tentar ler a resposta como texto primeiro
    const responseText = await asaasResponse.text();
    console.log('💳 [TOKENIZE] Resposta Asaas (primeiros 500 chars):', responseText.substring(0, 500));

    if (!asaasResponse.ok) {
      console.error('💳 [TOKENIZE] Erro na API Asaas - Status:', asaasResponse.status);
      console.error('💳 [TOKENIZE] Resposta completa:', responseText);

      let errorMessage = 'Erro ao processar cartão de crédito';
      let errorCode = 'ASAAS_ERROR';

      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errors?.[0]) {
          errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage;
          errorCode = errorData.errors[0].code || errorCode;
        }
      } catch (parseError) {
        console.error('💳 [TOKENIZE] Erro ao fazer parse da resposta Asaas:', parseError);
        // Se não conseguir fazer parse, pode ser HTML de erro
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
          errorMessage = 'Erro interno do gateway de pagamento';
          errorCode = 'GATEWAY_ERROR';
        }
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: errorCode,
          status: asaasResponse.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso na tokenização
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('💳 [TOKENIZE] Erro ao fazer parse da resposta de sucesso:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Resposta inválida do gateway',
          code: 'INVALID_RESPONSE'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 [TOKENIZE] Tokenização realizada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        token: tokenData.creditCardToken,
        message: 'Cartão tokenizado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💳 [TOKENIZE] Erro interno:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})