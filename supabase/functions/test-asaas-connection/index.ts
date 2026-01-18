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

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Verificar API key
    const hasApiKey = !!Deno.env.get('ASAAS_API_KEY')
    const apiKeyPrefix = Deno.env.get('ASAAS_API_KEY')?.substring(0, 10) + '...'

    // Testar conexão com Asaas (PRODUÇÃO)
    let asaasConnectionTest = null
    try {
      const testResponse = await fetch('https://www.asaas.com/api/v3/customers?limit=1', {
        method: 'GET',
        headers: {
          'access_token': Deno.env.get('ASAAS_API_KEY') ?? ''
        }
      })
      asaasConnectionTest = {
        status: testResponse.status,
        ok: testResponse.ok,
        hasApiKey: hasApiKey
      }
    } catch (error) {
      asaasConnectionTest = {
        error: error.message,
        hasApiKey: hasApiKey
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email
        },
        profile: {
          exists: !!profile,
          asaas_customer_id: profile?.asaas_customer_id,
          error: profileError?.message
        },
        asaas: {
          connection: asaasConnectionTest,
          apiKeyPrefix: apiKeyPrefix
        },
        environment: {
          supabase_url: !!Deno.env.get('SUPABASE_URL'),
          supabase_anon_key: !!Deno.env.get('SUPABASE_ANON_KEY'),
          asaas_api_key: hasApiKey
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in test-asaas-connection function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})