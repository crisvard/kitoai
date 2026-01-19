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
  const classifyPlan = (plan: any) => {
    const id = (plan.id || '').toString().toLowerCase();
    const name = (plan.name || '').toString().toLowerCase();

    if (['website', 'desenvolvimento', 'app'].includes(id)) return 'website';
    if (name.includes('desenvolvimento') || name.includes('website') || name.includes('site') || name.includes('app') || name.includes('agente')) return 'website';
    if (name.includes('whatsapp') || name.includes('agendamento')) return 'whatsapp';
    if (name.includes('ligação') || name.includes('ligac') || id.includes('ligacoes')) return 'ligacoes';
    return 'other';
  };

  const fetchPlans = async () => {
    console.log('🔍 [usePlans] Buscando planos ativos na tabela `plans`...');

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ [usePlans] Erro ao buscar planos:', error);
      const fallback = getFallbackPlans().map(p => ({ ...p, category: classifyPlan(p) }));
      return fallback;
    }

    const classified = (data || []).map((p: any) => ({ ...p, category: classifyPlan(p) }));

    console.log(`✅ [usePlans] Encontrados ${classified.length} planos ativos:`, classified.map((p: any) => `${p.id}: ${p.name} (${p.category})`));
    return classified.length ? classified : getFallbackPlans().map(p => ({ ...p, category: classifyPlan(p) }));
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
