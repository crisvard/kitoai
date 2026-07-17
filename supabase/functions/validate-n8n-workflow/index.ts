import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 [VALIDATE WORKFLOW] Starting workflow validation...')

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

    console.log('👤 [VALIDATE WORKFLOW] User:', user.id)

    // Get user credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('n8n_url, n8n_api_key')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      throw new Error('N8N credentials not found. Please configure them first.')
    }

    // Find the most recent workflow for this user (created or validated status)
    const { data: workflowData, error: workflowError } = await supabaseClient
      .from('n8n_workflows')
      .select('workflow_id, webhook_url, status')
      .eq('user_id', user.id)
      .in('status', ['created', 'validated'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (workflowError || !workflowData) {
      console.error('❌ [VALIDATE WORKFLOW] No workflow found:', workflowError)
      console.error('❌ [VALIDATE WORKFLOW] Available workflows for user:', user.id)

      // Debug: List all workflows for this user
      const { data: allWorkflows, error: listError } = await supabaseClient
        .from('n8n_workflows')
        .select('workflow_id, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (!listError && allWorkflows) {
        console.error('❌ [VALIDATE WORKFLOW] All user workflows:', allWorkflows)
      }

      throw new Error('No workflow found to validate. Please create a workflow first.')
    }

    console.log('📋 [VALIDATE WORKFLOW] Found workflow:', {
      id: workflowData.workflow_id,
      status: workflowData.status,
      webhook_url: workflowData.webhook_url
    })

    // Get the webhook path from the workflow data that was saved during creation
    // This ensures we use the same path that was set in create-n8n-workflow
    const existingWebhookUrl = workflowData.webhook_url
    let uniqueWebhookPath = `whatsapp-${user.id}-${workflowData.workflow_id}` // fallback

    if (existingWebhookUrl) {
      // Extract the path from the existing webhook URL
      const urlParts = existingWebhookUrl.split('/webhook/')
      if (urlParts.length > 1) {
        uniqueWebhookPath = urlParts[1]
        console.log('🔗 [VALIDATE WORKFLOW] Using existing webhook path:', uniqueWebhookPath)
      }
    }

    console.log('🔗 [VALIDATE WORKFLOW] Unique webhook path:', uniqueWebhookPath)

    // Get current workflow from N8N
    const getWorkflowResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowData.workflow_id}`, {
      headers: {
        'X-N8N-API-KEY': credentials.n8n_api_key,
      }
    })

    if (!getWorkflowResponse.ok) {
      throw new Error(`Failed to get workflow from N8N: ${getWorkflowResponse.status}`)
    }

    const currentWorkflow = await getWorkflowResponse.json()
    console.log('✅ [VALIDATE WORKFLOW] Retrieved workflow from N8N')

    // Update webhook path in the workflow - clean the object for N8N API
    const updatedWorkflow = {
      name: currentWorkflow.name,
      nodes: currentWorkflow.nodes.map((node: any) => {
        if (node.type === 'n8n-nodes-base.webhook') {
          return {
            ...node,
            parameters: {
              ...node.parameters,
              path: uniqueWebhookPath
            }
          }
        }
        return node
      }),
      connections: currentWorkflow.connections,
      settings: currentWorkflow.settings || {},
      staticData: currentWorkflow.staticData || null
    }

    // Update workflow in N8N
    const updateResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowData.workflow_id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': credentials.n8n_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedWorkflow)
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Failed to update workflow in N8N: ${updateResponse.status} ${errorText}`)
    }

    console.log('✅ [VALIDATE WORKFLOW] Workflow updated with unique webhook path')

    // Activate the workflow
    const activateResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowData.workflow_id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': credentials.n8n_api_key,
      }
    })

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text()
      console.warn(`⚠️ [VALIDATE WORKFLOW] Failed to activate workflow: ${activateResponse.status} ${errorText}`)
    } else {
      console.log('✅ [VALIDATE WORKFLOW] Workflow activated successfully')
    }

    // Generate the clean webhook URL (N8N webhooks don't use query parameters)
    const fullWebhookUrl = `${credentials.n8n_url}/webhook/${uniqueWebhookPath}`

    // Update workflow status in database BEFORE calling validate-webhook
    const { error: updateError } = await supabaseClient
      .from('n8n_workflows')
      .update({
        webhook_url: fullWebhookUrl,
        status: 'validated',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('workflow_id', workflowData.workflow_id)

    if (updateError) {
      console.error('❌ [VALIDATE WORKFLOW] Error updating workflow status:', updateError)
      throw new Error(`Failed to update workflow status: ${updateError.message}`)
    }

    console.log('✅ [VALIDATE WORKFLOW] Workflow status updated to validated')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Workflow validated successfully',
        workflow: {
          id: workflowData.workflow_id,
          status: 'validated'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [VALIDATE WORKFLOW] Fatal error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to validate workflow'

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