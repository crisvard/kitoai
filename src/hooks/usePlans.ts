import { useCachedData } from './useCachedData';
import { supabase } from '../lib/supabase';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  monthly_price?: number;
  annual_price?: number;
  billing_cycle?: string;
  features?: any[];
  is_active?: boolean;
  trial_days?: number;
  paypal_plan_id?: string;
}

export const usePlans = () => {
  const fetchPlans = async () => {
    console.log('🔍 [usePlans] Buscando planos da tabela plans...');

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ [usePlans] Erro ao buscar planos:', error);
      return getFallbackPlans();
    }

    console.log(`✅ [usePlans] Encontrados ${data?.length || 0} planos:`, data?.map(p => `${p.id}: ${p.name}`));
    console.log('📋 [usePlans] Dados completos dos planos:', data);
    return data || getFallbackPlans();
  };

  // Cache de 30 minutos
  const { data: plans, loading, error } = useCachedData('plans', fetchPlans, {
    ttl: 30 * 60 * 1000
  });

  return { plans, loading, error };
};

// Dados de fallback se tabela não existir ou estiver vazia
const getFallbackPlans = (): Plan[] => [
  {
    id: 'whatsapp',
    name: 'Agente de WhatsApp',
    price: 250.00,
    monthly_price: 250.00,
    annual_price: 1500.00,
    features: ["Agendamento online 24/7", "Gestão de profissionais", "Lembretes automáticos", "Relatórios de performance"],
    is_active: true
  },
  {
    id: 'ligacoes',
    name: 'Plano Agente de Ligações',
    price: 299.00,
    monthly_price: 299.00,
    annual_price: 2990.00,
    features: ["Até 10.000 ligações/mês", "IA de voz natural", "Relatórios detalhados", "Suporte prioritário"],
    is_active: true
  },
  {
    id: 'website',
    name: 'Desenvolvimento de Sites',
    price: 149.00,
    monthly_price: 149.00,
    annual_price: 1490.00,
    description: 'Plano completo para gerenciamento de projetos web com credenciais seguras',
    features: ["Gerenciamento de projetos web", "Armazenamento de credenciais", "Dados de hospedagem", "Integração com GitHub"],
    is_active: true
  }
];