import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Helper function to capture and store WhatsApp user ID
async function captureWhatsAppUserId(supabaseClient: any, userId: string, sessionName: string, wahaBaseUrl: string, wahaApiKey: string, franchiseId?: string) {
  try {
    console.log('📱 [CAPTURE] Capturing WhatsApp user ID for session:', sessionName)

    // Get session info including 'me' field
    const sessionInfoResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
      headers: {
        'X-API-Key': wahaApiKey,
        'Content-Type': 'application/json',
      },
    })

    if (sessionInfoResponse.ok) {
      const sessionInfo = await sessionInfoResponse.json()
      console.log('📊 [CAPTURE] Session info:', sessionInfo)

      if (sessionInfo.me && sessionInfo.me.id) {
        const whatsappUserId = sessionInfo.me.id
        console.log('🎯 [CAPTURE] WhatsApp User ID found:', whatsappUserId)

        // Insert into whatsapp_user_ids table
        const { error: insertError } = await supabaseClient
          .from('whatsapp_user_ids')
          .upsert({
            whatsapp_user_id: whatsappUserId,
            user_id: userId,
            franchise_id: franchiseId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'whatsapp_user_id,user_id'
          })

        if (insertError) {
          console.error('❌ [CAPTURE] Error inserting WhatsApp user ID:', insertError)
          return { success: false, error: insertError.message }
        } else {
          console.log('✅ [CAPTURE] WhatsApp user ID stored successfully')
          return { success: true, whatsappUserId }
        }
      } else {
        console.log('⚠️ [CAPTURE] No WhatsApp user ID found in session info')
        return { success: false, error: 'No WhatsApp user ID found in session' }
      }
    } else {
      console.log('⚠️ [CAPTURE] Could not get session info for WhatsApp user ID capture')
      return { success: false, error: 'Could not get session info' }
    }
  } catch (captureError) {
    console.error('💥 [CAPTURE] Error capturing WhatsApp user ID:', captureError)
    return { success: false, error: captureError.message }
  }
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
    const { sessionName, franchiseId } = await req.json()
    if (!sessionName) {
      throw new Error('Session name is required')
    }

    // Get user credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2')  // User with correct credentials
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found.')
    }

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Capture WhatsApp user ID
    const result = await captureWhatsAppUserId(supabaseClient, user.id, sessionName, wahaBaseUrl, credentials.waha_api_key, franchiseId)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Error capturing WhatsApp user ID:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to capture WhatsApp user ID'
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