import { useState, useEffect } from 'react';
import { ArrowLeft, User, Building, Mail, MapPin, Calendar, Clock, Save, Edit3, FileText, Phone, CreditCard } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { supabase } from '../lib/supabase';

interface AccountDashboardProps {
  onBack: () => void;
}

function AccountDashboard({ onBack }: AccountDashboardProps) {
  const { profile, loading, error } = useUserProfile();
  const { user } = useAuth();
  const { plans: availablePlans } = usePlans();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');

  const [formData, setFormData] = useState({
    // Dados comuns
    email: '',

    // Pessoa Física
    pf: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      telefone: '',
    },

    // Pessoa Jurídica
    pj: {
      razaoSocial: '',
      cnpj: '',
      telefone: '',
    },

    // Endereço (comum para ambos)
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  });



  useEffect(() => {
    if (profile) {
      setPersonType(profile.person_type === 'pj' ? 'pj' : 'pf');
      setFormData({
        email: profile.email || '',
        pf: {
          nome: profile.full_name || '',
          cpf: profile.cpf || '',
          dataNascimento: profile.data_nascimento || '',
          telefone: profile.phone || '',
        },
        pj: {
          razaoSocial: profile.razao_social || '',
          cnpj: profile.cnpj || '',
          telefone: profile.phone || '',
        },
        endereco: {
          cep: profile.cep || '',
          logradouro: profile.logradouro || '',
          numero: profile.numero || '',
          complemento: profile.complemento || '',
          bairro: profile.bairro || '',
          cidade: profile.cidade || '',
          estado: profile.estado || '',
        },
      });
    }
  }, [profile]);

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => {
      const sectionData = prev[section as keyof typeof prev];
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Salvando dados no Supabase:', formData);
      
      // Preparar dados para salvamento (todos os campos agora disponíveis)
      const userId = profile?.id || user?.id;
      
      console.log('Tentando salvar para user ID:', userId);
      
      // SOLUÇÃO FINAL: Enviar apenas os campos básicos que existem na tabela original
      const dataToSave: any = {
        // Esses campos existem na tabela original database_setup.sql
        full_name: (personType === 'pf' ? formData.pf.nome : formData.pj.razaoSocial)?.trim() || null,
        
        // Adicionar campos básicos que podem existir
        person_type: personType,
        
        // Campos de identificação (vão funcionar se a migração foi executada)
        cpf: formData.pf.cpf?.trim() || null,
        cnpj: formData.pj.cnpj?.trim() || null,
        phone: (personType === 'pf' ? formData.pf.telefone : formData.pj.telefone)?.trim() || null,
        data_nascimento: formData.pf.dataNascimento || null,
        razao_social: formData.pj.razaoSocial?.trim() || null,
        
        // Campos de endereço (vão funcionar se a migração foi executada)
        cep: formData.endereco.cep?.trim() || null,
        logradouro: formData.endereco.logradouro?.trim() || null,
        numero: formData.endereco.numero?.trim() || null,
        complemento: formData.endereco.complemento?.trim() || null,
        bairro: formData.endereco.bairro?.trim() || null,
        cidade: formData.endereco.cidade?.trim() || null,
        estado: formData.endereco.estado || null,
      };

      console.log('Dados a serem salvos (campos básicos):', dataToSave);
      
      // Salvar usando id (campo correto da tabela)
      const { data, error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        alert(`Erro ao salvar dados: ${error.message}. Verifique se o sistema está configurado corretamente.`);
        return;
      } else {
        console.log('Dados salvos com sucesso:', data);
        alert('Dados salvos com sucesso!');
      }

      // Fechar modo de edição
      setIsEditing(false);
      
    } catch (err) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Buscar TODOS os planos contratados baseado nos dados do banco
  const getContractedPlans = () => {
    console.log('📋 [ACCOUNT] Verificando planos contratados:', {
      profile: !!profile,
      availablePlans: availablePlans?.length,
      availablePlansDetails: availablePlans?.map(p => `${p.id}: ${p.name}`),
      // Status dos planos WhatsApp
      trial_active: profile?.trial_active,
      monthly_plan_active: profile?.monthly_plan_active,
      annual_plan_active: profile?.annual_plan_active,
      agendamentos_active: profile?.agendamentos_active,
      // Status dos planos Ligações
      trial_ligacoes_active: profile?.trial_ligacoes_active,
      ligacoes_monthly_plan_active: profile?.ligacoes_monthly_plan_active,
      ligacoes_active: profile?.ligacoes_active,
      // Datas importantes
      created_at: profile?.created_at,
      last_payment_date: profile?.last_payment_date,
      ligacoes_last_payment_date: profile?.ligacoes_last_payment_date
    });

    if (!profile || !availablePlans) {
      console.log('❌ [ACCOUNT] Perfil ou planos não disponíveis');
      return [];
    }

    const contractedPlans: any[] = [];

    // ========== 1. PLANO WHATSAPP (Agendamentos) ==========
    // 1a. Verificar plano pago WhatsApp
    if (profile.monthly_plan_active || profile.annual_plan_active) {
      const planData = availablePlans.find(p => p.id === 'plan-agendamentos');
      if (planData) {
        contractedPlans.push({
          id: planData.id,
          name: planData.name,
          price: `R$ ${planData.monthly_price?.toFixed(2) || '0.00'}`,
          period: '/mês',
          features: Array.isArray(planData.features) ? planData.features : [],
          isActive: true,
          isContracted: true,
          contractDate: profile.last_payment_date,
          nextPaymentDate: profile.plan_expires_at,
          billingCycle: profile.billing_cycle || 'monthly',
          isTrial: false,
          type: 'whatsapp',
          color: '#c4d82e'
        });
        console.log('💰 [ACCOUNT] Plano WhatsApp PAGO detectado');
      }
    }
    // 1b. Verificar trial WhatsApp ativo (apenas se não há plano pago)
    else if (profile.trial_active && profile.agendamentos_active) {
      const planData = availablePlans.find(p => p.id === 'plan-agendamentos');
      if (planData) {
        contractedPlans.push({
          id: planData.id,
          name: `${planData.name} (Trial)`,
          price: 'Gratuito',
          period: 'por 3 dias',
          features: Array.isArray(planData.features) ? planData.features : [],
          isActive: true,
          isContracted: true,
          contractDate: profile.created_at,
          nextPaymentDate: profile.trial_end_date,
          billingCycle: 'monthly',
          isTrial: true,
          type: 'whatsapp',
          color: '#c4d82e'
        });
        console.log('🎯 [ACCOUNT] Trial WhatsApp ATIVO detectado');
      }
    }

    // ========== 2. PLANO LIGAÇÕES ==========
    console.log('🔍 [ACCOUNT] === VERIFICANDO PLANO LIGAÇÕES ===');
    console.log('🔍 [ACCOUNT] Condição 2a (plano pago):', {
      ligacoes_monthly_plan_active: profile.ligacoes_monthly_plan_active,
      ligacoes_annual_plan_active: profile.ligacoes_annual_plan_active,
      resultado: profile.ligacoes_monthly_plan_active || profile.ligacoes_annual_plan_active
    });
    console.log('🔍 [ACCOUNT] Condição 2b (trial ativo):', {
      trial_ligacoes_active: profile.trial_ligacoes_active,
      ligacoes_active: profile.ligacoes_active,
      resultado: profile.trial_ligacoes_active && profile.ligacoes_active
    });
    console.log('🔍 [ACCOUNT] Condição 2c (apenas ligacoes_active):', {
      ligacoes_active: profile.ligacoes_active,
      resultado: profile.ligacoes_active
    });
    console.log('🔍 [ACCOUNT] Buscando planData para ligações:', {
      buscando: "plan-ligacoes ou '1'",
      availablePlanIds: availablePlans.map(p => p.id),
      encontrado: availablePlans.find(p => p.id === 'plan-ligacoes' || p.id === '1')
    });

    // 2a. Verificar plano pago Ligações
    if (profile.ligacoes_monthly_plan_active || profile.ligacoes_annual_plan_active) {
      console.log('✅ [ACCOUNT] ENTROU na condição 2a - Plano pago Ligações');
      const planData = availablePlans.find(p => p.id === 'plan-ligacoes' || p.id === '1');
      console.log('🔍 [ACCOUNT] planData encontrado:', planData);
      if (planData) {
        contractedPlans.push({
          id: planData.id,
          name: planData.name,
          price: `R$ ${planData.monthly_price?.toFixed(2) || '0.00'}`,
          period: '/mês',
          features: Array.isArray(planData.features) ? planData.features : [],
          isActive: true,
          isContracted: true,
          contractDate: profile.ligacoes_last_payment_date || profile.ligacoes_activation_date,
          nextPaymentDate: profile.ligacoes_plan_expires_at,
          billingCycle: profile.ligacoes_billing_cycle || 'monthly',
          isTrial: false,
          type: 'ligacoes',
          color: '#3b82f6'
        });
        console.log('💰 [ACCOUNT] Plano Ligações PAGO detectado');
      } else {
        console.log('❌ [ACCOUNT] planData NÃO encontrado para ligações!');
      }
    }
    // 2b. Verificar trial Ligações ativo (apenas se não há plano pago)
    else if (profile.trial_ligacoes_active && profile.ligacoes_active) {
      const planData = availablePlans.find(p => p.id === 'plan-ligacoes' || p.id === '1');
      if (planData) {
        contractedPlans.push({
          id: planData.id,
          name: `${planData.name} (Trial)`,
          price: 'Gratuito',
          period: 'por 3 dias',
          features: Array.isArray(planData.features) ? planData.features : [],
          isActive: true,
          isContracted: true,
          contractDate: profile.ligacoes_activation_date || profile.created_at,
          nextPaymentDate: profile.trial_ligacoes_end_date,
          billingCycle: 'monthly',
          isTrial: true,
          type: 'ligacoes',
          color: '#3b82f6'
        });
        console.log('🎯 [ACCOUNT] Trial Ligações ATIVO detectado');
      }
    }
    // 2c. Verificar apenas ligacoes_active (sem trial nem plano pago)
    else if (profile.ligacoes_active) {
      const planData = availablePlans.find(p => p.id === 'plan-ligacoes' || p.id === '1');
      if (planData) {
        // DUPLICADO DA LÓGICA DO WHATSAPP: usar campos de pagamento se existirem
        const ligacoesNextPayment = profile.ligacoes_plan_expires_at || profile.ligacoes_next_billing_date || null;
        const ligacoesContractDate = profile.ligacoes_last_payment_date || profile.ligacoes_activation_date || profile.created_at;
        
        console.log('📞 [ACCOUNT] Ligações 2c - Datas calculadas:', {
          ligacoesNextPayment,
          ligacoesContractDate,
          ligacoes_plan_expires_at: profile.ligacoes_plan_expires_at,
          ligacoes_next_billing_date: profile.ligacoes_next_billing_date,
          ligacoes_last_payment_date: profile.ligacoes_last_payment_date,
          ligacoes_activation_date: profile.ligacoes_activation_date
        });
        
        contractedPlans.push({
          id: planData.id,
          name: planData.name,
          price: `R$ ${planData.monthly_price?.toFixed(2) || '0.00'}`,
          period: '/mês',
          features: Array.isArray(planData.features) ? planData.features : [],
          isActive: true,
          isContracted: true,
          contractDate: ligacoesContractDate,
          nextPaymentDate: ligacoesNextPayment,
          billingCycle: 'monthly',
          isTrial: false,
          type: 'ligacoes',
          color: '#3b82f6'
        });
        console.log('📞 [ACCOUNT] Plano Ligações detectado (sem trial/pago)');
      }
    }

    console.log('✅ [ACCOUNT] Planos contratados retornados:', contractedPlans.length, contractedPlans);
    return contractedPlans;
  };

  const contractedPlans = getContractedPlans();

  // Debug logs
  console.log('🔍 [ACCOUNT] Perfil carregado:', profile);
  console.log('💰 [ACCOUNT] Campos de cobrança WhatsApp:', {
    payment_status: profile?.payment_status,
    plan_expires_at: profile?.plan_expires_at,
    last_payment_date: profile?.last_payment_date,
    monthly_plan_active: profile?.monthly_plan_active,
    annual_plan_active: profile?.annual_plan_active,
    agendamentos_active: profile?.agendamentos_active,
    trial_active: profile?.trial_active,
    trial_end_date: profile?.trial_end_date
  });
  console.log('📞 [ACCOUNT] Campos de cobrança Ligações:', {
    ligacoes_payment_status: profile?.ligacoes_payment_status,
    ligacoes_plan_expires_at: profile?.ligacoes_plan_expires_at,
    ligacoes_last_payment_date: profile?.ligacoes_last_payment_date,
    ligacoes_monthly_plan_active: profile?.ligacoes_monthly_plan_active,
    ligacoes_annual_plan_active: profile?.ligacoes_annual_plan_active,
    ligacoes_active: profile?.ligacoes_active,
    ligacoes_activation_date: profile?.ligacoes_activation_date,
    trial_ligacoes_active: profile?.trial_ligacoes_active,
    trial_ligacoes_end_date: profile?.trial_ligacoes_end_date,
    ligacoes_billing_cycle: profile?.ligacoes_billing_cycle
  });
  console.log('📋 [ACCOUNT] Planos contratados encontrados:', contractedPlans.length, contractedPlans);
  console.log('🎯 [ACCOUNT] Condições de exibição:', {
    hasPlans: contractedPlans.length > 0,
    profileStatus: profile?.payment_status,
    ligacoesStatus: profile?.ligacoes_payment_status
  });
  console.log('📦 [ACCOUNT] availablePlans da tabela plans:', availablePlans?.map(p => ({
    id: p.id,
    name: p.name,
    monthly_price: p.monthly_price
  })));


  const handleViewContract = () => {
    console.log('Visualizar contrato de serviços');
    // TODO: Implementar abertura do contrato em PDF ou modal
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados da conta...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-red-500 text-xl">Erro ao carregar dados: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#c4d82e]/30"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center space-x-2 ${isSaving ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#c4d82e] hover:bg-[#b5c928] hover:shadow-lg hover:shadow-[#c4d82e]/30'} text-black px-4 py-2 rounded-xl transition-all duration-200`}
                  >
                    <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                    <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">Minha Conta</h1>
            <p className="text-gray-400 text-lg">Gerencie suas informações pessoais</p>
          </div>

          {/* Person Type Selector */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-[#c4d82e]" />
              Tipo de Pessoa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPersonType('pf')}
                disabled={isEditing}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  personType === 'pf'
                    ? 'border-[#c4d82e] bg-[#c4d82e]/10 text-[#c4d82e]'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-8 h-8" />
                  <span className="text-lg font-bold">Pessoa Física</span>
                </div>
                <p className="text-sm text-left">CPF, data de nascimento, telefone</p>
              </button>

              <button
                onClick={() => setPersonType('pj')}
                disabled={isEditing}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  personType === 'pj'
                    ? 'border-[#c4d82e] bg-[#c4d82e]/10 text-[#c4d82e]'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Building className="w-8 h-8" />
                  <span className="text-lg font-bold">Pessoa Jurídica</span>
                </div>
                <p className="text-sm text-left">CNPJ, razão social, telefone</p>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-[#c4d82e]" />
              {personType === 'pf' ? 'Dados Pessoais' : 'Dados da Empresa'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email (comum) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-gray-400">
                  {formData.email}
                  <span className="text-xs text-gray-500 ml-2">(Não editável)</span>
                </div>
              </div>

              {/* Nome/Razão Social */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center">
                  {personType === 'pf' ? <User className="w-4 h-4 mr-2" /> : <Building className="w-4 h-4 mr-2" />}
                  {personType === 'pf' ? 'Nome Completo' : 'Razão Social'}
                </label>
                <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-gray-400">
                  {personType === 'pf' ? formData.pf.nome : formData.pj.razaoSocial || 'Nome não informado'}
                  <span className="text-xs text-gray-500 ml-2">(Não editável)</span>
                </div>
              </div>

              {/* CPF/CNPJ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {personType === 'pf' ? 'CPF' : 'CNPJ'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={personType === 'pf' ? formData.pf.cpf : formData.pj.cnpj}
                    onChange={(e) => handleInputChange(personType, personType === 'pf' ? 'cpf' : 'cnpj', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {personType === 'pf' ? formData.pf.cpf : formData.pj.cnpj}
                  </div>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={personType === 'pf' ? formData.pf.telefone : formData.pj.telefone}
                    onChange={(e) => handleInputChange(personType, 'telefone', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {personType === 'pf' ? formData.pf.telefone : formData.pj.telefone}
                  </div>
                )}
              </div>

              {/* Data de Nascimento (apenas PF) */}
              {personType === 'pf' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Data de Nascimento
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.pf.dataNascimento}
                      onChange={(e) => handleInputChange('pf', 'dataNascimento', e.target.value)}
                      className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                      {new Date(formData.pf.dataNascimento).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-[#c4d82e]" />
              Endereço
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CEP */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">CEP</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.cep}
                    onChange={(e) => handleInputChange('endereco', 'cep', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="00000-000"
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.cep}
                  </div>
                )}
              </div>

              {/* Logradouro */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-300">Logradouro</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.logradouro}
                    onChange={(e) => handleInputChange('endereco', 'logradouro', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Rua, Avenida, etc."
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.logradouro}
                  </div>
                )}
              </div>

              {/* Número */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Número</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.numero}
                    onChange={(e) => handleInputChange('endereco', 'numero', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="123"
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.numero}
                  </div>
                )}
              </div>

              {/* Complemento */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Complemento</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.complemento}
                    onChange={(e) => handleInputChange('endereco', 'complemento', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Apto, Sala, etc."
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.complemento}
                  </div>
                )}
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Bairro</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.bairro}
                    onChange={(e) => handleInputChange('endereco', 'bairro', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Nome do bairro"
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.bairro}
                  </div>
                )}
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Cidade</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.endereco.cidade}
                    onChange={(e) => handleInputChange('endereco', 'cidade', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Nome da cidade"
                  />
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.cidade}
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Estado</label>
                {isEditing ? (
                  <select
                    value={formData.endereco.estado}
                    onChange={(e) => handleInputChange('endereco', 'estado', e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
                  >
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PR">Paraná</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="GO">Goiás</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="PE">Pernambuco</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="PB">Paraíba</option>
                    <option value="AL">Alagoas</option>
                    <option value="SE">Sergipe</option>
                    <option value="PI">Piauí</option>
                    <option value="MA">Maranhão</option>
                    <option value="TO">Tocantins</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="AC">Acre</option>
                    <option value="AM">Amazonas</option>
                    <option value="PA">Pará</option>
                    <option value="AP">Amapá</option>
                    <option value="RR">Roraima</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white">
                    {formData.endereco.estado}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Plans Section - Mostra TODOS os planos contratados */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CreditCard className="w-6 h-6 mr-3 text-[#c4d82e]" />
              Planos Contratados
            </h2>

            {contractedPlans.length > 0 && (
              <div className="space-y-8">
                {contractedPlans.map((plan, index) => (
                  <div key={plan.id + '-' + index} className="space-y-6">
                    {/* Plan Details Card */}
                    <div 
                      className="rounded-2xl p-6 hover:transform hover:scale-[1.02] transition-all duration-300"
                      style={{
                        background: `linear-gradient(to bottom right, ${plan.color}15, ${plan.color}08)`,
                        border: `2px solid ${plan.color}50`
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${plan.color}30` }}
                        >
                          {plan.type === 'whatsapp' ? (
                            <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" fill={plan.color}/>
                            </svg>
                          ) : (
                            <Phone className="w-6 h-6 animate-pulse" style={{ color: plan.color }} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: plan.color }}>{plan.name}</h3>
                          <span className={`text-sm font-medium ${
                            plan.isTrial ? 'text-blue-400' : 'text-green-400'
                          }`}>
                            {plan.isTrial ? 'TRIAL' : 'ATIVO'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                      </div>

                      <div className="space-y-2 mb-6">
                        {(plan.features as string[]).slice(0, 3).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span style={{ color: plan.color }} className="text-sm">✓</span>
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleViewContract}
                        className="w-full flex items-center justify-center space-x-2 font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
                        style={{ 
                          backgroundColor: plan.color, 
                          color: '#000',
                          boxShadow: `0 10px 30px ${plan.color}30`
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Ver Contrato</span>
                      </button>
                    </div>

                    {/* Date Cards for this plan */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Contract Date Card */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-400 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-blue-400">
                              Data de Contratação
                              <span className="text-xs text-gray-400 ml-2">({plan.type === 'whatsapp' ? 'WhatsApp' : 'Ligações'})</span>
                            </h3>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {plan.contractDate ? new Date(plan.contractDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </div>

                      {/* Next Payment Date Card */}
                      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-green-400 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-green-400">
                              {plan.isTrial ? 'Fim do Trial' : 'Próximo Pagamento'}
                              <span className="text-xs text-gray-400 ml-2">({plan.type === 'whatsapp' ? 'WhatsApp' : 'Ligações'})</span>
                            </h3>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {plan.nextPaymentDate ? new Date(plan.nextPaymentDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                        {!plan.isTrial && plan.nextPaymentDate && new Date(plan.nextPaymentDate) > new Date() && (
                          <button
                            onClick={() => {
                              const paymentUrl = plan.type === 'whatsapp' 
                                ? `/direct-payment?renewal=true&planId=plan-agendamentos&amount=${plan.price.replace('R$ ', '')}`
                                : `/direct-payment?renewal=true&plan=ligacoes&planId=${plan.id}&amount=${plan.price.replace('R$ ', '')}`;
                              window.location.href = paymentUrl;
                            }}
                            className="mt-4 w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 text-sm"
                          >
                            <span>Pagar Agora</span>
                          </button>
                        )}
                        {plan.isTrial && (
                          <button
                            onClick={() => {
                              const paymentUrl = plan.type === 'whatsapp' 
                                ? `/direct-payment?planId=plan-agendamentos`
                                : `/direct-payment?plan=ligacoes`;
                              window.location.href = paymentUrl;
                            }}
                            className="mt-4 w-full flex items-center justify-center text-white font-medium py-2 px-3 rounded-md transition-all duration-300 hover:shadow-lg text-sm"
                            style={{ backgroundColor: plan.color, color: '#000' }}
                          >
                            <span>Assinar Plano</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divider between plans */}
                    {index < contractedPlans.length - 1 && (
                      <hr className="border-gray-700/50 my-6" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {contractedPlans.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Nenhum plano contratado</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-[#c4d82e] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#b5c928] transition-colors"
                >
                  Contratar Plano
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default AccountDashboard;