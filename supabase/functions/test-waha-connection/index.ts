import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('🔍 [TEST-WAHA] Starting WAHA connection test...');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('✅ [TEST-WAHA] User authenticated:', user.id);

    // Get WAHA credentials - SHARED by all administrators (from specific user)
    console.log('🔍 [TEST-WAHA] Fetching SHARED WAHA credentials (used by all administrators)');
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('waha_url, waha_api_key')
      .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2')  // User with correct credentials
      .single();

    console.log('📊 [TEST-WAHA] Global credentials query result:', {
      hasData: !!credentials,
      hasError: !!credError,
      errorCode: credError?.code,
      errorMessage: credError?.message
    });

    if (credError || !credentials) {
      console.error('❌ [TEST-WAHA] WAHA credentials not found:', credError);
      throw new Error('WAHA credentials not found. Please configure them first.');
    }

    console.log('✅ [TEST-WAHA] WAHA credentials found');

    console.log('🔑 [TEST-WAHA] Credentials found, testing connection...');
    console.log('🔗 [TEST-WAHA] WAHA URL:', credentials.waha_url);
    console.log('🔑 [TEST-WAHA] API Key present:', !!credentials.waha_api_key);

    // Validate WAHA URL format
    if (!credentials.waha_url || typeof credentials.waha_url !== 'string') {
      throw new Error('WAHA URL is not configured or invalid');
    }

    try {
      new URL(credentials.waha_url);
    } catch (urlError) {
      throw new Error(`WAHA URL is not a valid URL: ${credentials.waha_url}`);
    }

    // Test WAHA connection - try multiple endpoints
    const baseUrl = credentials.waha_url.replace(/\/$/, '');
    const endpoints = [
      `${baseUrl}/api/sessions?all=true`,
      `${baseUrl}/api/sessions`,
      `${baseUrl}/sessions`
    ];

    let response = null;
    let testUrlUsed = '';
    let fetchDuration = 0;

    for (const endpoint of endpoints) {
      try {
        console.log(`🌐 [TEST-WAHA] Trying endpoint: ${endpoint}`);
        const startTime = Date.now();

        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'X-API-Key': credentials.waha_api_key,
            'Content-Type': 'application/json',
          },
        });

        fetchDuration = Date.now() - startTime;
        testUrlUsed = endpoint;

        console.log(`📡 [TEST-WAHA] Response status: ${response.status} - URL: ${endpoint} - Duration: ${fetchDuration}ms`);

        // If we get a successful response (2xx), break out of the loop
        if (response.ok) {
          console.log(`✅ [TEST-WAHA] Successful response from: ${endpoint}`);
          break;
        } else {
          console.log(`⚠️ [TEST-WAHA] Endpoint ${endpoint} returned status ${response.status}, trying next...`);
        }
      } catch (endpointError) {
        console.log(`❌ [TEST-WAHA] Error with endpoint ${endpoint}:`, endpointError instanceof Error ? endpointError.message : String(endpointError));
        continue;
      }
    }

    if (!response) {
      throw new Error('All WAHA endpoints failed. Could not connect to WAHA server.');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`❌ [TEST-WAHA] WAHA server error: ${response.status} - ${errorText}`);
      throw new Error(`WAHA server responded with status ${response.status}: ${errorText}`);
    }

    const statusData = await response.json();
    console.log('📊 [TEST-WAHA] WAHA status response:', JSON.stringify(statusData, null, 2));

    // Validate response structure
    if (!Array.isArray(statusData) && typeof statusData !== 'object') {
      console.warn('⚠️ [TEST-WAHA] Unexpected response format from WAHA');
    }

    // Update connection status in database
    const { error: updateError } = await supabaseClient
      .from('whatsapp_connections')
      .upsert({
        user_id: user.id,
        waha_status: 'connected',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('❌ [TEST-WAHA] Error updating status:', updateError);
    } else {
      console.log('✅ [TEST-WAHA] Status updated to connected');
    }

    // Log detailed diagnostic information
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'waha_connection_test',
        payload: {
          user_id: user.id,
          waha_url: baseUrl,
          test_url: testUrlUsed,
          success: true,
          status: response.status,
          statusText: response.statusText,
          duration_ms: fetchDuration,
          response_size: JSON.stringify(statusData).length,
          timestamp: new Date().toISOString()
        },
        processed: true,
        created_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'WAHA connection test successful',
      data: {
        success: true,
        message: 'WAHA connection test successful',
        status: response.status,
        statusText: response.statusText,
        endpoint: testUrlUsed,
        duration: fetchDuration,
        wahaStatus: statusData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 [TEST-WAHA] Fatal error:', error);
    console.error('💥 [TEST-WAHA] Error type:', typeof error);
    console.error('💥 [TEST-WAHA] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
  