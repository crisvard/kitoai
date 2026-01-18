import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log('🧹 [EDGE FUNCTION] reset-whatsapp-status started')

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user')
    }

    // Get request body
    const { sessionName } = await req.json()
    if (!sessionName) {
      throw new Error('Session name is required')
    }

    console.log('🧹 [EDGE FUNCTION] Resetting status for session:', sessionName)

    // Get user credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key, n8n_url, n8n_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found. Please configure them first.')
    }

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Disconnect from WAHA server completely
    console.log('🧹 [EDGE FUNCTION] Disconnecting from WAHA server...')
    try {
      const disconnectResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': credentials.waha_api_key,
        },
      })

      if (disconnectResponse.ok) {
        console.log('✅ [EDGE FUNCTION] Successfully disconnected from WAHA server')
      } else {
        console.log('⚠️ [EDGE FUNCTION] WAHA server disconnect returned:', disconnectResponse.status)
        // Continue anyway - we still want to clean up the database
      }
    } catch (disconnectError) {
      console.log('⚠️ [EDGE FUNCTION] Error disconnecting from WAHA server:', disconnectError)
      // Continue anyway - we still want to clean up the database
    }

    // Get current workflow info before resetting
    const { data: currentConnection } = await supabaseClient
      .from('whatsapp_connections')
      .select('n8n_workflow_id')
      .eq('user_id', user.id)
      .single()

    // Deactivate N8N workflow if it exists
    if (currentConnection?.n8n_workflow_id && credentials.n8n_url && credentials.n8n_api_key) {
      console.log('🧹 [EDGE FUNCTION] Deactivating N8N workflow:', currentConnection.n8n_workflow_id)
      try {
        const deactivateResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${currentConnection.n8n_workflow_id}/activate`, {
          method: 'DELETE', // DELETE method to deactivate
          headers: {
            'X-N8N-API-KEY': credentials.n8n_api_key,
          },
        })

        if (deactivateResponse.ok) {
          console.log('✅ [EDGE FUNCTION] Successfully deactivated N8N workflow')
        } else {
          console.log('⚠️ [EDGE FUNCTION] N8N workflow deactivate returned:', deactivateResponse.status)
          // Continue anyway - we still want to clean up the database
        }
      } catch (n8nError) {
        console.log('⚠️ [EDGE FUNCTION] Error deactivating N8N workflow:', n8nError)
        // Continue anyway - we still want to clean up the database
      }
    }

    // Reset the connection status to disconnected
    await supabaseClient
      .from('whatsapp_connections')
      .upsert({
        user_id: user.id,
        waha_status: 'disconnected',
        waha_session_name: null,
        n8n_status: 'not_created',
        n8n_workflow_id: null,
        n8n_webhook_url: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    // Delete the session record if it exists
    await supabaseClient
      .from('whatsapp_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('session_name', sessionName)

    console.log('✅ [EDGE FUNCTION] WhatsApp status reset successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp status reset successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [EDGE FUNCTION] Fatal error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to reset WhatsApp status'

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