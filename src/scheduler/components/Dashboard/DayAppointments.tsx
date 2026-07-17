import { useState, useEffect } from 'react';
import { X, Clock, User, Scissors, DollarSign, Trash2, RotateCcw, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: string;
  total_price: number;
  notes: string;
  professional_id?: string;
  professional_name?: string;
  service_name?: string;
  duration_minutes?: number;
}

interface DayAppointmentsProps {
  selectedDate: Date | null;
  selectedProfessional: string | null;
  onClose: () => void;
  onAppointmentUpdate?: () => void;
}

export default function DayAppointments({ selectedDate, selectedProfessional, onClose, onAppointmentUpdate }: DayAppointmentsProps) {
  const { user } = useAuth();
  const { professional } = useProfessionalAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showChangeProfessionalModal, setShowChangeProfessionalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [newProfessionalId, setNewProfessionalId] = useState('');

  useEffect(() => {
    loadData();
  }, [user, selectedDate, selectedProfessional]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load professionals for filter
      const { data: profData } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      setProfessionals(profData || []);

      // Load appointments
      let query = supabase
        .from('appointments')
        .select(`
          *,
          professionals(name),
          services:appointment_services(
            service:services(name, duration_minutes)
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('appointment_date', startOfDay.toISOString())
          .lte('appointment_date', endOfDay.toISOString());
      }

      if (selectedProfessional) {
        query = query.eq('professional_id', selectedProfessional);
      }

      const { data } = await query.order('appointment_date', { ascending: true });

      if (data) {
        const formatted = data.map(apt => ({
          ...apt,
          professional_id: apt.professional_id,
          professional_name: (apt.professionals as any)?.name,
          service_name: (apt.services as any)?.length === 1
            ? (apt.services as any)[0].service.name
            : `${(apt.services as any)?.length || 0} serviços`,
          duration_minutes: (apt.services as any)?.length === 1
            ? (apt.services as any)[0].service.duration_minutes
            : undefined
        }));
        setAppointments(formatted);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      loadData();
      onAppointmentUpdate?.();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Erro ao excluir agendamento');
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewDateTime(new Date(appointment.appointment_date).toISOString().slice(0, 16));
    setShowRescheduleModal(true);
  };

  const handleChangeProfessional = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewProfessionalId(appointment.professional_id || '');
    setShowChangeProfessionalModal(true);
  };

  const confirmReschedule = async () => {
    if (!selectedAppointment || !newDateTime) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ appointment_date: new Date(newDateTime).toISOString() })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      loadData();
      onAppointmentUpdate?.();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Erro ao reagendar agendamento');
    }
  };

  const confirmChangeProfessional = async () => {
    if (!selectedAppointment || !newProfessionalId) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ professional_id: newProfessionalId })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setShowChangeProfessionalModal(false);
      setSelectedAppointment(null);
      loadData();
      onAppointmentUpdate?.();
    } catch (error) {
      console.error('Error changing professional:', error);
      alert('Erro ao alterar profissional');
    }
  };

  const getTitle = () => {
    if (selectedProfessional) {
      const prof = professionals.find(p => p.id === selectedProfessional);
      return `Agendamentos - ${prof?.name || 'Profissional'}`;
    }
    if (selectedDate) {
      return `Agendamentos do dia ${selectedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })}`;
    }
    return 'Agendamentos';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#1a1a1a] rounded-2xl transition-all duration-300 transform hover:scale-110"
        >
          <X className="w-5 h-5 text-[#c4d82e]" />
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-[#c4d82e]" />
          </div>
          <p className="text-gray-400 text-lg">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:shadow-xl hover:shadow-[#c4d82e]/10 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-xl mb-1">
                    {appointment.customer_name}
                  </h3>
                  <p className="text-gray-400 flex items-center gap-2">
                    <span>{appointment.customer_phone}</span>
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                  appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {appointment.status === 'confirmed' ? 'Confirmado' :
                   appointment.status === 'pending' ? 'Pendente' :
                   appointment.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                </span>
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
                    <p className="text-white font-semibold">{appointment.service_name}</p>
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
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {formatTime(appointment.appointment_date)}
                      {appointment.duration_minutes && ` (${appointment.duration_minutes}min)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReschedule(appointment)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title="Reagendar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleChangeProfessional(appointment)}
                    className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title="Trocar Profissional"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  {!professional && (
                    <button
                      onClick={() => handleDelete(appointment.id)}
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

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reagendar Agendamento</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: {selectedAppointment.customer_name}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova data e hora
              </label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReschedule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Professional Modal */}
      {showChangeProfessionalModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Trocar Profissional</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: {selectedAppointment.customer_name}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo profissional
              </label>
              <select
                value={newProfessionalId}
                onChange={(e) => setNewProfessionalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowChangeProfessionalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmChangeProfessional}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}