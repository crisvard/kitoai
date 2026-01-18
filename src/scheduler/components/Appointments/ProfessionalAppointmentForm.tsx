import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { Calendar, Clock, User, Phone, DollarSign, FileText, Plus, X, Search, CheckCircle } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import DatePicker from './DatePicker';

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  has_package?: boolean;
  package_sessions?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  professional_id: string;
}

interface SelectedService {
  service_id: string;
  use_package: boolean;
  package_id?: string;
}

interface RescheduleAppointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: string;
  total_price: number;
  notes: string;
  services: Array<{
    service: {
      name: string;
    };
  }>;
}

interface ProfessionalAppointmentFormProps {
  onSuccess: () => void;
  prefillCustomer?: Customer;
  rescheduleData?: RescheduleAppointment;
}

export default function ProfessionalAppointmentForm({ onSuccess, prefillCustomer, rescheduleData }: ProfessionalAppointmentFormProps) {
  const { professional } = useProfessionalAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [professionalData, setProfessionalData] = useState<{
    user_id: string | null;
    franchise_id: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    professional_id: ''
  });

  useEffect(() => {
    if (professional) {
      loadData();
    }
  }, [professional]);

  useEffect(() => {
    if (rescheduleData) {
      // Pre-fill form with reschedule data
      const appointmentDate = new Date(rescheduleData.appointment_date);
      setFormData({
        customer_name: rescheduleData.customer_name,
        customer_phone: rescheduleData.customer_phone,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentDate.toTimeString().slice(0, 5),
        notes: rescheduleData.notes,
        professional_id: professional?.id || ''
      });

      // Load customer if exists
      loadCustomerForReschedule(rescheduleData.customer_phone);
    } else if (prefillCustomer) {
      setSelectedCustomer(prefillCustomer);
      setFormData(prev => ({
        ...prev,
        customer_name: prefillCustomer.name,
        customer_phone: prefillCustomer.phone,
        professional_id: professional?.id || ''
      }));
    } else {
      // Set default professional
      setFormData(prev => ({
        ...prev,
        professional_id: professional?.id || ''
      }));
    }
  }, [rescheduleData, prefillCustomer, professional]);

  const loadData = async () => {
    if (!professional) return;

    try {
      // For professionals, only set their own ID (no selection needed)
      setProfessionals([professional]);

      // Load services for this professional via junction table
      const { data: professionalServiceIds, error: junctionError } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professional.id);

      if (junctionError) throw junctionError;

      // Now fetch the actual service details
      if (professionalServiceIds && professionalServiceIds.length > 0) {
        const serviceIds = professionalServiceIds.map(ps => ps.service_id);
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price, duration_minutes')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');

        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      } else {
        setServices([]);
      }

      // Load customers for this professional from customers table
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, professional_id')
        .eq('professional_id', professional.id)
        .order('name');

      if (customersError) throw customersError;

      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCustomerForReschedule = async (phone: string) => {
    try {
      // Find customer by phone
      const customer = customers.find(c => c.phone === phone);
      if (customer) {
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('Error loading customer for reschedule:', error);
    }
  };

  const loadProfessionalData = async (professionalId: string) => {
    try {
      console.log(`🔍 [PROFESSIONAL_DATA] Carregando dados do profissional: ${professionalId}`);
      
      const { data: professionalInfo, error: professionalError } = await supabase
        .from('professionals')
        .select('user_id, franchise_id')
        .eq('id', professionalId)
        .single();

      if (professionalError) {
        console.error('❌ [PROFESSIONAL_DATA] Erro ao buscar dados do profissional:', professionalError);
        return;
      }

      console.log('✅ [PROFESSIONAL_DATA] Dados do profissional encontrados:', professionalInfo);
      
      setProfessionalData({
        user_id: professionalInfo.user_id,
        franchise_id: professionalInfo.franchise_id
      });

      console.log('💾 [PROFESSIONAL_DATA] Dados armazenados no estado:', {
        user_id: professionalInfo.user_id,
        franchise_id: professionalInfo.franchise_id
      });
      
    } catch (error) {
      console.error('❌ [PROFESSIONAL_DATA] Erro geral ao carregar dados do profissional:', error);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleCustomerChange = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);

    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_name: customer.name,
        customer_phone: customer.phone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_name: '',
        customer_phone: ''
      }));
    }
  };

  const addService = () => {
    setSelectedServices(prev => [...prev, { service_id: '', use_package: false }]);
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const usePackage = service?.has_package || false;
    setSelectedServices(prev => prev.map((service, i) =>
      i === index ? { service_id: serviceId, use_package: usePackage } : service
    ));
  };

  const checkTimeConflict = async (appointmentDateTime: Date) => {
    if (!professional) return { hasConflict: false, conflictingAppointments: [] };

    // Calculate total duration of all selected services
    let totalDuration = 0;
    for (const selectedService of selectedServices) {
      const service = services.find(s => s.id === selectedService.service_id);
      if (service) {
        totalDuration += service.duration_minutes;
      }
    }

    // Calculate end time of this appointment
    const appointmentEndTime = new Date(appointmentDateTime);
    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + totalDuration);

    // Check for conflicting appointments
    let query = supabase
      .from('appointments')
      .select('id, appointment_date, status, customer_name')
      .eq('professional_id', professional.id)
      .gte('appointment_date', appointmentDateTime.toISOString())
      .lt('appointment_date', appointmentEndTime.toISOString())
      .neq('status', 'cancelled');

    // Exclude current appointment if rescheduling
    if (rescheduleData) {
      query = query.neq('id', rescheduleData.id);
    }

    const { error } = await query;

    if (error) {
      console.error('Error checking time conflicts:', error);
      return { hasConflict: false, conflictingAppointments: [] };
    }

    // Also check if any existing appointment overlaps with our time slot
    let overlapQuery = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        customer_name,
        appointment_services(
          service:services(duration_minutes)
        )
      `)
      .eq('professional_id', professional.id)
      .neq('status', 'cancelled')
      .neq('status', 'completed');

    // Exclude current appointment if rescheduling
    if (rescheduleData) {
      overlapQuery = overlapQuery.neq('id', rescheduleData.id);
    }

    const { data: overlappingAppointments, error: overlapError } = await overlapQuery;

    if (overlapError) {
      console.error('Error checking overlapping appointments:', overlapError);
      return { hasConflict: false, conflictingAppointments: [] };
    }

    // Check if any existing appointment's time slot overlaps with our new appointment
    const overlappingConflicts: any[] = [];
    for (const apt of overlappingAppointments || []) {
      const aptStartTime = new Date(apt.appointment_date);
      let aptDuration = 0;

      // Calculate duration of existing appointment
      for (const aptService of (apt.appointment_services as any) || []) {
        if (aptService.service?.duration_minutes) {
          aptDuration += aptService.service.duration_minutes;
        }
      }

      const aptEndTime = new Date(aptStartTime);
      aptEndTime.setMinutes(aptEndTime.getMinutes() + aptDuration);

      // Check for overlap
      if ((appointmentDateTime < aptEndTime && appointmentEndTime > aptStartTime)) {
        overlappingConflicts.push(apt);
      }
    }

    return {
      hasConflict: overlappingConflicts.length > 0,
      conflictingAppointments: overlappingConflicts
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional || selectedServices.length === 0) return;

    setLoading(true);
    try {
      // Verificar se o profissional está logado e tem ID válido
      if (!professional?.id) {
        throw new Error('Profissional não está logado ou não tem ID válido');
      }

      // Carregar dados atualizados do profissional diretamente do banco
      console.log('🔍 [PROFESSIONAL_DATA] Carregando dados do profissional para agendamento...');
      console.log('🔍 [PROFESSIONAL_DATA] Professional ID:', professional.id);
      console.log('🔍 [PROFESSIONAL_DATA] Professional object:', professional);

      // Verificar se estamos conectados ao Supabase
      const { data: testConnection, error: testError } = await supabase
        .from('professionals')
        .select('count')
        .limit(1);

      console.log('🔍 [PROFESSIONAL_DATA] Teste de conexão:', { testConnection, testError });

      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('id, user_id, franchise_id, name')
        .eq('id', professional.id)
        .single();

      console.log('🔍 [PROFESSIONAL_DATA] Query executada - Raw response:', { data: profData, error: profError });

      if (profError) {
        console.error('❌ [PROFESSIONAL_DATA] Erro na query:', profError);
        console.error('❌ [PROFESSIONAL_DATA] Detalhes completos do erro:', {
          message: profError.message,
          details: profError.details,
          hint: profError.hint,
          code: profError.code,
          status: profError.status,
          statusText: profError.statusText
        });
        throw new Error(`Erro ao carregar dados do profissional: ${profError.message}`);
      }

      if (!profData) {
        console.error('❌ [PROFESSIONAL_DATA] Nenhum dado retornado para o profissional:', professional.id);
        console.error('❌ [PROFESSIONAL_DATA] Verificando se o ID existe na tabela...');

        // Verificar se o profissional existe na tabela
        const { data: allPros, error: allError } = await supabase
          .from('professionals')
          .select('id, name, user_id')
          .limit(10);

        console.log('❌ [PROFESSIONAL_DATA] Todos os profissionais na tabela:', allPros);
        console.log('❌ [PROFESSIONAL_DATA] Erro ao buscar todos:', allError);

        throw new Error('Dados do profissional não encontrados');
      }

      console.log('✅ [PROFESSIONAL_DATA] Dados carregados com sucesso:', profData);
      console.log('✅ [PROFESSIONAL_DATA] user_id encontrado:', profData.user_id);
      console.log('✅ [PROFESSIONAL_DATA] franchise_id encontrado:', profData.franchise_id);

      // Log dos dados do profissional carregados
      console.log('📊 [SUBMIT] Dados do profissional para o agendamento:', {
        professional_id: professional.id,
        user_id: profData.user_id,
        franchise_id: profData.franchise_id
      });

      // Combine date and time
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      // Check for time conflicts
      const conflictResult = await checkTimeConflict(appointmentDateTime);
      if (conflictResult.hasConflict) {
        alert('Horário conflitante! Já existe um agendamento para este horário.');
        setLoading(false);
        return;
      }

      // Calculate total price and prepare services
      let totalPrice = 0;
      const appointmentServices = [];

      for (const selectedService of selectedServices) {
        const service = services.find(s => s.id === selectedService.service_id);
        if (!service) throw new Error('Serviço não encontrado');

        totalPrice += service.price;
        appointmentServices.push({
          service_id: selectedService.service_id,
          price: service.price,
          used_package_session: false
        });
      }

      // Find or create customer
      let customerId = selectedCustomer?.id;
      if (!customerId) {
        // Create new customer in customers table
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: formData.customer_name,
            phone: formData.customer_phone,
            professional_id: professional.id,
            user_id: profData.user_id,
            franchise_id: profData.franchise_id
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
        console.log('✅ [Customer] Novo cliente criado:', newCustomer);
      }

      let appointment;
      if (rescheduleData) {
        // Update existing appointment - MUST be for current professional
        if (rescheduleData.id && professional.id !== formData.professional_id) {
          throw new Error('Erro de segurança: Tentativa de reagendar agendamento de outro profissional');
        }

        // Update existing appointment
        const { data: updatedAppointment, error: updateError } = await supabase
          .from('appointments')
          .update({
            appointment_date: appointmentDateTime.toISOString(),
            notes: formData.notes
          })
          .eq('id', rescheduleData.id)
          .eq('professional_id', professional.id)  // Extra security check
          .select()
          .single();

        if (updateError) throw updateError;
        appointment = updatedAppointment;
      } else {
        // Create new appointment - MUST set professional_id to current professional
        const appointmentData = {
          professional_id: professional.id,  // ✅ Always set to current professional
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          appointment_date: appointmentDateTime.toISOString(),
          total_price: totalPrice,
          notes: formData.notes,
          status: 'pending',
          user_id: profData.user_id,
          franchise_id: profData.franchise_id
        };

        console.log('📝 [SUBMIT] Dados do agendamento a ser criado:', appointmentData);

        const { data: newAppointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();

        if (appointmentError) throw appointmentError;
        appointment = newAppointment;
      }

      // Create appointment services
      const servicesToInsert = appointmentServices.map(service => ({
        appointment_id: appointment.id,
        service_id: service.service_id,
        price: service.price,
        used_package_session: service.used_package_session
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert);

      if (servicesError) throw servicesError;

      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
        professional_id: professional?.id || ''
      });
      setSelectedCustomer(null);
      setSelectedServices([]);

      onSuccess();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    selectedServices.forEach(selectedService => {
      const service = services.find(s => s.id === selectedService.service_id);
      if (service) {
        total += service.price;
      }
    });
    return total;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#c4d82e]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{rescheduleData ? 'Reagendar Agendamento' : 'Novo Agendamento'}</h3>
              <p className="text-gray-400">{rescheduleData ? 'Reagende o agendamento existente' : 'Crie um novo agendamento para seu cliente'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Cliente
              </label>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
              >
                <option value="">Novo cliente</option>
                {filteredCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Buscar Cliente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                  placeholder="Nome ou telefone..."
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-400">
                  {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Nome do Cliente
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                  placeholder="+55 11 99999-9999"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-bold text-white">
                Serviços
              </label>
              <button
                type="button"
                onClick={addService}
                className="flex items-center gap-2 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#a6c025] text-black font-semibold px-4 py-2 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/40 transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </button>
            </div>

            {selectedServices.map((selectedService, index) => {
              const service = services.find(s => s.id === selectedService.service_id);

              return (
                <div key={index} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-white text-lg">
                      Serviço {index + 1}
                    </h4>
                    {selectedServices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-3">
                      Serviço
                    </label>
                    <select
                      value={selectedService.service_id}
                      onChange={(e) => updateService(index, e.target.value)}
                      className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                      required
                    >
                      <option value="">Selecione um serviço</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - R$ {service.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {service && (
                    <div className="mt-4 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-400" />
                          </div>
                          <span className="text-white font-bold">
                            R$ {service.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-white font-semibold">{service.duration_minutes} minutos</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedServices.length > 0 && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Total do Agendamento</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {calculateTotalPrice().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Data
              </label>
              <div className="relative">
                <DatePicker
                  value={formData.appointment_date}
                  onChange={(date) => {
                    console.log(`📅 [PROFESSIONAL] Clicou no dia: ${date}`);
                    setFormData({ ...formData, appointment_date: date });
                  }}
                  minDate={new Date()}
                  placeholder="Selecione uma data"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Profissional
              </label>
              <select
                value={formData.professional_id || professional?.id || ''}
                onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                required
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} - {prof.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slot Picker */}
           {formData.appointment_date && professional && (
             <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-10 h-10 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                   <Clock className="w-5 h-5 text-[#c4d82e]" />
                 </div>
                 <h4 className="text-lg font-bold text-white">Selecionar Horário</h4>
               </div>
               {(() => {
                 console.log(`🕒 [PROFESSIONAL] Abrindo horários disponíveis para ${formData.appointment_date} - Profissional: ${professional.name}`);
                 return null;
               })()}
               <TimeSlotPicker
                 selectedDate={formData.appointment_date}
                 selectedProfessional={professional.id}
                 selectedServices={selectedServices}
                 onTimeSelect={(time) => setFormData({ ...formData, appointment_time: time })}
                 selectedTime={formData.appointment_time}
                 services={services}
               />
             </div>
           )}

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
                rows={3}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#a6c025] text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/40 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Criando Agendamento...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Criar Agendamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}