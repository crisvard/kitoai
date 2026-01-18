import { useState, useEffect } from 'react';
import TopBar from './TopBar';
import ServiceCard from './ServiceCard';
import ClientInfo from './ClientInfo';
import { MessageSquare, Phone, Calendar, Code, TrendingUp, Megaphone, BarChart3 } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCache } from '../hooks/useCache';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
}

interface Plan {
  id: string;
  name: string;
  serviceIds: string[];
  price: string;
  period: string;
  features: string[];
  isActive: boolean;
  isContracted: boolean;
  isCombo?: boolean;
  contractDate?: string;
  billingCycle?: 'monthly' | 'yearly';
}

interface DashboardProps {
  onNavigateToWhatsapp: () => void;
  onNavigateToWhatsAppSetup: () => void;
  onNavigateToDialer: () => void;
  onNavigateToAccount: () => void;
  onNavigateToScheduler: () => void;
  onNavigateToFranchises: () => void;
}

function Dashboard({ onNavigateToAccount, onNavigateToWhatsapp, onNavigateToWhatsAppSetup, onNavigateToDialer, onNavigateToScheduler, onNavigateToFranchises }: DashboardProps) {
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useUserProfile();
  const { clearUserCache } = useCache();

  // Não forçar refresh automático - deixar o useUserProfile gerenciar o cache

  const [servicesState, setServicesState] = useState<Service[]>([]);
  const [selectedComboServices, setSelectedComboServices] = useState<string[]>([]);
  const [transitionLoading, setTransitionLoading] = useState(false);

  // Flag para ocultar a seção de Planos Disponíveis
  const hidePlansSection = true;

  const plans: Plan[] = [
    {
      id: '1',
      name: 'Agente de Ligações',
      serviceIds: ['2'],
      price: 'R$ 299',
      period: '/mês',
      features: [
        'Até 10.000 ligações/mês',
        'IA de voz natural',
        'Relatórios detalhados',
        'Suporte prioritário',
      ],
      isActive: true,
      isContracted: profile?.ligacoes_active || false,
      contractDate: profile?.ligacoes_activation_date || undefined,
      billingCycle: 'monthly',
    },
    // OCULTADO: Plano Agente de WhatsApp (id: '2')
    // {
    //   id: '2',
    //   name: 'Agente de Desenvolvimento',
    //   serviceIds: ['1'],
    //   price: 'R$ 199',
    //   period: '/mês',
    //   features: [
    //     'Agente WhatsApp com IA avançada',
    //     'Até 5.000 mensagens/mês',
    //     'Integração com N8N e Gemini',
    //     'Respostas automáticas inteligentes',
    //   ],
    //   isActive: true,
    //   isContracted: profile?.whatsapp_active || false,
    //   contractDate: profile?.whatsapp_activation_date || undefined,
    //   billingCycle: 'monthly',
    // },
    {
      id: '3',
      name: 'Agente de WhatsApp',
      serviceIds: ['3'],
      price: 'R$ 195',
      period: '/mês',
      features: [
        'Agente inteligente de WhatsApp',
        'Gestão de conversações',
        'Respostas automáticas inteligentes',
        'Relatórios de performance',
      ],
      isActive: true,
      isContracted: profile?.agendamentos_active || false,
      contractDate: profile?.agendamentos_activation_date || undefined,
      billingCycle: 'monthly',
    },
    // OCULTADO: Plano Combo Personalizado (id: '4')
    // {
    //   id: '4',
    //   name: 'Plano Combo Personalizado',
    //   serviceIds: [],
    //   price: 'R$ 299',
    //   period: '/mês',
    //   features: [
    //     'Integração entre agentes',
    //     'Suporte prioritário',
    //     'Relatórios avançados',
    //     'Painel unificado',
    //   ],
    //   isActive: false,
    //   isContracted: false,
    //   isCombo: true,
    // },
  ];

  useEffect(() => {
    console.log('Dashboard: Profile updated:', {
      agendamentos_active: profile?.agendamentos_active,
      trial_active: profile?.trial_active,
      trial_end_date: profile?.trial_end_date,
      full_profile: profile
    });

    // Verificar se usuário é novo (sem trial ativo e sem planos contratados, e nunca completou trial)
    const isNewUser = !profile?.trial_active && !profile?.agendamentos_active && !profile?.ligacoes_active && !profile?.trial_completed;
    // const hasSeenWelcomeBanner = localStorage.getItem('has_seen_welcome_banner') === 'true';

    // Removido: Mostrar banner apenas para usuários novos que ainda não viram
    // setShowWelcomeBanner(isNewUser && !hasSeenWelcomeBanner);

    const services: Service[] = [
      // OCULTO: Agente Modelo de WhatsApp
      {
        id: '1',
        name: 'Agente de Desenvolvimento',
        description: 'Sistema de controle de dados e esteira para desenvolvimento de sites e apps',
        icon: <Code className="w-8 h-8" />,
        isActive: true, // Sempre ativo - acesso liberado
      },
      {
        id: '2',
        name: 'Agente de Ligações',
        description: 'Agente de voz com fala humana e natural, capaz de realizar ligações automáticas',
        icon: <Phone className="w-8 h-8" />,
        isActive: profile?.ligacoes_active || false,
      },
      {
        id: '3',
        name: 'Agente de WhatsApp',
        description: 'Agente inteligente de automação WhatsApp para agendamentos',
        icon: <Calendar className="w-8 h-8" />,
        isActive: profile?.agendamentos_active || false,
      },
      {
        id: '4',
        name: 'Agente de Negociações',
        description: 'Sistema inteligente para negociações e fechamento de vendas',
        icon: <TrendingUp className="w-8 h-8" />,
        isActive: false, // Sempre ativo - acesso liberado
      },
      {
        id: '5',
        name: 'Agente de Marketing',
        description: 'Sistema completo de marketing digital e automação de campanhas',
        icon: <BarChart3 className="w-8 h-8" />,
        isActive: false, // Sempre ativo - acesso liberado
      },
    ];
    setServicesState(services);

    const preSelectedServices = plans
      .filter((plan: Plan) => plan.isContracted && !plan.isCombo)
      .flatMap((plan: Plan) => plan.serviceIds);
    setSelectedComboServices(preSelectedServices);
  }, [profile]);

  // Detectar transição do trial
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromTrial = urlParams.get('from_trial');

    console.log('Dashboard: Checking for from_trial parameter:', fromTrial);

    if (fromTrial) {
      console.log('Dashboard: from_trial detected, forcing profile refresh...');
      setTransitionLoading(true);
      // Limpar URL
      window.history.replaceState({}, '', '/dashboard');

      // Forçar refresh do perfil
      refreshProfile().finally(() => {
        setTransitionLoading(false);
      });
    }
  }, [refreshProfile]);

  if (profileLoading || transitionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {transitionLoading ? 'Configurando seu trial...' : 'Carregando dados do dashboard...'}
          </div>
          {transitionLoading && (
            <div className="text-gray-400 text-sm mt-2">
              Preparando seu acesso gratuito
            </div>
          )}
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-red-500 text-xl">Erro ao carregar dados: {profileError}</div>
      </div>
    );
  }

  const handleConfigure = (id: string) => {
    // Agente de Desenvolvimento (id '1') - Sempre acessível para websites
    if (id === '1') {
      window.location.href = '/websites';
      return;
    }
    if (id === '2') {
      onNavigateToDialer();
      return;
    }
    if (id === '3') {
      // Redirecionar para página de gerenciamento de franquias
      window.location.href = '/franchises';
      return;
    }
    if (id === '4') {
      // Redirecionar para página de negociações
      window.location.href = '/negociacoes';
      return;
    }
    if (id === '5') {
      // Redirecionar para página de marketing
      window.location.href = '/marketing';
      return;
    }

    console.log('Configure service:', id);
  };

  const toggleComboService = (serviceId: string) => {
    setSelectedComboServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Gerar plano combo dinamicamente
  const generateComboPlan = (): Plan => {
    const comboFeatures = [
      // OCULTO: Agente Modelo de WhatsApp
      ...(selectedComboServices.includes('1') ? ['Agente Modelo de WhatsApp completo', 'Até 5.000 mensagens/mês'] : []),
      ...(selectedComboServices.includes('2') ? ['Agente de Ligações', 'Até 10.000 ligações/mês'] : []),
      ...(selectedComboServices.includes('3') ? ['Agente de WhatsApp', 'Agendamento inteligente via WhatsApp'] : []),
      ...(selectedComboServices.includes('4') ? ['Agente de Negociações', 'Sistema inteligente de vendas e negociações'] : []),
      ...(selectedComboServices.includes('5') ? ['Agente de Marketing', 'Sistema completo de marketing digital'] : []),
      'Integração entre agentes',
      'Suporte prioritário',
      'Relatórios avançados',
      'Painel unificado',
    ];

    return {
      id: '4',
      name: `Combo`,
      serviceIds: selectedComboServices,
      price: selectedComboServices.length === 2 ? 'R$ 499' : selectedComboServices.length === 3 ? 'R$ 699' : selectedComboServices.length === 4 ? 'R$ 899' : selectedComboServices.length === 5 ? 'R$ 1.099' : 'R$ 299',
      period: '/mês',
      features: comboFeatures,
      isActive: false,
      isContracted: false,
      isCombo: true,
    };
  };

  const comboPlan = generateComboPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      <TopBar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Removido: Banner de Boas-Vindas para Novos Usuários */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Services Section */}
          <div className="xl:col-span-3">
            {/* Agents Section - First */}
            <div className="mb-12">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Meus Agentes</h2>
                <p className="text-gray-400">Gerencie seus agentes de automação</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {servicesState.map(service => {
                  const isContracted = plans.some(plan => plan.serviceIds.includes(service.id) && plan.isContracted) || 
                    service.id === '1' || // Agente de Desenvolvimento sempre liberado
                    (service.id === '4' && profile?.negociacoes_active) || // Negociações baseado no plano
                    (service.id === '5' && profile?.marketing_active); // Marketing baseado no plano
                  console.log(`Service ${service.id}: isActive=${service.isActive}, isContracted=${isContracted}`);
                  // OCULTO: Agente Modelo de WhatsApp (id '1')
                  const setupText = service.id === '1' && !profile?.whatsapp_active ? 'Configurar Agente' : undefined;
                  return (
                    <div key={service.id} className="flex">
                      <ServiceCard
                        service={service}
                        onConfigure={() => handleConfigure(service.id)}
                        isContracted={isContracted}
                        setupText={setupText}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plans Section - Second */}
            {(() => {
              // Calcular planos disponíveis para decidir se mostra a seção
              const availablePlans = plans.filter(plan => {
                if (plan.id === '3') {
                  if (profile?.trial_active || profile?.monthly_plan_active || profile?.annual_plan_active || profile?.agendamentos_active) {
                    return false;
                  }
                }
                if (plan.id === '1') {
                  if (profile?.trial_ligacoes_active || profile?.ligacoes_monthly_plan_active || profile?.ligacoes_annual_plan_active || profile?.ligacoes_active) {
                    return false;
                  }
                }
                return !plan.isContracted && !plan.isCombo;
              });
              
              // Se não houver planos disponíveis ou seção estiver oculta, não renderiza nada
              if (availablePlans.length === 0 || hidePlansSection) return null;
              
              return (
            <div className="mb-12">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Planos Disponíveis</h2>
                <p className="text-gray-400">Escolha o plano ideal para seus agentes</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                {/* Planos Disponíveis */}
                {plans.filter(plan => {
                  // === PLANO WHATSAPP (id: '3') ===
                  if (plan.id === '3') {
                    // Esconder se trial ativo OU plano pago ativo OU agendamentos ativo
                    if (profile?.trial_active || profile?.monthly_plan_active || profile?.annual_plan_active || profile?.agendamentos_active) {
                      return false;
                    }
                  }
                  // === PLANO LIGAÇÕES (id: '1') ===
                  if (plan.id === '1') {
                    // Esconder se trial ligações ativo OU plano pago ligações ativo OU ligações ativo
                    if (profile?.trial_ligacoes_active || profile?.ligacoes_monthly_plan_active || profile?.ligacoes_annual_plan_active || profile?.ligacoes_active) {
                      return false;
                    }
                  }
                  return !plan.isContracted && !plan.isCombo;
                }).map((plan, index) => {
                  const planServices = servicesState.filter(s => plan.serviceIds.includes(s.id));
                  return (
                    <div
                      key={plan.id}
                      className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#c4d82e]/40 rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-[#c4d82e]/20 hover:-translate-y-2 animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#c4d82e]/10">
                                {/* Modern Plan Icons */}
                                {plan.id === '1' ? (
                                  // Phone Plan Icon with Animation
                                  <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <linearGradient id="planPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#c4d82e" />
                                        <stop offset="100%" stopColor="#b5c928" />
                                      </linearGradient>
                                    </defs>
                                    <rect x="4" y="2" width="16" height="20" rx="3" ry="3" fill="none" stroke="url(#planPhoneGrad)" strokeWidth="2"/>
                                    <circle cx="12" cy="18" r="1.5" fill="url(#planPhoneGrad)" className="animate-pulse"/>
                                    <rect x="8" y="6" width="8" height="1" rx="0.5" fill="url(#planPhoneGrad)"/>
                                    <rect x="10" y="9" width="4" height="1" rx="0.5" fill="url(#planPhoneGrad)"/>
                                    <path d="M9 12h6l-1 2H10l-1-2z" fill="url(#planPhoneGrad)"/>

                                    {/* Animated signal indicator */}
                                    <circle cx="18" cy="4" r="1.5" fill="url(#planPhoneGrad)" className="animate-ping animation-delay-300"/>
                                  </svg>
                                ) : plan.id === '3' ? (
                                  // WhatsApp Business Plan Icon with Animation
                                  <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <linearGradient id="planWhatsappBusinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#c4d82e" />
                                        <stop offset="100%" stopColor="#b5c928" />
                                      </linearGradient>
                                    </defs>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" fill="url(#planWhatsappBusinessGrad)"/>

                                    {/* Animated notification indicator */}
                                    <circle cx="20" cy="4" r="2" fill="currentColor" className="animate-bounce animation-delay-500"/>
                                  </svg>
                                ) : (
                                  planServices[0]?.icon
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#c4d82e] rounded-full animate-pulse"></div>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white group-hover:text-[#c4d82e] transition-colors duration-300 mb-1">
                                {plan.name}
                              </h3>
                              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                Plano Individual
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-3xl font-black text-white group-hover:text-[#c4d82e] transition-colors duration-300 mb-1">
                              {plan.price}
                            </div>
                            <div className="text-sm text-gray-400 font-medium">
                              {plan.period}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-8">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-3 group/feature animate-fade-in-left"
                              style={{ animationDelay: `${(index * 100) + (idx * 50)}ms` }}
                            >
                              <div className="w-5 h-5 bg-[#c4d82e]/20 rounded-full flex items-center justify-center group-hover/feature:bg-[#c4d82e]/30 transition-colors duration-200">
                                <span className="text-[#c4d82e] text-xs font-bold">✓</span>
                              </div>
                              <span className="text-gray-300 text-sm group-hover/feature:text-white transition-colors duration-200">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>


                        <button
                          onClick={() => {
                            if (plan.id === '3') {
                              // Plano WhatsApp - Verificar se usuário já completou trial
                              if (profile?.trial_completed) {
                                // Usuário já usou trial, redirecionar para contratação direta
                                window.location.href = '/direct-payment?reason=trial_used';
                              } else {
                                // Primeiro trial, redirecionar para confirmação
                                window.location.href = '/trial-confirmation';
                              }
                            } else if (plan.id === '1') {
                              // Plano Ligações - Verificar se usuário já completou trial de ligações
                              if (profile?.ligacoes_trial_completed) {
                                // Usuário já usou trial de ligações, redirecionar para contratação direta
                                window.location.href = '/direct-payment?reason=trial_used&plan=ligacoes';
                              } else {
                                // Primeiro trial de ligações, redirecionar para confirmação
                                window.location.href = '/trial-ligacoes';
                              }
                            } else {
                              // Para outros planos, pode implementar contratação direta
                              console.log('Contratar plano:', plan.id);
                            }
                          }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-[#c4d82e]/40 hover:scale-[1.02] active:scale-[0.98] group/btn"
                        >
                          <span className="relative z-10">
                            {(plan.id === '3' && profile?.trial_completed) || (plan.id === '1' && profile?.ligacoes_trial_completed) 
                              ? 'Contratar Agora' 
                              : 'Testar Gratuitamente'}
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* OCULTADO: Plano Combo Especial */}
                {/* {[comboPlan].map(plan => {
                  const availableServices = servicesState.filter(service => !plans.some(p => p.serviceIds.includes(service.id) && p.isContracted));
                  return (
                    <div key={plan.id} className="group relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/20 hover:border-[#c4d82e]/50 rounded-3xl p-8 transition-all duration-700 hover:shadow-2xl hover:shadow-[#c4d82e]/30 hover:-translate-y-3 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/30 to-[#c4d82e]/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-[#c4d82e]/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
                                <svg className="w-8 h-8 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <linearGradient id="comboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#c4d82e" />
                                      <stop offset="50%" stopColor="#b5c928" />
                                      <stop offset="100%" stopColor="#a6c025" />
                                    </linearGradient>
                                    <linearGradient id="comboGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                                      <stop offset="100%" stopColor="#c4d82e" stopOpacity="0.4" />
                                    </linearGradient>
                                  </defs>
                                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="url(#comboGrad)" stroke="url(#comboGlow)" strokeWidth="0.5"/>
                                  <rect x="4" y="8" width="16" height="8" rx="1" fill="none" stroke="url(#comboGlow)" strokeWidth="0.3" opacity="0.6"/>
                                  <circle cx="7" cy="10" r="1.5" fill="url(#comboGlow)" className="animate-pulse"/>
                                  <circle cx="12" cy="10" r="1.5" fill="url(#comboGlow)" className="animate-pulse animation-delay-300"/>
                                  <circle cx="17" cy="10" r="1.5" fill="url(#comboGlow)" className="animate-pulse animation-delay-500"/>
                                  <circle cx="7" cy="14" r="1.5" fill="url(#comboGlow)" className="animate-pulse animation-delay-100"/>
                                  <circle cx="12" cy="14" r="1.5" fill="url(#comboGlow)" className="animate-pulse animation-delay-400"/>
                                  <path d="M19 4l1.5 3L23 7.5L20.5 10L21 13L19 11.5L17 13L17.5 10L15 7.5L18.5 7L19 4Z" fill="url(#comboGlow)" className="animate-bounce"/>
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#c4d82e] to-[#b5c928] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <span className="text-black text-xs font-bold">{selectedComboServices.length}</span>
                                  </div>
                                </svg>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-black text-xs font-bold">★</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-white group-hover:text-[#c4d82e] transition-colors duration-300 mb-1">
                                {plan.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                  Personalizável
                                </span>
                                <span className="text-xs bg-gradient-to-r from-[#c4d82e]/20 to-[#c4d82e]/10 text-[#c4d82e] px-3 py-1 rounded-full font-bold border border-[#c4d82e]/30">
                                  COMBO PREMIUM
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-4xl font-black text-white group-hover:text-[#c4d82e] transition-colors duration-300 mb-1">
                              {plan.price}
                            </div>
                            <div className="text-sm text-gray-400 font-medium">
                              {plan.period}
                            </div>
                            <div className="text-xs text-[#c4d82e]/80 font-semibold mt-1">
                              {selectedComboServices.length} agentes selecionados
                            </div>
                          </div>
                        </div>
                        <div className="mb-8">
                          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                            <span className="w-2 h-2 bg-[#c4d82e] rounded-full mr-3 animate-pulse"></span>
                            Selecione os Agentes para o Combo
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {servicesState.map((service, idx) => (
                              <button
                                key={service.id}
                                onClick={() => toggleComboService(service.id)}
                                className={`group/agent relative overflow-hidden p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                                  selectedComboServices.includes(service.id)
                                    ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 shadow-lg shadow-[#c4d82e]/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                } animate-fade-in-up`}
                                style={{ animationDelay: `${400 + (idx * 100)}ms` }}
                              >
                                <div className="flex flex-col items-center space-y-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                                    selectedComboServices.includes(service.id)
                                      ? 'bg-[#c4d82e]/20 text-[#c4d82e] shadow-lg shadow-[#c4d82e]/20'
                                      : 'bg-[#3a3a3a] text-gray-400 group-hover:text-[#c4d82e] group-hover:bg-[#c4d82e]/10'
                                  }`}>
                                    {service.id === '2' ? (
                                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                          <linearGradient id="comboPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="currentColor" />
                                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                                          </linearGradient>
                                        </defs>
                                        <rect x="4" y="2" width="16" height="20" rx="3" ry="3" fill="none" stroke="url(#comboPhoneGrad)" strokeWidth="2"/>
                                        <circle cx="12" cy="18" r="1.5" fill="url(#comboPhoneGrad)" className="animate-pulse"/>
                                        <rect x="8" y="6" width="8" height="1" rx="0.5" fill="url(#comboPhoneGrad)"/>
                                        <rect x="10" y="9" width="4" height="1" rx="0.5" fill="url(#comboPhoneGrad)"/>
                                        <path d="M9 12h6l-1 2H10l-1-2z" fill="url(#comboPhoneGrad)"/>
                                        <circle cx="18" cy="4" r="1.5" fill="currentColor" className="animate-ping"/>
                                      </svg>
                                    ) : service.id === '3' ? (
                                      <svg className="w-6 h-6 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                          <linearGradient id="comboWhatsappBusinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="currentColor" />
                                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                                          </linearGradient>
                                        </defs>
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" fill="url(#comboWhatsappBusinessGrad)"/>
                                        <circle cx="18" cy="4" r="1" fill="currentColor" className="animate-ping animation-delay-300"/>
                                      </svg>
                                    ) : (
                                      service.icon
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <span className={`text-xs font-bold transition-colors duration-300 ${
                                      selectedComboServices.includes(service.id)
                                        ? 'text-[#c4d82e]'
                                        : 'text-gray-300 group-hover/agent:text-white'
                                    }`}>
                                      {service.name.replace('Agente de ', '').replace('Sistema de ', '')}
                                    </span>
                                  </div>
                                </div>
                                {selectedComboServices.includes(service.id) && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-[#c4d82e] rounded-full flex items-center justify-center animate-bounce">
                                    <span className="text-black text-xs font-bold">✓</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                          {plan.features.slice(0, 6).map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-3 group/feature animate-fade-in-left"
                              style={{ animationDelay: `${600 + (idx * 50)}ms` }}
                            >
                              <div className="w-6 h-6 bg-[#c4d82e]/20 rounded-full flex items-center justify-center group-hover/feature:bg-[#c4d82e]/30 transition-colors duration-200">
                                <span className="text-[#c4d82e] text-xs font-bold">✓</span>
                              </div>
                              <span className="text-gray-300 text-sm group-hover/feature:text-white transition-colors duration-200">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                            selectedComboServices.length === 0
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
                          }`}
                          disabled={selectedComboServices.length === 0}
                        >
                          <span className="relative z-10">
                            {selectedComboServices.length === 0
                              ? '✨ Selecione seus agentes'
                              : `🚀 Contratar Combo Premium (${selectedComboServices.length} agentes)`
                            }
                          </span>
                          {selectedComboServices.length > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })} */}
              </div>
            </div>
              );
            })()}


          </div>

          {/* Client Info Section */}
          <div className="xl:col-span-1">
            <ClientInfo onNavigateToAccount={onNavigateToAccount} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

