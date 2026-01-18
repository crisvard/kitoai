import React from 'react';
import { Calendar as CalendarIcon, Users, Settings as SettingsIcon, BarChart3, ArrowLeft } from 'lucide-react';
import { SchedulerAuthProvider } from '../scheduler/contexts/SchedulerAuthContext';
import { SchedulerProvider, useScheduler } from '../scheduler/contexts/SchedulerContext';
import { AuthProvider } from '../scheduler/contexts/AuthContext';
import { ProfessionalAuthProvider } from '../scheduler/contexts/ProfessionalAuthContext';
import { PermissionsProvider } from '../contexts/PermissionsContext';
import { useSchedulerStats } from '../hooks/useSchedulerStats';
import Stats from '../scheduler/components/Dashboard/Stats';
import Calendar from '../scheduler/components/Dashboard/Calendar';

// Componente de ícone do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

// Importar páginas reais do agendador
import AppointmentsPage from '../scheduler/pages/AppointmentsPage';
import CustomersPage from '../scheduler/pages/CustomersPage';
import ProfessionalsPage from '../scheduler/pages/ProfessionalsPage';
import ReportsPage from '../scheduler/pages/ReportsPage';
import SettingsPage from '../scheduler/pages/SettingsPage';

// Importar aplicação WhatsApp
import WhatsappPage from '../pages/WhatsappPage';

interface FranchiseSchedulerPageProps {
  franchiseId: string;
  franchiseName: string;
  onBack: () => void;
}

interface AppointmentFromCalendar {
  id: string;
  customer_name: string;
  appointment_date: string;
  status: string;
  total_price: number;
  professional_name?: string;
  service_name?: string;
}

