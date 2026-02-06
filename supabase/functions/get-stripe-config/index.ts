import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("🔧 [STRIPE-CONFIG] Function loaded")

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("🔧 [STRIPE-CONFIG] Getting PRODUCTION Stripe keys from secrets")

    // Get Stripe keys APENAS from environment variables (Supabase secrets) - NO FALLBACK
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!publishableKey || !secretKey) {
      console.error("🔧 [STRIPE-CONFIG] Missing Stripe keys in production secrets")
      console.error("🔧 [STRIPE-CONFIG] Configure in: Supabase Dashboard > Settings > Edge Functions > Secrets")
      return new Response(
        JSON.stringify({
          error: 'Stripe keys not configured',
          required: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
          details: 'Configure all secrets in Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("🔧 [STRIPE-CONFIG] Production keys loaded successfully")
    console.log("🔧 [STRIPE-CONFIG] Publishable key starts with:", publishableKey.substring(0, 10) + "...")

    return new Response(
      JSON.stringify({
        publishableKey,
        webhookSecret
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error("🔧 [STRIPE-CONFIG] Error:", error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})