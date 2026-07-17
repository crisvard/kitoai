import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { Clock, MapPin, DollarSign } from 'lucide-react';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: string;
  total_price: number;
  notes: string;
  services: Array<{
    name: string;
  }>;
}

export default function ProfessionalLastAppointments() {
  const { professional } = useProfessionalAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [professional]);

  const loadAppointments = async () => {
    if (!professional) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_appointment_data')
        .select('*')
        .eq('professional_id', professional.id)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: false })
        .limit(6);

      if (error) throw error;

      const transformed = (data || []).map((item: any) => ({
        id: item.appointment_id,
        customer_name: item.customer_name,
        customer_phone: item.customer_phone,
        appointment_date: item.appointment_date,
        status: item.status,
        total_price: item.total_price,
        notes: item.notes,
        services: Array.isArray(item.services) ? item.services.map((s: any) => ({
          name: s.name || 'Serviço'
        })) : []
      }));

      setAppointments(transformed);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'pending':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'confirmed':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Realizado';
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
        >
          {/* Header with customer and status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-white font-semibold">{appointment.customer_name}</h4>
              <p className="text-sm text-gray-400">{appointment.customer_phone}</p>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </div>
          </div>

          {/* Date and Time */}
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span>{formatDate(appointment.appointment_date)}</span>
            <span className="text-[#c4d82e]">{formatTime(appointment.appointment_date)}</span>
          </div>

          {/* Services */}
          {appointment.services.length > 0 && (
            <div className="flex items-start space-x-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{appointment.services.map(s => s.name).join(', ')}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <DollarSign className="w-4 h-4 text-[#c4d82e]" />
            <span className="text-white">R$ {appointment.total_price.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
