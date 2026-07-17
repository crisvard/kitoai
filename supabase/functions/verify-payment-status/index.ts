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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { paymentId } = await req.json()

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar status do pagamento no Asaas (PRODUÇÃO)
    const asaasResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? ''
      }
    })

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.text()
      console.error('Asaas API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to check payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentData = await asaasResponse.json()
    console.log('Payment status check:', paymentData.status)

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentData.status,
        payment: paymentData,
        message: `Payment status: ${paymentData.status}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-payment-status function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})