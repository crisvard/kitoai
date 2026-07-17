import { useState, useEffect } from 'react';
import { useProfessionalAuth } from '../contexts/ProfessionalAuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Users, TrendingUp, LogOut, User, CheckCircle, Scissors, DollarSign } from 'lucide-react';
import AppointmentsList from '../components/Appointments/AppointmentsList';
import ProfessionalCustomersManager from '../components/Settings/ProfessionalCustomersManager';
import ProfessionalServicesList from '../components/Settings/ProfessionalServicesList';
import ProfessionalAppointmentForm from '../components/Appointments/ProfessionalAppointmentForm';
import CalendarComponent from '../components/Dashboard/Calendar';
import ProfessionalLastAppointments from '../components/Dashboard/ProfessionalLastAppointments';
import ProfessionalReportsPage from './ProfessionalReportsPage';
import AnimatedMenu from '../components/Layout/AnimatedMenu';

interface Customer {
  id: string;
  name: string;
  phone: string;
  professional_id: string;
}

export default function ProfessionalDashboardPage() {
  const { professional, logout } = useProfessionalAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'new-appointment' | 'customers' | 'reports' | 'services' | 'calendar'>('dashboard');
  const [selectedCustomerForAppointment, setSelectedCustomerForAppointment] = useState<Customer | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const CACHE_KEY = `prof_stats_${professional?.id || 'anon'}`;

  const loadCachedStats = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem(`prof_stats_${professional?.id || 'anon'}`);
      return raw ? JSON.parse(raw) : {
        totalAppointments: 0, todayAppointments: 0, totalCustomers: 0,
        monthlyRevenue: 0, availableServices: 0, monthlyCommissions: 0
      };
    } catch {
      return {
        totalAppointments: 0, todayAppointments: 0, totalCustomers: 0,
        monthlyRevenue: 0, availableServices: 0, monthlyCommissions: 0
      };
    }
  });
  const [loadingStats, setLoadingStats] = useState(() => loadCachedStats() === null);

  useEffect(() => {
    if (professional) {
      loadData();
    }
  }, [professional]);

  const loadData = async () => {
    if (!professional) return;

    // Show cached data immediately, refresh in background
    const cached = loadCachedStats();
    if (cached) {
      setStats(cached);
      setLoadingStats(false);
    } else {
      setLoadingStats(true);
    }

    try {
      // Load appointments for this professional from appointments table
      const { data: sharedData, error: sharedError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professional.id)
        .order('appointment_date', { ascending: false });

      if (sharedError) throw sharedError;

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayAppointments = sharedData?.filter(item => {
        const aptDate = new Date(item.appointment_date);
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length || 0;

      const monthlyRevenue = sharedData?.filter(item => {
        const aptDate = new Date(item.appointment_date);
        return aptDate >= thisMonth && item.status === 'completed';
      }).reduce((sum, item) => sum + item.total_price, 0) || 0;

      // Load services for this professional from junction table
      const { data: professionalServices, error: servicesError } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professional.id);

      if (servicesError) throw servicesError;

      // Load monthly commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commission_records')
        .select('commission_amount, created_at, appointment:appointments(appointment_date)')
        .eq('professional_id', professional.id);

      let monthlyCommissions = 0;
      if (!commissionsError && commissionsData) {
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const filteredCommissions = commissionsData.filter(record => {
          const appointment = record.appointment as any;
          if (!appointment?.appointment_date) return false;
          const appointmentDate = new Date(appointment.appointment_date);
          return appointmentDate >= thisMonth;
        });
        monthlyCommissions = filteredCommissions.reduce((sum, record) => sum + record.commission_amount, 0);
      }

const newStats = {
        totalAppointments: sharedData?.length || 0,
        todayAppointments,
        totalCustomers: sharedData?.length || 0,
        monthlyRevenue,
        availableServices: professionalServices?.length || 0,
        monthlyCommissions
      };
      setStats(newStats);
      setLoadingStats(false);
      // Save to cache for next visit
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(newStats)); } catch {}
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCustomerClickForAppointment = (customer: Customer) => {
    setSelectedCustomerForAppointment(customer);
    setActiveTab('new-appointment');
  };

  if (!professional) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4d82e] mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando...</p>
          </div>
        </div>
      );
    }

    const statCards = [
      {
        title: 'Serviços Disponíveis',
        value: stats.availableServices,
        icon: Scissors,
        color: 'teal',
        bgColor: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
        borderColor: 'border-teal-500/30',
        onClick: () => setActiveTab('services')
      },
      {
        title: 'Total de Agendamentos',
        value: stats.totalAppointments,
        icon: Calendar,
        color: 'blue',
        bgColor: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        onClick: () => setActiveTab('appointments')
      },
      {
        title: 'Agendamentos Hoje',
        value: stats.todayAppointments,
        icon: Clock,
        color: 'green',
        bgColor: 'bg-green-500/20',
        iconColor: 'text-green-400',
        borderColor: 'border-green-500/30'
      },
      {
        title: 'Total de Clientes',
        value: stats.totalCustomers,
        icon: Users,
        color: 'orange',
        bgColor: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        borderColor: 'border-orange-500/30'
      },
      {
        title: 'Receita Mensal',
        value: `R$ ${stats.monthlyRevenue.toFixed(2)}`,
        icon: TrendingUp,
        color: 'purple',
        bgColor: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        borderColor: 'border-purple-500/30'
      },
      {
        title: 'Comissões do Mês',
        value: `R$ ${stats.monthlyCommissions.toFixed(2)}`,
        icon: DollarSign,
        color: 'emerald',
        bgColor: 'bg-[#c4d82e]/20',
        iconColor: 'text-[#c4d82e]',
        borderColor: 'border-[#c4d82e]/30',
        onClick: () => setActiveTab('reports')
      }
    ];


    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Painel do Profissional</h1>
                  <p className="text-gray-400">Área restrita para profissionais</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-white">
                    <User className="w-4 h-4 text-[#c4d82e]" />
                    <span className="font-semibold">{professional.name}</span>
                  </div>
                  <span className="text-sm text-[#c4d82e]">
                    {professional.specialty}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#c4d82e]/20 to-[#c4d82e]/10 hover:from-[#c4d82e]/30 hover:to-[#c4d82e]/20 text-[#c4d82e] border border-[#c4d82e]/30 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Animated Menu */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AnimatedMenu activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#c4d82e]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Bem-vindo, {professional.name}!</h2>
                    <p className="text-gray-400">Especialista em {professional.specialty}</p>
                  </div>
                </div>
                <div className="text-gray-300">
                  <p>Gerencie seus agendamentos, clientes e visualize suas estatísticas profissionais.</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {loadingStats
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-3 bg-white/10 rounded w-24"></div>
                          <div className="h-7 bg-white/10 rounded w-20"></div>
                        </div>
                        <div className="w-14 h-14 bg-white/10 rounded-2xl"></div>
                      </div>
                    </div>
                  ))
                  : statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        onClick={stat.onClick}
                        className={`bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border ${stat.borderColor} rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#c4d82e]/10 ${stat.onClick ? 'cursor-pointer' : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                          </div>
                          <div className={`${stat.bgColor} p-4 rounded-2xl border ${stat.borderColor}`}>
                            <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Calendar and Last Appointments Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar Container */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Minha Agenda</h3>
                  <CalendarComponent
                    onDateClick={(date) => {
                      setSelectedDate(date);
                      setActiveTab('appointments');
                    }}
                    showAppointmentDetails={false}
                  />
                </div>

                {/* Last 6 Appointments Container */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Próximos Agendamentos</h3>
                  <ProfessionalLastAppointments />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Meus Agendamentos</h3>
                <p className="text-gray-400">Gerencie seus agendamentos e clientes</p>
              </div>
              <AppointmentsList
                refreshTrigger={0}
                selectedDate={selectedDate}
                onCloseFilter={() => setSelectedDate(null)}
                onReschedule={(appointment) => {
                  setRescheduleAppointment(appointment);
                  setActiveTab('new-appointment');
                }}
              />
            </div>
          )}

          {activeTab === 'new-appointment' && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Novo Agendamento</h3>
                <p className="text-gray-400">Crie um novo agendamento para seus clientes</p>
              </div>
              <ProfessionalAppointmentForm
                onSuccess={() => {
                  loadData();
                  setActiveTab('appointments');
                  setSelectedCustomerForAppointment(null);
                  setRescheduleAppointment(null);
                }}
                prefillCustomer={selectedCustomerForAppointment || undefined}
                rescheduleData={rescheduleAppointment || undefined}
              />
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Meus Clientes</h3>
                <p className="text-gray-400">Gerencie sua base de clientes</p>
              </div>
              <ProfessionalCustomersManager
                onCustomerClickForAppointment={handleCustomerClickForAppointment}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Minha Agenda</h3>
                <p className="text-gray-400">Visualize sua agenda completa</p>
              </div>
              <CalendarComponent
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setActiveTab('appointments');
                }}
              />
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Meus Serviços</h3>
                <p className="text-gray-400">Visualize seus serviços disponíveis</p>
              </div>
              <ProfessionalServicesList />
            </div>
          )}

          {activeTab === 'reports' && (
            <ProfessionalReportsPage />
          )}
        </main>
      </div>
    );
  }