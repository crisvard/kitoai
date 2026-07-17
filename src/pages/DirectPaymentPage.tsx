import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { useUserProfile } from '../hooks/useUserProfile';
import { useStripeKeys } from '../hooks/useStripeKeys';
import { activatePlan as activatePlanService } from '../lib/services/planService';
import PaymentDataModal from '../components/PaymentDataModal';
import PixQRCode from '../components/PixQRCode';
import CreditCardForm from '../components/CreditCardForm';

type BillingType = 'PIX' | 'CREDIT_CARD';

const DirectPaymentPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { plans, loading: plansLoading } = usePlans();
  const { keys: stripeKeys, loading: keysLoading, error: keysError } = useStripeKeys();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Create Stripe promise dynamically when keys are available - NO FALLBACK, ONLY PRODUCTION
  const stripePromise = useMemo(() => {
    if (stripeKeys?.publishableKey) {
      console.log('🔧 [STRIPE] Initializing Stripe with PRODUCTION key from Supabase secrets');
      console.log('🔧 [STRIPE] Key starts with:', stripeKeys.publishableKey.substring(0, 10) + '...');
      console.log('🔧 [STRIPE] NO FALLBACK - Using ONLY production keys from secrets');
      return loadStripe(stripeKeys.publishableKey, {
        locale: 'pt-BR'
      });
    }
    console.log('⏳ [STRIPE] Waiting for production keys from Supabase secrets...');
    console.log('⏳ [STRIPE] Configure secrets in: Supabase Dashboard > Settings > Edge Functions > Secrets');
    return null;
  }, [stripeKeys?.publishableKey]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [creditCardToken, setCreditCardToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDataModal, setShowDataModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'data' | 'payment' | 'processing' | 'stripe_payment'>('data');
  const [creditPackage, setCreditPackage] = useState<any>(null);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; payload: string; paymentId?: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [pixPollingActive, setPixPollingActive] = useState(false);

  const reason = searchParams.get('reason');
  const planParam = searchParams.get('plan'); // Parâmetro para identificar qual plano
  const packageIdParam = searchParams.get('packageId'); // ID do pacote de créditos
  const isRenewal = searchParams.get('renewal') === 'true';
  const renewalAmount = searchParams.get('amount');
  const landingPageId = searchParams.get('landingPageId'); // ID da landing page para app-developer-plan

  // Verificar se dados estão completos
  const hasCompleteData = () => {
    return !!(profile?.cpf && profile?.phone && profile?.cep &&
      profile?.logradouro && profile?.numero && profile?.bairro &&
      profile?.cidade && profile?.estado);
  };

  // Auto-select the correct plan based on URL param or default to WhatsApp
  useEffect(() => {
    // Se veio parâmetro plan=credits, buscar o pacote específico
    if (planParam === 'credits' && packageIdParam) {
      console.log('💰 [PLAN] Compra de créditos solicitada:', packageIdParam);
      setSelectedPlan(packageIdParam);

      const fetchPackage = async () => {
        const { data, error } = await supabase
          .from('credit_packages')
          .select('*')
          .eq('id', packageIdParam)
          .single();

        if (data) {
          console.log('✅ [PLAN] Pacote de créditos encontrado:', data);
          setCreditPackage(data);
        } else {
          console.error('❌ [PLAN] Erro ao buscar pacote de créditos:', error);
        }
      };

      fetchPackage();
      return;
    }

    // Se veio parâmetro plan=ligacoes, selecionar plano de ligações
    if (planParam === 'ligacoes') {
      const ligacoesPlan = plans?.find(plan =>
        (plan as any).category === 'ligacoes' ||
        plan.name?.toLowerCase().includes('ligaç') ||
        plan.name?.toLowerCase().includes('ligac') ||
        plan.id === 'ligacoes' ||
        plan.id === 'plan-ligacoes'
      );
      if (ligacoesPlan) {
        setSelectedPlan(ligacoesPlan.id);
        console.log('📞 Plano de Ligações selecionado:', ligacoesPlan);
        return;
      }
    }

    // Se veio parâmetro plan=website ou plan=website-lawyer, selecionar plano de website/desenvolvimento
    if (planParam === 'website' || planParam === 'website-lawyer') {
      const selectedId = searchParams.get('selected'); // Para advogados, pode ter um ID específico
      
      console.log('🔍 [PLAN] Procurando plano website. Parâmetro:', planParam, 'ID selecionado:', selectedId);
      console.log('🔍 [PLAN] Planos disponíveis:', plans?.map(p => ({ id: p.id, name: p.name, category: (p as any).category, price: p.price, monthly_price: p.monthly_price, annual_price: p.annual_price })));

      let websitePlan;

      // Se houver um ID específico selecionado (para advogados), usar esse
      if (selectedId) {
        websitePlan = plans?.find(plan => plan.id === selectedId);
        if (websitePlan) {
          console.log('⚖️ [PLAN] Plano de advogado selecionado:', websitePlan);
          setSelectedPlan(websitePlan.id);
          return;
        }
        console.warn('⚠️ [PLAN] Plano especificado não encontrado:', selectedId);
      }

      // Se for plano de advogado, tentar selecionar o primeiro plano lawyer disponível
      if (planParam === 'website-lawyer') {
        websitePlan = plans?.find((plan: any) => plan.category === 'lawyer' || plan.id?.includes('website-lawyer'));
      }

      // Tentar encontrar por ID específico "website"
      if (!websitePlan) {
        websitePlan = plans?.find(plan => plan.id === 'website');
      }

      // Se não encontrou, tentar por categoria
      if (!websitePlan) {
        websitePlan = plans?.find((plan: any) => plan.category === 'website' || plan.category === 'lawyer');
      }

      // Se ainda não encontrou, tentar por nome
      if (!websitePlan) {
        websitePlan = plans?.find(plan =>
          plan.id === 'desenvolvimento' ||
          plan.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || // UUID do plano website
          (plan.name && (plan.name.toLowerCase().includes('desenvolvimento') ||
            plan.name.toLowerCase().includes('website') ||
            plan.name.toLowerCase().includes('agente') ||
            plan.name.toLowerCase().includes('site') ||
            plan.name.toLowerCase().includes('advogado')))
        );
      }

      console.log('🌐 [PLAN] Plano website encontrado:', websitePlan);

      if (websitePlan) {
        setSelectedPlan(websitePlan.id);
        console.log('✅ [PLAN] Plano de Website selecionado:', websitePlan);
        return;
      } else {
        console.log('❌ [PLAN] Plano website NÃO encontrado, procurando alternativas...');
      }
    }

    // Se veio parâmetro plan=app-developer-plan, forçar seleção (plano pode não estar na lista)
    if (planParam === 'app-developer-plan') {
      console.log('📱 [PLAN] Parâmetro app-developer-plan detectado, forçando seleção');
      setSelectedPlan('app-developer-plan');
      console.log('✅ [PLAN] Plano App Developer forçado como selecionado');
      return;
    }

    // Padrão: Procurar pelo plano de agendamentos/WhatsApp
    const whatsappPlan = plans?.find(plan =>
      plan.name?.toLowerCase().includes('agendamento') ||
      plan.name?.toLowerCase().includes('whatsapp') ||
      plan.id === 'plan-agendamentos'
    );
    if (whatsappPlan) {
      setSelectedPlan(whatsappPlan.id);
      console.log('📋 Plano selecionado:', whatsappPlan);
    } else {
      console.log('❌ Nenhum plano encontrado. Planos disponíveis:', plans);
    }
  }, [plans, planParam]);

  // Polling automático para verificar status do PIX
  useEffect(() => {
    if (currentStep === 'processing' && pixData?.paymentId && !pixPollingActive) {
      console.log('🔄 [POLLING] Iniciando polling automático para PIX...');
      setPixPollingActive(true);

      const pollInterval = setInterval(async () => {
        try {
          console.log('🔍 [POLLING] Verificando status do pagamento PIX...');

          const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-payment-status', {
            body: { paymentId: pixData.paymentId }
          });

          if (statusError) {
            console.error('❌ [POLLING] Erro na verificação:', statusError);
            return;
          }

          if (statusData.status === 'RECEIVED') {
            console.log('✅ [POLLING] Pagamento PIX confirmado automaticamente!');

            // Limpar polling
            clearInterval(pollInterval);
            setPixPollingActive(false);

            // Para app-developer-plan, não ativar automaticamente (tem fluxo próprio)
            if (selectedPlan === 'app-developer-plan') {
              console.log('📱 [POLLING] App Developer Plan - redirecionando para dashboard sem ativação automática');
              navigate('/dashboard');
            } else {
              // Ativar plano normalmente para outros planos
              await activatePlan(pixData.paymentId);
              navigate('/dashboard');
            }
          } else {
            console.log('⏳ [POLLING] Pagamento ainda pendente:', statusData.status);
          }
        } catch (err) {
          console.error('❌ [POLLING] Erro no polling:', err);
        }
      }, 10000); // Verificar a cada 10 segundos

      // Cleanup function
      return () => {
        console.log('🧹 [POLLING] Limpando polling automático...');
        clearInterval(pollInterval);
        setPixPollingActive(false);
      };
    }
  }, [currentStep, pixData?.paymentId, pixPollingActive, navigate, selectedPlan, planParam]);

  const handleDataConfirmation = () => {
    setCurrentStep('payment');
  };

  const handlePixPayment = async () => {
    console.log('🚀 [PIX] Iniciando processo de pagamento PIX...');
    console.log('📊 [PIX] Estado inicial:', {
      user: !!user,
      userEmail: user?.email,
      selectedPlan,
      billingType
    });

    if (!user || !selectedPlan) {
      console.error('❌ [PIX] Dados obrigatórios faltando:', {
        hasUser: !!user,
        hasSelectedPlan: !!selectedPlan
      });
      setError('Dados obrigatórios não encontrados. Tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 [PIX] Passo 1: Criando/validando cliente...');

      // 1. Criar cliente no Asaas se não existir
      const { data: customerData, error: customerError } = await supabase.functions.invoke('create-asaas-customer');

      console.log('📋 [PIX] Resultado criação cliente:', {
        customerData,
        customerError,
        hasCustomerData: !!customerData,
        customerId: customerData?.asaas_customer_id
      });

      if (customerError) {
        console.error('❌ [PIX] Falha na criação do cliente:', customerError);
        throw new Error(`Falha ao criar cliente: ${customerError.message || customerError}`);
      }

      if (!customerData) {
        console.error('❌ [PIX] Nenhum dado retornado da criação do cliente');
        throw new Error('Nenhum dado retornado da criação do cliente');
      }

      console.log('✅ [PIX] Cliente criado/validado com sucesso');

      console.log('📝 [PIX] Passo 2: Criando pagamento PIX...');

      // 2. Criar pagamento PIX
      const paymentRequestBody = {
        planId: selectedPlan,
        billingType: 'PIX',
        isDirectPayment: true
      };

      console.log('📤 [PIX] Enviando requisição de pagamento:', paymentRequestBody);

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-asaas-payment', {
        body: paymentRequestBody
      });

      console.log('📥 [PIX] Resposta completa do pagamento:', {
        paymentData,
        paymentError,
        hasPaymentData: !!paymentData,
        hasPaymentError: !!paymentError
      });



      if (paymentError) {
        console.error('❌ [PIX] Falha na criação do pagamento:', paymentError);
        throw new Error(`Falha ao criar pagamento: ${paymentError.message || paymentError}`);
      }

      if (!paymentData) {
        console.error('❌ [PIX] Nenhum dado retornado da criação do pagamento');
        throw new Error('Nenhum dado retornado da criação do pagamento');
      }

      console.log('✅ [PIX] Pagamento criado com sucesso');

      // 3. Validar dados do PIX
      console.log('🔍 [PIX] Validando dados PIX recebidos...');

      if (!paymentData.payment) {
        console.error('❌ [PIX] Dados de pagamento ausentes:', paymentData);
        throw new Error('Dados de pagamento ausentes na resposta');
      }

      console.log('📊 [PIX] Dados do pagamento Asaas:', {
        id: paymentData.payment.id,
        value: paymentData.payment.value,
        status: paymentData.payment.status,
        billingType: paymentData.payment.billingType
      });

      // Verificar se tem dados PIX
      const hasQRCode = !!paymentData.qrCodeBase64;
      const hasPayload = !!paymentData.payload;

      console.log('🎯 [PIX] Dados PIX disponíveis:', {
        hasQRCode,
        hasPayload,
        qrCodeLength: paymentData.qrCodeBase64?.length || 0,
        payloadLength: paymentData.payload?.length || 0,
        qrCodeType: typeof paymentData.qrCodeBase64,
        payloadType: typeof paymentData.payload
      });

      if (!hasQRCode && !hasPayload) {
        console.error('❌ [PIX] Nenhum dado PIX recebido:', {
          paymentData,
          allKeys: Object.keys(paymentData),
          paymentKeys: Object.keys(paymentData.payment || {})
        });
        throw new Error('Nenhum dado PIX (QR Code ou payload) foi recebido do servidor');
      }

      // 4. Configurar dados PIX para exibição
      console.log('⚙️ [PIX] Configurando dados para exibição...');

      const pixDataToSet = {
        qrCodeBase64: paymentData.qrCodeBase64 || null,
        payload: paymentData.payload || null,
        paymentId: paymentData.payment.id
      };

      console.log('🎯 [PIX] Dados PIX configurados:', {
        paymentId: pixDataToSet.paymentId,
        hasQRCode: !!pixDataToSet.qrCodeBase64,
        hasPayload: !!pixDataToSet.payload
      });

      setPixData(pixDataToSet);
      setCurrentStep('processing');

      console.log('✅ [PIX] Processo de PIX concluído com sucesso!');
      console.log('🏁 [PIX] Redirecionando para tela de processamento...');

    } catch (err: any) {
      console.error('💥 [PIX] ERRO DETALHADO:', {
        error: err,
        errorName: err.name,
        errorMessage: err.message,
        errorDetails: err.details,
        errorStack: err.stack,
        user: user?.email,
        selectedPlan,
        timestamp: new Date().toISOString()
      });

      // Mostrar detalhes do erro se disponível
      const errorDetails = err.details || err.message || 'Erro desconhecido';
      const fullError = `Erro ao gerar PIX: ${errorDetails}`;
      console.error('🚨 [PIX] Definindo mensagem de erro:', fullError);
      setError(fullError);
    } finally {
      setLoading(false);
      console.log('🏁 [PIX] Processo PIX finalizado');
    }
  };

  const handleVerifyPixPayment = async () => {
    console.log('🔍 [VERIFY] Iniciando verificação de pagamento PIX...');

    if (!pixData?.paymentId) {
      console.error('❌ [VERIFY] ID do pagamento não encontrado:', pixData);
      setError('ID do pagamento não encontrado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 [VERIFY] Verificando status do pagamento:', pixData.paymentId);

      // Verificar status do pagamento no Asaas
      const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-payment-status', {
        body: { paymentId: pixData.paymentId }
      });

      console.log('📋 [VERIFY] Resultado verificação:', { statusData, statusError });

      if (statusError) {
        console.error('❌ [VERIFY] Erro na verificação:', statusError);
        throw statusError;
      }

      if (statusData.status === 'RECEIVED') {
        console.log('✅ [VERIFY] Pagamento confirmado!');

        // Pagamento confirmado - ativar plano com ID do pagamento
        await activatePlan(pixData.paymentId);
        navigate('/dashboard');
      } else {
        console.log('⏳ [VERIFY] Pagamento ainda pendente:', statusData.status);
        setError('Pagamento ainda não foi confirmado. Tente novamente em alguns instantes.');
      }

    } catch (err: any) {
      console.error('❌ [VERIFY] Erro ao verificar pagamento:', err);
      setError('Erro ao verificar status do pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCardPayment = async () => {
    if (!user || !selectedPlan) {
      setError('Dados obrigatórios não encontrados');
      return;
    }

    if (!selectedPlanData && selectedPlan !== 'app-developer-plan') {
      setError('Aguarde o carregamento dos planos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let amount = (selectedPlanData?.monthly_price || selectedPlanData?.price);

      // Se for compra de créditos, usar o preço do pacote
      if (planParam === 'credits' && creditPackage) {
        amount = creditPackage.price;
      }

      const invokeResult = await supabase.functions.invoke('create-stripe-payment-intent', {
        body: {
          planId: selectedPlan,
          amount: amount,
          installments: installments,
          userId: user?.id
        }
      });

      const intentData = invokeResult.data;
      const intentError = invokeResult.error;

      if (intentError) {
        throw intentError;
      }

      if (!intentData) {
        throw new Error('Nenhum dado retornado da função');
      }

      // 2. Salvar clientSecret e mostrar formulário
      if (!intentData.clientSecret) {
        throw new Error('ClientSecret não retornado');
      }

      setClientSecret(intentData.clientSecret);
      setCurrentStep('stripe_payment');

    } catch (err: any) {
      const errorDetails = err.details || err.message || 'Erro desconhecido';
      setError(`Erro ao processar pagamento: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Determinar qual plano ativar baseado no plano selecionado
      const selectedPlanObj = plans?.find(p => p.id === selectedPlan);
      const isWebsitePlan = selectedPlanObj && (
        selectedPlan === 'website' ||
        selectedPlan === 'desenvolvimento' ||
        selectedPlan?.includes('website-lawyer') ||
        selectedPlanObj.name?.toLowerCase().includes('desenvolvimento') ||
        selectedPlanObj.name?.toLowerCase().includes('website') ||
        selectedPlanObj.name?.toLowerCase().includes('advogado')
      );

      if (planParam === 'credits') {
        console.log('💰 [STRIPE] Ativando créditos...');

        await activatePlanService(
          user!.id,
          selectedPlan,
          paymentIntentId,
          undefined,
          undefined,
          'stripe'
        );

        console.log('✅ [STRIPE] Créditos ativados com sucesso via planService');
      } else if (isWebsitePlan) {
        console.log('🌐 [STRIPE] Usando planService para website...');

        const websiteId = searchParams.get('websiteId');
        const websiteName = selectedPlanObj?.name || 'Website';

        await activatePlanService(
          user!.id,
          selectedPlan,
          paymentIntentId,
          websiteName,
          websiteId || undefined,
          'stripe'
        );

        console.log('✅ [STRIPE] Website ativado via planService');
      } else {
        // Para planos de assinatura, usar Edge Functions
        let functionName = 'activate-stripe-plan'; // default para agendamentos/whatsapp

        if (selectedPlan === 'plan-ligacoes' || selectedPlan === 'ligacoes') {
          functionName = 'activate-stripe-ligacoes';
        }

        console.log('🔧 [STRIPE] Usando Edge Function:', functionName, 'para plano:', selectedPlan);

        const { data: activateData, error: activateError } = await supabase.functions.invoke(functionName, {
          body: {
            userId: user?.id,
            paymentIntentId: paymentIntentId,
            planId: selectedPlan,
            isRenewal: isRenewal
          }
        });

        if (activateError) {
          throw new Error(`Erro ao ativar plano: ${activateError.message}`);
        }
      }

      // Limpar cache do perfil
      const userId = user?.id;
      if (userId) {
        const cachePrefix = 'kito_expert_cache_';
        const keys = Object.keys(localStorage);
        const userCacheKeys = keys.filter(key => key.startsWith(`${cachePrefix}${userId}_`));
        userCacheKeys.forEach(key => localStorage.removeItem(key));
      }

      // Redirecionar para dashboard
      navigate('/dashboard');

    } catch (error) {
      setError(`Erro ao ativar plano: ${(error as Error).message}`);
    }
  };

  const activatePlan = async (paymentId?: string) => {
    console.log('⚡ [ACTIVATE] Ativando plano...');

    if (!user) throw new Error('Usuário não autenticado');

    // Determinar qual plano ativar baseado no plano selecionado
    const selectedPlanObj = plans?.find(p => p.id === selectedPlan);
    const isWebsitePlan = selectedPlanObj && (
      selectedPlan === 'website' ||
      selectedPlan === 'desenvolvimento' ||
      selectedPlan === 'app-developer-plan' ||
      selectedPlan?.includes('website-lawyer') ||
      selectedPlanObj.name?.toLowerCase().includes('desenvolvimento') ||
      selectedPlanObj.name?.toLowerCase().includes('website') ||
      selectedPlanObj.name?.toLowerCase().includes('app developer') ||
      selectedPlanObj.name?.toLowerCase().includes('advogado')
    );

    console.log('📋 [ACTIVATE] Tipo de plano:', isWebsitePlan ? 'WEBSITE' : 'ASSINATURA', 'Plano:', selectedPlanObj?.name);

    // Para compra de créditos via PIX
    if (planParam === 'credits') {
      console.log('💰 [ACTIVATE] Ativando créditos via PIX...');
      // A ativação do PIX geralmente é via webhook no Asaas, 
      // mas se o usuário clicar em "Já Paguei", podemos forçar verificação
      // Para créditos, o verify-payment-status já deve cuidar disso se o webhook funcionar.
      // Aqui apenas redirecionamos se for sucesso.
      return;
    }

    // Para planos de website ou app-developer-plan, usar planService (pagamento por serviço)
    if (isWebsitePlan || selectedPlan === 'app-developer-plan') {
      console.log('🌐 [ACTIVATE] Usando planService para website/landing page...');

      const websiteId = searchParams.get('websiteId');
      const landingPageId = searchParams.get('landingPageId');
      const websiteName = selectedPlanObj?.name || 'Website';

      try {
        await activatePlanService(
          user.id,
          selectedPlan,
          paymentId || '',
          websiteName,
          selectedPlan === 'app-developer-plan' ? (landingPageId || undefined) : (websiteId || undefined),
          billingType === 'PIX' ? 'pix' : 'stripe'
        );

        console.log('✅ [ACTIVATE] Website/Landing page ativado via planService');
        return;
      } catch (error) {
        console.error('❌ [ACTIVATE] Erro ao ativar website/landing page:', error);
        throw error;
      }
    }

    // Para planos de assinatura (WhatsApp, Ligações), usar lógica atual
    console.log('📅 [ACTIVATE] Ativando plano de assinatura...');

    // Calcular datas de recorrência
    const now = new Date();

    let nextBillingDate: Date;
    if (isRenewal && profile?.plan_expires_at) {
      // Para renovações, calcular a partir da data de vencimento atual + 30 dias
      nextBillingDate = new Date(profile.plan_expires_at);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      console.log('🔄 [ACTIVATE] Renovação: calculando nova expiração baseada em vencimento atual');
    } else {
      // Para novas contratações, calcular a partir de agora + 30 dias
      nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const { error: activateError } = await supabase
      .from('profiles')
      .update({
        // Ativar plano
        agendamentos_active: true,
        monthly_plan_active: true,
        annual_plan_active: false,
        billing_cycle: 'monthly',

        // Sistema de recorrência
        payment_status: 'paid',
        asaas_payment_id: paymentId || null,
        next_billing_date: nextBillingDate.toISOString(),
        last_payment_date: now.toISOString(),
        plan_expires_at: nextBillingDate.toISOString(),

        // Limpar bloqueios e atrasos
        access_blocked: false,
        access_blocked_reason: null,
        payment_overdue_days: 0,
        grace_period_end: null,
        last_overdue_check: now.toISOString()
      })
      .eq('id', user.id);

    if (activateError) throw activateError;

    // Limpar cache do perfil
    const userId = user.id;
    const cachePrefix = 'kito_expert_cache_';
    const keys = Object.keys(localStorage);
    const userCacheKeys = keys.filter(key => key.startsWith(`${cachePrefix}${userId}_`));
    userCacheKeys.forEach(key => localStorage.removeItem(key));

    console.log('✅ [ACTIVATE] Plano de assinatura ativado com recorrência completa', {
      selectedPlan: selectedPlanObj?.name,
      isRenewal,
      nextBillingDate: nextBillingDate.toISOString()
    });
  };

  const handleCopyPayload = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      alert('Código PIX copiado!');
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

  const selectedPlanData = plans?.find(plan => plan.id === selectedPlan);

  if (currentStep === 'data') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {planParam === 'credits' ? 'Compra de Créditos' : (isRenewal ? 'Renovação de Plano' : 'Contratação Direta')}
            </h1>
            <p className="text-gray-400">
              {planParam === 'credits'
                ? 'Adquira créditos para utilizar o Agente de Ligações.'
                : (isRenewal
                  ? 'Pague antecipadamente para renovar seu plano e manter o acesso contínuo.'
                  : planParam === 'app-developer-plan'
                    ? 'Contrate agora o Plano App Developer para desenvolvimento completo de aplicativos.'
                    : `Você já utilizou seu período de teste. Contrate agora para continuar usando o ${planParam === 'ligacoes'
                      ? 'Agente de Ligações'
                      : (planParam === 'website' || planParam === 'website-lawyer')
                        ? 'Agente de Websites'
                        : 'Agente WhatsApp'
                    }.`)
              }
            </p>
            {reason === 'trial_used' && !isRenewal && (
              <div className="mt-4 p-4 bg-yellow-100/10 border border-yellow-400/20 text-yellow-400 rounded-lg">
                <p className="text-sm">Seu período de teste gratuito expirou.</p>
              </div>
            )}
            {isRenewal && (
              <div className="mt-4 p-4 bg-green-100/10 border border-green-400/20 text-green-400 rounded-lg">
                <p className="text-sm">Renovação antecipada do plano mensal.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100/10 border border-red-400/20 text-red-400 rounded-lg">
              <strong>Erro Detalhado:</strong><br />
              {error}
            </div>
          )}

          {/* Plano Selecionado */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-6">
              {planParam === 'credits' ? 'Pacote Selecionado' : 'Plano Selecionado'}
            </h3>
            {(selectedPlanData || selectedPlan === 'app-developer-plan' || (planParam === 'credits' && creditPackage)) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-lg">
                      {planParam === 'credits'
                        ? creditPackage?.name
                        : (selectedPlan === 'app-developer-plan' ? 'Plano App Developer' : selectedPlanData?.name)}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {planParam === 'credits'
                        ? `${creditPackage?.credits_amount} créditos para ligações`
                        : (selectedPlan === 'app-developer-plan'
                          ? 'Desenvolvimento de aplicativos mobile e web com entrega completa'
                          : selectedPlanData?.description)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      R$ {planParam === 'credits'
                        ? parseFloat(creditPackage?.price ?? '0').toFixed(2)
                        : (selectedPlan === 'app-developer-plan'
                          ? '7000.00'
                          : (isRenewal && renewalAmount
                            ? parseFloat(renewalAmount ?? '0').toFixed(2)
                            : parseFloat((selectedPlanData?.monthly_price || selectedPlanData?.price) ?? '0').toFixed(2)))
                      }
                      <span className="text-sm font-medium text-gray-400">
                        {planParam === 'credits' || selectedPlan === 'app-developer-plan' || selectedPlanData?.billing_cycle === 'one_time' || selectedPlanData?.id?.startsWith('website-lawyer') ? ' (único)' : '/mês'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Método de Pagamento */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-6">Método de Pagamento</h3>
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${billingType === 'PIX'
                  ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
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
                    <h4 className="font-medium text-white">PIX</h4>
                    <p className="text-sm text-gray-400">
                      Pagamento instantâneo e gratuito
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${billingType === 'CREDIT_CARD'
                  ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
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
                    <h4 className="font-medium text-white">Cartão de Crédito</h4>
                    <p className="text-sm text-gray-400">
                      Parcelamento automático mensal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!hasCompleteData()) {
                setShowDataModal(true);
              } else {
                handleDataConfirmation();
              }
            }}
            disabled={loading || (!selectedPlan && !creditPackage)}
            className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${!loading && (selectedPlan || creditPackage) && hasCompleteData()
              ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
          >
            <span className="relative z-10">
              {loading ? 'Processando...' : 'Continuar para Pagamento'}
            </span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Ao contratar o plano, você concorda com nossos termos de serviço.
            O pagamento será processado na próxima etapa.
          </p>
        </div>

        {/* Modal de Coleta de Dados */}
        <PaymentDataModal
          isOpen={showDataModal}
          onClose={() => setShowDataModal(false)}
          onConfirm={(data) => {
            // Dados já foram salvos no modal, agora prosseguir para etapa de pagamento
            handleDataConfirmation();
          }}
          selectedPlan={selectedPlanData || null}
          billingType={billingType}
          onBillingTypeChange={setBillingType}
        />
      </div>
    );
  }

  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Processar Pagamento</h1>
            <p className="text-gray-400">
              Complete o pagamento para ativar seu plano
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-100/10 border border-red-400/20 text-red-400 rounded-lg">
              <strong>Erro Detalhado:</strong><br />
              {error}
            </div>
          )}

          {billingType === 'PIX' ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">Pagamento PIX</h3>
                  <p className="text-sm text-gray-400">Clique no botão abaixo para gerar o QR Code</p>
                </div>

                <button
                  onClick={handlePixPayment}
                  disabled={loading || (!selectedPlanData && !creditPackage)}
                  className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${!loading && (selectedPlanData || creditPackage)
                    ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <span className="relative z-10">
                    {loading ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                  </span>
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">Pagamento com Cartão</h3>
                  <p className="text-sm text-gray-400">Selecione o número de parcelas e clique no botão abaixo</p>
                </div>

                {/* Seletor de Parcelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número de Parcelas
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#c4d82e]/50 focus:outline-none transition-colors"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num} className="bg-gray-800">
                        {num}x {selectedPlanData && `R$ ${((selectedPlanData.monthly_price || selectedPlanData.price) / num).toFixed(2)}`}
                      </option>
                    ))}
                  </select>
                  {selectedPlanData && (
                    <p className="text-xs text-gray-400 mt-1">
                      Total: R$ {(selectedPlanData.monthly_price || selectedPlanData.price).toFixed(2)} em {installments}x de R$ {((selectedPlanData.monthly_price || selectedPlanData.price) / installments).toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCreditCardPayment}
                  disabled={loading || (!selectedPlanData && selectedPlan !== 'app-developer-plan' && !creditPackage) || !!clientSecret}
                  className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${!loading && (selectedPlanData || selectedPlan === 'app-developer-plan' || creditPackage) && !clientSecret
                    ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <span className="relative z-10">
                    {loading ? 'Iniciando Pagamento...' : clientSecret ? 'Pagamento Iniciado!' : 'Iniciar Pagamento'}
                  </span>
                  {!loading && !clientSecret && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  )}
                </button>

                {clientSecret && (
                  <Elements stripe={stripePromise}>
                    <CreditCardForm clientSecret={clientSecret} onPaymentSuccess={handleStripePaymentSuccess} installments={installments} />
                  </Elements>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => setCurrentStep('data')}
              className="w-full py-3 px-4 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors"
            >
              ← Voltar
            </button>

          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'stripe_payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Pagamento com Cartão</h1>
            <p className="text-gray-400">
              Preencha os dados do cartão para processar o pagamento
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-100/10 border border-red-400/20 text-red-400 rounded-lg">
              <strong>Erro Detalhado:</strong><br />
              {error}
            </div>
          )}

          <Elements stripe={stripePromise}>
            <CreditCardForm clientSecret={clientSecret} onPaymentSuccess={handleStripePaymentSuccess} />
          </Elements>

          <button
            onClick={() => setCurrentStep('payment')}
            className="w-full py-3 px-4 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Pagamento PIX</h1>
            <p className="text-gray-400">
              Escaneie o QR Code ou copie o código para pagar
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-100/10 border border-red-400/20 text-red-400 rounded-lg">
              <strong>Erro Detalhado:</strong><br />
              {error}
            </div>
          )}

          {pixData && (
            <PixQRCode
              qrCodeBase64={pixData.qrCodeBase64}
              payload={pixData.payload}
              onCopyPayload={handleCopyPayload}
            />
          )}

          <div className="space-y-4">
            <button
              onClick={handleVerifyPixPayment}
              disabled={loading}
              className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${!loading
                ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span className="relative z-10">
                {loading ? 'Verificando Pagamento...' : 'Já Paguei - Verificar e Ativar'}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentStep('payment')}
              className="w-full py-3 px-4 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DirectPaymentPage;