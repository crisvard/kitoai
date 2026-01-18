import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { supabase } from '../../lib/supabase';

interface SchedulerContextType {
  // Navigation
  currentView: 'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp';
  setCurrentView: (view: 'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp') => void;
  settingsTab: 'professionals' | 'services' | 'customers' | 'packages' | 'commissions';
  setSettingsTab: (tab: 'professionals' | 'services' | 'customers' | 'packages' | 'commissions') => void;

  // Data
  appointments: any[];
  customers: any[];
  professionals: any[];
  services: any[];
  packages: any[];

  // Loading states
  loading: {
    appointments: boolean;
    customers: boolean;
    professionals: boolean;
    services: boolean;
    packages: boolean;
  };

  // Refresh functions
  refreshAppointments: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshProfessionals: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshPackages: () => Promise<void>;

  // CRUD operations
  createAppointment: (data: any) => Promise<any>;
  updateAppointment: (id: string, data: any) => Promise<any>;
  deleteAppointment: (id: string) => Promise<any>;

  createCustomer: (data: any) => Promise<any>;
  updateCustomer: (id: string, data: any) => Promise<any>;
  deleteCustomer: (id: string) => Promise<any>;

  createProfessional: (data: any) => Promise<any>;
  updateProfessional: (id: string, data: any) => Promise<any>;
  deleteProfessional: (id: string) => Promise<any>;

