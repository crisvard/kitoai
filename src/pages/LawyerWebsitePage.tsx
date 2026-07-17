import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlans } from '../hooks/usePlans';
import { useUserProfile } from '../hooks/useUserProfile';

interface LawyerWebsitePageProps {
  onBack: () => void;
}

interface LawyerPlan {
  id: string;
  name: string;
  price?: number;
  monthly_price?: number;
  price_monthly?: number;
  annual_price?: number;
  price_yearly?: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

const LawyerWebsitePage: React.FC<LawyerWebsitePageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { plans } = usePlans();
  const { profile, loading: profileLoading } = useUserProfile();
  const [lawyerPlans, setLawyerPlans] = useState<LawyerPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Filtrar planos de advogado
  useEffect(() => {
    if (plans && plans.length > 0) {
      const filtered = plans.filter((plan: any) => 
        plan.id?.includes('website-lawyer') || plan.category === 'lawyer'
      ) as LawyerPlan[];

      // Ordenar por preço e marcar o Profissional como recomendado
      const sorted = filtered.sort((a, b) => {
        const priceA = a.monthly_price ?? a.price ?? a.price_monthly ?? a.annual_price ?? 0;
        const priceB = b.monthly_price ?? b.price ?? b.price_monthly ?? b.annual_price ?? 0;
        return priceA - priceB;
      });
      const withRecommended = sorted.map(plan => ({
        ...plan,
        recommended: plan.id === 'website-lawyer-professional'
      }));

      setLawyerPlans(withRecommended);
      if (withRecommended.length > 0 && !selectedPlan) {
        setSelectedPlan(withRecommended[0].id);
      }
    }
  }, [plans, selectedPlan]);

  const handleSelectPlan = (planId: string) => {
    console.log('Lawyer Website: selected plan', planId);
    setSelectedPlan(planId);
  };

  const handleProceedToPayment = (event?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!selectedPlan) {
      console.warn('Lawyer Website: no plan selected, cannot proceed');
      return;
    }

    const url = `/direct-payment?plan=website-lawyer&selected=${encodeURIComponent(selectedPlan)}`;
    console.log('Lawyer Website: proceeding to payment', { selectedPlan, url });

    try {
      navigate(url);
    } catch (error) {
      console.warn('Navigation failed, falling back to window.location:', error);
      window.location.href = url;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const isBlocked = profile?.website_access_blocked === true;
  const blockReason = profile?.website_block_reason;

  const resolvePlanPrice = (plan: LawyerPlan) => {
    return plan.monthly_price ?? plan.price ?? plan.price_monthly ?? plan.annual_price ?? 0;
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full bg-[#111827] border border-white/10 rounded-3xl p-10 shadow-2xl shadow-black/40">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso bloqueado</h1>
          <p className="text-gray-300 mb-6">
            O agente de websites para advogados está bloqueado para sua conta no momento.
          </p>
          {blockReason && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              <strong>Motivo:</strong> {blockReason}
            </div>
          )}
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#c4d82e] text-black font-semibold hover:bg-[#b5c928] transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Planos para Advogados
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Websites profissionais construídos dentro do Código de Ética da OAB
          </p>
          <p className="text-gray-400">
            Isento de taxa de hospedagem e manutenção. Anuidade do domínio cobrada separadamente.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {lawyerPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleSelectPlan(plan.id)}
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
              selectedPlan === plan.id
                ? 'ring-2 ring-[#c4d82e] shadow-2xl shadow-[#c4d82e]/40 scale-105'
                : 'hover:shadow-lg'
            } ${plan.recommended ? 'md:scale-105' : ''}`}
          >
            {/* Background */}
            <div
              className={`absolute inset-0 ${
                selectedPlan === plan.id || plan.recommended
                  ? 'bg-gradient-to-br from-[#c4d82e]/20 to-transparent'
                  : 'bg-white/5'
              }`}
            />

            {/* Recommended Badge */}
            {plan.recommended && (
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-[#c4d82e] text-black px-3 py-1 rounded-full text-sm font-bold">
                  Recomendado
                </div>
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 p-8 border border-white/10 rounded-2xl backdrop-blur-xl h-full flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-300 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="text-4xl font-black text-white mb-1">
                  {formatPrice(resolvePlanPrice(plan))}
                </div>
                <p className="text-gray-400 text-sm">valor único do projeto</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <Check size={18} className="text-[#c4d82e]" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Selection Indicator */}
              <div className={`w-full py-3 rounded-lg border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-[#c4d82e] bg-[#c4d82e]/10 text-[#c4d82e] font-bold'
                  : 'border-white/10 text-gray-400'
              } text-center`}>
                {selectedPlan === plan.id ? '✓ Selecionado' : 'Selecionar'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleProceedToPayment}
          disabled={!selectedPlan}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
            selectedPlan
              ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-2xl hover:shadow-[#c4d82e]/40 cursor-pointer'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedPlan ? 'Prosseguir para Pagamento' : 'Selecione um Plano'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="max-w-6xl mx-auto mt-12 p-6 bg-blue-500/10 border border-blue-400/30 rounded-xl">
        <h3 className="font-bold text-blue-300 mb-2">ℹ️ Informação importante</h3>
        <p className="text-blue-200 text-sm">
          Todos os planos são construídos integralmente dentro do Código de Ética da OAB (Provimento 205/2021).
          O cliente fica isento de taxas de hospedagem e manutenção mensais ou anuais.
          A anuidade do domínio .adv.br é cobrada separadamente pelo registrador.
        </p>
      </div>
    </div>
  );
};

export default LawyerWebsitePage;
