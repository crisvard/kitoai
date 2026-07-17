import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🔔 [START TRIAL LIGACOES] Iniciando trial de ligações...')

  try {
    // Cliente para autenticação do usuário
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Cliente admin para fazer updates (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      console.error('❌ [START TRIAL LIGACOES] Usuário não autenticado')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('👤 [START TRIAL LIGACOES] Usuário:', user.id)

    const { trialDays = 3 } = await req.json()

    // Verificar se usuário já completou trial de ligações
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('ligacoes_trial_completed, trial_ligacoes_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [START TRIAL LIGACOES] Erro ao buscar perfil:', profileError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar perfil' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile?.ligacoes_trial_completed) {
      console.warn('⚠️ [START TRIAL LIGACOES] Usuário já utilizou trial de ligações')
      return new Response(
        JSON.stringify({ error: 'Trial de ligações já foi utilizado', code: 'TRIAL_ALREADY_USED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile?.trial_ligacoes_active) {
      console.warn('⚠️ [START TRIAL LIGACOES] Trial de ligações já está ativo')
      return new Response(
        JSON.stringify({ error: 'Trial de ligações já está ativo', code: 'TRIAL_ALREADY_ACTIVE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular data de fim do trial
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + trialDays)

    console.log('📅 [START TRIAL LIGACOES] Trial configurado:', {
      trialDays,
      trialEndDate: trialEndDate.toISOString()
    })

    // Atualizar perfil com trial de ligações ativo
    const updateData = {
      // Ativar trial de ligações
      trial_ligacoes_active: true,
      trial_ligacoes_end_date: trialEndDate.toISOString(),
      
      // Liberar acesso durante o trial
      ligacoes_active: true,
      ligacoes_activation_date: new Date().toISOString(),
      
      // Garantir que bloqueios estão limpos
      ligacoes_access_blocked: false,
      ligacoes_block_reason: null
    }

    console.log('🔄 [START TRIAL LIGACOES] Atualizando perfil:', updateData)

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ [START TRIAL LIGACOES] Erro ao atualizar perfil:', updateError)
      return new Response(
        JSON.stringify({ error: 'Falha ao iniciar trial de ligações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [START TRIAL LIGACOES] Trial de ligações iniciado com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        trial_end_date: trialEndDate.toISOString(),
        trial_days: trialDays,
        message: 'Trial de ligações iniciado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [START TRIAL LIGACOES] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
