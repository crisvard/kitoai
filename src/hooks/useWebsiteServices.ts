import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface WebsiteService {
  id: string;
  user_id: string;
  site_name: string;
  segment?: string;
  site_link?: string;
  activated_at?: string | null;
  payment_method?: string | null;
  payment_id?: string | null;
  domain_login?: string;
  domain_password?: string;
  domain_registrar?: string; // Empresa/registrador do domínio
  github_link?: string;
  hosting_data?: {
    provider?: string;
    host?: string;
    plan?: string;
    account?: string;
    notes?: string;
  };
  social_links?: Array<{
    platform: string;
    url: string;
  }>;
  site_photos?: Array<{
    url: string;
    name?: string;
  }>;
  notes?: string;
  status: 'published' | 'paused' | 'cancelled' | 'deleted';
  created_at: string;
  updated_at: string;
}

export function useWebsiteServices() {
  const [websites, setWebsites] = useState<WebsiteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapDbRowToWebsiteService = (row: any): WebsiteService => {
    const rawStatus = (row.status as string | undefined) ?? undefined;
    const normalizedStatus = rawStatus === 'inactive' ? 'paused' : rawStatus;

    return {
      id: row.id,
      user_id: row.user_id,
      site_name: row.site_name ?? row.website_name ?? '',
      segment: row.segment ?? row.site_segment ?? undefined,
      site_link: row.site_link ?? row.website_url ?? row.website_link ?? undefined,
      activated_at: row.activated_at ?? null,
      payment_method: row.payment_method ?? null,
      payment_id: row.payment_id ?? null,
      domain_login: row.domain_login ?? undefined,
      domain_password: row.domain_password ?? undefined,
      domain_registrar: row.domain_registrar ?? undefined,
      github_link: row.github_link ?? undefined,
      hosting_data: row.hosting_data ?? undefined,
      social_links: row.social_links ?? undefined,
      site_photos: row.site_photos ?? undefined,
      notes: row.notes ?? undefined,
      status: (normalizedStatus as WebsiteService['status']) ?? 'paused',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  };

  const mapWebsiteServiceToDbInsert = (websiteData: Omit<WebsiteService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const payload: Record<string, unknown> = {
      website_name: websiteData.site_name,
      website_url: websiteData.site_link || null,
      segment: websiteData.segment || null,
      status: websiteData.status || 'paused',
      notes: websiteData.notes || null,
    };

    // Avoid forcing null into NOT NULL columns; only set when applicable.
    if (websiteData.status === 'published') {
      payload.activated_at = new Date().toISOString();
    }

    return {
      ...payload,
    };
  };

  const mapWebsiteServiceToDbUpdate = (updates: Partial<WebsiteService>) => {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof updates.site_name === 'string') dbUpdates.website_name = updates.site_name;
    if (typeof updates.site_link === 'string') dbUpdates.website_url = updates.site_link;
    if (typeof updates.segment === 'string') dbUpdates.segment = updates.segment;
    if (typeof updates.status === 'string') dbUpdates.status = updates.status;

    return dbUpdates;
  };

  // Verificar pagamentos PIX pendentes e ativar sites automaticamente
  const checkPendingPixPayments = async () => {
    try {
      console.log('🔍 [PENDING_CHECK] Verificando pagamentos PIX pendentes...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar websites com status 'paused' que podem ter pagamentos pendentes
      const { data: pendingWebsites, error: websitesError } = await supabase
        .from('user_websites')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'paused')
        .not('payment_id', 'is', null);

      if (websitesError) {
        console.error('❌ [PENDING_CHECK] Erro ao buscar websites pendentes:', websitesError);
        return;
      }

      if (!pendingWebsites || pendingWebsites.length === 0) {
        console.log('✅ [PENDING_CHECK] Nenhum website pendente encontrado');
        return;
      }

      console.log('📋 [PENDING_CHECK] Websites pendentes encontrados:', pendingWebsites.length);

      // Para cada website pendente, verificar o status do pagamento
      for (const website of pendingWebsites) {
        if (!website.payment_id) continue;

        try {
          console.log('🔍 [PENDING_CHECK] Verificando pagamento:', website.payment_id);

          const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-payment-status', {
            body: { paymentId: website.payment_id }
          });

          if (statusError) {
            console.error('❌ [PENDING_CHECK] Erro ao verificar status:', statusError);
            continue;
          }

          if (statusData.status === 'RECEIVED') {
            console.log('✅ [PENDING_CHECK] Pagamento confirmado! Ativando website:', website.id);

            // Atualizar status na tabela payments se existir
            const { error: paymentUpdateError } = await supabase
              .from('payments')
              .update({
                status: 'paid',
                updated_at: new Date().toISOString(),
              })
              .eq('external_payment_id', website.payment_id);

            if (paymentUpdateError) {
              console.warn('⚠️ [PENDING_CHECK] Erro ao atualizar tabela payments:', paymentUpdateError);
              // Não falhar por causa disso
            } else {
              console.log('✅ [PENDING_CHECK] Status do pagamento atualizado na tabela payments');
            }

            // Ativar o website
            const { error: updateError } = await supabase
              .from('user_websites')
              .update({
                status: 'published',
                activated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', website.id);

            if (updateError) {
              console.error('❌ [PENDING_CHECK] Erro ao ativar website:', updateError);
            } else {
              console.log('✅ [PENDING_CHECK] Website ativado com sucesso:', website.id);

              // Atualizar o estado local
              setWebsites(prevWebsites =>
                prevWebsites.map(w =>
                  w.id === website.id
                    ? { ...w, status: 'published', activated_at: new Date().toISOString() }
                    : w
                )
              );
            }
          } else {
            console.log('⏳ [PENDING_CHECK] Pagamento ainda pendente:', website.payment_id, statusData.status);
          }
        } catch (err) {
          console.error('❌ [PENDING_CHECK] Erro ao verificar pagamento:', err);
        }
      }
    } catch (err) {
      console.error('❌ [PENDING_CHECK] Erro geral na verificação:', err);
    }
  };

  // Fetch all websites for current user
  const fetchWebsites = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error: fetchError } = await supabase
        .from('user_websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setWebsites((data || []).map(mapDbRowToWebsiteService));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar websites';
      setError(errorMessage);
      console.error('Erro ao buscar websites:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new website
  const createWebsite = async (websiteData: Omit<WebsiteService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📝 [createWebsite] Criando novo website:', websiteData);

      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
          });

        if (profileError) {
          console.error('❌ [createWebsite] Erro ao criar perfil:', profileError);
          throw profileError;
        }
      }

      const insertPayload = {
        user_id: user.id,
        ...mapWebsiteServiceToDbInsert(websiteData),
      };

      // Inserir na tabela user_websites
      const { data, error: createError } = await supabase
        .from('user_websites')
        .insert(insertPayload)
        .select()
        .single();

      if (createError) {
        console.error('❌ [createWebsite] Erro ao criar:', {
          payload: insertPayload,
          code: (createError as any).code,
          message: (createError as any).message,
          details: (createError as any).details,
          hint: (createError as any).hint,
        });
        throw createError;
      }

      console.log('✅ [createWebsite] Website criado:', data);

      const newWebsite: WebsiteService = mapDbRowToWebsiteService(data);

      setWebsites(prev => [newWebsite, ...prev]);
      return newWebsite;
    } catch (err) {
      const e = err as any;
      const parts = [
        typeof e?.message === 'string' ? e.message : undefined,
        typeof e?.details === 'string' ? e.details : undefined,
        typeof e?.hint === 'string' ? e.hint : undefined,
        typeof e?.code === 'string' ? `code=${e.code}` : undefined,
      ].filter(Boolean);

      const errorMessage = parts.length ? parts.join(' | ') : 'Erro ao criar website';
      console.error('❌ [createWebsite] Erro:', e);
      throw new Error(errorMessage);
    }
  };

  // Update website
  const updateWebsite = async (id: string, updates: Partial<WebsiteService>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('user_websites')
        .update(mapWebsiteServiceToDbUpdate(updates))
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedWebsite = mapDbRowToWebsiteService(data);
      setWebsites(prev => prev.map(w => (w.id === id ? updatedWebsite : w)));

      return updatedWebsite;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar website';
      console.error('Erro ao atualizar website:', err);
      throw new Error(errorMessage);
    }
  };

  // Delete website
  const deleteWebsite = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_websites')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setWebsites(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar website';
      console.error('Erro ao deletar website:', err);
      throw new Error(errorMessage);
    }
  };

  // Get single website
  const getWebsite = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_websites')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return mapDbRowToWebsiteService(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar website';
      console.error('Erro ao buscar website:', err);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchWebsites().then(() => {
      // Após carregar os websites, verificar pagamentos pendentes
      checkPendingPixPayments();
    });
  }, []);

  return {
    websites,
    loading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    getWebsite,
    checkPendingPixPayments,
  };
}
