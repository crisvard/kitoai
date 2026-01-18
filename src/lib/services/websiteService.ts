import { supabase } from '../supabase';

export interface UserWebsite {
  id: string;
  user_id: string;
  website_name: string;
  website_url?: string;
  status: 'published' | 'paused' | 'cancelled';
  activated_at: string;
  expires_at?: string;
  payment_method?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export const websiteService = {
  // Obter todos os sites do usuário
  async getUserWebsites(userId: string): Promise<UserWebsite[]> {
    console.log('🌐 [WEBSITE_SERVICE] Buscando sites do usuário:', userId);
    
    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao buscar sites:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Sites encontrados:', data?.length || 0);
    return data || [];
  },

  // Ativar novo site
  async activateWebsite(
    userId: string,
    websiteName: string,
    paymentId: string,
    paymentMethod: string = 'stripe'
  ): Promise<UserWebsite> {
    console.log('🌐 [WEBSITE_SERVICE] Ativando site:', websiteName);

    const { data, error } = await supabase
      .from('user_websites')
      .insert({
        user_id: userId,
        website_name: websiteName,
        status: 'published',
        payment_id: paymentId,
        payment_method: paymentMethod,
        activated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao ativar site:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Site ativado:', data);
    return data;
  },

  // Ativar um site existente (pagamento individual)
  async activateExistingWebsite(
    websiteId: string,
    paymentId: string,
    paymentMethod: string = 'stripe'
  ): Promise<UserWebsite> {
    console.log('🌐 [WEBSITE_SERVICE] Ativando site existente:', websiteId);

    const { data, error } = await supabase
      .from('user_websites')
      .update({
        status: 'published',
        payment_id: paymentId,
        payment_method: paymentMethod,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId)
      .select()
      .single();

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao ativar site existente:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Site existente ativado:', data);
    return data;
  },

  // Atualizar site
  async updateWebsite(
    websiteId: string,
    updates: Partial<UserWebsite>
  ): Promise<UserWebsite> {
    console.log('🌐 [WEBSITE_SERVICE] Atualizando site:', websiteId);

    const { data, error } = await supabase
      .from('user_websites')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)
      .select()
      .single();

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao atualizar site:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Site atualizado:', data);
    return data;
  },

  // Deletar site
  async deleteWebsite(websiteId: string): Promise<void> {
    console.log('🌐 [WEBSITE_SERVICE] Deletando site:', websiteId);

    const { error } = await supabase
      .from('user_websites')
      .delete()
      .eq('id', websiteId);

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao deletar site:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Site deletado');
  },

  // Obter site por ID
  async getWebsite(websiteId: string): Promise<UserWebsite> {
    console.log('🌐 [WEBSITE_SERVICE] Buscando site:', websiteId);

    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('id', websiteId)
      .single();

    if (error) {
      console.error('❌ [WEBSITE_SERVICE] Erro ao buscar site:', error);
      throw error;
    }

    console.log('✅ [WEBSITE_SERVICE] Site encontrado:', data);
    return data;
  }
};
