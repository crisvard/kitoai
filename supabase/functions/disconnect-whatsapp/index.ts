import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log('🔌 [DISCONNECT-WHATSAPP] Starting WhatsApp disconnection...')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ [DISCONNECT-WHATSAPP] No authorization header')
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    console.log('👤 [DISCONNECT-WHATSAPP] Authenticating user...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ [DISCONNECT-WHATSAPP] User authentication failed:', userError)
      throw new Error('Invalid user')
    }
    console.log('✅ [DISCONNECT-WHATSAPP] User authenticated:', user.id)

    // Get user credentials for WAHA operations
    console.log('🔑 [DISCONNECT-WHATSAPP] Fetching user credentials...')
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key, n8n_url, n8n_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      console.error('❌ [DISCONNECT-WHATSAPP] Credentials not found:', credError)
      // Continue anyway - we can still clean up database
    }

    // Step 1: Disconnect from WAHA if possible
    if (credentials?.waha_url && credentials?.waha_api_key) {
      try {
        console.log('📱 [DISCONNECT-WHATSAPP] Disconnecting from WAHA...')

        // Get active session
        const { data: sessionData } = await supabaseClient
          .from('whatsapp_sessions')
          .select('session_name')
          .eq('user_id', user.id)
          .eq('status', 'WORKING')
          .single()

        if (sessionData) {
          // Try to disconnect from WAHA
          const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')
          const disconnectResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionData.session_name}`, {
            method: 'DELETE',
            headers: {
              'X-API-Key': credentials.waha_api_key,
              'Content-Type': 'application/json',
            },
          })

          if (disconnectResponse.ok) {
            console.log('✅ [DISCONNECT-WHATSAPP] Successfully disconnected from WAHA')
          } else {
            console.warn('⚠️ [DISCONNECT-WHATSAPP] WAHA disconnect returned:', disconnectResponse.status)
          }
        }
      } catch (wahaError) {
        console.warn('⚠️ [DISCONNECT-WHATSAPP] Error disconnecting from WAHA:', wahaError)
        // Continue with cleanup even if WAHA disconnect fails
      }
    }

    // Step 2: Clean up whatsapp_sessions
    console.log('🗑️ [DISCONNECT-WHATSAPP] Cleaning whatsapp_sessions...')
    const { error: sessionError } = await supabaseClient
      .from('whatsapp_sessions')
      .delete()
      .eq('user_id', user.id)

    if (sessionError) {
      console.error('❌ [DISCONNECT-WHATSAPP] Error cleaning whatsapp_sessions:', sessionError)
    } else {
      console.log('✅ [DISCONNECT-WHATSAPP] whatsapp_sessions cleaned')
    }

    // Step 3: Reset whatsapp_connections
    console.log('🔄 [DISCONNECT-WHATSAPP] Resetting whatsapp_connections...')
    const { error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        waha_session_name: null,
        waha_status: 'disconnected',
        n8n_workflow_id: null,
        n8n_webhook_url: null,
        n8n_status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (connectionError) {
      console.error('❌ [DISCONNECT-WHATSAPP] Error resetting whatsapp_connections:', connectionError)
    } else {
      console.log('✅ [DISCONNECT-WHATSAPP] whatsapp_connections reset')
    }

    // Step 4: Deactivate/delete N8N workflows
    console.log('⚙️ [DISCONNECT-WHATSAPP] Handling N8N workflows...')
    const { data: workflows, error: workflowQueryError } = await supabaseClient
      .from('n8n_workflows')
      .select('workflow_id, status')
      .eq('user_id', user.id)
      .in('status', ['created', 'validated', 'active'])

    if (workflowQueryError) {
      console.error('❌ [DISCONNECT-WHATSAPP] Error querying workflows:', workflowQueryError)
    } else if (workflows && workflows.length > 0) {
      // Try to deactivate workflows in N8N
      if (credentials?.n8n_url && credentials?.n8n_api_key) {
        for (const workflow of workflows) {
          try {
            console.log(`🔌 [DISCONNECT-WHATSAPP] Deactivating workflow ${workflow.workflow_id}...`)
            await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflow.workflow_id}/activate`, {
              method: 'DELETE', // This deactivates the workflow
              headers: {
                'X-N8N-API-KEY': credentials.n8n_api_key,
              },
            })
          } catch (n8nError) {
            console.warn(`⚠️ [DISCONNECT-WHATSAPP] Error deactivating workflow ${workflow.workflow_id}:`, n8nError)
          }
        }
      }

      // DELETE workflows from database (complete cleanup)
      const { error: workflowDeleteError } = await supabaseClient
        .from('n8n_workflows')
        .delete()
        .eq('user_id', user.id)

      if (workflowDeleteError) {
        console.error('❌ [DISCONNECT-WHATSAPP] Error deleting workflows:', workflowDeleteError)
      } else {
        console.log('✅ [DISCONNECT-WHATSAPP] N8N workflows deleted from database')
      }
    }

    // Step 5: Clean up whatsapp_user_ids
    console.log('📱 [DISCONNECT-WHATSAPP] Cleaning whatsapp_user_ids...')
    const { error: whatsappUserIdsError } = await supabaseClient
      .from('whatsapp_user_ids')
      .delete()
      .eq('user_id', user.id)

    if (whatsappUserIdsError) {
      console.error('❌ [DISCONNECT-WHATSAPP] Error cleaning whatsapp_user_ids:', whatsappUserIdsError)
    } else {
      console.log('✅ [DISCONNECT-WHATSAPP] whatsapp_user_ids cleaned')
    }

    // Step 6: Clean up agent configurations
    console.log('🤖 [DISCONNECT-WHATSAPP] Cleaning agent configurations...')
    const { error: agentError } = await supabaseClient
      .from('agent_configs')
      .delete()
      .eq('user_id', user.id)

    if (agentError) {
      console.error('❌ [DISCONNECT-WHATSAPP] Error cleaning agent_configs:', agentError)
    } else {
      console.log('✅ [DISCONNECT-WHATSAPP] agent_configs cleaned')
    }

    // Step 6: Log the disconnection
    console.log('📝 [DISCONNECT-WHATSAPP] Logging disconnection...')
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'whatsapp_disconnected',
        payload: {
          user_id: user.id,
          timestamp: new Date().toISOString(),
          cleaned_tables: [
            'whatsapp_sessions',
            'whatsapp_connections',
            'whatsapp_user_ids',
            'n8n_workflows', // Now DELETED instead of marked inactive
            'agent_configs'
          ]
        },
        processed: true,
        created_at: new Date().toISOString()
      })

    console.log('🏁 [DISCONNECT-WHATSAPP] WhatsApp disconnection completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp disconnected successfully. All dependent configurations have been cleaned.',
        cleaned_tables: [
          'whatsapp_sessions',
          'whatsapp_connections',
          'whatsapp_user_ids',
          'n8n_workflows', // DELETED from database
          'agent_configs'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [DISCONNECT-WHATSAPP] Fatal error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})