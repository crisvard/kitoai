import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LandingService {
  id: string;
  user_id: string;
  site_name: string;
  segment?: string;
  site_link?: string;
  activation_date?: string | null;
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
  is_active: boolean;
  is_trial: boolean;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export function useLandingServices() {
  const [landingPages, setLandingPages] = useState<LandingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapDbRowToLandingService = (row: any): LandingService => {
    return {
      id: row.id,
      user_id: row.user_id,
      site_name: row.site_name ?? '',
      segment: row.segment ?? undefined,
      site_link: row.site_link ?? undefined,
      activation_date: row.activation_date ?? null,
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
      is_active: row.is_active ?? false,
      is_trial: row.is_trial ?? true,
      trial_start: row.trial_start ?? undefined,
      trial_end: row.trial_end ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  };

  const mapLandingServiceToDbInsert = (landingData: Omit<LandingService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const payload: Record<string, unknown> = {
      site_name: landingData.site_name,
      site_link: landingData.site_link || null,
      segment: landingData.segment || null,
      is_active: landingData.is_active || false,
      is_trial: landingData.is_trial ?? true,
      notes: landingData.notes || null,
    };

    // Avoid forcing null into NOT NULL columns; only set when applicable.
    if (landingData.is_active) {
      payload.activation_date = new Date().toISOString();
    }

    return {
      ...payload,
    };
  };

  const mapLandingServiceToDbUpdate = (updates: Partial<LandingService>) => {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof updates.site_name === 'string') dbUpdates.site_name = updates.site_name;
    if (typeof updates.site_link === 'string') dbUpdates.site_link = updates.site_link;
    if (typeof updates.segment === 'string') dbUpdates.segment = updates.segment;
    if (typeof updates.is_active === 'boolean') dbUpdates.is_active = updates.is_active;

    return dbUpdates;
  };

  // Verificar pagamentos PIX pendentes e ativar landing pages automaticamente
  const checkPendingPixPayments = async () => {
    try {
      console.log('🔍 [LANDING_PENDING_CHECK] Verificando pagamentos PIX pendentes...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar landing pages com is_active false que podem ter pagamentos pendentes
      const { data: pendingLandingPages, error: landingPagesError } = await supabase
        .from('user_landing_pages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .not('payment_id', 'is', null);

      if (landingPagesError) {
        console.error('❌ [LANDING_PENDING_CHECK] Erro ao buscar landing pages pendentes:', landingPagesError);
        return;
      }

      if (!pendingLandingPages || pendingLandingPages.length === 0) {
        console.log('✅ [LANDING_PENDING_CHECK] Nenhuma landing page pendente encontrada');
        return;
      }

      console.log('📋 [LANDING_PENDING_CHECK] Landing pages pendentes encontradas:', pendingLandingPages.length);

      // Para cada landing page pendente, verificar o status do pagamento
      for (const landingPage of pendingLandingPages) {
        if (!landingPage.payment_id) continue;

        try {
          console.log('🔍 [LANDING_PENDING_CHECK] Verificando pagamento:', landingPage.payment_id);

          const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-payment-status', {
            body: { paymentId: landingPage.payment_id }
          });

          if (statusError) {
            console.error('❌ [LANDING_PENDING_CHECK] Erro ao verificar status:', statusError);
            continue;
          }

          if (statusData.status === 'RECEIVED') {
            console.log('✅ [LANDING_PENDING_CHECK] Pagamento confirmado! Ativando landing page:', landingPage.id);

            // Atualizar status na tabela payments se existir
            const { error: paymentUpdateError } = await supabase
              .from('payments')
              .update({
                status: 'paid',
                updated_at: new Date().toISOString(),
              })
              .eq('external_payment_id', landingPage.payment_id);

            if (paymentUpdateError) {
              console.warn('⚠️ [LANDING_PENDING_CHECK] Erro ao atualizar tabela payments:', paymentUpdateError);
              // Não falhar por causa disso
            } else {
              console.log('✅ [LANDING_PENDING_CHECK] Status do pagamento atualizado na tabela payments');
            }

            // Ativar a landing page
            const { error: updateError } = await supabase
              .from('user_landing_pages')
              .update({
                is_active: true,
                activation_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', landingPage.id);

            if (updateError) {
              console.error('❌ [LANDING_PENDING_CHECK] Erro ao ativar landing page:', updateError);
            } else {
              console.log('✅ [LANDING_PENDING_CHECK] Landing page ativada com sucesso:', landingPage.id);

              // Atualizar o estado local
              setLandingPages(prevLandingPages =>
                prevLandingPages.map(lp =>
                  lp.id === landingPage.id
                    ? { ...lp, is_active: true, activation_date: new Date().toISOString() }
                    : lp
                )
              );
            }
          } else {
            console.log('⏳ [LANDING_PENDING_CHECK] Pagamento ainda pendente:', landingPage.payment_id, statusData.status);
          }
        } catch (err) {
          console.error('❌ [LANDING_PENDING_CHECK] Erro ao verificar pagamento:', err);
        }
      }
    } catch (err) {
      console.error('❌ [LANDING_PENDING_CHECK] Erro geral na verificação:', err);
    }
  };

  // Fetch all landing pages for current user
  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error: fetchError } = await supabase
        .from('user_landing_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setLandingPages((data || []).map(mapDbRowToLandingService));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar landing pages';
      setError(errorMessage);
      console.error('Erro ao buscar landing pages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new landing page
  const createLandingPage = async (landingData: Omit<LandingService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📝 [createLandingPage] Criando seu app...:', landingData);

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
          console.error('❌ [createLandingPage] Erro ao criar perfil:', profileError);
          throw profileError;
        }
      }

      const insertPayload = {
        user_id: user.id,
        ...mapLandingServiceToDbInsert(landingData),
      };

      // Inserir na tabela user_landing_pages
      const { data, error: createError } = await supabase
        .from('user_landing_pages')
        .insert(insertPayload)
        .select()
        .single();

      if (createError) {
        console.error('❌ [createLandingPage] Erro ao criar:', {
          payload: insertPayload,
          code: (createError as any).code,
          message: (createError as any).message,
          details: (createError as any).details,
          hint: (createError as any).hint,
        });
        throw createError;
      }

      console.log('✅ [createLandingPage] Landing page criada:', data);

      const newLandingPage: LandingService = mapDbRowToLandingService(data);

      setLandingPages(prev => [newLandingPage, ...prev]);
      return newLandingPage;
    } catch (err) {
      const e = err as any;
      const parts = [
        typeof e?.message === 'string' ? e.message : undefined,
        typeof e?.details === 'string' ? e.details : undefined,
        typeof e?.hint === 'string' ? e.hint : undefined,
        typeof e?.code === 'string' ? `code=${e.code}` : undefined,
      ].filter(Boolean);

      const errorMessage = parts.length ? parts.join(' | ') : 'Erro ao criar landing page';
      console.error('❌ [createLandingPage] Erro:', e);
      throw new Error(errorMessage);
    }
  };

  // Update landing page
  const updateLandingPage = async (id: string, updates: Partial<LandingService>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('user_landing_pages')
        .update(mapLandingServiceToDbUpdate(updates))
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedLandingPage = mapDbRowToLandingService(data);
      setLandingPages(prev => prev.map(lp => (lp.id === id ? updatedLandingPage : lp)));

      return updatedLandingPage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar landing page';
      console.error('Erro ao atualizar landing page:', err);
      throw new Error(errorMessage);
    }
  };

  // Delete landing page
  const deleteLandingPage = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_landing_pages')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setLandingPages(prev => prev.filter(lp => lp.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar landing page';
      console.error('Erro ao deletar landing page:', err);
      throw new Error(errorMessage);
    }
  };

  // Get single landing page
  const getLandingPage = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_landing_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return mapDbRowToLandingService(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar landing page';
      console.error('Erro ao buscar landing page:', err);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchLandingPages().then(() => {
      // Após carregar as landing pages, verificar pagamentos pendentes
      checkPendingPixPayments();
    });
  }, []);

  return {
    landingPages,
    loading,
    error,
    fetchLandingPages,
    createLandingPage,
    updateLandingPage,
    deleteLandingPage,
    getLandingPage,
    checkPendingPixPayments,
  };
}