  createService: (data: any) => Promise<any>;
  updateService: (id: string, data: any) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
}

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export function SchedulerProvider({ children, franchiseId }: { children: React.ReactNode; franchiseId?: string }) {
  // Tentar usar useAuth, mas com fallback se não estiver disponível
  let user = null;
  let userRole = null;
  let contextFranchiseId = null;
  let permissionsLoading = false;

  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (e) {
    // useAuth não está disponível, tentar obter do localStorage
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        user = parsed?.currentSession?.user || null;
      }
    } catch (localStorageError) {
      console.error('Error getting user from localStorage:', localStorageError);
    }
  }

  try {
    const permissionsContext = usePermissions();
    userRole = permissionsContext?.userRole;
    contextFranchiseId = permissionsContext?.franchiseId;
    permissionsLoading = permissionsContext?.isLoading || false;
  } catch (e) {
    // usePermissions não está disponível
    console.log('usePermissions not available, using fallback');
  }

  // Priorizar franchiseId passado como prop (para FranchiseSchedulerPage)
  // Se não houver prop, usar do contexto de permissões
  const effectiveFranchiseId = franchiseId || contextFranchiseId;

  console.log('🚀 SchedulerProvider inicializado');
  console.log('🔑 franchiseId prop:', franchiseId);
  console.log('🔑 franchiseId contexto:', contextFranchiseId);
  console.log('🎯 franchiseId efetivo:', effectiveFranchiseId);
  console.log('👤 userRole:', userRole);
  console.log('👤 user authenticated:', !!user);
  console.log('📍 Current location pathname:', window.location.pathname);

  const [currentView, setCurrentView] = useState<'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'professionals' | 'services' | 'customers' | 'packages' | 'commissions'>('professionals');

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState({
    appointments: false,
    customers: false,
    professionals: false,
    services: false,
    packages: false,
  });

  // Load initial data
  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', !!user, 'permissionsLoading:', permissionsLoading, 'effectiveFranchiseId:', effectiveFranchiseId, 'userRole:', userRole);

    // Só carregar se não estiver carregando permissões e tiver user
    if (user && !permissionsLoading) {
      if (effectiveFranchiseId) {
        console.log('✅ Carregando dados isolados para franquia:', effectiveFranchiseId);
        refreshAppointments();
        refreshCustomers();
        refreshProfessionals();
        refreshServices();
        refreshPackages();
      } else if (userRole === 'admin') {
        console.log('✅ Carregando dados globais para admin');
        // Para admin sem franchiseId específico, carregar todos os dados (sem filtro)
        refreshAppointments();
        refreshCustomers();
        refreshProfessionals();
        refreshServices();
        refreshPackages();
      } else {
        console.log('⏳ Aguardando determinação de permissões...');
      }
    }
  }, [user, permissionsLoading, effectiveFranchiseId, userRole]);

  // Data loading functions
  const refreshAppointments = async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, appointments: true }));

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          professionals(name),
          appointment_services(
            service:services(name, duration_minutes, price)
          )
        `)
        .order('appointment_date', { ascending: false });

      // Aplicar filtro de franquia se necessário
      if (effectiveFranchiseId) {
        console.log('🔒 Carregando agendamentos APENAS para franquia:', effectiveFranchiseId);
        query = query.eq('franchise_id', effectiveFranchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 Carregando TODOS os agendamentos para admin');
        // Admin vê tudo - sem filtro
      } else {
        console.log('⏳ Aguardando contexto de permissões...');
        setAppointments([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setAppointments(data || []);
      const contextMsg = effectiveFranchiseId ? `franquia ${effectiveFranchiseId}` : 'admin (global)';
      console.log(`✅ Carregados ${data?.length || 0} agendamentos para ${contextMsg}`);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  };

  const refreshCustomers = async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, customers: true }));

    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          professional:professionals(id, name, specialty)
        `)
        .order('name');

      // Aplicar filtro de franquia se necessário
      if (effectiveFranchiseId) {
        console.log('🔒 Carregando clientes APENAS para franquia:', effectiveFranchiseId);
        query = query.eq('franchise_id', effectiveFranchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 Carregando TODOS os clientes para admin');
        // Admin vê tudo - sem filtro
      } else {
        console.log('⏳ Aguardando contexto de permissões...');
        setCustomers([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setCustomers(data || []);
      const contextMsg = effectiveFranchiseId ? `franquia ${effectiveFranchiseId}` : 'admin (global)';
      console.log(`✅ Carregados ${data?.length || 0} clientes para ${contextMsg}`);

      // Log detalhado para debug de isolamento
      if (data && data.length > 0) {
        console.log('📋 Lista de clientes carregados:');
        data.forEach(customer => {
          console.log(`  - ${customer.name} (ID: ${customer.id}, Franchise: ${customer.franchise_id || 'N/A'})`);
        });
      } else {
        console.log('📋 Nenhum cliente encontrado para o contexto atual');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const refreshProfessionals = async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, professionals: true }));

    try {
      let query = supabase
        .from('professionals')
        .select('*')
        .order('name');

      // Aplicar filtro de franquia se necessário
      if (effectiveFranchiseId) {
        console.log('🔒 Carregando profissionais APENAS para franquia:', effectiveFranchiseId);
        query = query.eq('franchise_id', effectiveFranchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 Carregando TODOS os profissionais para admin');
        // Admin vê tudo - sem filtro
      } else {
        console.log('⏳ Aguardando contexto de permissões...');
        setProfessionals([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setProfessionals(data || []);
      const contextMsg = effectiveFranchiseId ? `franquia ${effectiveFranchiseId}` : 'admin (global)';
      console.log(`✅ Carregados ${data?.length || 0} profissionais para ${contextMsg}`);

      // Log detalhado para debug de isolamento
      if (data && data.length > 0) {
        console.log('📋 Lista de profissionais carregados:');
        data.forEach(prof => {
          console.log(`  - ${prof.name} (ID: ${prof.id}, Franchise: ${prof.franchise_id || 'N/A'})`);
        });
      } else {
        console.log('📋 Nenhum profissional encontrado para o contexto atual');
      }
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(prev => ({ ...prev, professionals: false }));
    }
  };

  const refreshServices = async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, services: true }));

    try {
      let query = supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');

      // Aplicar filtro de franquia se necessário
      if (effectiveFranchiseId) {
        console.log('🔒 Carregando serviços APENAS para franquia:', effectiveFranchiseId);
        query = query.eq('franchise_id', effectiveFranchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 Carregando TODOS os serviços para admin');
        // Admin vê tudo - sem filtro
      } else {
        console.log('⏳ Aguardando contexto de permissões...');
        setServices([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setServices(data || []);
      const contextMsg = effectiveFranchiseId ? `franquia ${effectiveFranchiseId}` : 'admin (global)';
      console.log(`✅ Carregados ${data?.length || 0} serviços para ${contextMsg}`);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  };

  const refreshPackages = async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, packages: true }));

    try {
      let query = supabase
        .from('packages')
        .select(`
          *,
          services:package_services(
            id,
            service_id,
            quantity,
            service:services(id, name, price)
          )
        `)
        .eq('active', true)
        .order('name');

      // Aplicar filtro de franquia se necessário
      if (effectiveFranchiseId) {
        console.log('🔒 Carregando pacotes APENAS para franquia:', effectiveFranchiseId);
        query = query.eq('franchise_id', effectiveFranchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 Carregando TODOS os pacotes para admin');
        // Admin vê tudo - sem filtro
      } else {
        console.log('⏳ Aguardando contexto de permissões...');
        setPackages([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setPackages(data || []);
      const contextMsg = effectiveFranchiseId ? `franquia ${effectiveFranchiseId}` : 'admin (global)';
      console.log(`✅ Carregados ${data?.length || 0} pacotes para ${contextMsg}`);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(prev => ({ ...prev, packages: false }));
    }
  };



  // CRUD operations for appointments
  const createAppointment = async (data: any) => {
    console.log('➕ [SchedulerContext] createAppointment chamado:', data);
    if (!user) throw new Error('User not authenticated');

    // Usar user_id que existe na tabela users (mesmo para todas as franquias)
    const appointmentUserId = '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e';

    const appointmentData = {
      ...data,
      user_id: appointmentUserId,
    };

    console.log('📝 [SchedulerContext] Dados iniciais:', appointmentData);

    // Add franchise_id baseado no contexto de permissões
    if (effectiveFranchiseId) {
      appointmentData.franchise_id = effectiveFranchiseId;
      console.log('🔒 Criando agendamento para franquia:', effectiveFranchiseId, 'user_id:', appointmentUserId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin criando agendamento global com user_id:', appointmentUserId);
      // Admin pode criar sem franchise_id ou especificar
    }

    console.log('📝 [SchedulerContext] Dados finais para inserção:', appointmentData);

    const { data: result, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      console.error('❌ [SchedulerContext] Erro ao inserir agendamento:', error);
      throw error;
    }

    console.log('✅ [SchedulerContext] Agendamento criado com sucesso:', result);
    await refreshAppointments();
    return result;
  };

  const updateAppointment = async (id: string, data: any) => {
    console.log('🔄 [updateAppointment] Iniciando atualização:', { id, data, effectiveFranchiseId, userRole });

    // Build query with franchise filtering
    let query = supabase
      .from('appointments')
      .update(data)
      .eq('id', id);

    // IMPORTANTE: Admin NÃO deve ter filtro de franquia para poder atualizar QUALQUER agendamento
    if (userRole !== 'admin' && effectiveFranchiseId) {
      console.log('🔒 Atualizando agendamento APENAS para franquia:', effectiveFranchiseId);
      query = query.eq('franchise_id', effectiveFranchiseId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin atualizando agendamento - SEM filtro de franquia');
      // Admin pode atualizar qualquer agendamento
    } else {
      console.log('⚠️ Contexto indefinido - aplicando filtro mínimo');
      // Se não há contexto claro, não permitir atualização
      throw new Error('Contexto de franquia indefinido - não é possível atualizar agendamento');
    }

    console.log('📡 Executando query de atualização...');
    const { data: result, error } = await query.select(`
      id,
      customer_name,
      customer_phone,
      appointment_date,
      status,
      notes,
      total_price,
      franchise_id,
      professional_id,
      user_id
    `).single();

    if (error) {
      console.error('❌ Erro na atualização:', error);
      throw error;
    }

    console.log('✅ Agendamento atualizado com sucesso:', result);

    // OBSERVAÇÃO: A criação de registros de comissão agora é feita pelo trigger do banco de dados
    // Não é mais necessário fazer isso manualmente no JavaScript
    // O trigger 'trigger_create_commission_records' cuida disso automaticamente

    await refreshAppointments();
    return result;
  };

  const deleteAppointment = async (id: string) => {
    // Aplicar filtro de franquia se necessário
    let query = supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    // IMPORTANTE: Admin NÃO deve ter filtro de franquia para poder excluir QUALQUER agendamento
    if (userRole !== 'admin' && effectiveFranchiseId) {
      console.log('🔒 Excluindo agendamento APENAS para franquia:', effectiveFranchiseId);
      query = query.eq('franchise_id', effectiveFranchiseId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin excluindo agendamento - SEM filtro de franquia');
      // Admin pode excluir qualquer agendamento
    }

    const { error } = await query.select('id').single(); // Evitar select=* que causa erro 403

    if (error) throw error;
    await refreshAppointments();
  };

  // CRUD operations for customers
  const createCustomer = async (data: any) => {
    console.log('👥 [createCustomer] Iniciando criação de cliente');
    console.log('👥 [createCustomer] Dados recebidos:', data);
    console.log('👥 [createCustomer] effectiveFranchiseId:', effectiveFranchiseId);

    if (!user) throw new Error('User not authenticated');

    // Usar user_id que existe na tabela users (mesmo para todas as franquias)
    const customerUserId = '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e';

    const customerData = {
      ...data,
      user_id: customerUserId,
    };

    // Add franchise_id baseado no contexto de permissões
    if (effectiveFranchiseId) {
      customerData.franchise_id = effectiveFranchiseId;
      console.log('🔒 Criando cliente para franquia:', effectiveFranchiseId, 'user_id:', customerUserId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin criando cliente global com user_id:', customerUserId);
    }

    console.log('👥 [createCustomer] Dados finais para inserção:', customerData);

    const { data: result, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ [createCustomer] Erro ao inserir cliente:', error);
      throw error;
    }

    console.log('✅ [createCustomer] Cliente criado com sucesso:', result);
    await refreshCustomers();
    return result;
  };

  const updateCustomer = async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await refreshCustomers();
    return result;
  };

  const deleteCustomer = async (id: string) => {
    // Aplicar filtro de franquia se necessário
    let query = supabase
      .from('customers')
      .delete()
      .eq('id', id);

    // Aplicar filtro de franquia se necessário
    if (effectiveFranchiseId) {
      console.log('🔒 Excluindo cliente APENAS para franquia:', effectiveFranchiseId);
      query = query.eq('franchise_id', effectiveFranchiseId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin excluindo cliente global');
      // Admin pode excluir sem filtro adicional
    }

    const { error } = await query;

    if (error) throw error;
    await refreshCustomers();
  };

  // CRUD operations for professionals
  const createProfessional = async (data: any) => {
    if (!user) throw new Error('User not authenticated');

    const professionalData = {
      ...data,
      user_id: user.id,
    };

    // Add franchise_id baseado no contexto de permissões
    if (effectiveFranchiseId) {
      professionalData.franchise_id = effectiveFranchiseId;
    }

    const { data: result, error } = await supabase
      .from('professionals')
      .insert(professionalData)
      .select()
      .single();

    if (error) throw error;
    await refreshProfessionals();
    return result;
  };

  const updateProfessional = async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('professionals')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await refreshProfessionals();
    return result;
  };

  const deleteProfessional = async (id: string) => {
    // Aplicar filtro de franquia se necessário
    let query = supabase
      .from('professionals')
      .delete()
      .eq('id', id);

    // Aplicar filtro de franquia se necessário
    if (effectiveFranchiseId) {
      console.log('🔒 Excluindo profissional APENAS para franquia:', effectiveFranchiseId);
      query = query.eq('franchise_id', effectiveFranchiseId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin excluindo profissional global');
      // Admin pode excluir sem filtro adicional
    }

    const { error } = await query;

    if (error) throw error;
    await refreshProfessionals();
  };

  // CRUD operations for services
  const createService = async (data: any) => {
    console.log('🛠️ [createService] Iniciando criação de serviço');
    console.log('🛠️ [createService] Dados recebidos:', data);
    console.log('🛠️ [createService] User atual:', user?.id);
    console.log('🛠️ [createService] effectiveFranchiseId:', effectiveFranchiseId);

    if (!user) throw new Error('User not authenticated');

    // Usar user_id que existe na tabela users (mesmo para todas as franquias)
    const serviceUserId = '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e';

    if (effectiveFranchiseId) {
      console.log('🔒 Criando serviço para franquia:', effectiveFranchiseId, 'user_id:', serviceUserId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin criando serviço global com user_id:', serviceUserId);
    }

    const serviceData = {
      ...data,
      user_id: serviceUserId,
    };

    // Add franchise_id baseado no contexto de permissões
    if (effectiveFranchiseId) {
      serviceData.franchise_id = effectiveFranchiseId;
    }

    console.log('🛠️ [createService] Dados finais para inserção:', serviceData);

    const { data: result, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      console.error('❌ [createService] Erro ao inserir serviço:', error);
      throw error;
    }

    console.log('✅ [createService] Serviço criado com sucesso:', result);
    await refreshServices();
    return result;
  };

  const updateService = async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('services')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await refreshServices();
    return result;
  };

  const deleteService = async (id: string) => {
    // Aplicar filtro de franquia se necessário
    let query = supabase
      .from('services')
      .delete()
      .eq('id', id);

    // Aplicar filtro de franquia se necessário
    if (effectiveFranchiseId) {
      console.log('🔒 Excluindo serviço APENAS para franquia:', effectiveFranchiseId);
      query = query.eq('franchise_id', effectiveFranchiseId);
    } else if (userRole === 'admin') {
      console.log('👑 Admin excluindo serviço global');
      // Admin pode excluir sem filtro adicional
    }

    const { error } = await query;

    if (error) throw error;
    await refreshServices();
  };

  const value: SchedulerContextType = {
    currentView,
    setCurrentView,
    settingsTab,
    setSettingsTab,
    appointments,
    customers,
    professionals,
    services,
    packages,
    loading,
    refreshAppointments,
    refreshCustomers,
    refreshProfessionals,
    refreshServices,
    refreshPackages,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    createService,
    updateService,
    deleteService,
  };

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  const context = useContext(SchedulerContext);
  if (context === undefined) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
}
