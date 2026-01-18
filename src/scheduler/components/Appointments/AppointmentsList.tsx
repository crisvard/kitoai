import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { Calendar, Clock, User, Phone, Scissors, DollarSign, Trash2, CheckCircle, XCircle, AlertCircle, RotateCcw, Search } from 'lucide-react';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: string;
  total_price: number;
  notes: string;
  professional_name?: string;
  professional_id?: string;
  services?: Array<{
    service_id: string;
    service: {
      name: string;
    };
    price: number;
    used_package_session: boolean;
  }>;
}

interface AppointmentsListProps {
  refreshTrigger: number;
  onReschedule?: (appointment: Appointment) => void;
  selectedAppointment?: {
    id: string;
    customer_name: string;
    appointment_date: string;
    status: string;
    total_price: number;
    professional_name?: string;
    service_name?: string;
  } | null;
  selectedDate?: Date | null;
  onCloseFilter?: () => void;
}

export default function AppointmentsList({ refreshTrigger, onReschedule, selectedAppointment, selectedDate, onCloseFilter }: AppointmentsListProps) {
  const { professional } = useProfessionalAuth();

  // Try to use permissions and scheduler contexts (for admin users)
  let userRole = null;
  let franchiseId = null;
  let schedulerAppointments: any[] = [];
  let schedulerLoading = false;
  let refreshAppointments: any = null;
  let updateAppointment: any = null;
  let deleteAppointmentFromContext: any = null;

  try {
    const permissionsContext = usePermissions();
    userRole = permissionsContext?.userRole;
    franchiseId = permissionsContext?.franchiseId;
  } catch (e) {
    // PermissionsContext not available (professional user)
    userRole = 'professional';
  }

  try {
    const schedulerContext = useScheduler();
    schedulerAppointments = schedulerContext.appointments;
    schedulerLoading = schedulerContext.loading.appointments || schedulerContext.loading.customers || schedulerContext.loading.professionals || schedulerContext.loading.services;
    refreshAppointments = schedulerContext.refreshAppointments;
    updateAppointment = schedulerContext.updateAppointment;
    deleteAppointmentFromContext = schedulerContext.deleteAppointment;
  } catch (e) {
    // SchedulerContext not available (professional user), will load data directly
    console.log('SchedulerContext not available, loading appointments directly for professional');
  }
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Local functions for professional users when contexts are not available
  const loadProfessionalAppointments = async () => {
    if (!professional) return;

    setLoading(true);

    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professionals(name),
          appointment_services(
            service:services(name, duration_minutes, price)
          )
        `)
        .eq('professional_id', professional.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const transformedAppointments = appointmentsData?.map(appointment => ({
        ...appointment,
        professional_name: appointment.professionals?.name || 'N/A',
        services: appointment.appointment_services?.map((as: any) => ({
          service_id: as.service?.id || as.service_id,
          service: {
            name: as.service?.name || 'Serviço não encontrado'
          },
          price: as.service?.price || 0,
          used_package_session: false
        })) || []
      })) || [];

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error loading professional appointments:', error);
      setAppointments([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const localUpdateAppointment = async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Reload appointments after update
    if (professional) {
      await loadProfessionalAppointments();
    }

    return result;
  };

  const localDeleteAppointment = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Reload appointments after delete
    if (professional) {
      await loadProfessionalAppointments();
    }
  };

  // Determine if this is admin or professional view using permissions context
  const isAdminView = userRole === 'admin';
  const isProfessionalView = userRole === 'professional';

  useEffect(() => {
    // Determine which loading strategy to use based on context availability
    const hasSchedulerContext = !!refreshAppointments;

    if (hasSchedulerContext) {
      // Use scheduler context for admin users
      loadAppointments();
    } else if (professional) {
      // SchedulerContext not available, load data directly for professional
      loadProfessionalAppointments();
    }
  }, [professional, refreshTrigger, refreshAppointments]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Use data from scheduler context instead of direct queries
      let filteredAppointments = schedulerAppointments;

      // Filter by professional if in professional view
      if (isProfessionalView && professional) {
        filteredAppointments = filteredAppointments.filter(apt => apt.professional_id === professional.id);
      }

      // For admin view, no additional filtering needed (SchedulerContext already handles franchise filtering)

      // Transform data to match expected format (same as before)
      const transformedAppointments = filteredAppointments.map(appointment => ({
        ...appointment,
        professional_name: appointment.professionals?.name || 'N/A',
        services: appointment.appointment_services?.map((as: any) => ({
          service_id: as.service?.id || as.service_id,
          service: {
            name: as.service?.name || 'Serviço não encontrado'
          },
          price: as.service?.price || 0,
          used_package_session: false // This would need to be calculated based on package usage
        })) || []
      }));

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    console.log('🚀 [UPDATE_STATUS] Iniciando updateStatus:', { id, newStatus, franchiseId });

    try {
      // Use appropriate update function based on context availability
      const updateFunc = updateAppointment || localUpdateAppointment;
      console.log('📝 [UPDATE_STATUS] Chamando updateAppointment...');
      await updateFunc(id, { status: newStatus });
      console.log('✅ [UPDATE_STATUS] Status do agendamento atualizado com sucesso');

      // If status changed to completed, create commission record
      if (newStatus === 'completed') {
        console.log('💰 [COMMISSION] Status mudou para completed, iniciando criação de comissão...');

        try {
          // First try to find in local state
          console.log('🔍 [COMMISSION] Procurando agendamento na lista local...');
          let appointment = appointments.find(apt => apt.id === id);
          console.log('📋 [COMMISSION] Agendamento encontrado localmente:', !!appointment);

          // If not found locally, fetch from database
          if (!appointment) {
            console.log('🔍 [COMMISSION] Agendamento não encontrado localmente, buscando no banco...');
            const { data: dbAppointment, error: fetchError } = await supabase
              .from('appointments')
              .select('id, professional_id, total_price')
              .eq('id', id)
              .single();

            if (fetchError || !dbAppointment) {
              console.error('❌ [COMMISSION] Erro ao buscar agendamento no banco:', fetchError);
              return;
            }

            appointment = dbAppointment as any; // Type assertion for commission logic
            console.log('✅ [COMMISSION] Agendamento encontrado no banco:', appointment);
          }

          // Ensure appointment exists
          if (!appointment) {
            console.error('❌ [COMMISSION] Agendamento não encontrado em lugar nenhum');
            return;
          }

          console.log('👤 [COMMISSION] Buscando configuração de comissão para profissional:', appointment.professional_id);

          // Get commission configuration for this professional
          const { data: commissionConfig, error: configError } = await supabase
            .from('professional_commissions')
            .select('commission_value, calculation_type')
            .eq('professional_id', appointment.professional_id)
            .single();

          if (configError) {
            console.warn('⚠️ [COMMISSION] Configuração de comissão não encontrada:', configError);
          }

          console.log('⚙️ [COMMISSION] Configuração encontrada:', commissionConfig);

          let commissionAmount = 0;
          if (commissionConfig) {
            if (commissionConfig.calculation_type === 'fixed') {
              commissionAmount = commissionConfig.commission_value;
              console.log('💵 [COMMISSION] Cálculo fixo:', commissionAmount);
            } else if (commissionConfig.calculation_type === 'percentage') {
              commissionAmount = appointment.total_price * (commissionConfig.commission_value / 100);
              console.log('📊 [COMMISSION] Cálculo percentual:', {
                total_price: appointment.total_price,
                percentage: commissionConfig.commission_value,
                result: commissionAmount
              });
            }
          } else {
            // Fallback: use default value
            commissionAmount = 20;
            console.log('🔄 [COMMISSION] Usando valor padrão:', commissionAmount);
          }

          console.log('💾 [COMMISSION] Inserindo registro de comissão...');
          const commissionData = {
            appointment_id: appointment.id,
            professional_id: appointment.professional_id,
            franchise_id: franchiseId,
            service_name: 'Serviço de Agendamento',
            service_price: appointment.total_price,
            commission_amount: commissionAmount,
            commission_type: commissionConfig?.calculation_type || 'fixed',
            commission_value: commissionConfig?.commission_value || 0,
            status: 'paid'
          };
          console.log('📄 [COMMISSION] Dados a serem inseridos:', commissionData);

          // Create commission record
          const { error: insertError } = await supabase
            .from('commission_records')
            .insert(commissionData);

          if (insertError) {
            console.error('❌ [COMMISSION] Erro ao inserir comissão:', insertError);
          } else {
            console.log('✅ [COMMISSION] Registro de comissão criado com sucesso:', {
              appointment_id: appointment.id,
              commission_amount: commissionAmount,
              professional_id: appointment.professional_id,
              franchise_id: franchiseId
            });
          }
        } catch (commissionError) {
          console.error('❌ [COMMISSION] Erro geral ao criar registro de comissão:', commissionError);
          console.error('❌ [COMMISSION] Stack trace:', commissionError instanceof Error ? commissionError.stack : 'N/A');
          // Don't show alert for commission error to avoid interrupting the flow
        }
      }

      console.log('🏁 [UPDATE_STATUS] Processo concluído com sucesso');
      // Refresh will be handled by the context
    } catch (error) {
      console.error('❌ [UPDATE_STATUS] Erro geral no updateStatus:', error);
      console.error('❌ [UPDATE_STATUS] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      alert('Erro ao atualizar agendamento');
    }
  };

  const deleteAppointmentHandler = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      // Use appropriate delete function based on context availability
      const deleteFunc = deleteAppointmentFromContext || localDeleteAppointment;
      await deleteFunc(id);
      // Refresh will be handled by the context or local function
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Erro ao excluir agendamento');
    }
  };

  const toggleAppointmentSelection = (id: string) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAppointments(newSelected);
    // Note: selectAll state will be updated by the render logic
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAppointments(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredAppointments.map(apt => apt.id));
      setSelectedAppointments(allIds);
      setSelectAll(true);
    }
  };


  const deleteSelectedAppointments = async () => {
    if (selectedAppointments.size === 0) return;

    const count = selectedAppointments.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} agendamento${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}?`)) return;

    try {
      const idsToDelete = Array.from(selectedAppointments);

      // Delete each appointment using the appropriate function
      const deleteFunc = deleteAppointmentFromContext || localDeleteAppointment;
      for (const id of idsToDelete) {
        await deleteFunc(id);
      }

      setSelectedAppointments(new Set());
      setSelectAll(false);
      // Refresh will be handled by the context
    } catch (error) {
      console.error('Error deleting selected appointments:', error);
      alert('Erro ao excluir agendamentos selecionados');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    // Filter by selected appointment from calendar (show only that one)
    if (selectedAppointment && apt.id !== selectedAppointment.id) return false;

    // Filter by selected date from calendar
    if (selectedDate) {
      const aptDate = new Date(apt.appointment_date);
      const filterDate = new Date(selectedDate);
      if (aptDate.toDateString() !== filterDate.toDateString()) return false;
    }

    // Filter by status
    if (filter !== 'all' && apt.status !== filter) return false;

    // Filter by search term (customer name or phone)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = apt.customer_name.toLowerCase().includes(searchLower);
      const phoneMatch = apt.customer_phone.includes(searchTerm);
      if (!nameMatch && !phoneMatch) return false;
    }

    return true;
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter by selected appointment indicator */}
      {selectedAppointment && (
        <div className="mb-6 bg-[#c4d82e]/20 border border-[#c4d82e]/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#c4d82e]">
              Filtrando agendamento: <span className="font-bold">{selectedAppointment.customer_name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR')} às{' '}
              {new Date(selectedAppointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={onCloseFilter}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Limpar Filtro
          </button>
        </div>
      )}

      {/* Filter by selected date indicator */}
      {selectedDate && !selectedAppointment && (
        <div className="mb-6 bg-blue-500/20 border border-blue-500/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Filtrando por data: <span className="font-bold">{selectedDate.toLocaleDateString('pt-BR')}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Mostrando apenas agendamentos deste dia
            </p>
          </div>
          <button
            onClick={onCloseFilter}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Limpar Filtro
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
            placeholder="Buscar por nome ou telefone do cliente..."
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-400">
            {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? 's' : ''} encontrado{filteredAppointments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Selection Controls */}
      {filteredAppointments.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                <div
                  onClick={toggleSelectAll}
                  className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                    ${filteredAppointments.length > 0 && filteredAppointments.every(apt => selectedAppointments.has(apt.id))
                      ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                      : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                    }
                  `}
                >
                  {filteredAppointments.length > 0 && filteredAppointments.every(apt => selectedAppointments.has(apt.id)) && (
                    <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                  )}
                </div>
                <span className="font-medium group-hover:text-white transition-colors duration-200">
                  Selecionar Todos ({filteredAppointments.length})
                </span>
              </label>
              {selectedAppointments.size > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                  <span className="text-sm text-[#c4d82e] font-medium">
                    {selectedAppointments.size} selecionado{selectedAppointments.size > 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
                  <div className="w-4 h-4 rounded border-2 border-gray-500"></div>
                  <span className="text-sm text-gray-400 font-medium">
                    Nenhum selecionado
                  </span>
                </div>
              )}
            </div>
            {selectedAppointments.size > 0 && (
              <button
                onClick={deleteSelectedAppointments}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados ({selectedAppointments.size})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black shadow-lg'
                : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-lg'
                : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            Pendentes ({appointments.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === 'confirmed'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            Confirmados ({appointments.filter(a => a.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black shadow-lg'
                : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            Concluídos ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === 'cancelled'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            Cancelados ({appointments.filter(a => a.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#c4d82e]" />
          </div>
          <p className="text-gray-400 text-lg">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment, index) => (
            <div
              key={appointment.id}
              onClick={() => toggleAppointmentSelection(appointment.id)}
              className={`
                relative cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
                ${selectedAppointments.has(appointment.id)
                  ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                  : 'border-white/10 hover:bg-white/10'
                }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Selection indicator */}
              {selectedAppointments.has(appointment.id) && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">{appointment.customer_name}</h3>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {appointment.customer_phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-[#c4d82e]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Profissional</p>
                    <p className="text-white font-semibold">{appointment.professional_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Serviços</p>
                    <p className="text-white font-semibold">
                      {appointment.services?.length === 1
                        ? appointment.services[0].service.name
                        : `${appointment.services?.length || 0} serviços`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Valor Total</p>
                    <p className="text-white font-bold text-lg">R$ {appointment.total_price.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(appointment.id, 'confirmed')}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                        title="Confirmar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      {onReschedule && (
                        <button
                          onClick={() => onReschedule(appointment)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                          title="Reagendar"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => updateStatus(appointment.id, 'completed')}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                        title="Marcar como concluído"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      {onReschedule && (
                        <button
                          onClick={() => onReschedule(appointment)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                          title="Reagendar"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  {isAdminView && (
                    <button
                      onClick={() => deleteAppointmentHandler(appointment.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-gray-400">Observações: </span>
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}