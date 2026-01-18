import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { useUserProfile } from '../hooks/useUserProfile';

type BillingType = 'PIX' | 'CREDIT_CARD';

const TrialSignupPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { plans, loading: plansLoading } = usePlans();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [creditCardToken, setCreditCardToken] = useState<string>('');
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Verificar se é contratação direta (usuário já usou trial)
  const isDirectPayment = searchParams.get('direct') === 'true';
  const reason = searchParams.get('reason');

  const handleNext = () => {
    if (selectedPlan) {
      setStep('payment');
    }
  };

  const handleStartTrial = async () => {
    if (!user || !selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      // 1. Criar cliente no Asaas se não existir
      const { data: customerData, error: customerError } = await supabase.functions.invoke('create-asaas-customer');

      if (customerError) throw customerError;

      // 2. Criar assinatura no Asaas
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          planId: selectedPlan,
          billingType: billingType,
          creditCardToken: billingType === 'CREDIT_CARD' ? creditCardToken : undefined,
          isDirectPayment: isDirectPayment
        }
      });

      if (subscriptionError) throw subscriptionError;

      if (!isDirectPayment) {
        // 3. Iniciar trial no banco local (apenas se não for contratação direta)
        const { data: trialData, error: trialError } = await supabase.functions.invoke('start-trial', {
          body: { planId: selectedPlan }
        });

        if (trialError) throw trialError;
      } else {
        // Para contratação direta, ativar plano imediatamente no banco local
        // O Asaas já cobrou imediatamente, então podemos ativar o plano
        console.log('Contratação direta - ativando plano imediatamente');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Ativar plano diretamente (sem trial)
        const { error: activateError } = await supabase
          .from('profiles')
          .update({
            agendamentos_active: true,
            billing_cycle: 'monthly', // ou yearly baseado no plano
            monthly_plan_active: true,
            annual_plan_active: false, // ajustar conforme necessário
          })
          .eq('id', user.id);

        if (activateError) throw activateError;

        console.log('Plano ativado com sucesso para contratação direta');
      }

      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao processar contratação:', err);
      setError(isDirectPayment ? 'Erro ao contratar plano. Tente novamente.' : 'Erro ao iniciar período de teste. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isDirectPayment ? 'Contratação de Plano' : 'Teste Gratuito por 3 Dias'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isDirectPayment
              ? 'Você já utilizou seu período de teste. Contrate agora para continuar usando.'
              : 'Escolha um plano e comece seu período de teste gratuito'
            }
          </p>
          {reason === 'trial_used' && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <p className="text-sm">Seu período de teste gratuito já foi utilizado.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {step === 'plan' ? (
          <>
            <div className="space-y-4 mb-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          R$ {plan.monthly_price.toFixed(2)}/mês
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedPlan}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                selectedPlan
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Próximo
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Escolha o método de pagamento
              </h3>
              <div className="space-y-3">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    billingType === 'PIX'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBillingType('PIX')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={billingType === 'PIX'}
                      onChange={() => setBillingType('PIX')}
                      className="mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">PIX</h4>
                      <p className="text-sm text-gray-600">
                        Pagamento instantâneo e gratuito
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    billingType === 'CREDIT_CARD'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBillingType('CREDIT_CARD')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={billingType === 'CREDIT_CARD'}
                      onChange={() => setBillingType('CREDIT_CARD')}
                      className="mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">Cartão de Crédito</h4>
                      <p className="text-sm text-gray-600">
                        Parcelamento automático mensal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('plan')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
                  !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading
                  ? (isDirectPayment ? 'Contratando...' : 'Iniciando Trial...')
                  : (isDirectPayment ? 'Contratar Plano' : 'Iniciar Teste Gratuito')
                }
              </button>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-gray-500 text-center">
          {isDirectPayment ? (
            <>Ao contratar o plano, você concorda com nossos termos de serviço. O pagamento será processado imediatamente.</>
          ) : (
            <>Ao iniciar o teste, você concorda com nossos termos de serviço. O período de teste é gratuito e sem compromisso.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default TrialSignupPage;