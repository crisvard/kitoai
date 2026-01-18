import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

type BillingType = 'PIX' | 'CREDIT_CARD';
type PlanType = 'monthly';

const TrialConfirmationPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const planType: PlanType = 'monthly';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const trialDays = 3;

  // Calcular datas do trial
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  const monthlyPriceText = 'R$ 250';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Verificar se usuário já completou trial
  useEffect(() => {
    if (profile?.trial_completed) {
      console.log('Usuário já completou trial, redirecionando para contratação direta');
      navigate('/direct-payment?reason=trial_used');
    }
  }, [profile?.trial_completed, navigate]);

  const handleStartTrial = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Calcular data de fim do trial (3 dias)
      const calculatedTrialEndDate = new Date();
      calculatedTrialEndDate.setDate(calculatedTrialEndDate.getDate() + trialDays);

      // Atualizar perfil com trial ativo e liberar acesso ao WhatsApp durante trial
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          trial_active: true,
          trial_end_date: calculatedTrialEndDate.toISOString(),
          agendamentos_active: true,
          billing_cycle: planType,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Verificar se o update foi bem-sucedido
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('trial_active, agendamentos_active, trial_end_date')
        .eq('id', user.id)
        .single();

      console.log('Trial iniciado com sucesso!', {
        trialEndDate: calculatedTrialEndDate.toISOString(),
        billingType,
        planType,
        updatedProfile
      });

      // Limpar cache do perfil
      const userId = user.id;
      const cachePrefix = 'kito_expert_cache_';
      const keys = Object.keys(localStorage);
      const userCacheKeys = keys.filter(key => key.startsWith(`${cachePrefix}${userId}_`));
      userCacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`TrialConfirmationPage: Cleared ${userCacheKeys.length} cache items for user ${userId}`);

      // Redirecionar para dashboard
      window.location.href = '/dashboard?from_trial=true';
    } catch (err: any) {
      console.error('Erro ao iniciar trial:', err);
      setError('Erro ao iniciar período de teste. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Confirmação do Período de Teste</h1>
          <p className="text-gray-400">Agente de WhatsApp - Teste Gratuito por {trialDays} Dias</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Detalhes do Trial</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-300">Data de Início:</span>
              <span className="text-white font-medium">{formatDate(trialStartDate)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-300">Data de Término:</span>
              <span className="text-white font-medium">{formatDate(trialEndDate)}</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-gray-300">Duração:</span>
              <span className="text-[#c4d82e] font-medium">{trialDays} dias gratuitos</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Plano Selecionado</h3>
          <div className="space-y-3">
            <div className="border border-[#c4d82e] bg-[#c4d82e]/10 rounded-lg p-4">
              <div className="flex items-center">
                <input type="radio" checked readOnly className="mr-3" />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Plano Mensal</h4>
                  <p className="text-sm text-gray-400">{monthlyPriceText}/mês após o trial</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Método de Pagamento</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setBillingType('PIX')}
              className={`w-full text-left border rounded-lg p-4 transition-colors ${
                billingType === 'PIX'
                  ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center">
                <input type="radio" checked={billingType === 'PIX'} readOnly className="mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-white">PIX</div>
                  <div className="text-sm text-gray-400">Pagamento recorrente via PIX</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBillingType('CREDIT_CARD')}
              className={`w-full text-left border rounded-lg p-4 transition-colors ${
                billingType === 'CREDIT_CARD'
                  ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center">
                <input type="radio" checked={billingType === 'CREDIT_CARD'} readOnly className="mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-white">Cartão de Crédito</div>
                  <div className="text-sm text-gray-400">Pagamento recorrente no cartão</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>
        )}

        <button
          onClick={handleStartTrial}
          disabled={loading}
          className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
            !loading
              ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="relative z-10">{loading ? 'Iniciando Trial...' : `Iniciar Trial Gratuito de ${trialDays} Dias`}</span>
        </button>

        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Importante</span>
          </div>
          <p className="text-sm">
            Você terá <strong>{trialDays} dias gratuitos</strong> para testar o serviço. Após esse período, será
            cobrado automaticamente <strong>{monthlyPriceText}/mês</strong> (pagamento recorrente).
          </p>
          <p className="text-sm mt-2">Você pode cancelar a qualquer momento antes do fim do trial para não ser cobrado.</p>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/dashboard')} className="text-[#c4d82e] hover:text-white transition-colors">
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialConfirmationPage;