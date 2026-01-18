  import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  serve(async (req) => {
    console.log('🚀 [CREATE WORKFLOW] Starting workflow creation...')
    console.log('📨 [CREATE WORKFLOW] Request method:', req.method)

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      console.log('🔐 [CREATE WORKFLOW] Checking authorization...')

      // Get user from JWT
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('❌ [CREATE WORKFLOW] No authorization header')
        throw new Error('No authorization header')
      }

      console.log('✅ [CREATE WORKFLOW] Authorization header present')

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      // Get user
      console.log('👤 [CREATE WORKFLOW] Getting user from JWT...')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        console.error('❌ [CREATE WORKFLOW] Invalid user:', userError)
        throw new Error('Invalid user')
      }
      console.log('✅ [CREATE WORKFLOW] User authenticated:', user.id)
      console.log('📧 User email:', user.email)
      console.log('🔍 User metadata:', user.user_metadata)

      // Get request body to check for workflow template ID
      console.log('📦 [CREATE WORKFLOW] Parsing request body...')
      const requestBody = await req.json().catch(() => ({}))
      console.log('📦 [CREATE WORKFLOW] Request body:', requestBody)

      // Use workflow template from request body, with fallback
      const workflowTemplateId = requestBody.workflowTemplateId || 'AMalw1a0H2Cv0EGj'
      const isSchedulerMode = requestBody.isSchedulerMode || false
      console.log('🔄 [CREATE WORKFLOW] Using workflow template:', workflowTemplateId, 'for mode:', isSchedulerMode ? 'scheduler' : 'dashboard')

      // Get user credentials from database - SHARED by all administrators
      console.log('🔑 [CREATE WORKFLOW] Getting SHARED user credentials...')

      const { data: credentials, error: credError } = await supabaseClient
        .from('user_credentials')
        .select('n8n_url, n8n_api_key, waha_url, waha_api_key, gemini_api_key')
        .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2')  // User with correct credentials
        .single()

      console.log('🔑 [CREATE WORKFLOW] Raw query result:', {
        data: credentials,
        error: credError,
        errorMessage: credError?.message,
        errorCode: credError?.code,
        errorDetails: credError?.details
      })

      if (credError) {
        console.error('❌ [CREATE WORKFLOW] Credentials query failed:', {
          code: credError.code,
          message: credError.message,
          details: credError.details,
          hint: credError.hint
        })

        if (credError.code === 'PGRST116') {
          throw new Error('User credentials not found. Please configure N8N, WAHA and Gemini credentials first.')
        }

        throw new Error(`Database error: ${credError.message}`)
      }

      if (!credentials) {
        console.error('❌ [CREATE WORKFLOW] No credentials returned')
        throw new Error('N8N and WAHA credentials not found. Please configure them first.')
      }

      console.log('✅ [CREATE WORKFLOW] Credentials found:', {
        hasN8N: !!(credentials.n8n_url && credentials.n8n_api_key),
        hasWAHA: !!(credentials.waha_url && credentials.waha_api_key),
        hasGemini: !!credentials.gemini_api_key
      })

      console.log('✅ [CREATE WORKFLOW] Credentials found')

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

      // Download template workflow and create a copy
      console.log('📥 Downloading template workflow...')

      // Try different API endpoints for N8N
      const endpoints = [
        `${credentials.n8n_url}/rest/workflows/${workflowTemplateId}`,
        `${credentials.n8n_url}/api/v1/workflows/${workflowTemplateId}`,
        `${credentials.n8n_url}/api/workflows/${workflowTemplateId}`
      ];

      let templateData = null;
      let templateResponse = null;

      for (const endpoint of endpoints) {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        try {
          templateResponse = await fetch(endpoint, {
            headers: {
              'X-N8N-API-KEY': credentials.n8n_api_key,
            }
          });

          if (templateResponse.ok) {
            templateData = await templateResponse.json();
            console.log(`✅ Template downloaded successfully from: ${endpoint}`);
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} returned: ${templateResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Error with endpoint ${endpoint}:`, error.message);
        }
      }

      if (!templateData) {
        throw new Error(`Failed to download template workflow from any endpoint. Last status: ${templateResponse?.status}`)
      }

      // Create new workflow based on template - SIMPLY CLONE IT
      console.log('🆕 Creating workflow from template')

      // Generate truly unique webhook path for this user
      // Include timestamp to ensure uniqueness even for same user
      const timestamp = Date.now()
      const uniqueWebhookPath = `whatsapp-${user.id}-${timestamp}`

      const newWorkflowData = {
        name: `WhatsApp Agent - ${user.id}`,
        nodes: templateData.nodes.map((node: any) => {
          // Create a clean copy of the node with only essential properties
          const cleanedNode: any = {
            parameters: node.parameters,
            name: node.name,
            type: node.type,
            typeVersion: node.typeVersion,
            position: node.position
          };

          // Update webhook path for this user
          if (node.type === 'n8n-nodes-base.webhook') {
            cleanedNode.parameters = {
              ...node.parameters,
              path: uniqueWebhookPath
            };
          }

          return cleanedNode;
        }),
        connections: templateData.connections,
        settings: {}, // Use empty settings to avoid validation issues
        staticData: null
      }

      const createResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': credentials.n8n_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflowData)
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Failed to create N8N workflow: ${createResponse.status} ${errorText}`)
      }

      const workflowData = await createResponse.json()
      console.log('✅ Workflow created successfully')


      // NOTE: Workflow will be activated later in validate-n8n-workflow function
      // This allows for webhook path customization before activation
      console.log('⏳ Workflow created but not activated yet - will be activated during validation')

      // Get existing webhook_url from whatsapp_connections
      const { data: existingConnection, error: connError } = await supabaseClient
        .from('whatsapp_connections')
        .select('n8n_webhook_url')
        .eq('user_id', user.id)
        .single()

      const webhookUrl = existingConnection?.n8n_webhook_url ||
        `${credentials.n8n_url}/webhook/${uniqueWebhookPath}`

      // Save workflow info to database (upsert to allow updates)
      console.log('💾 Saving workflow to database...')
      const workflowRecord = {
        user_id: user.id,
        workflow_id: workflowData.id,
        webhook_url: webhookUrl,
        status: 'created', // Will be activated later in validate-n8n-workflow
        updated_at: new Date().toISOString()
      }

      console.log('Workflow record to save:', workflowRecord)

      const { data: savedData, error: upsertError } = await supabaseClient
        .from('n8n_workflows')
        .upsert(workflowRecord, {
          onConflict: 'user_id,workflow_id'
        })
        .select()

      if (upsertError) {
        console.error('❌ Error saving/updating workflow to DB:', upsertError)
        throw new Error(`Failed to save workflow to n8n_workflows: ${upsertError.message}`)
      } else {
        console.log('✅ Workflow saved to database:', savedData)
      }

      // Update whatsapp_connections with workflow info
      const { error: updateError } = await supabaseClient
        .from('whatsapp_connections')
        .upsert({
          user_id: user.id,
          n8n_workflow_id: workflowData.id,
          n8n_webhook_url: `${credentials.n8n_url}/webhook/${uniqueWebhookPath}`,
          n8n_status: 'created', // Will be updated to 'validated' later
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (updateError) {
        console.error('Error updating whatsapp_connections:', updateError)
        // Don't throw error here, workflow was created successfully
      }

      return new Response(
        JSON.stringify({
          success: true,
          workflow: {
            id: workflowData.id,
            name: workflowData.name,
            webhookUrl: `${credentials.n8n_url}/webhook/${uniqueWebhookPath}`
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
          message: error instanceof Error ? error.message : 'Failed to create N8N workflow'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }
  })