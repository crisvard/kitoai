      import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
      import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      }
      
      // Helper function to extract text from JSONB fields
      function extractText(field: any): string {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field.text || '';
      }
      
      // Generate personalized system message for Gemini
      function generateSystemMessage(agentConfig: any): string {
        let systemMessage = `Você é um assistente de IA especializado em atendimento ao cliente para uma empresa.\n\n`;
      
        // Adicionar personalidade
        const personality = extractText(agentConfig.personality);
        if (personality) {
          systemMessage += `## SUA PERSONALIDADE\n${personality}\n\n`;
        }
      
        // Adicionar empresa
        const company = extractText(agentConfig.company_knowledge);
        if (company) {
          systemMessage += `## SOBRE A EMPRESA\n${company}\n\n`;
        }
      
        // Adicionar serviços
        const services = extractText(agentConfig.product_knowledge);
        if (services) {
          systemMessage += `## SERVIÇOS OFERECIDOS\n${services}\n\n`;
        }
      
        // Instruções para ferramenta
        systemMessage += `## FERRAMENTA DISPONÍVEL
      Você tem acesso à ferramenta "query_supabase" que permite consultar dados da empresa armazenados no Supabase.
      
      Use esta ferramenta quando precisar de:
      - Informações sobre agendamentos e horários disponíveis
      - Preços e detalhes de serviços
      - Dados de clientes
      - Qualquer informação específica armazenada no sistema
      
      Para usar a ferramenta, chame a função query_supabase com uma consulta em linguagem natural.
      
      Exemplos de uso:
      - "Quais agendamentos tenho para hoje?"
      - "Qual é o preço do corte de cabelo?"
      - "O cliente João Silva tem algum agendamento?"
      - "Quais serviços estão disponíveis?"
      
      ## INSTRUÇÕES IMPORTANTES
      - Sempre use a ferramenta quando precisar de dados específicos ou atualizados
      - Seja educado e profissional em suas respostas
      - Use as informações da empresa para contextualizar suas respostas
      - Mantenha respostas concisas mas completas
      - Se não encontrar informações específicas, sugira consultar diretamente no sistema`;
      
        return systemMessage;
      }

      serve(async (req) => {
        console.log('🚀 [EDGE FUNCTION] load-n8n-workflow-data started')

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

          console.log('👤 [EDGE FUNCTION] User authenticated:', user.id)

          // Get user's N8N workflow
          let { data: workflowData, error: workflowError } = await supabaseClient
            .from('n8n_workflows')
            .select('workflow_id, webhook_url')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          // If no workflow found in n8n_workflows, copy from whatsapp_connections
          if (workflowError || !workflowData) {
            console.log('🔍 [EDGE FUNCTION] No workflow in n8n_workflows, copying from whatsapp_connections...')

            const { data: connData, error: connError } = await supabaseClient
              .from('whatsapp_connections')
              .select('n8n_workflow_id, n8n_webhook_url, n8n_status')
              .eq('user_id', user.id)
              .single()

            if (connError || !connData?.n8n_workflow_id) {
              throw new Error('No workflow found in whatsapp_connections. Please create a workflow first.')
            }

            console.log('📋 [EDGE FUNCTION] Found workflow data in connections:', {
              workflow_id: connData.n8n_workflow_id,
              webhook_url: connData.n8n_webhook_url?.substring(0, 50) + '...',
              status: connData.n8n_status
            })

            // Use service role to copy the data
            const serviceClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            )

            const { data: copiedData, error: copyError } = await serviceClient
              .from('n8n_workflows')
              .upsert({
                user_id: user.id,
                workflow_id: connData.n8n_workflow_id,
                webhook_url: connData.n8n_webhook_url,
                status: 'active',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,workflow_id'
              })
              .select('workflow_id, webhook_url')
              .single()

            if (copyError || !copiedData) {
              console.error('❌ [EDGE FUNCTION] Failed to copy workflow data:', copyError)
              throw new Error(`Failed to copy workflow data: ${copyError?.message}`)
            }

            workflowData = copiedData
            console.log('✅ [EDGE FUNCTION] Workflow data copied successfully')
          }

          console.log('📋 [EDGE FUNCTION] Using workflow:', workflowData.workflow_id)

          // Get user credentials
          const { data: credentials, error: credError } = await supabaseClient
            .from('user_credentials')
            .select('waha_url, waha_api_key, gemini_api_key, n8n_url, n8n_api_key')
            .eq('user_id', user.id)
            .single()

          if (credError || !credentials) {
            throw new Error('Credentials not found. Please configure them first.')
          }

          console.log('🔑 [EDGE FUNCTION] Credentials loaded')

          // Get agent configuration
          const { data: agentConfig, error: agentError } = await supabaseClient
            .from('agent_configs')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (agentError || !agentConfig) {
            throw new Error('Agent configuration not found. Please configure the agent first.')
          }

          console.log('🤖 [EDGE FUNCTION] Agent config loaded')

          // Get current workflow from N8N
          console.log('📥 [EDGE FUNCTION] Fetching current workflow from N8N...')
          const workflowResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowData.workflow_id}`, {
            headers: {
              'X-N8N-API-KEY': credentials.n8n_api_key,
            }
          })

          if (!workflowResponse.ok) {
            const errorText = await workflowResponse.text()
            throw new Error(`Failed to fetch workflow: ${workflowResponse.status} ${errorText}`)
          }

          const currentWorkflow = await workflowResponse.json()
          console.log('✅ [EDGE FUNCTION] Current workflow fetched')

          // Generate personalized system message for Gemini
          const systemMessage = generateSystemMessage(agentConfig);

          // Update workflow nodes with user-specific data
          const updatedNodes = currentWorkflow.nodes.map((node: any) => {
            // Update Supabase URLs and keys
            if (node.type === 'n8n-nodes-base.httpRequest' &&
                (node.name === 'Get Agent Config' || node.name === 'Get Chat History' ||
                node.name === 'Get Templates' || node.name === 'Save Incoming Message' ||
                node.name === 'Save Response')) {

              // Replace hardcoded Supabase URL
              if (node.parameters.url) {
                node.parameters.url = node.parameters.url.replace(
                  'https://hedxxbsieoazrmbayzab.supabase.co',
                  Deno.env.get('SUPABASE_URL') ?? ''
                )
              }

              // Update API keys in headers
              if (node.parameters.headerParameters?.parameters) {
                node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.map((param: any) => {
                  if (param.name === 'apikey' || param.name === 'Authorization') {
                    return {
                      ...param,
                      value: param.name === 'apikey'
                        ? (Deno.env.get('SUPABASE_ANON_KEY') ?? '')
                        : `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') ?? ''}`
                    }
                  }
                  return param
                })
              }
            }

            // Update WAHA URL and API key
            if (node.type === 'n8n-nodes-base.httpRequest' && node.name === 'Send Response') {
              if (node.parameters.url) {
                // Replace WAHA URL
                node.parameters.url = node.parameters.url.replace(
                  "'http://whats.kitoai.online:3001'",
                  `'${credentials.waha_url}'`
                )
              }

              // Update WAHA API key in headers
              if (node.parameters.headerParameters?.parameters) {
                node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.map((param: any) => {
                  if (param.name === 'X-API-Key') {
                    return {
                      ...param,
                      value: credentials.waha_api_key
                    }
                  }
                  return param
                })
              }
            }

            // Update Gemini node with system message and function calling
            if (node.type === 'n8n-nodes-base.googleGemini' && node.name === 'Call Gemini') {
              console.log('🤖 [EDGE FUNCTION] Updating Gemini node with system message and tools');

              return {
                ...node,
                parameters: {
                  ...node.parameters,
                  systemMessage: systemMessage,
                  options: {
                    ...node.parameters.options,
                    functionCalling: true
                  },
                  tools: [
                    {
                      functionDeclaration: {
                        name: "query_supabase",
                        description: "Consulta dados armazenados no Supabase para obter informações contextuais sobre a empresa, serviços, agendamentos, clientes, etc.",
                        parameters: {
                          type: "object",
                          properties: {
                            query: {
                              type: "string",
                              description: "Consulta em linguagem natural sobre dados da empresa (ex: preços de serviços, agendamentos disponíveis, informações de clientes)"
                            },
                            table: {
                              type: "string",
                              description: "Nome da tabela para consultar (opcional)",
                              enum: ["appointments", "services", "customers", "agent_configs"]
                            }
                          },
                          required: ["query"]
                        }
                      }
                    }
                  ]
                }
              };
            }

            return node
          })

          // Update the workflow - send only allowed properties
          const workflowUpdate = {
            name: `WhatsApp Agent - ${user.id} (Loaded)`,
            nodes: updatedNodes,
            connections: currentWorkflow.connections,
            settings: currentWorkflow.settings || {},
            staticData: currentWorkflow.staticData || null
          }
      
          console.log('📤 [EDGE FUNCTION] Updating workflow in N8N...')
      
          // Update workflow in N8N
          const updateResponse = await fetch(`${credentials.n8n_url}/api/v1/workflows/${workflowData.workflow_id}`, {
            method: 'PUT',
            headers: {
              'X-N8N-API-KEY': credentials.n8n_api_key,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowUpdate)
          })

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            throw new Error(`Failed to update workflow: ${updateResponse.status} ${errorText}`)
          }

          const updatedWorkflowData = await updateResponse.json()
          console.log('✅ [EDGE FUNCTION] Workflow updated successfully')

          // Update database to mark workflow as loaded
          const { error: updateError } = await supabaseClient
            .from('n8n_workflows')
            .update({
              status: 'loaded',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('workflow_id', workflowData.workflow_id)

          if (updateError) {
            console.error('❌ [EDGE FUNCTION] Error updating workflow status:', updateError)
            // Don't throw error here, workflow was updated successfully
          }

          // Update whatsapp_connections to mark as loaded
          const { error: connUpdateError } = await supabaseClient
            .from('whatsapp_connections')
            .update({
              n8n_status: 'loaded',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (connUpdateError) {
            console.error('❌ [EDGE FUNCTION] Error updating connection status:', connUpdateError)
          }

          console.log('🎉 [EDGE FUNCTION] Workflow data loaded successfully!')

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Workflow data loaded successfully',
              workflow: {
                id: updatedWorkflowData.id,
                name: updatedWorkflowData.name,
                status: 'loaded'
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )

        } catch (error) {
          console.error('💥 [EDGE FUNCTION] Fatal error:', error)

          const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow data'

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