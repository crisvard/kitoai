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

  console.log('🔔 [STRIPE] Criando PaymentIntent...')

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-11-20.acacia',
    })

    const { planId, amount, userId, installments = 1 } = await req.json()
    console.log('📋 [STRIPE] Dados recebidos:', { planId, amount, userId, installments })

    if (!planId || !amount || !userId) {
      throw new Error('planId, amount e userId são obrigatórios')
    }

    if (installments < 1 || installments > 12) {
      throw new Error('Número de parcelas deve ser entre 1 e 12')
    }

    // Validar com os dados do banco de dados (tabela unificada de planos)
    let finalAmount = amount;
    const { data: plan } = await supabaseClient
      .from('plans')
      .select('price, monthly_price, annual_price, name')
      .eq('id', planId)
      .maybeSingle();

    if (plan) {
      console.log('💰 [STRIPE] Plano/Pacote validado no banco:', plan.name);
      finalAmount = plan.price || plan.monthly_price || plan.annual_price || amount;
    }

    // Criar PaymentIntent
    const paymentIntentData: any = {
      amount: Math.round(finalAmount * 100), // Stripe usa centavos
      currency: 'brl',
      metadata: {
        planId,
        userId,
        installments: installments.toString(),
        type: planId.startsWith('credits_') ? 'credits' : 'plan'
      },
    };

    // Se tiver parcelamento, habilitar installments (sem plan no create)
    if (installments > 1) {
      paymentIntentData.payment_method_options = {
        card: {
          installments: {
            enabled: true,
          },
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('🔄 [STRIPE] Criando PaymentIntent com dados:', {
      amount: Math.round(amount * 100),
      currency: 'brl',
      installments: installments,
      metadata: {
        planId,
        userId,
        installments: installments.toString(),
      }
    });

    console.log('✅ [STRIPE] PaymentIntent criado:', paymentIntent.id);
    console.log('📊 [STRIPE] Detalhes do PaymentIntent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret ? 'presente' : 'ausente',
      metadata: paymentIntent.metadata
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 [STRIPE] Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})