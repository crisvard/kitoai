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

    // Get WhatsApp session info
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('whatsapp_sessions')
      .select('session_name')
      .eq('user_id', user.id)
      .eq('status', 'WORKING')
      .single()

    if (sessionError || !sessionData) {
      throw new Error('No active WhatsApp session found. Please connect WhatsApp first.')
    }

    // Get N8N workflow info
    const { data: workflowData, error: workflowError } = await supabaseClient
      .from('n8n_workflows')
      .select('webhook_url')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (workflowError || !workflowData) {
      throw new Error('No active N8N workflow found. Please create workflow first.')
    }

    // Get user credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found.')
    }

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Configure webhook in WAHA session
    const webhookConfig = {
      config: {
        webhooks: [
          {
            url: workflowData.webhook_url,
            events: ['message', 'session.status'],
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Source': 'kito-expert'
            }
          }
        ]
      }
    }

    const updateResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionData.session_name}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': credentials.waha_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookConfig)
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Failed to configure webhook: ${updateResponse.status} ${errorText}`)
    }

    // Update session status in database
    const { error: updateError } = await supabaseClient
      .from('whatsapp_sessions')
      .update({ webhook_configured: true })
      .eq('user_id', user.id)
      .eq('session_name', sessionData.session_name)

    if (updateError) {
      console.error('Error updating session status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        webhookUrl: workflowData.webhook_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error validating webhook:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to validate webhook'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})