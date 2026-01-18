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
