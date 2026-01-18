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
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      })
    }

    // Get webhook data from WAHA
    const webhookData = await req.json()

    console.log('Received WhatsApp webhook:', webhookData)

    // Create Supabase client with service role key for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different webhook events
    if (webhookData.event === 'message') {
      await handleIncomingMessage(supabaseClient, webhookData.payload)
    } else if (webhookData.event === 'session.status') {
      await handleSessionStatus(supabaseClient, webhookData.payload)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to process webhook'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function handleIncomingMessage(supabaseClient: any, message: any) {
  try {
    // Skip messages from me (outgoing)
    if (message.fromMe) {
      return
    }

    // Extract phone number from chat ID (remove @c.us)
    const clientNumber = message.from.replace('@c.us', '')

    // Find user by session name (this is a simplified approach)
    // In production, you'd need a better way to map sessions to users
    const sessionName = message.session || 'default'

    // For now, we'll assume the session name contains user info or
    // we need to maintain a mapping table
    // This is a placeholder - you'll need to implement proper user identification

    console.log('Processing message from:', clientNumber, 'Message:', message.body)

    // Save message to database (this will be picked up by N8N)
    // Note: This is a simplified version. In production, you'd want to:
    // 1. Identify the user from the session
    // 2. Create/update conversation
    // 3. Save message with proper relationships

    // For now, just log the message
    const { error } = await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'whatsapp_message',
        payload: message,
        processed: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving webhook message:', error)
    }

  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleSessionStatus(supabaseClient: any, status: any) {
  try {
    console.log('Session status update:', status)

    // Update session status in database
    const { error } = await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'session_status',
        payload: status,
        processed: true,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving session status:', error)
    }

  } catch (error) {
    console.error('Error handling session status:', error)
  }
}