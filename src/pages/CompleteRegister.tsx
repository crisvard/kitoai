import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo1.png';

const CompleteRegister = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTrial, setShowTrial] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string>('');

  // Planos fixos - não busca no banco
  const plans = [
    {
      id: 'ligacoes',
      name: 'Agente de Ligações',
      description: 'Sistema completo de agendamento e gestão de ligações telefônicas',
      monthly_price: 79.90,
      annual_price: 799.00
    },
    {
      id: 'whatsapp',
      name: 'Sistema de Agendamentos',
      description: 'Integração com WhatsApp Business API para atendimento automatizado',
      monthly_price: 39.90,
      annual_price: 399.00
    }
  ];
  const plansLoading = false;
  const { user } = useAuth();

  // Debug: log quando plans mudam
  useEffect(() => {
    if (plans.length > 0) {
      console.log('🎨 Renderizando cards:', plans.map(p => p.name));
    }
  }, [plans]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect to register
      navigate('/register');
    }
  }, [location.state, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!ageConfirmed) {
      alert('Você precisa confirmar que é maior de 18 anos.');
      return;
    }
    if (!termsAccepted) {
      alert('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (!emailConsent) {
      alert('Você precisa autorizar o recebimento de emails promocionais.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Iniciando processo de cadastro...');
      console.log('📧 Email:', email);
      console.log('👤 Nome completo:', fullName);

      // Email já foi verificado, agora criar conta no Supabase Auth normalmente
      console.log('🔐 Criando conta no Supabase Auth...');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error('❌ Erro no signUp:', signUpError);
        throw signUpError;
      }

      console.log('✅ Conta criada no Auth. Dados:', data);

      // Aguardar um pouco para garantir que o usuário foi criado
      console.log('⏳ Aguardando criação do usuário...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        console.error('❌ Erro ao obter usuário:', getUserError);
        throw getUserError;
      }

      if (!user) {
        console.error('❌ Usuário não foi criado');
        throw new Error('Usuário não foi criado');
      }

      console.log('👤 Usuário criado com sucesso:', user.id, user.email);

      // Fazer login automático após cadastro para manter sessão ativa
      console.log('🔐 Fazendo login automático...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        console.error('❌ Erro no login automático:', loginError);
        // Mesmo com erro no login, continua com o cadastro básico
      } else {
        console.log('✅ Login automático realizado com sucesso');
        // Registro na tabela users será criado na primeira visita à "Minha conta"
      }

      // Salvar perfil completo na tabela profiles
      const profileData = {
        id: user.id, // Usar 'id' como chave primária
        full_name: fullName,
        email: email,
        contract_date: new Date().toISOString().split('T')[0],
        monthly_plan_active: false,
        annual_plan_active: false,
        next_monthly_payment: null,
        next_annual_payment: null,
        acquired_plans: [],
        plan_values: [],
        whatsapp_active: false,
        ligacoes_active: false,
        agendamentos_active: false,
        whatsapp_activation_date: null,
        ligacoes_activation_date: null,
        agendamentos_activation_date: null,
        credits: 0,
        person_type: 'PF', // Pessoa Física por padrão
        cpf: '',
        cnpj: '',
        razao_social: '',
        data_nascimento: '',
        phone: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        billing_cycle: 'monthly'
      };

      console.log('💾 Salvando na tabela profiles...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error('Erro ao salvar perfil completo:', profileError);
      } else {
        console.log('✅ Dados salvos na tabela profiles');
      }

      // alert('Conta criada com sucesso! Agora vamos configurar seu plano de teste.');
      setShowTrial(true);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      alert('Erro ao criar conta: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!user || !selectedPlan) return;

    setTrialLoading(true);
    setTrialError('');

    try {
      // 1. Criar cliente no Asaas se não existir
      const { data: customerData, error: customerError } = await supabase.functions.invoke('create-asaas-customer');

      if (customerError) throw customerError;

      // 2. Criar assinatura no Asaas
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          planId: selectedPlan,
          billingType: billingType,
          creditCardToken: billingType === 'CREDIT_CARD' ? 'simulated_token' : undefined // Simulado por enquanto
        }
      });

      if (subscriptionError) throw subscriptionError;

      // 3. Iniciar trial no banco local
      const { data: trialData, error: trialError } = await supabase.functions.invoke('start-trial', {
        body: { planId: selectedPlan }
      });

      if (trialError) throw trialError;

      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Erro ao iniciar trial:', err);
      setTrialError('Erro ao iniciar período de teste. Tente novamente.');
    } finally {
      setTrialLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !ageConfirmed || !termsAccepted || !emailConsent;

  return (
    <div style={{
      backgroundColor: '#1E1E20',
      color: '#717171',
      fontFamily: 'Inter, sans-serif',
      margin: 0,
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Background blur elements */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        backgroundColor: '#717171',
        top: 0,
        right: 0,
        borderRadius: '10px 30px 600px 100px',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        backgroundColor: '#717171',
        bottom: 0,
        left: 0,
        borderRadius: '100px 30px 600px 100px',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }}></div>

      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <a href="http://localhost:5173/" style={{ display: 'block', textDecoration: 'none' }}>
          <img
            src={logo}
            alt="Kito Expert Logo"
            style={{
              width: '240px',
              height: 'auto',
              margin: 'auto',
              display: 'block',
              marginBottom: '30px'
            }}
          />
        </a>
        <h1 style={{
          fontWeight: 500,
          color: '#fff',
          fontSize: 'x-large',
          marginBottom: '10px'
        }}>Completar Cadastro</h1>
        <p style={{ marginBottom: '10px' }}>
          Finalize seu cadastro no Kito Expert Dashboard
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSignup} style={{
        display: 'flex',
        margin: 'auto',
        marginBlock: '30px',
        width: 'min(300px, 90vw)',
        gap: '15px',
        flexWrap: 'wrap'
      }}>

        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Seu nome completo"
          required
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#1C1C1E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717188',
            transition: 'background-image 0.5s, opacity .5s, border .5s',
            color: '#fff',
            width: '100%'
          }}
        />

        <input
          type="email"
          value={email}
          disabled
          placeholder="Seu email"
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#2C2C2E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717144',
            color: '#717171',
            width: '100%',
            cursor: 'not-allowed',
            opacity: 0.7
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          minLength={6}
          required
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#1C1C1E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717188',
            transition: 'background-image 0.5s, opacity .5s, border .5s',
            color: '#fff',
            width: '100%'
          }}
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar senha"
          minLength={6}
          required
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#1C1C1E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717188',
            transition: 'background-image 0.5s, opacity .5s, border .5s',
            color: '#fff',
            width: '100%'
          }}
        />

        <p style={{
          fontSize: 'small',
          textAlign: 'left',
          color: '#717171',
          width: '100%'
        }}>
          A senha deve ter pelo menos 6 caracteres
        </p>

        {/* Checkboxes */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            <span style={{ fontSize: 'small', color: '#717171' }}>
              Confirmo que sou maior de 18 anos
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            <span style={{ fontSize: 'small', color: '#717171' }}>
              Aceito os <a href="/terms-of-use" style={{ color: '#c9f31d' }}>Termos de Uso</a> e <a href="/privacy-policy" style={{ color: '#c9f31d' }}>Política de Privacidade</a>
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            <span style={{ fontSize: 'small', color: '#717171' }}>
              Autorizo o recebimento de emails promocionais
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#c9f31d',
            color: '#000',
            cursor: 'pointer',
            width: '100%',
            opacity: isButtonDisabled ? 0.6 : 1,
            pointerEvents: isButtonDisabled ? 'none' : 'auto'
          }}
        >
          {isLoading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      {/* Seção de Trial */}
      {showTrial && (
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#1C1C1E',
          borderRadius: '15px',
          border: '1px solid #71717188'
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: 'x-large',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Configure seu Plano de Teste Gratuito
          </h2>

          {trialError && (
            <div style={{
              padding: '10px',
              backgroundColor: '#ff4444',
              color: '#fff',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              {trialError}
            </div>
          )}

          {/* Seleção de Plano */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Escolha seu plano:</h3>
            {plansLoading ? (
              <p style={{ color: '#717171' }}>Carregando planos...</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      padding: '15px',
                      border: selectedPlan === plan.id ? '2px solid #c9f31d' : '1px solid #717171',
                      borderRadius: '10px',
                      backgroundColor: selectedPlan === plan.id ? '#c9f31d22' : '#2C2C2E',
                      cursor: 'pointer',
                      flex: '1',
                      minWidth: '200px'
                    }}
                  >
                    <h4 style={{ color: '#fff', margin: '0 0 5px 0' }}>{plan.name}</h4>
                    <p style={{ color: '#717171', fontSize: 'small', margin: '0 0 10px 0' }}>{plan.description}</p>
                    <p style={{ color: '#c9f31d', fontWeight: 'bold', margin: 0 }}>
                      R$ {plan.monthly_price.toFixed(2)}/mês
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Método de Pagamento */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Método de pagamento:</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={billingType === 'PIX'}
                  onChange={() => setBillingType('PIX')}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ color: '#fff' }}>PIX (Recomendado - Gratuito)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={billingType === 'CREDIT_CARD'}
                  onChange={() => setBillingType('CREDIT_CARD')}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ color: '#fff' }}>Cartão de Crédito</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleStartTrial}
            disabled={!selectedPlan || trialLoading}
            style={{
              all: 'unset',
              padding: '15px',
              borderRadius: '15px',
              backgroundColor: '#c9f31d',
              color: '#000',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
              opacity: (!selectedPlan || trialLoading) ? 0.6 : 1,
              pointerEvents: (!selectedPlan || trialLoading) ? 'none' : 'auto'
            }}
          >
            {trialLoading ? 'Configurando Trial...' : 'Iniciar Teste Gratuito de 3 Dias'}
          </button>

          <p style={{
            fontSize: 'small',
            color: '#717171',
            textAlign: 'center',
            marginTop: '15px'
          }}>
            Você terá 3 dias gratuitos. Após esse período, a cobrança será feita automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompleteRegister;