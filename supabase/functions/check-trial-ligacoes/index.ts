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

  console.log('🔔 [CHECK TRIAL LIGACOES] Verificando trials expirados...')

  try {
    // Usar service role para poder atualizar qualquer usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString()

    // Buscar todos os usuários com trial de ligações ativo e expirado
    const { data: expiredTrials, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, trial_ligacoes_end_date')
      .eq('trial_ligacoes_active', true)
      .lt('trial_ligacoes_end_date', now)

    if (fetchError) {
      console.error('❌ [CHECK TRIAL LIGACOES] Erro ao buscar trials expirados:', fetchError)
      throw fetchError
    }

    console.log(`📊 [CHECK TRIAL LIGACOES] Encontrados ${expiredTrials?.length || 0} trials expirados`)

    if (!expiredTrials || expiredTrials.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum trial de ligações expirado encontrado',
          processed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar cada trial expirado
    let processedCount = 0
    const errors: any[] = []

    for (const profile of expiredTrials) {
      console.log(`🔄 [CHECK TRIAL LIGACOES] Expirando trial do usuário: ${profile.id}`)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          // Desativar trial
          trial_ligacoes_active: false,
          ligacoes_trial_completed: true,
          
          // Bloquear acesso (trial acabou, não pagou)
          ligacoes_active: false,
          ligacoes_access_blocked: true,
          ligacoes_block_reason: 'trial_expired'
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error(`❌ [CHECK TRIAL LIGACOES] Erro ao expirar trial do usuário ${profile.id}:`, updateError)
        errors.push({ userId: profile.id, error: updateError.message })
      } else {
        console.log(`✅ [CHECK TRIAL LIGACOES] Trial expirado para usuário: ${profile.id}`)
        processedCount++
      }
    }

    console.log(`🎉 [CHECK TRIAL LIGACOES] Processamento concluído: ${processedCount}/${expiredTrials.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${processedCount} trials de ligações expirados`,
        processed: processedCount,
        total: expiredTrials.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [CHECK TRIAL LIGACOES] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
