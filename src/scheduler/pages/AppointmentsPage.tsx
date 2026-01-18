import { useState, useEffect } from 'react';
import AppointmentForm from '../components/Appointments/AppointmentForm';
import AppointmentsList from '../components/Appointments/AppointmentsList';
import { useScheduler } from '../contexts/SchedulerContext';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: string;
  total_price: number;
  notes: string;
  professional_name?: string;
  services?: Array<{
    service: {
      name: string;
    };
    price: number;
    used_package_session: boolean;
  }>;
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

interface AppointmentsPageProps {
  selectedAppointment?: AppointmentFromCalendar | null;
  selectedDate?: Date | null;
  onCloseFilter?: () => void;
  franchiseId?: string;
}

export default function AppointmentsPage({ selectedAppointment, selectedDate, onCloseFilter, franchiseId }: AppointmentsPageProps) {
  const { refreshAppointments } = useScheduler();
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'reschedule'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [prefillData, setPrefillData] = useState<{
    customer_name?: string;
    customer_phone?: string;
    professional_id?: string;
  }>({});

  useEffect(() => {
    // If an appointment was selected from calendar, pass it to AppointmentsList
    if (selectedAppointment) {
      setActiveTab('list');
    }
  }, [selectedAppointment]);

  useEffect(() => {
    // Check URL parameters for prefilled data
    const urlParams = new URLSearchParams(window.location.search);
    const customerParam = urlParams.get('customer');
    const rescheduleParam = urlParams.get('reschedule');
    const phone = urlParams.get('phone');
    const professional = urlParams.get('professional');

    // Also check sessionStorage for customer data from navigation events
    const sessionCustomer = sessionStorage.getItem('prefillCustomer');
    if (sessionCustomer) {
      try {
        const customerData = JSON.parse(sessionCustomer);
        setPrefillData({
          customer_name: customerData.name || '',
          customer_phone: customerData.phone || '',
          professional_id: customerData.professional_id || ''
        });
        setActiveTab('new');
        sessionStorage.removeItem('prefillCustomer'); // Clean up
        return;
      } catch (error) {
        console.error('Error parsing session customer data:', error);
      }
    }

    if (customerParam) {
      try {
        const customerData = JSON.parse(decodeURIComponent(customerParam));
        setPrefillData({
          customer_name: customerData.name || '',
          customer_phone: customerData.phone || '',
          professional_id: customerData.professional_id || ''
        });
        setActiveTab('new');
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    } else if (rescheduleParam) {
      try {
        const appointmentData = JSON.parse(decodeURIComponent(rescheduleParam));
        setRescheduleAppointment(appointmentData);
        setActiveTab('reschedule');
      } catch (error) {
        console.error('Error parsing reschedule data:', error);
      }
    } else if (phone || professional) {
      setPrefillData({
        customer_name: '',
        customer_phone: phone || '',
        professional_id: professional || ''
      });
      setActiveTab('new');
    }
  }, []);

  const handleAppointmentCreated = async () => {
    // Refresh appointments in the scheduler context
    await refreshAppointments();

    // Also trigger local refresh for AppointmentsList
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
    setRescheduleAppointment(null);
  };

  const handleReschedule = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setActiveTab('reschedule');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Agendamentos</h1>
          <p className="text-gray-400">Gerencie os agendamentos manuais</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl">
          <div className="border-b border-white/10">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'list'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Lista de Agendamentos
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'new'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Novo Agendamento
              </button>
              {rescheduleAppointment && (
                <button
                  onClick={() => setActiveTab('reschedule')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'reschedule'
                      ? 'border-[#c4d82e] text-[#c4d82e]'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Reagendar
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'list' && <AppointmentsList 
              refreshTrigger={refreshTrigger} 
              onReschedule={handleReschedule} 
              selectedAppointment={selectedAppointment} 
              selectedDate={selectedDate}
              onCloseFilter={onCloseFilter} 
            />}
            {activeTab === 'new' && (
              <>
                {console.log('📝 [DEBUG] Renderizando AppointmentForm para novo agendamento')}
                {console.log('🏢 [DEBUG] franchiseId no AppointmentsPage:', franchiseId)}
                <AppointmentForm onSuccess={handleAppointmentCreated} prefillData={prefillData} franchiseId={franchiseId} />
              </>
            )}
            {activeTab === 'reschedule' && rescheduleAppointment && (
              <>
                {console.log('🔄 [DEBUG] Renderizando AppointmentForm para reagendamento')}
                {console.log('🏢 [DEBUG] franchiseId no AppointmentsPage:', franchiseId)}
                <AppointmentForm
                  onSuccess={handleAppointmentCreated}
                  rescheduleData={rescheduleAppointment}
                  franchiseId={franchiseId}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}