const FranchiseSchedulerContent: React.FC<{ franchiseId: string; franchiseName: string; onBack: () => void }> = ({
  franchiseId,
  franchiseName,
  onBack
}) => {
  console.log('🎯 [DEBUG] FranchiseSchedulerContent renderizado');
  console.log('🆔 [DEBUG] franchiseId:', franchiseId);
  console.log('🏷️ [DEBUG] franchiseName:', franchiseName);

  const { currentView, setCurrentView, setSettingsTab } = useScheduler();
  const { todayAppointments, totalAppointments, activeCustomers, totalProfessionals, loading: statsLoading } = useSchedulerStats(franchiseId);
  const [selectedAppointmentFromCalendar, setSelectedAppointmentFromCalendar] = React.useState<AppointmentFromCalendar | null>(null);
  const [selectedDateFromCalendar, setSelectedDateFromCalendar] = React.useState<Date | null>(null);

  console.log('📊 [DEBUG] useScheduler hook result:', { currentView, setCurrentView: !!setCurrentView, setSettingsTab: !!setSettingsTab });

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'appointments' as const, label: 'Agendamentos', icon: CalendarIcon },
    { id: 'customers' as const, label: 'Clientes', icon: Users },
    { id: 'professionals' as const, label: 'Profissionais', icon: Users },
    { id: 'reports' as const, label: 'Relatórios', icon: BarChart3 },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: WhatsAppIcon },
    { id: 'settings' as const, label: 'Configurações', icon: SettingsIcon },
  ];

  const handleReportsClick = () => {
    setCurrentView('reports');
  };

  const handleProfessionalsClick = () => {
    setCurrentView('professionals');
  };

  const handleServicesClick = () => {
    setCurrentView('settings');
    setSettingsTab('services');
  };

  const handleAppointmentsClick = () => {
    setCurrentView('appointments');
  };

  const handleAppointmentClickFromCalendar = (appointment: AppointmentFromCalendar) => {
    setSelectedAppointmentFromCalendar(appointment);
    setSelectedDateFromCalendar(null);
    setCurrentView('appointments');
  };

  const handleDateClickFromCalendar = (date: Date) => {
    setSelectedDateFromCalendar(date);
    setSelectedAppointmentFromCalendar(null);
    setCurrentView('appointments');
  };

  const handleAppointmentsClosed = () => {
    setSelectedAppointmentFromCalendar(null);
    setSelectedDateFromCalendar(null);
  };

  const appointmentsText = React.useMemo(() => {
    if (statsLoading) return '...';
    if (todayAppointments === 1) return '1 agendamento';
    return `${todayAppointments} agendamentos`;
  }, [statsLoading, todayAppointments]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <Stats 
              onReportsClick={handleReportsClick} 
              onProfessionalsClick={handleProfessionalsClick} 
              onServicesClick={handleServicesClick} 
              onAppointmentsClick={handleAppointmentsClick}
              franchiseId={franchiseId}
            />
            <Calendar
              onAppointmentClick={handleAppointmentClickFromCalendar}
              onDateClick={handleDateClickFromCalendar}
              franchiseId={franchiseId}
            />
          </div>
        );
      case 'appointments':
        return <AppointmentsPage
          selectedAppointment={selectedAppointmentFromCalendar}
          selectedDate={selectedDateFromCalendar}
          onCloseFilter={handleAppointmentsClosed}
          franchiseId={franchiseId}
        />;
      case 'customers':
        return <CustomersPage />;
      case 'professionals':
        return <ProfessionalsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'whatsapp':
        return <WhatsappPage onBack={onBack} isSchedulerMode={true} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar à Franquia</span>
              </button>
              <div className="text-white">
                <h1 className="text-lg font-semibold">{franchiseName}</h1>
                <p className="text-sm text-gray-400">Sistema de Agendamentos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Sistema de Agendamentos</h1>
                  <p className="text-gray-400">Gerencie agendamentos, clientes e profissionais da franquia <strong>{franchiseName}</strong></p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = currentView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentView(tab.id)}
                      className={`
                        group relative overflow-hidden
                        bg-gradient-to-br from-white/5 to-white/[0.02]
                        border border-white/10 rounded-2xl
                        p-4 transition-all duration-500 ease-out
                        hover:scale-105 hover:shadow-xl hover:shadow-white/10
                        ${isActive
                          ? 'bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 border-[#c4d82e]/50 shadow-lg shadow-[#c4d82e]/20'
                          : 'hover:border-white/20'
                        }
                      `}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className={`
                        absolute inset-0 opacity-0 transition-opacity duration-300
                        ${isActive ? 'opacity-100' : ''}
                        bg-gradient-to-br from-white/10 to-transparent
                      `} />

                      <div className={`
                        relative z-10 mb-3 mx-auto w-12 h-12 rounded-xl
                        transition-all duration-300 flex items-center justify-center
                        ${isActive
                          ? 'bg-[#c4d82e]/20 scale-110'
                          : 'bg-white/10 hover:bg-white/20'
                        }
                      `}>
                        <Icon className={`
                          w-6 h-6 transition-all duration-300
                          ${isActive
                            ? 'text-[#c4d82e] scale-110'
                            : 'text-gray-400 hover:text-white'
                          }
                        `} />
                      </div>

                      <div className="relative z-10 text-center">
                        <span className={`
                          text-xs font-semibold transition-all duration-300 block
                          ${isActive
                            ? 'text-[#c4d82e]'
                            : 'text-gray-300 group-hover:text-white'
                          }
                        `}>
                          {tab.label}
                        </span>
                      </div>

                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#c4d82e] rounded-full animate-pulse" />
                      )}

                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl border border-white/20 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              {renderContent()}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl sticky top-8 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-[#c4d82e]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Agendamentos Hoje</h3>
                    <p className="text-sm text-gray-400">
                      {appointmentsText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 border border-[#c4d82e]/20 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-[#c4d82e] mb-2">Total de Agendamentos</h4>
                  <p className="text-white font-bold text-2xl">{statsLoading ? '...' : totalAppointments}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Clientes Ativos</h4>
                  <p className="text-white font-bold text-2xl">{statsLoading ? '...' : activeCustomers}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Profissionais</h4>
                  <p className="text-white font-bold text-2xl">{statsLoading ? '...' : totalProfessionals}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FranchiseSchedulerPage: React.FC<FranchiseSchedulerPageProps> = ({ franchiseId, franchiseName, onBack }) => {
  console.log('🏢 FranchiseSchedulerPage: Iniciando com franchiseId:', franchiseId);

  return (
    <SchedulerAuthProvider>
      <SchedulerProvider franchiseId={franchiseId}>
        <FranchiseSchedulerContent franchiseId={franchiseId} franchiseName={franchiseName} onBack={onBack} />
      </SchedulerProvider>
    </SchedulerAuthProvider>
  );
};

export default FranchiseSchedulerPage;