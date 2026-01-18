import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';

interface Appointment {
  id: string;
  customer_name: string;
  appointment_date: string;
  status: string;
  total_price: number;
  professional_name?: string;
  service_name?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface CalendarProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onProfessionalFilter?: (professionalId: string | null) => void;
  isAdminView?: boolean;
  showAppointmentDetails?: boolean; // Nova prop para controlar se mostra detalhes ou apenas total
  franchiseId?: string; // Nova prop para isolamento por franquia
}

export default function Calendar({ onAppointmentClick, onDateClick, onProfessionalFilter, isAdminView = false, showAppointmentDetails = true, franchiseId }: CalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);

  // Try to get professional context for automatic filtering
  let currentProfessional = null;
  try {
    const { professional } = useProfessionalAuth();
    currentProfessional = professional;
  } catch (e) {
    // Not in professional context
  }

  // Determine view mode based on franchiseId and props
  const isFranchiseView = !!franchiseId;
  const isAdminViewMode = !franchiseId && isAdminView;

  useEffect(() => {
    loadAppointments();
    if (isAdminViewMode) {
      loadProfessionals();
    }
  }, [franchiseId, currentDate, viewMode, selectedProfessional, isAdminView, currentProfessional]);

  const loadAppointments = async () => {
    const startDate = getStartDate();
    const endDate = getEndDate();

    let query = supabase
      .from('appointments')
      .select(`
        id,
        customer_name,
        appointment_date,
        status,
        total_price,
        professional_id,
        professional:professionals(id, name),
        services:appointment_services(service:services(name))
      `)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString())
      .neq('status', 'cancelled');

    // Apply franchise filter if in franchise view
    if (franchiseId) {
      query = query.eq('franchise_id', franchiseId);
    }

    // Apply professional filter if selected (only in admin view)
    if (selectedProfessional && isAdminViewMode) {
      query = query.eq('professional_id', selectedProfessional);
    }

    // Apply automatic professional filter for professional dashboard
    if (currentProfessional && !isAdminViewMode) {
      query = query.eq('professional_id', currentProfessional.id);
    }

    const { data, error } = await query.order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
      return;
    }

    if (data) {
      // Format appointments
      const formatted: Appointment[] = data.map(apt => ({
        id: apt.id,
        customer_name: apt.customer_name,
        appointment_date: apt.appointment_date,
        status: apt.status,
        total_price: apt.total_price,
        professional_name: (apt.professional as any)?.name || 'N/A',
        service_name: Array.isArray(apt.services) && apt.services.length === 1
          ? (apt.services[0] as any)?.service?.name
          : `${apt.services?.length || 0} serviços`
      }));

      setAppointments(formatted);
    }
  };

  const loadProfessionals = async () => {
    // Only load professionals if in admin view and not in franchise view
    if (!isAdminViewMode || franchiseId) {
      setProfessionals([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
      setProfessionals([]);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'daily') {
      date.setHours(0, 0, 0, 0);
    } else if (viewMode === 'weekly') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'daily') {
      date.setHours(23, 59, 59, 999);
    } else if (viewMode === 'weekly') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
      date.setHours(23, 59, 59, 999);
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (viewMode === 'daily') {
      return currentDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else if (viewMode === 'weekly') {
      const start = getStartDate();
      const end = getEndDate();
      return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getDate() === day &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-[#c4d82e]" />
          <h2 className="text-xl font-bold text-white">Calendário</h2>
        </div>

        <div className="flex items-center space-x-3">
          {isAdminViewMode && !franchiseId && (
            <select
              value={selectedProfessional || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProfessional(value || null);
                if (onProfessionalFilter) {
                  onProfessionalFilter(value || null);
                }
              }}
              className="px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300 hover:border-gray-500"
            >
              <option value="" className="bg-[#2a2a2a] text-white">Todos os profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id} className="bg-[#2a2a2a] text-white">{prof.name}</option>
              ))}
            </select>
          )}

          <div className="bg-[#1a1a1a] border border-gray-600 rounded-2xl p-1 flex shadow-lg">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={navigatePrevious}
          className="p-3 hover:bg-[#1a1a1a] rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg border border-gray-600/50"
        >
          <ChevronLeft className="w-6 h-6 text-[#c4d82e]" />
        </button>

        <h3 className="text-xl font-bold text-white capitalize bg-gradient-to-r from-[#c4d82e] to-[#b8d025] bg-clip-text text-transparent">
          {getDateRangeText()}
        </h3>

        <button
          onClick={navigateNext}
          className="p-3 hover:bg-[#1a1a1a] rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg border border-gray-600/50"
        >
          <ChevronRight className="w-6 h-6 text-[#c4d82e]" />
        </button>
      </div>

      {viewMode === 'monthly' && (
        <div>
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-[#c4d82e] py-3 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayAppointments = getAppointmentsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => {
                    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    if (onDateClick) {
                      onDateClick(clickedDate);
                    }
                  }}
                  className={`aspect-square bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    isToday
                      ? 'border-[#c4d82e]/30 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 shadow-lg shadow-[#c4d82e]/20 hover:bg-[#c4d82e]/10'
                      : 'border-white/10 hover:border-[#c4d82e]/30 hover:bg-white/10'
                  }`}
                >
                  <div className={`text-sm font-bold mb-2 ${
                    isToday ? 'text-[#c4d82e]' : 'text-white'
                  }`}>
                    {day}
                  </div>
                  {dayAppointments.length > 0 && (
                    showAppointmentDetails ? (
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(apt);
                            }}
                            className="text-xs bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black px-2 py-1 rounded-lg shadow-md hover:from-[#b8d025] hover:to-[#a8c025] transition-all duration-300 cursor-pointer truncate font-semibold transform hover:scale-105"
                            title={`${apt.customer_name} - ${new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate text-xs">{apt.customer_name}</span>
                              <span className="ml-1 text-black/80 font-bold text-xs">
                                {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-[#c4d82e] font-bold bg-[#c4d82e]/20 px-2 py-1 rounded-lg border border-[#c4d82e]/30">
                            +{dayAppointments.length - 2} mais
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="text-xs bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black px-1.5 py-0.5 rounded-md shadow-sm font-semibold text-xs">
                          {dayAppointments.length}
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(viewMode === 'daily' || viewMode === 'weekly') && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-[#c4d82e]" />
              </div>
              <p className="text-gray-400 text-lg">Nenhum agendamento neste período</p>
            </div>
          ) : (
            appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => onAppointmentClick?.(apt)}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/5 hover:shadow-lg hover:shadow-[#c4d82e]/10 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">{apt.customer_name}</h4>
                    <p className="text-gray-400 text-sm">{apt.service_name}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                    apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    apt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    apt.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {apt.status === 'confirmed' ? 'Confirmado' :
                     apt.status === 'pending' ? 'Pendente' :
                     apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-medium">{apt.professional_name}</span>
                  <span className="text-white font-semibold bg-[#2a2a2a] px-3 py-1 rounded-lg">
                    {new Date(apt.appointment_date).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="font-bold text-[#c4d82e] text-lg bg-gradient-to-r from-[#c4d82e]/20 to-[#b8d025]/20 px-3 py-1 rounded-lg border border-[#c4d82e]/30">
                    R$ {apt.total_price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
