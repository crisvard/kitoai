import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user')
    }

    // Get user credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found. Please configure them first.')
    }

    // Test connection to WAHA
    const testUrl = `${credentials.waha_url.replace(/\/$/, '')}/api/sessions`

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': credentials.waha_api_key,
        'Content-Type': 'application/json',
      },
    })

    const success = response.ok

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'WAHA connection successful' : 'WAHA connection failed',
        status: response.status,
        statusText: response.statusText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Error testing WAHA connection:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to test WAHA connection'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})