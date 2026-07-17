import { supabase } from '../supabase';
import { websiteService } from './websiteService';

export const activatePlan = async (
  userId: string,
  planId: string,
  paymentId: string,
  websiteName?: string,
  websiteId?: string,
  paymentMethod: string = 'stripe'
) => {
  console.log('📊 [planService] Ativando plano:', planId);

  try {
    // Website/Desenvolvimento - usa websiteService
    if (planId === 'website' || planId === 'desenvolvimento' || !!websiteId) {
      console.log('🌐 [planService] Ativando website...');

      if (websiteId) {
        await websiteService.activateExistingWebsite(websiteId, paymentId, paymentMethod);
      } else {
        const siteName = websiteName || `site-${Date.now()}`;
        await websiteService.activateWebsite(userId, siteName, paymentId, paymentMethod);

        const { error } = await supabase
          .from('profiles')
          .update({ website_active: true, website_activation_date: new Date().toISOString() })
          .eq('id', userId);

        if (error) throw error;
      }

      console.log('✅ [planService] Website ativado com sucesso');
      return { success: true, type: 'website' };
    }

    // App Developer Plan - ativa landing page existente
    if (planId === 'app-developer-plan' && websiteId) {
      console.log('📱 [planService] Ativando landing page para app development...');

      // Atualizar a landing page com os dados do pagamento
      const { error } = await supabase
        .from('user_landing_pages')
        .update({
          payment_id: paymentId,
          payment_method: paymentMethod,
          is_active: true,
          activation_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId);

      if (error) {
        console.error('❌ [planService] Erro ao ativar landing page:', error);
        throw error;
      }

      console.log('✅ [planService] Landing page ativada com sucesso');
      return { success: true, type: 'landing_page' };
    }

    // Créditos do Agente de Ligações
    if (planId.startsWith('credits_')) {
      console.log('💰 [planService] Ativando pacote de créditos...');

      // Buscar o pacote de créditos na tabela unificada de planos
      const { data: pkg, error: pkgError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (pkgError || !pkg) {
        console.error('❌ [planService] Pacote não encontrado:', pkgError);
        throw new Error('Pacote de créditos não encontrado');
      }

      // Buscar perfil do usuário para somar os créditos
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ [planService] Erro ao buscar perfil:', profileError);
        throw new Error('Perfil não encontrado');
      }

      const creditsAmountToAdd = pkg.features?.credits_amount || 0;
      const newCredits = (profile.credits || 0) + creditsAmountToAdd;

      // Atualizar os créditos do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [planService] Erro ao atualizar créditos:', updateError);
        throw new Error(`Erro ao atualizar créditos: ${updateError.message}`);
      }

      // Registrar a compra
      const { error: insertError } = await supabase
        .from('credit_purchases')
        .insert({
          user_id: userId,
          package_id: planId,
          credits_amount: creditsAmountToAdd,
          amount: pkg.price || pkg.monthly_price,
          status: 'completed',
          payment_method: paymentMethod,
          stripe_payment_intent_id: paymentMethod === 'stripe' ? paymentId : undefined
        });

      if (insertError) {
        // Se a inserção de credit_purchases falhar, o profile.credits já foi atualizado, então
        // não seria justo lançar erro que bloqueie e oculte a mensagem de sucesso da tela, mas logamos
        console.error('❌ [planService] Créditos ativados, porém não foi possível salvar em credit_purchases:', insertError);
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: pkg.price || pkg.monthly_price,
          currency: 'BRL',
          payment_method: paymentMethod,
          status: 'paid',
          stripe_payment_intent_id: paymentMethod === 'stripe' ? paymentId : undefined,
          description: `Compra de Créditos - ${pkg.name}`
        });

      if (paymentError) console.error('Erro em salvar tabela de payments:', paymentError);

      console.log('✅ [planService] Pacote de créditos ativado com sucesso');
      return { success: true, type: 'credits', data: { newCredits } };
    }

    // Todos os outros planos - usar Edge Function apropriada
    console.log('💳 [planService] Ativando plano via Edge Function:', planId);

    // Determinar qual Edge Function usar baseado no planId
    let functionName = 'activate-stripe-plan'; // default para agendamentos/whatsapp

    if (planId === 'plan-ligacoes' || planId === 'ligacoes') {
      functionName = 'activate-stripe-ligacoes';
    }

    console.log('🔧 [planService] Usando função:', functionName);

    const { data, error } = await supabase.functions.invoke(
      functionName,
      {
        body: {
          userId,
          planId,
          paymentIntentId: paymentId  // A Edge Function espera paymentIntentId
        }
      }
    );

    if (error) throw error;

    console.log('✅ [planService] Plano ativado com sucesso');
    return { success: true, type: 'plan', data };

  } catch (error) {
    console.error('❌ [planService] Erro ao ativar plano:', error);
    throw error;
  }
};
