import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 [EDGE FUNCTION] check-waha-status started')

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

    console.log('🔍 [EDGE FUNCTION] Checking WAHA status for session:', sessionName)

    // Get user credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found')
    }

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Check current WAHA session status
    console.log('📡 [EDGE FUNCTION] Checking WAHA session status...')
    let wahaStatus = null
    let sessionInfo = null

    try {
      const sessionResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
      })

      if (sessionResponse.ok) {
        sessionInfo = await sessionResponse.json()
        wahaStatus = sessionInfo.status
        console.log('📊 [EDGE FUNCTION] WAHA session status:', wahaStatus)
      } else {
        console.log('❌ [EDGE FUNCTION] Session not found in WAHA')
        wahaStatus = 'not_found'
      }
    } catch (error) {
      console.log('❌ [EDGE FUNCTION] Error checking WAHA session:', error)
      wahaStatus = 'error'
    }

    // Get current database status
    const { data: currentDbStatus, error: dbError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentStatus = currentDbStatus?.waha_status || 'disconnected'
    console.log('💾 [EDGE FUNCTION] Current database status:', currentStatus)

    // Determine if status needs to be updated
    let newStatus = currentStatus
    let shouldUpdate = false

    if (wahaStatus === 'WORKING' && currentStatus !== 'connected') {
      console.log('✅ [EDGE FUNCTION] WAHA is WORKING, updating database to connected')
      newStatus = 'connected'
      shouldUpdate = true
    } else if (wahaStatus === 'SCAN_QR_CODE' && currentStatus !== 'connecting') {
      console.log('📱 [EDGE FUNCTION] WAHA is SCAN_QR_CODE, updating database to connecting')
      newStatus = 'connecting'
      shouldUpdate = true
    } else if (wahaStatus === 'not_found' || wahaStatus === 'error') {
      console.log('❌ [EDGE FUNCTION] WAHA session not found/error, updating database to disconnected')
      newStatus = 'disconnected'
      shouldUpdate = true
    }

    // Update database if needed
    if (shouldUpdate) {
      console.log(`🔄 [EDGE FUNCTION] Updating database status from '${currentStatus}' to '${newStatus}'`)

      await supabaseClient
        .from('whatsapp_connections')
        .upsert({
          user_id: user.id,
          waha_session_name: sessionName,
          waha_status: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      // Update session info if available
      if (sessionInfo) {
        await supabaseClient
          .from('whatsapp_sessions')
          .upsert({
            user_id: user.id,
            session_name: sessionName,
            status: sessionInfo.status,
            waha_session_id: sessionInfo.name,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,session_name'
          })
      }
    }

    const response = {
      success: true,
      wahaStatus: wahaStatus,
      databaseStatus: newStatus,
      updated: shouldUpdate,
      sessionInfo: sessionInfo
    }

    console.log('📤 [EDGE FUNCTION] Response:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [EDGE FUNCTION] Fatal error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to check WAHA status'

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