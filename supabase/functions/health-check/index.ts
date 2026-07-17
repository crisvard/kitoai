import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  response_time_ms: number
  error?: string
  details?: any
}

serve(async (req) => {
  console.log('🏥 [HEALTH-CHECK] Starting comprehensive health check...')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const results: HealthCheckResult[] = []

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ [HEALTH-CHECK] No authorization header')
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    console.log('👤 [HEALTH-CHECK] Authenticating user...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ [HEALTH-CHECK] User authentication failed:', userError)
      throw new Error('Invalid user')
    }
    console.log('✅ [HEALTH-CHECK] User authenticated:', user.id)

    // Get user credentials
    console.log('🔑 [HEALTH-CHECK] Fetching user credentials...')
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key, n8n_url, n8n_api_key, gemini_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      console.error('❌ [HEALTH-CHECK] Credentials not found:', credError)
      throw new Error('Credentials not found. Please configure them first.')
    }

    // Check Supabase connectivity
    console.log('💾 [HEALTH-CHECK] Testing Supabase connectivity...')
    const supabaseStart = Date.now()
    try {
      const { data, error } = await supabaseClient
        .from('user_credentials')
        .select('count')
        .limit(1)
        .single()

      const supabaseDuration = Date.now() - supabaseStart
      results.push({
        service: 'supabase',
        status: error ? 'unhealthy' : 'healthy',
        response_time_ms: supabaseDuration,
        error: error?.message,
        details: { user_id: user.id }
      })
      console.log(`✅ [HEALTH-CHECK] Supabase: ${error ? 'FAILED' : 'OK'} (${supabaseDuration}ms)`)
    } catch (error) {
      const supabaseDuration = Date.now() - supabaseStart
      results.push({
        service: 'supabase',
        status: 'unhealthy',
        response_time_ms: supabaseDuration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error(`❌ [HEALTH-CHECK] Supabase failed:`, error)
    }

    // Check WAHA connectivity
    console.log('📱 [HEALTH-CHECK] Testing WAHA connectivity...')
    const wahaStart = Date.now()
    try {
      const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')
      const response = await fetch(`${wahaBaseUrl}/api/sessions`, {
        method: 'GET',
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const wahaDuration = Date.now() - wahaStart
      const isHealthy = response.ok

      results.push({
        service: 'waha',
        status: isHealthy ? 'healthy' : 'unhealthy',
        response_time_ms: wahaDuration,
        error: !isHealthy ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        details: {
          url: wahaBaseUrl,
          status: response.status,
          has_api_key: !!credentials.waha_api_key
        }
      })
      console.log(`✅ [HEALTH-CHECK] WAHA: ${isHealthy ? 'OK' : 'FAILED'} (${wahaDuration}ms)`)
    } catch (error) {
      const wahaDuration = Date.now() - wahaStart
      results.push({
        service: 'waha',
        status: 'unhealthy',
        response_time_ms: wahaDuration,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { url: credentials.waha_url }
      })
      console.error(`❌ [HEALTH-CHECK] WAHA failed:`, error)
    }

    // Check N8N connectivity
    console.log('⚙️ [HEALTH-CHECK] Testing N8N connectivity...')
    const n8nStart = Date.now()
    try {
      const response = await fetch(`${credentials.n8n_url}/rest/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': credentials.n8n_api_key,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const n8nDuration = Date.now() - n8nStart
      const isHealthy = response.ok

      results.push({
        service: 'n8n',
        status: isHealthy ? 'healthy' : 'unhealthy',
        response_time_ms: n8nDuration,
        error: !isHealthy ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        details: {
          url: credentials.n8n_url,
          status: response.status,
          has_api_key: !!credentials.n8n_api_key
        }
      })
      console.log(`✅ [HEALTH-CHECK] N8N: ${isHealthy ? 'OK' : 'FAILED'} (${n8nDuration}ms)`)
    } catch (error) {
      const n8nDuration = Date.now() - n8nStart
      results.push({
        service: 'n8n',
        status: 'unhealthy',
        response_time_ms: n8nDuration,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { url: credentials.n8n_url }
      })
      console.error(`❌ [HEALTH-CHECK] N8N failed:`, error)
    }

    // Check Gemini API (simple connectivity test)
    console.log('🤖 [HEALTH-CHECK] Testing Gemini API connectivity...')
    const geminiStart = Date.now()
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + credentials.gemini_api_key, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hello' }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const geminiDuration = Date.now() - geminiStart
      const isHealthy = response.ok || response.status === 400 // 400 is OK for invalid request format

      results.push({
        service: 'gemini',
        status: isHealthy ? 'healthy' : 'unhealthy',
        response_time_ms: geminiDuration,
        error: !isHealthy ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        details: {
          has_api_key: !!credentials.gemini_api_key,
          status: response.status
        }
      })
      console.log(`✅ [HEALTH-CHECK] Gemini: ${isHealthy ? 'OK' : 'FAILED'} (${geminiDuration}ms)`)
    } catch (error) {
      const geminiDuration = Date.now() - geminiStart
      results.push({
        service: 'gemini',
        status: 'unhealthy',
        response_time_ms: geminiDuration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error(`❌ [HEALTH-CHECK] Gemini failed:`, error)
    }

    // Check WhatsApp session status
    console.log('📱 [HEALTH-CHECK] Checking WhatsApp session status...')
    try {
      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('whatsapp_sessions')
        .select('session_name, status, webhook_configured')
        .eq('user_id', user.id)
        .eq('status', 'WORKING')
        .single()

      const hasActiveSession = !sessionError && sessionData

      results.push({
        service: 'whatsapp_session',
        status: hasActiveSession ? 'healthy' : 'unhealthy',
        response_time_ms: 0,
        error: !hasActiveSession ? 'No active WhatsApp session found' : undefined,
        details: sessionData || { message: 'No active session' }
      })
      console.log(`✅ [HEALTH-CHECK] WhatsApp Session: ${hasActiveSession ? 'ACTIVE' : 'INACTIVE'}`)
    } catch (error) {
      results.push({
        service: 'whatsapp_session',
        status: 'unknown',
        response_time_ms: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error(`❌ [HEALTH-CHECK] WhatsApp session check failed:`, error)
    }

    // Check N8N workflow status
    console.log('⚙️ [HEALTH-CHECK] Checking N8N workflow status...')
    try {
      const { data: workflowData, error: workflowError } = await supabaseClient
        .from('n8n_workflows')
        .select('workflow_id, status, webhook_url')
        .eq('user_id', user.id)
        .in('status', ['active', 'validated'])
        .single()

      const hasActiveWorkflow = !workflowError && workflowData

      results.push({
        service: 'n8n_workflow',
        status: hasActiveWorkflow ? 'healthy' : 'unhealthy',
        response_time_ms: 0,
        error: !hasActiveWorkflow ? 'No active N8N workflow found' : undefined,
        details: workflowData || { message: 'No active workflow' }
      })
      console.log(`✅ [HEALTH-CHECK] N8N Workflow: ${hasActiveWorkflow ? 'ACTIVE' : 'INACTIVE'}`)
    } catch (error) {
      results.push({
        service: 'n8n_workflow',
        status: 'unknown',
        response_time_ms: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error(`❌ [HEALTH-CHECK] N8N workflow check failed:`, error)
    }

    // Calculate overall health
    const totalDuration = Date.now() - startTime
    const healthyServices = results.filter(r => r.status === 'healthy').length
    const totalServices = results.length
    const overallHealth = healthyServices === totalServices ? 'healthy' :
                         healthyServices >= totalServices * 0.7 ? 'degraded' : 'unhealthy'

    console.log(`🏁 [HEALTH-CHECK] Completed in ${totalDuration}ms - ${healthyServices}/${totalServices} services healthy`)

    // Log health check results
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'health_check',
        payload: {
          user_id: user.id,
          overall_health: overallHealth,
          healthy_services: healthyServices,
          total_services: totalServices,
          results: results,
          total_duration_ms: totalDuration,
          timestamp: new Date().toISOString()
        },
        processed: true,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        overall_health: overallHealth,
        healthy_services: healthyServices,
        total_services: totalServices,
        total_duration_ms: totalDuration,
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`💥 [HEALTH-CHECK] Fatal error after ${totalDuration}ms:`, error)

    return new Response(
      JSON.stringify({
        success: false,
        overall_health: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        total_duration_ms: totalDuration,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})