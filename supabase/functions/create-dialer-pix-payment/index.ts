// create-dialer-pix-payment/index.ts
// Dedicated edge function for Dialer credit purchases via PIX (Asaas)
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

    console.log('🚀 [DIALER PIX] Iniciando criação de pagamento PIX para créditos do dialer...')

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

        // Autenticar usuário
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Autenticação necessária' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Receber dados
        const { packageId } = await req.json()
        if (!packageId) {
            return new Response(
                JSON.stringify({ error: 'packageId é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('📋 [DIALER PIX] Buscando pacote:', packageId)

        // Buscar pacote de créditos
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('credit_packages')
            .select('*')
            .eq('id', packageId)
            .single()

        if (pkgError || !pkg) {
            return new Response(
                JSON.stringify({ error: 'Pacote de créditos não encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('✅ [DIALER PIX] Pacote encontrado:', pkg.name, '- R$', pkg.price)

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: 'Perfil não encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Garantir que o cliente Asaas existe
        let asaasCustomerId = profile.asaas_customer_id
        if (!asaasCustomerId) {
            console.log('⚠️ [DIALER PIX] Cliente Asaas não encontrado, criando...')
            const { data: customerData, error: customerError } = await supabaseClient.functions.invoke('create-asaas-customer')

            if (customerError || !customerData?.asaas_customer_id) {
                return new Response(
                    JSON.stringify({ error: 'Não foi possível criar o cliente Asaas. Complete seu cadastro de faturamento.' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            asaasCustomerId = customerData.asaas_customer_id
        }

        const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
        if (!asaasApiKey) {
            return new Response(
                JSON.stringify({ error: 'Configuração Asaas incompleta' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Criar cobrança PIX no Asaas
        const paymentPayload = {
            customer: asaasCustomerId,
            billingType: 'PIX',
            value: pkg.price,
            dueDate: new Date().toISOString().split('T')[0],
            description: `Créditos Dialer - ${pkg.name} (${pkg.credits_amount} créditos)`,
            externalReference: `dialer_credits_${user.id}_${packageId}_${Date.now()}`,
        }

        console.log('📤 [DIALER PIX] Criando cobrança no Asaas...')
        const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': asaasApiKey,
            },
            body: JSON.stringify(paymentPayload),
        })

        if (!asaasResponse.ok) {
            const errorText = await asaasResponse.text()
            console.error('❌ [DIALER PIX] Erro Asaas:', errorText)
            let errorMessage = 'Erro ao criar cobrança PIX'
            try {
                const errorData = JSON.parse(errorText)
                if (errorData.errors?.[0]) {
                    errorMessage = errorData.errors[0].description || errorData.errors[0].message || errorMessage
                }
            } catch (_) { }
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const payment = await asaasResponse.json()
        console.log('✅ [DIALER PIX] Cobrança criada:', payment.id)

        // Registrar compra pendente
        await supabaseClient.from('credit_purchases').insert({
            user_id: user.id,
            package_id: packageId,
            asaas_payment_id: payment.id,
            amount: pkg.price,
            credits_amount: pkg.credits_amount,
            status: 'pending',
            payment_method: 'pix',
        })

        // Buscar QR Code PIX
        console.log('🔍 [DIALER PIX] Buscando QR Code PIX...')
        const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${payment.id}/pixQrCode`, {
            method: 'GET',
            headers: { 'access_token': asaasApiKey },
        })

        let qrCodeBase64 = null
        let payload = null

        if (pixResponse.ok) {
            const pixData = await pixResponse.json()
            qrCodeBase64 = pixData.encodedImage || null
            payload = pixData.payload || null
        } else {
            payload = `Pagamento ${pkg.name} - R$ ${pkg.price}`
        }

        return new Response(
            JSON.stringify({
                success: true,
                paymentId: payment.id,
                qrCodeBase64,
                payload,
                value: pkg.price,
                credits: pkg.credits_amount,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('💥 [DIALER PIX] Erro interno:', error)
        return new Response(
            JSON.stringify({ error: 'Erro interno do servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
