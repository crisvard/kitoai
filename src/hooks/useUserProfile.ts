import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCache } from './useCache';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  cpf: string;
  phone: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  trial_active: boolean;
  trial_end_date: string;
  trial_completed: boolean;
  credits: number;
  text_access_expires_at: string;
  // Campos da tabela profiles existente
  contract_date: string;
  monthly_plan_active: boolean;
  annual_plan_active: boolean;
  next_monthly_payment: string;
  next_annual_payment: string;
  acquired_plans: string[];
  plan_values: number[];
  // Campos adicionais que podem existir
  whatsapp_active?: boolean;
  ligacoes_active?: boolean;
  agendamentos_active?: boolean;
  whatsapp_activation_date?: string;
  ligacoes_activation_date?: string;
  agendamentos_activation_date?: string;
  person_type?: string;
  data_nascimento?: string;
  cnpj?: string;
  razao_social?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  billing_cycle?: string;
  plan_expires_at?: string;
  payment_status?: string;
  next_billing_date?: string;
  last_payment_date?: string;
  asaas_payment_id?: string;
  // Website Service fields
  website_active?: boolean;
  website_activation_date?: string;
  trial_website_active?: boolean;
  trial_website_end_date?: string;
  website_trial_completed?: boolean;
  website_access_blocked?: boolean;
  website_block_reason?: string;

  // Marketing Agent fields (opcionais)
  marketing_active?: boolean;
  marketing_activation_date?: string;
  trial_marketing_active?: boolean;
  trial_marketing_end_date?: string;
  marketing_trial_completed?: boolean;
  marketing_access_blocked?: boolean;
  marketing_block_reason?: string;

  // Negotiations Agent fields (opcionais)
  negociacoes_active?: boolean;
  negociacoes_activation_date?: string;
  trial_negociacoes_active?: boolean;
  trial_negociacoes_end_date?: string;
  negociacoes_trial_completed?: boolean;
  negociacoes_access_blocked?: boolean;
  negociacoes_block_reason?: string;

  // Ligações (Dialer) Agent fields (opcionais)
  trial_ligacoes_active?: boolean;
  trial_ligacoes_end_date?: string;
  ligacoes_trial_completed?: boolean;
  ligacoes_access_blocked?: boolean;
  ligacoes_block_reason?: string;
  // Ligações Payment fields
  ligacoes_monthly_plan_active?: boolean;
  ligacoes_annual_plan_active?: boolean;
  ligacoes_billing_cycle?: string;
  ligacoes_plan_expires_at?: string;
  ligacoes_payment_status?: string;
  ligacoes_next_billing_date?: string;
  ligacoes_last_payment_date?: string;
  ligacoes_stripe_subscription_id?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { getOrSet, clearUserCache } = useCache();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Cache TTL: 30 minutes
  const PROFILE_CACHE_TTL = 30 * 60 * 1000;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async (): Promise<UserProfile> => {
      console.log('🔍 [PROFILE] Fetching profile for user:', user.id);

      let profileData = null;

      // Buscar perfil usando apenas a coluna id (estrutura real da tabela)
      try {
        console.log('📋 [PROFILE] Executing query: select * from profiles where id =', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('📊 [PROFILE] Query result:', {
          hasData: !!data,
          error: error?.message,
          errorCode: error?.code,
          dataKeys: data ? Object.keys(data) : []
        });

        if (!error && data) {
          profileData = data;
          console.log('✅ [PROFILE] Profile found:', data.id);
          console.log('🌐 [PROFILE] Website fields:', {
            website_active: data.website_active,
            website_activation_date: data.website_activation_date,
            trial_website_active: data.trial_website_active,
            trial_website_end_date: data.trial_website_end_date
          });
          console.log('💰 [PROFILE] Billing fields:', {
            payment_status: data.payment_status,
            plan_expires_at: data.plan_expires_at,
            last_payment_date: data.last_payment_date,
            monthly_plan_active: data.monthly_plan_active,
            agendamentos_active: data.agendamentos_active,
            next_billing_date: data.next_billing_date,
            access_blocked: data.access_blocked,
            payment_overdue_days: data.payment_overdue_days
          });
          console.log('� [PROFILE] Ligações Billing fields:', {
            ligacoes_active: data.ligacoes_active,
            ligacoes_activation_date: data.ligacoes_activation_date,
            ligacoes_monthly_plan_active: data.ligacoes_monthly_plan_active,
            ligacoes_annual_plan_active: data.ligacoes_annual_plan_active,
            ligacoes_plan_expires_at: data.ligacoes_plan_expires_at,
            ligacoes_next_billing_date: data.ligacoes_next_billing_date,
            ligacoes_last_payment_date: data.ligacoes_last_payment_date,
            ligacoes_payment_status: data.ligacoes_payment_status,
            trial_ligacoes_active: data.trial_ligacoes_active,
            trial_ligacoes_end_date: data.trial_ligacoes_end_date
          });
          console.log('�📥 [PROFILE] RAW DATA FROM DB:', JSON.stringify(data, null, 2));
        } else if (error?.code === 'PGRST116') {
          // PGRST116 = no rows returned - perfil não existe, criar básico
          console.log('ℹ️ [PROFILE] No profile found, will create basic profile');
          profileData = null;
        } else {
          console.error('❌ [PROFILE] Error fetching profile:', error);
        }
      } catch (fetchError) {
        console.error('💥 [PROFILE] Exception fetching profile:', fetchError);
      }

      let finalProfile: UserProfile;

      if (profileData) {
        // Verificar se trial expirou e desativar automaticamente
        let updatedProfileData = { ...profileData };

        if (profileData.trial_active && profileData.trial_end_date) {
          const trialEndDate = new Date(profileData.trial_end_date);
          const now = new Date();

          if (now >= trialEndDate) {
            console.log('Trial expirado, desativando plano automaticamente...');

            // Desativar plano automaticamente
            try {
              await supabase
                .from('profiles')
                .update({
                  trial_active: false,
                  trial_completed: true, // Marcar que trial foi usado
                  agendamentos_active: false, // Desativar WhatsApp
                  monthly_plan_active: false,
                  annual_plan_active: false,
                  billing_cycle: null,
                  asaas_subscription_id: null,
                  trial_end_date: null,
                })
                .eq('id', profileData.id);

              // Atualizar dados locais
              updatedProfileData.trial_active = false;
              updatedProfileData.trial_completed = true; // Marcar que trial foi usado
              updatedProfileData.agendamentos_active = false;
              updatedProfileData.monthly_plan_active = false;
              updatedProfileData.annual_plan_active = false;
              updatedProfileData.billing_cycle = null;
              updatedProfileData.asaas_subscription_id = null;
              updatedProfileData.trial_end_date = null;

              console.log('Plano desativado automaticamente após expiração do trial');
            } catch (error) {
              console.error('Erro ao desativar trial expirado:', error);
            }
          }
        }

        // Expirar trial do Marketing automaticamente
        if (profileData.trial_marketing_active && profileData.trial_marketing_end_date) {
          const trialEndDate = new Date(profileData.trial_marketing_end_date);
          const now = new Date();

          if (now >= trialEndDate) {
            console.log('Trial do Marketing expirado, desativando automaticamente...');

            try {
              await supabase
                .from('profiles')
                .update({
                  trial_marketing_active: false,
                  marketing_trial_completed: true,
                  marketing_active: false, // Bloqueia acesso após trial
                  trial_marketing_end_date: null
                })
                .eq('id', profileData.id);

              updatedProfileData.trial_marketing_active = false;
              updatedProfileData.marketing_trial_completed = true;
              updatedProfileData.marketing_active = false;
              updatedProfileData.trial_marketing_end_date = null;
            } catch (error) {
              console.error('Erro ao desativar trial do Marketing expirado:', error);
            }
          }
        }

        // Expirar trial de Negociações automaticamente
        if (profileData.trial_negociacoes_active && profileData.trial_negociacoes_end_date) {
          const trialEndDate = new Date(profileData.trial_negociacoes_end_date);
          const now = new Date();

          if (now >= trialEndDate) {
            console.log('Trial de Negociações expirado, desativando automaticamente...');

            try {
              await supabase
                .from('profiles')
                .update({
                  trial_negociacoes_active: false,
                  negociacoes_trial_completed: true,
                  negociacoes_active: false, // Bloqueia acesso após trial
                  trial_negociacoes_end_date: null
                })
                .eq('id', profileData.id);

              updatedProfileData.trial_negociacoes_active = false;
              updatedProfileData.negociacoes_trial_completed = true;
              updatedProfileData.negociacoes_active = false;
              updatedProfileData.trial_negociacoes_end_date = null;
            } catch (error) {
              console.error('Erro ao desativar trial de Negociações expirado:', error);
            }
          }
        }

        // Expirar trial de Ligações automaticamente
        if (profileData.trial_ligacoes_active && profileData.trial_ligacoes_end_date) {
          const trialEndDate = new Date(profileData.trial_ligacoes_end_date);
          const now = new Date();

          if (now >= trialEndDate) {
            console.log('Trial de Ligações expirado, desativando automaticamente...');

            try {
              await supabase
                .from('profiles')
                .update({
                  trial_ligacoes_active: false,
                  ligacoes_trial_completed: true,
                  ligacoes_active: false, // Bloqueia acesso após trial
                  trial_ligacoes_end_date: null
                })
                .eq('id', profileData.id);

              updatedProfileData.trial_ligacoes_active = false;
              updatedProfileData.ligacoes_trial_completed = true;
              updatedProfileData.ligacoes_active = false;
              updatedProfileData.trial_ligacoes_end_date = null;
            } catch (error) {
              console.error('Erro ao desativar trial de Ligações expirado:', error);
            }
          }
        }

        // Expirar trial de Website/Desenvolvimento automaticamente
        if (profileData.trial_website_active && profileData.trial_website_end_date) {
          const trialEndDate = new Date(profileData.trial_website_end_date);
          const now = new Date();

          if (now >= trialEndDate) {
            console.log('Trial de Desenvolvimento expirado, desativando automaticamente...');

            try {
              await supabase
                .from('profiles')
                .update({
                  trial_website_active: false,
                  website_trial_completed: true,
                  website_active: false, // Bloqueia acesso após trial
                  trial_website_end_date: null
                })
                .eq('id', profileData.id);

              updatedProfileData.trial_website_active = false;
              updatedProfileData.website_trial_completed = true;
              updatedProfileData.website_active = false;
              updatedProfileData.trial_website_end_date = null;
            } catch (error) {
              console.error('Erro ao desativar trial de Desenvolvimento expirado:', error);
            }
          }
        }


        // Se encontrou o perfil, usar dados da tabela + email do auth
        finalProfile = {
          id: updatedProfileData.id,
          email: user.email || '', // Email sempre vem do auth
          full_name: updatedProfileData.full_name || '',
          created_at: updatedProfileData.created_at || user.created_at || new Date().toISOString(),
          updated_at: updatedProfileData.updated_at || new Date().toISOString(),
          avatar_url: updatedProfileData.avatar_url || '',
          stripe_customer_id: updatedProfileData.stripe_customer_id || '',
          stripe_subscription_id: updatedProfileData.stripe_subscription_id || '',
          cpf: updatedProfileData.cpf || '',
          phone: updatedProfileData.phone || '',
          asaas_customer_id: updatedProfileData.asaas_customer_id || '',
          asaas_subscription_id: updatedProfileData.asaas_subscription_id || '',
          trial_active: updatedProfileData.trial_active || false,
          trial_end_date: updatedProfileData.trial_end_date || '',
          trial_completed: updatedProfileData.trial_completed || false,
          credits: updatedProfileData.credits || 0,
          text_access_expires_at: updatedProfileData.text_access_expires_at || '',
          // Campos da tabela profiles existente
          contract_date: updatedProfileData.contract_date || '',
          monthly_plan_active: updatedProfileData.monthly_plan_active || false,
          annual_plan_active: updatedProfileData.annual_plan_active || false,
          next_monthly_payment: updatedProfileData.next_monthly_payment || '',
          next_annual_payment: updatedProfileData.next_annual_payment || '',
          acquired_plans: updatedProfileData.acquired_plans || [],
          plan_values: updatedProfileData.plan_values || [],
          // Campos adicionais que podem existir
          whatsapp_active: updatedProfileData.whatsapp_active || false,
          ligacoes_active: updatedProfileData.ligacoes_active || false,
          agendamentos_active: updatedProfileData.agendamentos_active || false,
          whatsapp_activation_date: updatedProfileData.whatsapp_activation_date || '',
          ligacoes_activation_date: updatedProfileData.ligacoes_activation_date || '',
          agendamentos_activation_date: updatedProfileData.agendamentos_activation_date || '',
          person_type: updatedProfileData.person_type || '',
          data_nascimento: updatedProfileData.data_nascimento || '',
          cnpj: updatedProfileData.cnpj || '',
          razao_social: updatedProfileData.razao_social || '',
          cep: updatedProfileData.cep || '',
          logradouro: updatedProfileData.logradouro || '',
          numero: updatedProfileData.numero || '',
          complemento: updatedProfileData.complemento || '',
          bairro: updatedProfileData.bairro || '',
          cidade: updatedProfileData.cidade || '',
          estado: updatedProfileData.estado || '',
          billing_cycle: updatedProfileData.billing_cycle || '',
          // Campos adicionais que podem existir
          plan_expires_at: updatedProfileData.plan_expires_at || '',
          payment_status: updatedProfileData.payment_status || 'pending',
          next_billing_date: updatedProfileData.next_billing_date || '',
          last_payment_date: updatedProfileData.last_payment_date || '',
          asaas_payment_id: updatedProfileData.asaas_payment_id || '',
          // Website Service fields
          website_active: updatedProfileData.website_active || false,
          website_activation_date: updatedProfileData.website_activation_date || '',
          trial_website_active: updatedProfileData.trial_website_active || false,
          trial_website_end_date: updatedProfileData.trial_website_end_date || '',

          // Marketing Agent fields (opcionais)
          marketing_active: updatedProfileData.marketing_active || false,
          marketing_activation_date: updatedProfileData.marketing_activation_date || '',
          trial_marketing_active: updatedProfileData.trial_marketing_active || false,
          trial_marketing_end_date: updatedProfileData.trial_marketing_end_date || '',
          marketing_trial_completed: updatedProfileData.marketing_trial_completed || false,
          marketing_access_blocked: updatedProfileData.marketing_access_blocked || false,
          marketing_block_reason: updatedProfileData.marketing_block_reason || '',

          // Negotiations Agent fields (opcionais)
          negociacoes_active: updatedProfileData.negociacoes_active || false,
          negociacoes_activation_date: updatedProfileData.negociacoes_activation_date || '',
          trial_negociacoes_active: updatedProfileData.trial_negociacoes_active || false,
          trial_negociacoes_end_date: updatedProfileData.trial_negociacoes_end_date || '',
          negociacoes_trial_completed: updatedProfileData.negociacoes_trial_completed || false,
          negociacoes_access_blocked: updatedProfileData.negociacoes_access_blocked || false,
          negociacoes_block_reason: updatedProfileData.negociacoes_block_reason || '',

          // Ligações (Dialer) Agent fields (opcionais)
          trial_ligacoes_active: updatedProfileData.trial_ligacoes_active || false,
          trial_ligacoes_end_date: updatedProfileData.trial_ligacoes_end_date || '',
          ligacoes_trial_completed: updatedProfileData.ligacoes_trial_completed || false,
          ligacoes_access_blocked: updatedProfileData.ligacoes_access_blocked || false,
          ligacoes_block_reason: updatedProfileData.ligacoes_block_reason || '',
          // Ligações payment fields
          ligacoes_monthly_plan_active: updatedProfileData.ligacoes_monthly_plan_active || false,
          ligacoes_annual_plan_active: updatedProfileData.ligacoes_annual_plan_active || false,
          ligacoes_billing_cycle: updatedProfileData.ligacoes_billing_cycle || '',
          ligacoes_plan_expires_at: updatedProfileData.ligacoes_plan_expires_at || '',
          ligacoes_payment_status: updatedProfileData.ligacoes_payment_status || '',
          ligacoes_next_billing_date: updatedProfileData.ligacoes_next_billing_date || '',
          ligacoes_last_payment_date: updatedProfileData.ligacoes_last_payment_date || '',
          ligacoes_stripe_subscription_id: updatedProfileData.ligacoes_stripe_subscription_id || '',
        };
      } else {
        // Se não encontrou perfil, criar um perfil básico com dados do auth
        finalProfile = {
          id: user.id,
          email: user.email || '',
          full_name: '',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: '',
          stripe_customer_id: '',
          stripe_subscription_id: '',
          cpf: '',
          phone: '',
          asaas_customer_id: '',
          asaas_subscription_id: '',
          trial_active: false,
          trial_end_date: '',
          trial_completed: false,
          credits: 0,
          text_access_expires_at: '',
          // Campos da tabela profiles existente
          contract_date: '',
          monthly_plan_active: false,
          annual_plan_active: false,
          next_monthly_payment: '',
          next_annual_payment: '',
          acquired_plans: [],
          plan_values: [],
          // Campos adicionais que podem existir
          whatsapp_active: false,
          ligacoes_active: false,
          agendamentos_active: false,
          whatsapp_activation_date: '',
          ligacoes_activation_date: '',
          agendamentos_activation_date: '',
          person_type: '',
          data_nascimento: '',
          cnpj: '',
          razao_social: '',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          billing_cycle: '',
          // Campos adicionais que podem existir
          plan_expires_at: '',
          payment_status: 'pending',
          next_billing_date: '',
          last_payment_date: '',
          asaas_payment_id: '',
          // Website Service fields
          website_active: false,
          website_activation_date: '',
          trial_website_active: false,
          trial_website_end_date: '',

          // Marketing Agent fields (opcionais)
          marketing_active: false,
          marketing_activation_date: '',
          trial_marketing_active: false,
          trial_marketing_end_date: '',
          marketing_trial_completed: false,
          marketing_access_blocked: false,
          marketing_block_reason: '',

          // Negotiations Agent fields (opcionais)
          negociacoes_active: false,
          negociacoes_activation_date: '',
          trial_negociacoes_active: false,
          trial_negociacoes_end_date: '',
          negociacoes_trial_completed: false,
          negociacoes_access_blocked: false,
          negociacoes_block_reason: '',

          // Ligações (Dialer) Agent fields (opcionais)
          trial_ligacoes_active: false,
          trial_ligacoes_end_date: '',
          ligacoes_trial_completed: false,
          ligacoes_access_blocked: false,
          ligacoes_block_reason: '',
          // Ligações payment fields
          ligacoes_monthly_plan_active: false,
          ligacoes_annual_plan_active: false,
          ligacoes_billing_cycle: '',
          ligacoes_plan_expires_at: '',
          ligacoes_payment_status: '',
          ligacoes_next_billing_date: '',
          ligacoes_last_payment_date: '',
          ligacoes_stripe_subscription_id: '',
        };
      }

      console.log('📤 [PROFILE] FINAL PROFILE BEING RETURNED:', {
        id: finalProfile.id,
        website_active: finalProfile.website_active,
        trial_website_active: finalProfile.trial_website_active,
        website_activation_date: finalProfile.website_activation_date,
        trial_website_end_date: finalProfile.trial_website_end_date
      });

      return finalProfile;
    };

    const loadProfile = async () => {
      try {
        let profileData: UserProfile;

        if (forceRefresh) {
          // Forçar busca direta do banco, ignorando cache
          console.log('🔄 Forçando refresh - buscando dados frescos do banco');
          profileData = await fetchProfile();
          // Limpar cache após buscar dados frescos
          if (user.id) {
            clearUserCache(user.id);
          }
        } else {
          // Usar cache normalmente
          profileData = await getOrSet(
            'user_profile',
            () => fetchProfile(),
            {
              userId: user.id,
              ttl: PROFILE_CACHE_TTL
            }
          );
        }

        console.log('✅ [PROFILE] Perfil final processado:', {
          id: profileData.id,
          payment_status: profileData.payment_status,
          monthly_plan_active: profileData.monthly_plan_active,
          agendamentos_active: profileData.agendamentos_active
        });

        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Exception loading profile:', err);
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
        // Resetar flag de force refresh
        if (forceRefresh) {
          setForceRefresh(false);
        }
      }
    };

    loadProfile();
  }, [user, getOrSet, forceRefresh, clearUserCache]);

  const refreshProfile = async () => {
    console.log('🔄 Solicitando refresh forçado do perfil');

    if (!user) return;

    // Resetar estado e ativar flag de force refresh
    setProfile(null);
    setLoading(true);
    setError(null);
    setForceRefresh(true);
  };

  return { profile, loading, error, refreshProfile };
};