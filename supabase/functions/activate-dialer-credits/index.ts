// activate-dialer-credits/index.ts
// Dedicated edge function to activate Dialer credits after Stripe payment
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

    console.log('💎 [DIALER CREDITS] Ativando créditos do dialer após pagamento Stripe...')

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2024-11-20.acacia',
        })

        const { userId, paymentIntentId, packageId } = await req.json()

        if (!userId || !paymentIntentId || !packageId) {
            throw new Error('userId, paymentIntentId e packageId são obrigatórios')
        }

        console.log('📋 [DIALER CREDITS] Dados recebidos:', { userId, paymentIntentId, packageId })

        // Verificar pagamento no Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        console.log('💰 [DIALER CREDITS] PaymentIntent status:', paymentIntent.status)

        if (paymentIntent.status !== 'succeeded') {
            throw new Error(`Pagamento não confirmado. Status: ${paymentIntent.status}`)
        }

        // Idempotência: verificar se já foi processado
        const { data: existing } = await supabaseClient
            .from('credit_purchases')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle()

        if (existing?.status === 'completed') {
            console.log('✅ [DIALER CREDITS] Compra já processada anteriormente')
            return new Response(
                JSON.stringify({ success: true, message: 'Créditos já ativados' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Buscar pacote de créditos
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('credit_packages')
            .select('*')
            .eq('id', packageId)
            .single()

        if (pkgError || !pkg) {
            throw new Error('Pacote de créditos não encontrado')
        }

        // Buscar créditos atuais do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

        if (profileError) {
            throw new Error('Perfil do usuário não encontrado')
        }

        const currentCredits = profile.credits || 0
        const newCredits = currentCredits + pkg.credits_amount

        console.log('📈 [DIALER CREDITS] Atualizando créditos:', { currentCredits, newCredits })

        // Adicionar créditos
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId)

        if (updateError) {
            throw new Error(`Erro ao atualizar créditos: ${updateError.message}`)
        }

        // Registrar compra
        const purchaseData = {
            user_id: userId,
            package_id: packageId,
            credits_amount: pkg.credits_amount,
            amount: paymentIntent.amount / 100,
            status: 'completed',
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntentId,
        }

        if (existing) {
            await supabaseClient.from('credit_purchases').update({ status: 'completed' }).eq('id', existing.id)
        } else {
            await supabaseClient.from('credit_purchases').insert(purchaseData)
        }

        // Histórico de pagamentos
        await supabaseClient.from('payments').insert({
            user_id: userId,
            amount: paymentIntent.amount / 100,
            currency: 'BRL',
            payment_method: 'stripe',
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
            description: `Créditos Dialer - ${pkg.name}`,
        })

        console.log('🎉 [DIALER CREDITS] Créditos ativados com sucesso! Total:', newCredits)

        return new Response(
            JSON.stringify({ success: true, message: 'Créditos ativados com sucesso', newCredits }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('💥 [DIALER CREDITS] Erro:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Erro desconhecido', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
