// Edge Function: sportmonks-proxy
// Proxy server-side para a API Sportmonks (contorna CORS)
// Secret necessária no Supabase: SPORTMONKS_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE = 'https://api.sportmonks.com/v3/football';

serve(async (req) => {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const token = Deno.env.get('SPORTMONKS_API_KEY');
        if (!token) {
            return new Response(
                JSON.stringify({ error: 'SPORTMONKS_API_KEY não configurada no Supabase.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parâmetros do body enviado pelo frontend
        const { endpoint, params = {} } = await req.json();

        // Monta a URL com api_token e parâmetros extras
        const searchParams = new URLSearchParams({ api_token: token, ...params });
        const url = `${BASE}/${endpoint}?${searchParams.toString()}`;

        console.log(`[sportmonks-proxy] → ${url.replace(token, '***')}`);

        const smRes = await fetch(url, {
            headers: { 'Accept': 'application/json' },
        });

        const body = await smRes.text();

        if (!smRes.ok) {
            console.error(`[sportmonks-proxy] Sportmonks erro ${smRes.status}: ${body}`);
            return new Response(
                JSON.stringify({ error: `Sportmonks HTTP ${smRes.status}`, details: body }),
                { status: smRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(body, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('[sportmonks-proxy] Erro inesperado:', err);
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
