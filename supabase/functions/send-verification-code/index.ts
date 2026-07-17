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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification code in database
    const { error: insertError } = await supabaseClient
      .from('verification_codes')
      .insert({
        email: email,
        code: verificationCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      })

    if (insertError) {
      console.error('Error storing verification code:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao gerar código de verificação' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email with verification code using Resend
    console.log('🚀 [VERIFICATION] Iniciando envio de email...')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    console.log('🔍 [DEBUG] RESEND_API_KEY exists:', !!resendApiKey)
    console.log('🔍 [DEBUG] RESEND_API_KEY length:', resendApiKey?.length)
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço de email não configurado' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📧 [VERIFICATION] Tentando enviar email para:', email)

    console.log('🔄 [VERIFICATION] Fazendo chamada para Resend API...')
    
    // Teste simples primeiro - vamos ver se conseguimos fazer qualquer chamada HTTP
    console.log('🌐 [TEST] Testando conectividade HTTP...')
    try {
      const testResponse = await fetch('https://httpbin.org/get')
      console.log('🌐 [TEST] HTTP test status:', testResponse.status)
    } catch (testError) {
      console.error('🌐 [TEST] HTTP test failed:', testError)
    }
    
    try {
      const emailPayload = {
        from: 'Kito Expert <noreply@kitoexpert.com>',
        to: [email],
        subject: 'Código de Verificação - Kito Expert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Código de Verificação</h2>
            <p>Olá!</p>
            <p>Seu código de verificação para acessar o Kito Expert é:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0;">${verificationCode}</h1>
            </div>
            <p>Este código expira em 10 minutos.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Kito Expert</p>
          </div>
        `,
      }

      console.log('📧 [VERIFICATION] Payload:', JSON.stringify(emailPayload, null, 2))

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      console.log('📧 [VERIFICATION] Response status:', emailResponse.status)
      console.log('📧 [VERIFICATION] Response headers:', Object.fromEntries(emailResponse.headers.entries()))

      const responseText = await emailResponse.text()
      console.log('📧 [VERIFICATION] Response body:', responseText)

      if (!emailResponse.ok) {
        console.error('❌ Error sending email - Status:', emailResponse.status, 'Body:', responseText)
        return new Response(
          JSON.stringify({ success: false, error: `Erro ao enviar email: ${emailResponse.status} - ${responseText}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`✅ [VERIFICATION] Código ${verificationCode} enviado com sucesso para ${email}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Código enviado com sucesso',
          email: email
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } catch (emailError) {
      console.error('❌ Exception sending email:', emailError)
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao enviar email: ${emailError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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