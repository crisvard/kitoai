// create-credit-purchase/index.ts
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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
        if (authError || !user) throw new Error('Unauthorized')

        // Parse request
        const { packageId } = await req.json()
        if (!packageId) throw new Error('packageId is required')

        // Get package details
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('credit_packages')
            .select('*')
            .eq('id', packageId)
            .single()

        if (pkgError || !pkg) throw new Error('Package not found')

        // Get profile
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('asaas_customer_id, full_name, email, cpf')
            .eq('id', user.id)
            .single()

        if (!profile?.asaas_customer_id) {
            throw new Error('Você precisa completar seu cadastro de faturamento antes de comprar créditos.')
        }

        const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

        // Create PIX payment in Asaas
        const paymentData = {
            customer: profile.asaas_customer_id,
            billingType: 'PIX',
            value: pkg.price,
            dueDate: new Date().toISOString().split('T')[0],
            description: `Compra de Créditos: ${pkg.name}`,
            externalReference: `credits_${user.id}_${packageId}_${Date.now()}`,
        }

        const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': asaasApiKey!
            },
            body: JSON.stringify(paymentData)
        })

        if (!asaasResponse.ok) {
            const errorMsg = await asaasResponse.text()
            throw new Error(`Asaas error: ${errorMsg}`)
        }

        const payment = await asaasResponse.json()

        // Record pending purchase in database
        await supabaseClient
            .from('credit_purchases')
            .insert({
                user_id: user.id,
                package_id: packageId,
                asaas_payment_id: payment.id,
                amount: pkg.price,
                credits_amount: pkg.credits_amount,
                status: 'pending'
            })

        // Get PIX QR Code
        const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${payment.id}/pixQrCode`, {
            method: 'GET',
            headers: { 'access_token': asaasApiKey! }
        })

        const pixData = await pixResponse.json()

        return new Response(
            JSON.stringify({
                success: true,
                paymentId: payment.id,
                qrCodeBase64: pixData.encodedImage,
                payload: pixData.payload,
                value: pkg.price,
                credits: pkg.credits_amount
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
