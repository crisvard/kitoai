// Delete VAPI Agent Edge Function
// Deletes a VAPI assistant and cleans up database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface DeleteAgentRequest {
  agentId: string;
  vapiAssistantId: string;
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
    const body: DeleteAgentRequest = await req.json();
    const { agentId, vapiAssistantId } = body;

    // Validate required fields
    if (!agentId || !vapiAssistantId) {
      throw new Error('Missing agentId or vapiAssistantId');
    }

    // Delete VAPI assistant
    const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!vapiResponse.ok && vapiResponse.status !== 404) {
      const errorData = await vapiResponse.json();
      throw new Error(`VAPI API error: ${JSON.stringify(errorData)}`);
    }

    // Delete agent from database
    const { error: deleteError } = await supabase
      .from('user_agents')
      .delete()
      .eq('id', agentId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw new Error(`Database deletion failed: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agent deleted successfully',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error deleting VAPI agent:', error);
    
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
