// Stop Agent Calls Edge Function
// Stops all active calls for an agent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StopCallsRequest {
  agentId: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: StopCallsRequest = await req.json();
    const { agentId } = body;

    // Validate required fields
    if (!agentId) {
      throw new Error('Missing agentId');
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('user_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Get all active calls for this agent
    const { data: activeCalls, error: callsError } = await supabase
      .from('agent_call_history')
      .select('vapi_call_id')
      .eq('agent_id', agentId)
      .eq('status', 'in-progress');

    if (callsError) {
      throw new Error(`Error fetching active calls: ${callsError.message}`);
    }

    // End each call via VAPI
    const endCallPromises = (activeCalls || []).map(async (call: { vapi_call_id: string }) => {
      try {
        const vapiResponse = await fetch(`https://api.vapi.ai/call/${call.vapi_call_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
          },
        });

        if (!vapiResponse.ok && vapiResponse.status !== 404) {
          const errorData = await vapiResponse.json();
          console.error(`Failed to end call ${call.vapi_call_id}:`, errorData);
          return { success: false, callId: call.vapi_call_id };
        }

        // Update call status in database
        await supabase
          .from('agent_call_history')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            end_reason: 'stopped_by_user',
          })
          .eq('vapi_call_id', call.vapi_call_id);

        return { success: true, callId: call.vapi_call_id };
      } catch (error) {
        console.error(`Error ending call ${call.vapi_call_id}:`, error);
        return { 
          success: false, 
          callId: call.vapi_call_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(endCallPromises);

    // Update agent status to idle
    const { error: statusError } = await supabase
      .from('user_agents')
      .update({ 
        status: 'idle',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (statusError) {
      console.error('Error updating agent status:', statusError);
    }

    // Reset calling contacts back to pending
    await supabase
      .from('agent_contacts')
      .update({ status: 'pending' })
      .eq('agent_id', agentId)
      .eq('status', 'calling');

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Stopped ${successCount} calls, ${failedCount} failed`,
        results: results,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error stopping agent calls:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
