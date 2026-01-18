import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedProfessional: string;
  selectedServices: Array<{ service_id: string }>;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
  services?: Array<{ id: string; duration_minutes: number }>;
  franchiseId?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  services: Array<{
    service: {
      duration_minutes: number;
    };
  }>;
}

interface WorkingHour {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  is_available: boolean;
}

export default function TimeSlotPicker({
  selectedDate,
  selectedProfessional,
  selectedServices,
  onTimeSelect,
  selectedTime,
  services = [],
  franchiseId
}: TimeSlotPickerProps) {
  // Get user from admin context, optional
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (e) {
    // Not in AuthProvider context, which is fine for professional
  }

  const { professional } = useProfessionalAuth();

  // Try to use scheduler context (for admin users)
  let contextAppointments: any[] = [];
  let contextLoading = { appointments: false };

  try {
    const schedulerContext = useScheduler();
    contextAppointments = schedulerContext.appointments;
    contextLoading = schedulerContext.loading;
  } catch (e) {
    // SchedulerContext not available (professional user)
    console.log('SchedulerContext not available in TimeSlotPicker, will load appointments directly');
  }

  // Check if any loading is active
  const isAnyLoading = Object.values(contextLoading).some(loading => loading);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);

  // Load appointments directly for professional users
  const loadProfessionalAppointments = async () => {
    if (!selectedProfessional || !selectedDate) return;

    setLoading(true);
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          professional_id,
          appointment_services(
            service:services(duration_minutes)
          )
        `)
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', `${selectedDate}T00:00:00`)
        .lt('appointment_date', `${selectedDate}T23:59:59`)
        .neq('status', 'completed');

      if (error) throw error;

      setLocalAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments for time slots:', error);
      setLocalAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Use context appointments if available, otherwise use local appointments
  const allAppointments = contextAppointments.length > 0 ? contextAppointments : localAppointments;

  // Load appointments when needed for professional users
  useEffect(() => {
    if (!contextAppointments.length && selectedProfessional && selectedDate) {
      loadProfessionalAppointments();
    }
  }, [selectedProfessional, selectedDate, contextAppointments.length]);

  // Filter appointments for the selected professional and date
  // Only block appointments with status: pending, confirmed, or cancelled
  const appointments = allAppointments.filter(apt => {
    if (!selectedDate || !selectedProfessional) return false;

    // Check if appointment is for the selected professional
    if (apt.professional_id !== selectedProfessional) return false;

    // Check if appointment is on the selected date
    const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
    if (aptDate !== selectedDate) return false;

    // Only block active appointments (pending, confirmed, cancelled)
    // Exclude completed appointments from blocking
    return apt.status !== 'completed';
  });



  // Appointments are now loaded from SchedulerContext, no need for separate loading

  // Load working hours when professional or date changes
  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadWorkingHours();
    }
  }, [selectedProfessional, selectedDate]);

  const loadWorkingHours = async () => {
    try {
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();

      const { data: workingHoursData, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (error) {
        console.error('Error loading working hours:', error);
      } else {
        setWorkingHours(workingHoursData || []);
      }
    } catch (error) {
      console.error('❌ Error loading working hours:', error);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];

    // If no working hours configured, show default slots (8:00-18:00)
    if (workingHours.length === 0) {
      const startHour = 8;
      const endHour = 18;
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }
      return slots;
    }

    // Generate slots only within configured working hours
    workingHours.forEach(workingHour => {
      const [startHour, startMinute] = workingHour.start_time.split(':').map(Number);
      const [endHour, endMinute] = workingHour.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);

        // Add 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    });

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(slots)].sort();


    return uniqueSlots;
  };

  const calculateTotalDuration = () => {
    // Calculate total duration based on selected services
    let totalDuration = 0;

    if (selectedServices.length === 0) {
      return 30;
    }

    for (const selectedService of selectedServices) {
      const service = services.find(s => s.id === selectedService.service_id);
      if (service) {
        totalDuration += service.duration_minutes;
      } else {
        totalDuration += 30; // Default duration if service not found
      }
    }

    return Math.max(totalDuration, 30); // At least 30 minutes
  };

  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!selectedDate) return true;

    // Parse selectedDate (YYYY-MM-DD format) and timeSlot (HH:MM format)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hour, minute] = timeSlot.split(':').map(Number);

    // Create date/time in local timezone to match how appointments are displayed
    const slotDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    const totalDuration = calculateTotalDuration();
    const slotEndTime = new Date(slotDateTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + totalDuration);

    // Check for appointment conflicts
    if (appointments.length === 0) {
      return true;
    }

    for (const appointment of appointments) {
      // Appointments are stored in UTC in database, JavaScript automatically converts to local time
      const aptStartTime = new Date(appointment.appointment_date);

      // Calculate appointment duration
      let aptDuration = 0;
      for (const service of appointment.services || []) {
        if (service.service?.duration_minutes) {
          aptDuration += service.service.duration_minutes;
        }
      }

      // Ensure minimum duration of 30 minutes if no services or duration found
      if (aptDuration === 0) {
        aptDuration = 30;
      }

      const aptEndTime = new Date(aptStartTime);
      aptEndTime.setMinutes(aptEndTime.getMinutes() + aptDuration);

      // Check for overlap - if slot starts before appointment ends AND slot ends after appointment starts
      const hasOverlap = slotDateTime < aptEndTime && slotEndTime > aptStartTime;

      if (hasOverlap) {
        return false; // Conflict found
      }
    }
    return true; // No conflicts
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
  };

  // Check if we have the required data to render slots
  const hasRequiredData = selectedDate && selectedProfessional && contextAppointments.length >= 0;

  if (isAnyLoading || !hasRequiredData) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-400">Carregando horários...</span>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  // Format selected date for display
  const formatSelectedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          {formatSelectedDate(selectedDate)}
        </h3>
        <p className="text-sm text-gray-400">Horários Disponíveis</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
        {timeSlots.map(timeSlot => {
          const isAvailable = isTimeSlotAvailable(timeSlot);
          const isSelected = selectedTime === timeSlot;

          return (
            <button
              key={timeSlot}
              type="button"
              onClick={() => isAvailable && onTimeSelect(timeSlot)}
              disabled={!isAvailable}
              className={`
                relative p-2 text-xs font-medium rounded-lg border transition-all transform hover:scale-105
                ${isSelected
                  ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black border-[#c4d82e] shadow-md'
                  : isAvailable
                    ? 'bg-[#2a2a2a] text-green-400 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 cursor-pointer'
                    : 'bg-[#2a2a2a] text-red-400 border-red-500/30 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{formatTime(timeSlot)}</span>
                {isSelected ? (
                  <CheckCircle className="w-3 h-3" />
                ) : !isAvailable ? (
                  <XCircle className="w-3 h-3" />
                ) : null}
              </div>
              {!isAvailable && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#2a2a2a] border border-green-500/30 rounded"></div>
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#2a2a2a] border border-red-500/30 rounded"></div>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] border border-[#c4d82e] rounded"></div>
          <span>Selecionado</span>
        </div>
      </div>
    </div>
  );
}