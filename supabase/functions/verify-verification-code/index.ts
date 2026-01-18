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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request body
    const { email, code } = await req.json()

    console.log(`🔍 [VERIFY] Verificando código para email: ${email}, código: ${code}`)

    if (!email || !code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email e código são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check verification code
    console.log('🔍 [VERIFY] Consultando tabela verification_codes...')
    const { data: verificationData, error: verificationError } = await supabaseClient
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('🔍 [VERIFY] Resultado da consulta:', { data: verificationData, error: verificationError })

    if (verificationError || !verificationData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Código inválido ou expirado' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark code as used
    const { error: updateError } = await supabaseClient
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id)

    if (updateError) {
      console.error('Error marking code as used:', updateError)
      // Don't fail the request if this update fails
    }

    console.log(`✅ [VERIFICATION] Código verificado com sucesso para ${email}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código verificado com sucesso',
        email: email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ [VERIFICATION] Erro:', error)

    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})