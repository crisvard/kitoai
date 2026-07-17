import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Senha é obrigatória' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const dialerPassword = Deno.env.get('DIALER_PASSWORD_SECRET')

    if (!dialerPassword) {
      console.error('❌ DIALER_PASSWORD_SECRET não está configurado')
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de senha do agente não encontrada' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (password.trim() !== dialerPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Senha incorreta. Tente novamente.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ [validate-dialer-password] Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao validar senha' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
