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

    console.log('💎 [ACTIVATE CREDITS] Recebendo ativação de créditos...')

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2024-11-20.acacia',
        })

        const { userId, paymentIntentId, packageId } = await req.json()

        console.log('📋 [ACTIVATE CREDITS] Dados recebidos:', { userId, paymentIntentId, packageId })

        if (!userId || !paymentIntentId || !packageId) {
            throw new Error('userId, paymentIntentId e packageId são obrigatórios')
        }

        // Verificar se o PaymentIntent foi pago no Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        console.log('💰 [ACTIVATE CREDITS] PaymentIntent status:', paymentIntent.status)

        if (paymentIntent.status !== 'succeeded') {
            throw new Error(`Pagamento não confirmado. Status: ${paymentIntent.status}`)
        }

        // Verificar se este pagamento já foi processado (idempotência)
        const { data: existingPurchase, error: purchaseLookupError } = await supabaseClient
            .from('credit_purchases')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle()

        if (existingPurchase && existingPurchase.status === 'completed') {
            console.log('✅ [ACTIVATE CREDITS] Compra já processada anteriormente')
            return new Response(
                JSON.stringify({ success: true, message: 'Créditos já ativados' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Buscar pacote de créditos na tabela unificada de planos
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('plans')
            .select('*')
            .eq('id', packageId)
            .single()

        if (pkgError || !pkg) {
            console.error('❌ [ACTIVATE CREDITS] Pacote/Plano não encontrado:', pkgError)
            throw new Error('Pacote de créditos não encontrado na tabela de planos')
        }

        const creditsAmountToAdd = pkg.features?.credits_amount || 0;

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

        if (profileError) {
            console.error('❌ [ACTIVATE CREDITS] Erro buscar perfil:', profileError)
            throw new Error('Perfil do usuário não encontrado')
        }

        const currentCredits = profile.credits || 0
        const newCredits = currentCredits + pkg.credits_amount

        console.log('📈 [ACTIVATE CREDITS] Atualizando créditos:', { currentCredits, newCredits })

        // Adicionar créditos ao perfil
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId)

        if (updateError) {
            console.error('❌ [ACTIVATE CREDITS] Erro ao atualizar créditos:', updateError)
            throw new Error(`Erro ao atualizar créditos: ${updateError.message}`)
        }

        // Registrar ou atualizar a compra
        const purchaseData = {
            user_id: userId,
            package_id: packageId,
            credits_amount: pkg.credits_amount,
            amount: paymentIntent.amount / 100,
            status: 'completed',
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntentId
        }

        if (existingPurchase) {
            await supabaseClient
                .from('credit_purchases')
                .update({ status: 'completed' })
                .eq('id', existingPurchase.id)
        } else {
            await supabaseClient
                .from('credit_purchases')
                .insert(purchaseData)
        }

        // Salvar no histórico geral de pagamentos
        await supabaseClient
            .from('payments')
            .insert({
                user_id: userId,
                amount: paymentIntent.amount / 100,
                currency: 'BRL',
                payment_method: 'stripe',
                status: 'paid',
                stripe_payment_intent_id: paymentIntentId,
                description: `Compra de Créditos - ${pkg.name}`
            })

        console.log('🎉 [ACTIVATE CREDITS] Créditos ativados com sucesso!')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Créditos ativados com sucesso',
                newCredits
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('💥 [ACTIVATE CREDITS] Erro:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Erro desconhecido',
                success: false
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
