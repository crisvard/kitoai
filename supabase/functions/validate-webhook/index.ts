import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    // Get request body to check for webhookUrl parameter
    let requestBody: any = {}
    try {
      requestBody = await req.json()
    } catch (e) {
      // Body might be empty, continue
    }

    let webhookUrl: string

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

    // If webhookUrl was provided in request, use it directly
    if (requestBody.webhookUrl) {
      console.log('✅ Using webhook URL from request:', requestBody.webhookUrl)
      webhookUrl = requestBody.webhookUrl
    } else {
      // Fallback: Get N8N workflow info for validated workflows
      console.log('🔍 No webhook URL in request, searching for validated workflow for user:', user.id)
      const { data: workflowData, error: workflowError } = await supabaseClient
        .from('n8n_workflows')
        .select('webhook_url, status')
        .eq('user_id', user.id)
        .eq('status', 'validated')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      console.log('🔍 Workflow query result:', { data: workflowData, error: workflowError })

      if (workflowError || !workflowData) {
        console.error('❌ Workflow query error:', workflowError)
        console.error('❌ No workflow data found')
        throw new Error('No N8N workflow found. Please create workflow first.')
      }

      console.log('✅ Found workflow with status:', workflowData.status)
      webhookUrl = workflowData.webhook_url
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

    // Configure webhook in WAHA session with basic events first
    const wahaEvents = [
      'message',           // Text, media, location messages
      'session.status'     // Session state changes
    ]

    const webhookConfig = {
      config: {
        webhooks: [
          {
            url: webhookUrl,
            events: wahaEvents,
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Source': 'kito-expert',
              'X-User-ID': user.id
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

    // Update workflow status in whatsapp_connections to prevent button from showing again
    const { error: workflowUpdateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        n8n_status: 'validated',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (workflowUpdateError) {
      console.error('Error updating workflow status:', workflowUpdateError)
    } else {
      console.log('✅ Workflow status updated to validated')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        webhookUrl: webhookUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error validating webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate webhook'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})