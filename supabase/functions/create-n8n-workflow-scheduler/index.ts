import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
   console.log('🚀 [CREATE SCHEDULER WORKFLOW] Starting scheduler workflow creation...')
   console.log('📨 [CREATE SCHEDULER WORKFLOW] Request method:', req.method)

   // Handle CORS preflight requests
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }

   try {
     console.log('🔐 [CREATE SCHEDULER WORKFLOW] Checking authorization...')

     // Get user from JWT
     const authHeader = req.headers.get('Authorization')
     if (!authHeader) {
       console.error('❌ [CREATE SCHEDULER WORKFLOW] No authorization header')
       throw new Error('No authorization header')
     }

     console.log('✅ [CREATE SCHEDULER WORKFLOW] Authorization header present')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    console.log('👤 [CREATE SCHEDULER WORKFLOW] Getting user from JWT...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ [CREATE SCHEDULER WORKFLOW] Invalid user:', userError)
      throw new Error('Invalid user')
    }
    console.log('✅ [CREATE SCHEDULER WORKFLOW] User authenticated:', user.id)

    // Always use the scheduler workflow template
    const workflowTemplateId = 'u0CCNjw9JMS1iTav' // Scheduler workflow
    console.log('🔄 [CREATE SCHEDULER WORKFLOW] Using scheduler workflow template:', workflowTemplateId)

    // Get user credentials from database
    console.log('🔑 [CREATE SCHEDULER WORKFLOW] Getting user credentials...')
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('n8n_url, n8n_api_key, waha_url, waha_api_key, gemini_api_key')
      .eq('user_id', user.id)
      .single()

    console.log('🔑 [CREATE SCHEDULER WORKFLOW] Credentials query result:', { error: credError, hasCredentials: !!credentials })

    if (credError || !credentials) {
      console.error('❌ [CREATE SCHEDULER WORKFLOW] Credentials error:', credError)
      throw new Error('N8N and WAHA credentials not found. Please configure them first.')
    }

    console.log('✅ [CREATE SCHEDULER WORKFLOW] Credentials found')

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

    // Skip cleanup to preserve existing workflows
    console.log('ℹ️ Skipping cleanup to preserve existing workflows')

    // Download template workflow and create a copy
    console.log('📥 Downloading scheduler template workflow...')

    const templateResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowTemplateId}`, {
      headers: {
        'X-N8N-API-KEY': credentials.n8n_api_key,
      }
    })

    if (!templateResponse.ok) {
      throw new Error(`Failed to download scheduler template workflow: ${templateResponse.status}`)
    }

    const templateData = await templateResponse.json()
    console.log('✅ Scheduler template downloaded successfully')

    // Create new workflow based on template - SIMPLY CLONE IT
    console.log('🆕 Creating scheduler workflow from template')

    // Generate truly unique webhook path for this user
    // Include timestamp to ensure uniqueness even for same user
    const timestamp = Date.now()
    const uniqueWebhookPath = `whatsapp-scheduler-${user.id}-${timestamp}`

    const newWorkflowData = {
      name: `WhatsApp Scheduler Agent - ${user.id}`,
      nodes: templateData.nodes.map((node: any) => ({
        ...node,
        // Update webhook path for this user (will be made unique during validation)
        ...(node.type === 'n8n-nodes-base.webhook' && {
          parameters: {
            ...node.parameters,
            path: uniqueWebhookPath
          }
        }),
        // Remove webhookId to create new webhook
        ...(node.type === 'n8n-nodes-base.webhook' && { webhookId: undefined }),
        // Keep original credentials - DO NOT remove them
        id: undefined // Let N8N generate new IDs
      })),
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
      throw new Error(`Failed to create N8N scheduler workflow: ${createResponse.status} ${errorText}`)
    }

    const workflowData = await createResponse.json()
    console.log('✅ Scheduler workflow created successfully')


    // NOTE: Workflow will be activated later in validate-n8n-workflow function
    // This allows for webhook path customization before activation
    console.log('⏳ Scheduler workflow created but not activated yet - will be activated during validation')

    // Get existing webhook_url from whatsapp_connections
    const { data: existingConnection, error: connError } = await supabaseClient
      .from('whatsapp_connections')
      .select('n8n_webhook_url')
      .eq('user_id', user.id)
      .single()

    const webhookUrl = existingConnection?.n8n_webhook_url ||
      `${credentials.n8n_url}/webhook/${uniqueWebhookPath}`

    // Save workflow info to database (upsert to allow updates)
    console.log('💾 Saving scheduler workflow to database...')
    const workflowRecord = {
      user_id: user.id,
      workflow_id: workflowData.id,
      webhook_url: webhookUrl,
      status: 'created', // Will be activated later in validate-n8n-workflow
      updated_at: new Date().toISOString()
    }

    console.log('Scheduler workflow record to save:', workflowRecord)

    const { data: savedData, error: upsertError } = await supabaseClient
      .from('n8n_workflows')
      .upsert(workflowRecord, {
        onConflict: 'user_id,workflow_id'
      })
      .select()

    if (upsertError) {
      console.error('❌ Error saving/updating scheduler workflow to DB:', upsertError)
      throw new Error(`Failed to save scheduler workflow to n8n_workflows: ${upsertError.message}`)
    } else {
      console.log('✅ Scheduler workflow saved to database:', savedData)
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
    console.error('Error creating N8N scheduler workflow:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create N8N scheduler workflow'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})