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

    // Get request body
    const { sessionName } = await req.json()
    if (!sessionName) {
      throw new Error('Session name is required')
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

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Try to get existing session first
    let session
    try {
      const getResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
      })

      if (getResponse.ok) {
        session = await getResponse.json()
        console.log('Existing session found:', session.name)
      }
    } catch (error) {
      console.log('No existing session found, will create new one')
    }

    // If no existing session, create new one
    if (!session) {
      const createResponse = await fetch(`${wahaBaseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          start: true,
          config: {
            webhooks: [
              {
                url: `${Deno.env.get('SUPABASE_URL')}/functions/whatsapp-webhook`,
                events: ['message'],
                headers: {
                  'Content-Type': 'application/json',
                  'X-Webhook-Source': 'waha'
                }
              }
            ]
          }
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Failed to create session: ${createResponse.status} ${errorText}`)
      }

      session = await createResponse.json()
    }

    // If session exists but is stopped, start it
    if (session.status === 'STOPPED') {
      const startResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: {
          'X-API-Key': credentials.waha_api_key,
        },
      })

      if (!startResponse.ok) {
        throw new Error(`Failed to start session: ${startResponse.status}`)
      }

      // Wait a bit and get updated session info
      await new Promise(resolve => setTimeout(resolve, 2000))

      const updatedResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
      })

      if (updatedResponse.ok) {
        session = await updatedResponse.json()
      }
    }

    // Save session info to database
    const { error: insertError } = await supabaseClient
      .from('whatsapp_sessions')
      .upsert({
        user_id: user.id,
        session_name: sessionName,
        status: session.status,
        waha_session_id: session.name
      }, {
        onConflict: 'user_id,session_name'
      })

    if (insertError) {
      console.error('Error saving session to DB:', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          name: session.name,
          status: session.status,
          qr: session.qr || null
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating WAHA session:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to create WAHA session'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})