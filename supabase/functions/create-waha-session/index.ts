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
          return false
        } else {
          console.log('✅ [CAPTURE] WhatsApp user ID stored successfully')
          return true
        }
      } else {
        console.log('⚠️ [CAPTURE] No WhatsApp user ID found in session info')
        return false
      }
    } else {
      console.log('⚠️ [CAPTURE] Could not get session info for WhatsApp user ID capture')
      return false
    }
  } catch (captureError) {
    console.error('💥 [CAPTURE] Error capturing WhatsApp user ID:', captureError)
    return false
  }
}

serve(async (req) => {
  const sessionId = crypto.randomUUID().substring(0, 8)
  console.log(`🚀 [${sessionId}] create-waha-session started`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error(`❌ [${sessionId}] No authorization header`)
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    console.log(`👤 [${sessionId}] Authenticating user...`)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error(`❌ [${sessionId}] User authentication failed:`, userError)
      throw new Error('Invalid user')
    }
    console.log(`✅ [${sessionId}] User authenticated: ${user.id}`)

    // Get request body
    const { sessionName, phoneNumber } = await req.json()
    if (!sessionName) {
      console.error(`❌ [${sessionId}] Session name is required`)
      throw new Error('Session name is required')
    }

    console.log(`📱 [${sessionId}] Session: ${sessionName}, Phone: ${phoneNumber || 'not provided'}`)

    // Get user credentials from database - SHARED by all administrators
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2')  // User with correct credentials
      .single()

    if (credError || !credentials) {
      throw new Error('WAHA credentials not found. Please configure them first.')
    }

    const wahaBaseUrl = credentials.waha_url.replace(/\/$/, '')

    // Check if session already exists and is authenticated
    console.log('🔍 [EDGE FUNCTION] Checking existing session status...')
    let existingSession = null
    try {
      const sessionResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
      })

      if (sessionResponse.ok) {
        existingSession = await sessionResponse.json()
        console.log('📊 [EDGE FUNCTION] Session status:', existingSession.status)

        // If session is already working, user is already authenticated
        if (existingSession.status === 'WORKING') {
          console.log('✅ [EDGE FUNCTION] User already authenticated!')

          // Update database status
          await supabaseClient
            .from('whatsapp_connections')
            .upsert({
              user_id: user.id,
              waha_session_name: sessionName,
              waha_status: 'connected',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          // Capture WhatsApp user ID and store in whatsapp_user_ids table
          const { franchiseId } = await req.json().catch(() => ({}))
          await captureWhatsAppUserId(supabaseClient, user.id, sessionName, wahaBaseUrl, credentials.waha_api_key, franchiseId)

          return new Response(
            JSON.stringify({
              success: true,
              alreadyAuthenticated: true,
              session: {
                name: existingSession.name,
                status: existingSession.status
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }

        // If session exists and is in SCAN_QR_CODE, try to get QR code directly
        if (existingSession.status === 'SCAN_QR_CODE') {
          console.log('📱 [EDGE FUNCTION] Session exists and is ready for QR code, getting QR directly...')

          // Try to get QR code for existing session
          let qrCode = null
          let qrAttempts = 0
          const maxQrAttempts = 60 // 60 seconds timeout for QR

          while (qrAttempts < maxQrAttempts && !qrCode) {
            try {
              const qrResponse = await fetch(`${wahaBaseUrl}/api/${sessionName}/auth/qr`, {
                method: 'GET',
                headers: {
                  'X-API-Key': credentials.waha_api_key,
                },
              })

              if (qrResponse.ok) {
                // WAHA returns PNG image binary data, not JSON
                const imageBuffer = await qrResponse.arrayBuffer()
                const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
                qrCode = `data:image/png;base64,${base64Image}`

                console.log('✅ [EDGE FUNCTION] QR Code obtained successfully (PNG converted to base64)')
                break
              } else {
                console.log(`⏳ [EDGE FUNCTION] QR Code not ready yet (attempt ${qrAttempts + 1})`)
              }
            } catch (error) {
              console.log('⚠️ [EDGE FUNCTION] Error getting QR code:', error)
            }

            qrAttempts++
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between attempts
          }

          if (qrCode) {
            console.log('🎯 [EDGE FUNCTION] QR Code ready for authentication')

            // Update database status to connecting
            await supabaseClient
              .from('whatsapp_connections')
              .upsert({
                user_id: user.id,
                waha_session_name: sessionName,
                waha_status: 'connecting',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })

            // Save session info
            await supabaseClient
              .from('whatsapp_sessions')
              .upsert({
                user_id: user.id,
                session_name: sessionName,
                status: existingSession.status,
                waha_session_id: existingSession.name
              }, {
                onConflict: 'user_id,session_name'
              })

            const finalResponse = {
              success: true,
              qrCode: qrCode,
              phoneNumber: phoneNumber,
              session: {
                name: existingSession.name,
                status: existingSession.status
              }
            }

            console.log('📤 [EDGE FUNCTION] Final response:', JSON.stringify(finalResponse, null, 2))

            return new Response(
              JSON.stringify(finalResponse),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
              }
            )
          } else {
            console.log('❌ [EDGE FUNCTION] Could not get QR code for existing session')
            // Continue to delete and recreate session
          }
        }

        // If session exists but is in other non-working state, delete it first
        if (existingSession.status !== 'WORKING' && existingSession.status !== 'SCAN_QR_CODE') {
          console.log('🗑️ [EDGE FUNCTION] Session exists but not working, deleting it first...')
          try {
            const deleteResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
              method: 'DELETE',
              headers: {
                'X-API-Key': credentials.waha_api_key,
              },
            })
            console.log('🗑️ [EDGE FUNCTION] Delete session response:', deleteResponse.status)
          } catch (deleteError) {
            console.log('⚠️ [EDGE FUNCTION] Error deleting session (may not exist):', deleteError)
          }
          existingSession = null // Reset to force creation
        }
      }
    } catch (error) {
      console.log('ℹ️ [EDGE FUNCTION] Error checking session (may not exist):', error)
    }

    // Phone number is only required when creating a new session
    // If session exists and is SCAN_QR_CODE, we can get QR code directly
    if (!existingSession || existingSession.status !== 'SCAN_QR_CODE') {
      if (!phoneNumber) {
        throw new Error('Phone number is required for authentication')
      }

      // Validate phone number format (Brazilian format: 55 + DDD + number)
      const phoneRegex = /^55\d{10,11}$/
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format. Use: 55 + DDD + number (e.g., 5511987654321)')
      }
    }

    console.log('📱 [EDGE FUNCTION] Starting phone authentication for:', phoneNumber)

    // Create or get session
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
        console.log('✅ [EDGE FUNCTION] Existing session found')
      }
    } catch (error) {
      console.log('ℹ️ [EDGE FUNCTION] Session does not exist, will create new one')
    }

    // Create session if it doesn't exist
    if (!session) {
      console.log('🆕 [EDGE FUNCTION] Creating new WAHA session...')

      const sessionConfig = {
        name: sessionName,
        start: true
        // Removendo webhooks da criação para evitar conflitos
      }

      const createResponse = await fetch(`${wahaBaseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'X-API-Key': credentials.waha_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionConfig)
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Failed to create session: ${createResponse.status} ${errorText}`)
      }

      session = await createResponse.json()
      console.log('✅ [EDGE FUNCTION] Session created successfully')

      // Wait for session to be ready (STARTED status)
      console.log('⏳ [EDGE FUNCTION] Waiting for session to be ready...')
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout

      while (attempts < maxAttempts) {
        try {
          const statusResponse = await fetch(`${wahaBaseUrl}/api/sessions/${sessionName}`, {
            headers: {
              'X-API-Key': credentials.waha_api_key,
            },
          })

          if (statusResponse.ok) {
            const currentSession = await statusResponse.json()
            console.log(`🔄 [EDGE FUNCTION] Session status: ${currentSession.status}`)

            if (currentSession.status === 'STARTED' || currentSession.status === 'WORKING' || currentSession.status === 'SCAN_QR_CODE') {
              console.log('✅ [EDGE FUNCTION] Session is ready!')
              session = currentSession
              break
            }
          }
        } catch (error) {
          console.log('⚠️ [EDGE FUNCTION] Error checking session status:', error)
        }

        attempts++
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      }

      if (session.status !== 'STARTED' && session.status !== 'WORKING' && session.status !== 'SCAN_QR_CODE') {
        throw new Error(`Session failed to start. Final status: ${session.status}`)
      }
    }

    // Get QR Code for authentication (more reliable than request-code)
    console.log('📱 [EDGE FUNCTION] Getting QR Code for authentication...')

    // Wait for session to be fully ready with QR code
    console.log('⏳ [EDGE FUNCTION] Waiting for QR Code to be available...')
    let qrCode = null
    let qrAttempts = 0
    const maxQrAttempts = 60 // 60 seconds timeout for QR

    while (qrAttempts < maxQrAttempts && !qrCode) {
      try {
        // WAHA endpoint to get QR code: GET /api/{session}/auth/qr
        const qrResponse = await fetch(`${wahaBaseUrl}/api/${sessionName}/auth/qr`, {
          method: 'GET',
          headers: {
            'X-API-Key': credentials.waha_api_key,
          },
        })

        if (qrResponse.ok) {
          // WAHA returns PNG image binary data, not JSON
          const imageBuffer = await qrResponse.arrayBuffer()
          const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
          qrCode = `data:image/png;base64,${base64Image}`

          console.log('✅ [EDGE FUNCTION] QR Code obtained successfully (PNG converted to base64)')
          break
        } else {
          console.log(`⏳ [EDGE FUNCTION] QR Code not ready yet (attempt ${qrAttempts + 1})`)
        }
      } catch (error) {
        console.log('⚠️ [EDGE FUNCTION] Error getting QR code:', error)
      }

      qrAttempts++
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between attempts
    }

    if (!qrCode) {
      throw new Error('Failed to obtain QR Code within timeout period')
    }

    console.log('🎯 [EDGE FUNCTION] QR Code ready for authentication')

    // Update database status to connecting
    await supabaseClient
      .from('whatsapp_connections')
      .upsert({
        user_id: user.id,
        waha_session_name: sessionName,
        waha_status: 'connecting',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    // Save session info
    await supabaseClient
      .from('whatsapp_sessions')
      .upsert({
        user_id: user.id,
        session_name: sessionName,
        status: session.status,
        waha_session_id: session.name
      }, {
        onConflict: 'user_id,session_name'
      })

    const finalResponse = {
      success: true,
      qrCode: qrCode,
      phoneNumber: phoneNumber,
      session: {
        name: session.name,
        status: session.status
      }
    }

    console.log('📤 [EDGE FUNCTION] Final response:', JSON.stringify(finalResponse, null, 2))

    return new Response(
      JSON.stringify(finalResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [EDGE FUNCTION] Fatal error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to create WAHA session'

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