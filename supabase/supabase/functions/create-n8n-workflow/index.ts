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
      .select('n8n_url, n8n_api_key, waha_url, waha_api_key, gemini_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('N8N and WAHA credentials not found. Please configure them first.')
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

    // Create N8N workflow template
    const workflowTemplate = {
      name: `WhatsApp Agent - ${user.id}`,
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: 'whatsapp-webhook',
            responseMode: 'responseNode',
            options: {}
          },
          id: 'webhook-id',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [240, 300]
        },
        {
          parameters: {
            operation: 'get',
            table: 'whatsapp_conversations',
            conditions: '={{ "client_number": $json.from }}',
            returnAll: false,
            limit: 1,
            orderBy: 'last_message_at desc'
          },
          id: 'supabase-id',
          name: 'Supabase Query',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [460, 300],
          credentials: {
            supabaseApi: {
              id: 'supabase-credential-id',
              name: 'Supabase API'
            }
          }
        },
        {
          parameters: {
            model: 'gemini-pro',
            prompt: '={{ $json.systemPrompt }}',
            options: {}
          },
          id: 'gemini-id',
          name: 'Gemini AI',
          type: 'n8n-nodes-base.gemini',
          typeVersion: 1,
          position: [680, 300],
          credentials: {
            geminiApi: {
              id: 'gemini-credential-id',
              name: 'Gemini API'
            }
          }
        },
        {
          parameters: {
            url: `{{ $json.wahaUrl }}/api/sendText`,
            method: 'POST',
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'session',
                  value: '{{ $json.sessionName }}'
                },
                {
                  name: 'chatId',
                  value: '{{ $json.from }}'
                },
                {
                  name: 'text',
                  value: '={{ $json.response }}'
                }
              ]
            },
            options: {}
          },
          id: 'waha-send-id',
          name: 'WAHA Send',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [900, 300]
        },
        {
          parameters: {
            operation: 'insert',
            table: 'whatsapp_messages',
            dataMode: 'defineBelow',
            values: {
              conversation_id: '={{ $json.conversationId }}',
              direction: 'outbound',
              message_type: 'text',
              content: '={{ $json.response }}',
              timestamp: '={{ new Date().toISOString() }}'
            }
          },
          id: 'supabase-save-id',
          name: 'Save Response',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [1120, 300],
          credentials: {
            supabaseApi: {
              id: 'supabase-credential-id',
              name: 'Supabase API'
            }
          }
        }
      ],
      connections: {
        'Webhook': {
          main: [
            [
              {
                node: 'Supabase Query',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Supabase Query': {
          main: [
            [
              {
                node: 'Gemini AI',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Gemini AI': {
          main: [
            [
              {
                node: 'WAHA Send',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'WAHA Send': {
          main: [
            [
              {
                node: 'Save Response',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      },
      settings: {},
      staticData: null
    }

    // Create workflow in N8N
    const n8nResponse = await fetch(`https://n8n.kitoai.online/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjM0N2M2Yy1kYTVjLTRiYmMtOWU1YS04OGM5YTY3ZTMzOGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNjcyNTQ1fQ.GAR0DezECXceB0-3HssXh9_20JQcn64WmxmKxl_UBR4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowTemplate)
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      throw new Error(`Failed to create N8N workflow: ${n8nResponse.status} ${errorText}`)
    }

    const workflowData = await n8nResponse.json()

    // Save workflow info to database
    const { error: insertError } = await supabaseClient
      .from('n8n_workflows')
      .insert({
        user_id: user.id,
        workflow_id: workflowData.id,
        webhook_url: `https://n8n.kitoai.online/webhook/${workflowData.id}`,
        status: 'active'
      })

    if (insertError) {
      console.error('Error saving workflow to DB:', insertError)
      // Don't throw error here, workflow was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow: {
          id: workflowData.id,
          name: workflowData.name,
          webhookUrl: `https://n8n.kitoai.online/webhook/${workflowData.id}`
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating N8N workflow:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to create N8N workflow'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})