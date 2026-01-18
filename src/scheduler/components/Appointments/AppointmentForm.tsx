import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { Calendar, Clock, User, Phone, DollarSign, FileText, Plus, X } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import DatePicker from './DatePicker';

interface Professional {
  id: string;
  name: string;
  specialty: string;
  franchise_id?: string;
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
  professional_id?: string;
  professional?: {
    id: string;
    name: string;
    specialty: string;
  };
}

interface CustomerPackage {
  id: string;
  package_id: string;
  paid: boolean;
  expiration_date: string | null;
  package: {
    name: string;
    services: Array<{
      service_id: string;
      quantity: number;
      service: {
        name: string;
      };
      customer_sessions?: {
        sessions_remaining: number;
      };
    }>;
  };
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
  professional_id?: string;
  professional_name?: string;
  services?: Array<{
    service: {
      name: string;
    };
    price: number;
    used_package_session: boolean;
  }>;
}

interface AppointmentFormProps {
  onSuccess: () => void;
  rescheduleData?: RescheduleAppointment;
  prefillData?: {
    customer_name?: string;
    customer_phone?: string;
    professional_id?: string;
  };
  franchiseId?: string;
}

export default function AppointmentForm({ onSuccess, rescheduleData, prefillData, franchiseId }: AppointmentFormProps) {
   // Get user from admin context, optional
   let user = null;
   let professional = null;

   try {
     const authContext = useAuth();
     user = authContext?.user;
   } catch (e) {
     // Not in AuthProvider context, which is fine for professional
   }

   try {
     // Get professional from professional context, optional
     const profContext = useProfessionalAuth();
     professional = profContext?.professional;
   } catch (e) {
     // Not in ProfessionalAuthProvider context
   }

   // Try to use scheduler context for data and operations (for admin users)
   let contextProfessionals: any[] = [];
   let contextServices: any[] = [];
   let contextCustomers: any[] = [];
   let contextLoading = false;
   let createAppointment: any = null;
   let updateAppointment: any = null;
   let refreshCustomers: any = null;

   try {
     const schedulerContext = useScheduler();
     contextProfessionals = schedulerContext.professionals;
     contextServices = schedulerContext.services;
     contextCustomers = schedulerContext.customers;
     contextLoading = schedulerContext.loading.appointments || schedulerContext.loading.customers || schedulerContext.loading.professionals || schedulerContext.loading.services;
     createAppointment = schedulerContext.createAppointment;
     updateAppointment = schedulerContext.updateAppointment;
     refreshCustomers = schedulerContext.refreshCustomers;
   } catch (e) {
     // SchedulerContext not available (professional user), will load data directly
     console.log('SchedulerContext not available, loading data directly for professional');
   }

   const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
   const [datesWithAppointments, setDatesWithAppointments] = useState<Set<string>>(new Set());
   const [loading, setLoading] = useState(false);
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
   const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
   const [showOverlapConfirmation, setShowOverlapConfirmation] = useState(false);
   const [overlapDetails, setOverlapDetails] = useState<{
     conflictingAppointments: any[];
     proposedStart: Date;
     proposedEnd: Date;
   } | null>(null);
 
   const [servicesWithPackages, setServicesWithPackages] = useState<Service[]>([]);
 
   // Local state for professional users (when SchedulerContext is not available)
   const [localProfessionals, setLocalProfessionals] = useState<any[]>([]);
   const [localServices, setLocalServices] = useState<any[]>([]);
   const [localCustomers, setLocalCustomers] = useState<any[]>([]);
   const [localLoading, setLocalLoading] = useState(false);
 
   const [formData, setFormData] = useState({
      customer_name: '',
      customer_phone: '',
      professional_id: '',
      appointment_date: '',
      appointment_time: '',
      notes: ''
    });

  // Load data for professional users when SchedulerContext is not available
  useEffect(() => {
    if (!createAppointment && professional) {
      // SchedulerContext not available, load data directly for professional
      loadProfessionalData();
    }
  }, [professional]);

  const loadProfessionalData = async () => {
    if (!professional) return;

    setLocalLoading(true);

    try {
      // Load professionals (only the current professional)
      setLocalProfessionals([professional]);

      // Load services available to this professional
      const { data: professionalServices } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professional.id);

      if (professionalServices && professionalServices.length > 0) {
        const serviceIds = professionalServices.map(ps => ps.service_id);

        const { data: services } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');

        setLocalServices(services || []);
      } else {
        // Fallback: load all active services if no professional services are configured
        console.log('⚠️ No professional services found, loading all active services as fallback');
        const { data: allServices } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('name');

        setLocalServices(allServices || []);
      }

      // Load customers for this professional
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          *,
          professional:professionals(id, name, specialty)
        `)
        .eq('professional_id', professional.id)
        .order('name');

      setLocalCustomers(customers || []);

    } catch (error) {
      console.error('Error loading professional data:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Use context data if available, otherwise use local data
  const effectiveProfessionals = contextProfessionals.length > 0 ? contextProfessionals : localProfessionals;
  const effectiveServices = contextServices.length > 0 ? contextServices : localServices;
  const effectiveCustomers = contextCustomers.length > 0 ? contextCustomers : localCustomers;
  const effectiveLoading = contextLoading || localLoading;

  // Local functions for professional users when SchedulerContext is not available
  const localCreateAppointment = async (data: any) => {
    if (!professional) throw new Error('Professional not authenticated');

    const appointmentData = {
      ...data,
      user_id: null, // Professionals don't have user_id
    };

    const { data: result, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;
    return result;
  };

  const localUpdateAppointment = async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  };

  const localRefreshCustomers = async () => {
    if (!professional) return;

    try {
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          *,
          professional:professionals(id, name, specialty)
        `)
        .eq('professional_id', professional.id)
        .order('name');

      setLocalCustomers(customers || []);
    } catch (error) {
      console.error('Error refreshing customers:', error);
    }
  };

  // Use context functions if available, otherwise use local functions
  const createAppointmentFunc = createAppointment || localCreateAppointment;
  const updateAppointmentFunc = updateAppointment || localUpdateAppointment;
  const refreshCustomersFunc = refreshCustomers || localRefreshCustomers;

  useEffect(() => {

     if (rescheduleData) {
      // Pre-fill form with reschedule data
      const appointmentDate = new Date(rescheduleData.appointment_date);
      setFormData({
        customer_name: rescheduleData.customer_name,
        customer_phone: rescheduleData.customer_phone,
        professional_id: rescheduleData.professional_id || '', // Use professional_id from reschedule data
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentDate.toTimeString().slice(0, 5),
        notes: rescheduleData.notes
      });

      // Load customer packages if customer exists
      loadCustomerPackages(rescheduleData.customer_phone);

      // Pre-select services from the original appointment
      if (rescheduleData.services && rescheduleData.services.length > 0) {
        const preSelectedServices = rescheduleData.services.map(service => ({
          service_id: (service as any).service_id || '', // Use service_id from the service data
          use_package: service.used_package_session
        }));
        setSelectedServices(preSelectedServices);
      }
    } else if (prefillData) {
      // Pre-fill form with data from URL parameters
      setFormData(prev => ({
        ...prev,
        customer_name: prefillData.customer_name || '',
        customer_phone: prefillData.customer_phone || '',
        professional_id: prefillData.professional_id || ''
      }));

      // Load customer packages if customer phone is provided
      if (prefillData.customer_phone) {
        loadCustomerPackages(prefillData.customer_phone);
      }
    }
  }, [rescheduleData, prefillData]);

  // Load dates with appointments when professional changes
  useEffect(() => {
    if (formData.professional_id) {
      loadDatesWithAppointments(formData.professional_id);
    }
  }, [formData.professional_id]);



  const loadDatesWithAppointments = async (professionalId: string) => {
    try {
      let query = supabase
        .from('appointments')
        .select('appointment_date, status')
        .eq('professional_id', professionalId)
        .in('status', ['pending', 'confirmed']);

      if (user && !professional) {
        // For admin, also filter by user_id
        query = query.eq('user_id', user.id);
      }

      const { data: appointments } = await query;

      if (appointments) {
        const datesSet = new Set<string>();
        appointments.forEach((apt: any) => {
          const dateString = new Date(apt.appointment_date).toISOString().split('T')[0];
          datesSet.add(dateString);
        });
        setDatesWithAppointments(datesSet);
      }
    } catch (error) {
      console.error('Erro ao carregar datas com agendamentos:', error);
    }
  };




  const loadCustomerPackages = async (phone: string) => {
    try {
      // Find customer by phone
      let query = supabase
        .from('customers')
        .select('id');

      if (professional) {
        // Professional: filter by professional_id
        query = query
          .eq('professional_id', professional.id)
          .eq('phone', phone);
      } else if (user) {
        // Admin: filter by user_id
        query = query
          .eq('user_id', user.id)
          .eq('phone', phone);
      } else {
        return;
      }

      // Aplicar filtro de franquia se disponível
      if (franchiseId) {
        console.log('🔒 [DEBUG] Filtrando cliente por franquia em loadCustomerPackages:', franchiseId);
        query = query.eq('franchise_id', franchiseId);
      }

      const { data: customerData } = await query.single();

      if (customerData) {
        await handleCustomerChange(customerData.id);
      }
    } catch (error) {
      console.error('Error loading customer packages:', error);
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    const customer = effectiveCustomers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);

    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_name: customer.name,
        customer_phone: customer.phone,
        professional_id: customer.professional_id || ''
      }));

      // Load customer packages and update services list
      try {
        console.log('🔍 [AppointmentForm] Loading packages for customer:', customerId, 'franchise_id:', franchiseId);

        // Get customer packages with full details
        let query = supabase
          .from('customer_packages')
          .select(`
            id,
            package_id,
            expiration_date,
            paid,
            created_at,
            package:packages!inner(
              name,
              price,
              expires_after_days,
              services:package_services(
                service_id,
                quantity,
                service:services!inner(name)
              )
            )
          `)
          .eq('customer_id', customerId)
          .eq('paid', true);

        // Only filter by user_id if user exists (admin view)
        if (user) {
          query = query.eq('user_id', user.id);
        }

        const { data: customerPackagesData } = await query;

        console.log('✅ [AppointmentForm] Customer packages found:', customerPackagesData?.length || 0);

        // Get sessions remaining for each service
        const packagesWithSessions = [];
        if (customerPackagesData) {
          for (const cp of customerPackagesData) {
            console.log('🔍 [AppointmentForm] Package data for', cp.package_id, ':', JSON.stringify(cp.package, null, 2));

            const servicesWithSessions = [];
            for (const service of (cp.package as any).services || []) {
              console.log('🔍 [AppointmentForm] Loading sessions for service:', service.service_id, 'customer_package:', cp.id, 'franchise_id:', franchiseId);

              const query = supabase
                .from('customer_package_services')
                .select('sessions_remaining')
                .eq('customer_package_id', cp.id)
                .eq('service_id', service.service_id);

              // Only add franchise_id filter if it's defined and not null
              if (franchiseId) {
                query.eq('franchise_id', franchiseId);
              }

              const { data: sessionData, error: sessionError } = await query.limit(1);

              if (sessionError) {
                console.error('❌ [AppointmentForm] Error loading session data:', sessionError);
              }

              console.log('🔍 [AppointmentForm] Session data for customer_package', cp.id, 'service', service.service_id, ':', sessionData);

              const sessionsRemaining = sessionData && sessionData.length > 0 ? sessionData[0].sessions_remaining : 0;
              console.log('✅ [AppointmentForm] Sessions remaining calculated:', sessionsRemaining);

              servicesWithSessions.push({
                service_id: service.service_id,
                quantity: service.quantity,
                service: {
                  name: service.service.name
                },
                customer_sessions: [{ sessions_remaining: sessionsRemaining }]
              });
            }

            packagesWithSessions.push({
              id: cp.id,
              package_id: cp.package_id,
              expiration_date: cp.expiration_date,
              paid: cp.paid,
              created_at: cp.created_at,
              package: {
                name: (cp.package as any).name,
                price: (cp.package as any).price,
                services: servicesWithSessions
              }
            });
          }
        }

        // Filter valid packages (not expired and have sessions)
        const validPackages = packagesWithSessions.filter((cp: any) => {
          const isExpired = cp.expiration_date && new Date(cp.expiration_date) < new Date();
          const hasSessions = cp.package.services.some((service: any) =>
            (service.customer_sessions[0]?.sessions_remaining || 0) > 0
          );
          console.log('🔍 [AppointmentForm] Package', cp.id, 'isExpired:', isExpired, 'hasSessions:', hasSessions);
          return !isExpired && hasSessions;
        });

        console.log('✅ [AppointmentForm] Valid packages:', validPackages.length);
        setCustomerPackages(validPackages as any);

        // Update services list with package information
        const servicesWithPackagesMap = new Map();
        (servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).forEach(service => {
          servicesWithPackagesMap.set(service.id, {
            ...service,
            has_package: false,
            package_sessions: 0
          });
        });

        // Mark services that have available package sessions
        validPackages.forEach((pkg: any) => {
          pkg.package.services.forEach((service: any) => {
            if (servicesWithPackagesMap.has(service.service_id)) {
              const serviceData = servicesWithPackagesMap.get(service.service_id);
              serviceData.has_package = true;
              serviceData.package_sessions = service.customer_sessions[0]?.sessions_remaining || 0;
            }
          });
        });

        setServicesWithPackages(Array.from(servicesWithPackagesMap.values()));
      } catch (error) {
        console.error('Error loading customer packages:', error);
        setCustomerPackages([]);
        // Reset services to original state
        setServicesWithPackages((servicesWithPackages.length > 0 ? servicesWithPackages : contextServices).map(s => ({ ...s, has_package: false, package_sessions: 0 })));
      }
    } else {
      setCustomerPackages([]);
      // Reset services to original state
      setServicesWithPackages((servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).map(s => ({ ...s, has_package: false, package_sessions: 0 })));
    }
  };

  const addService = () => {
    setSelectedServices(prev => [...prev, { service_id: '', use_package: false }]);
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

 const updateService = (index: number, serviceId: string) => {
   const service = (servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).find(s => s.id === serviceId);
   // Don't automatically use package - let user choose
   setSelectedServices(prev => prev.map((service, i) =>
     i === index ? { ...service, service_id: serviceId, use_package: false } : service
   ));
 };


  const checkTimeConflict = async (appointmentDateTime: Date, professionalId: string, excludeAppointmentId?: string) => {
    console.log('🔍 [DEBUG] checkTimeConflict chamado:', {
      appointmentDateTime,
      professionalId,
      excludeAppointmentId,
      selectedServices,
      franchiseId
    });

    // Calculate total duration of all selected services
    let totalDuration = 0;
    for (const selectedService of selectedServices) {
      const service = (servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).find(s => s.id === selectedService.service_id);
      if (service) {
        totalDuration += service.duration_minutes;
      }
    }

    console.log('⏱️ [DEBUG] Duração total calculada:', totalDuration);

    // Calculate end time of this appointment
    const appointmentEndTime = new Date(appointmentDateTime);
    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + totalDuration);

    console.log('📅 [DEBUG] Período do agendamento:', {
      start: appointmentDateTime.toISOString(),
      end: appointmentEndTime.toISOString()
    });

    // Build query based on user type (admin vs professional)
    let conflictQuery = supabase
      .from('appointments')
      .select('id, appointment_date, status, customer_name')
      .eq('professional_id', professionalId)
      .gte('appointment_date', appointmentDateTime.toISOString())
      .lt('appointment_date', appointmentEndTime.toISOString())
      .neq('status', 'cancelled')
      .neq('status', 'completed');

    // For admins, also filter by user_id
    if (user && !professional) {
      conflictQuery = conflictQuery.eq('user_id', user.id);
      console.log('👑 [DEBUG] Aplicando filtro user_id para admin:', user.id);
    }

    // Aplicar filtro de franquia se disponível
    if (franchiseId) {
      conflictQuery = conflictQuery.eq('franchise_id', franchiseId);
      console.log('🔒 [DEBUG] Aplicando filtro franchise_id na verificação de conflitos:', franchiseId);
    }

    console.log('🔍 [DEBUG] Executando query de conflitos...');
    const { data: conflictingAppointments, error } = await conflictQuery;

    if (error) {
      console.error('Error checking time conflicts:', error);
      return { hasConflict: false, conflictingAppointments: [] };
    }

    // Exclude current appointment if rescheduling
    const filteredConflicts = conflictingAppointments?.filter(apt =>
      excludeAppointmentId ? apt.id !== excludeAppointmentId : true
    ) || [];

    if (filteredConflicts.length > 0) {
      return { hasConflict: true, conflictingAppointments: filteredConflicts };
    }

    console.log('🔍 [DEBUG] Verificando sobreposições de horário...');

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
      .eq('professional_id', professionalId)
      .neq('status', 'cancelled')
      .neq('status', 'completed');

    // For admins, also filter by user_id
    if (user && !professional) {
      overlapQuery = overlapQuery.eq('user_id', user.id);
      console.log('👑 [DEBUG] Aplicando filtro user_id para sobreposições:', user.id);
    }

    // Aplicar filtro de franquia se disponível
    if (franchiseId) {
      overlapQuery = overlapQuery.eq('franchise_id', franchiseId);
      console.log('🔒 [DEBUG] Aplicando filtro franchise_id para sobreposições:', franchiseId);
    }

    console.log('🔍 [DEBUG] Executando query de sobreposições...');
    const { data: overlappingAppointments, error: overlapError } = await overlapQuery;

    if (overlapError) {
      console.error('Error checking overlapping appointments:', overlapError);
      return { hasConflict: false, conflictingAppointments: [] };
    }

    // Check if any existing appointment's time slot overlaps with our new appointment
    const overlappingConflicts = [];
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
      if ((appointmentDateTime < aptEndTime && appointmentEndTime > aptStartTime) &&
          (excludeAppointmentId ? apt.id !== excludeAppointmentId : true)) {
        overlappingConflicts.push(apt);
      }
    }

    console.log('✅ [DEBUG] Resultado final da verificação de conflitos:', {
      hasConflict: overlappingConflicts.length > 0,
      conflictingAppointmentsCount: overlappingConflicts.length,
      conflictingAppointments: overlappingConflicts
    });

    return {
      hasConflict: overlappingConflicts.length > 0,
      conflictingAppointments: overlappingConflicts
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔍 [DEBUG] handleSubmit chamado');
    console.log('👤 [DEBUG] user:', user);
    console.log('👨‍⚕️ [DEBUG] professional:', professional);
    console.log('📋 [DEBUG] selectedServices:', selectedServices);
    console.log('🏢 [DEBUG] professionals no contexto:', effectiveProfessionals);
    console.log('👷 [DEBUG] services no contexto:', effectiveServices);
    console.log('👥 [DEBUG] customers no contexto:', effectiveCustomers);
    console.log('📅 [DEBUG] formData:', formData);
    console.log('🏢 [DEBUG] franchiseId:', franchiseId);

    // Allow submission if we have data from context (franchise mode) or user/professional context
    const hasContextData = effectiveProfessionals.length > 0 && effectiveServices.length > 0;
    const hasUserContext = user || professional;

    console.log('📊 [DEBUG] hasContextData:', hasContextData, 'hasUserContext:', hasUserContext, 'selectedServices.length:', selectedServices.length);

    if ((!hasContextData && !hasUserContext) || selectedServices.length === 0) {
      console.log('❌ [DEBUG] Validação falhou - dados insuficientes ou selectedServices vazio');
      console.log('📊 [DEBUG] hasContextData:', hasContextData, 'hasUserContext:', hasUserContext);
      alert('Erro: Dados insuficientes para criar agendamento. Verifique se há profissionais e serviços disponíveis.');
      return;
    }

    // Validate that professional is selected for new customers
    if (!selectedCustomer && !formData.professional_id) {
      console.log('❌ [DEBUG] Validação falhou - professional_id obrigatório para novos clientes');
      alert('Erro: Selecione um profissional para atribuir ao novo cliente.');
      return;
    }

    console.log('✅ [DEBUG] Validação passou, prosseguindo...');

    setLoading(true);
    console.log('⚙️ [DEBUG] Iniciando processamento do agendamento...');

    try {
      console.log('📅 [DEBUG] Criando data do agendamento:', `${formData.appointment_date}T${formData.appointment_time}-03:00`);
      // Combine date and time in São Paulo timezone
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}-03:00`);
      console.log('📅 [DEBUG] Data criada:', appointmentDateTime);

      console.log('🔍 [DEBUG] Verificando conflitos de horário...');
      // Check for time conflicts
      const conflictResult = await checkTimeConflict(appointmentDateTime, formData.professional_id, rescheduleData?.id);
      console.log('🔍 [DEBUG] Resultado da verificação de conflitos:', conflictResult);

      if (conflictResult.hasConflict) {
        // Calculate total duration for overlap details
        let totalDuration = 0;
        for (const selectedService of selectedServices) {
          const service = effectiveServices.find(s => s.id === selectedService.service_id);
          if (service) {
            totalDuration += service.duration_minutes;
          }
        }
        const appointmentEndTime = new Date(appointmentDateTime);
        appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + totalDuration);

        setOverlapDetails({
          conflictingAppointments: conflictResult.conflictingAppointments,
          proposedStart: appointmentDateTime,
          proposedEnd: appointmentEndTime
        });
        setShowOverlapConfirmation(true);
        setLoading(false);
        return;
      }

      // Calculate total price and prepare services
      console.log('💰 [DEBUG] Calculating total price and preparing services');
      let totalPrice = 0;
      const appointmentServices = [];
      const currentServices = servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices;

      for (const selectedService of selectedServices) {
        const service = currentServices.find((s: any) => s.id === selectedService.service_id);
        if (!service) throw new Error('Serviço não encontrado');

        let price = service.price;
        let usedPackageSession = false;

        if (service.has_package && selectedService.use_package) {
           // Service has package available and user chose to use it
           price = 0;
           usedPackageSession = true;
           // Find which package to use for this service
           const availablePackage = customerPackages.find(cp =>
             cp.package.services.some(ps => ps.service_id === selectedService.service_id && (ps.customer_sessions as any)?.sessions_remaining > 0)
           );
           if (availablePackage) {
             selectedService.package_id = availablePackage.id;
           }
          }

        totalPrice += price;
        appointmentServices.push({
          service_id: selectedService.service_id,
          price,
          used_package_session: usedPackageSession
        });
      }

      console.log('💰 [DEBUG] Total price calculated:', totalPrice);
      console.log('🛠️ [DEBUG] Appointment services prepared:', appointmentServices);

      // Create or update appointment using scheduler context
      const appointmentData: any = {
        professional_id: formData.professional_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        appointment_date: appointmentDateTime.toISOString(),
        total_price: totalPrice,
        notes: formData.notes,
        status: 'pending',
        uses_package: selectedServices.some(s => s.use_package), // Mark if any service uses package
        // Sempre pegar user_id e franchise_id do profissional logado
        user_id: (professional as any)?.user_id || user?.id || null,
        franchise_id: (professional as any)?.franchise_id || franchiseId || null,
      };

      console.log('📦 [PACKAGE DEBUG] Appointment uses_package flag:', appointmentData.uses_package);
      console.log('📦 [PACKAGE DEBUG] Services analysis:', selectedServices.map(s => ({
        service_id: s.service_id,
        use_package: s.use_package,
        package_id: s.package_id
      })));
      console.log('🏢 [DEBUG] Final appointmentData:', appointmentData);

      let appointment;
      if (rescheduleData) {
        // Update existing appointment for reschedule using scheduler context
        console.log('🔄 [DEBUG] Iniciando reagendamento para appointment ID:', rescheduleData.id);
        console.log('📝 [DEBUG] Dados do reagendamento:', appointmentData);

        appointment = await updateAppointmentFunc(rescheduleData.id, appointmentData);
        console.log('✅ [DEBUG] Reagendamento realizado com sucesso:', appointment);

        // Delete old appointment services and commissions for reschedule
        console.log('🗑️ [DEBUG] Removendo serviços antigos do agendamento');
        await supabase.from('appointment_services').delete().eq('appointment_id', rescheduleData.id);
        await supabase.from('commission_records').delete().eq('appointment_id', rescheduleData.id);
        console.log('✅ [DEBUG] Serviços antigos removidos');
      } else {
        // Create new appointment using scheduler context (which adds franchise_id)
        console.log('➕ [DEBUG] Criando novo agendamento');
        appointment = await createAppointmentFunc(appointmentData);
        console.log('✅ [DEBUG] Novo agendamento criado:', appointment);
      }

      // Create appointment services
      const servicesToInsert = appointmentServices.map((service, index) => {
        const selectedService = selectedServices[index];
        const customerPackageId = service.used_package_session && selectedService?.package_id ? selectedService.package_id : null;

        return {
          appointment_id: appointment.id,
          service_id: service.service_id,
          price: service.price,
          used_package_session: service.used_package_session,
          customer_package_id: customerPackageId
        };
      });


      const { data: insertedServices, error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert)
        .select('id, service_id, price');


      if (servicesError) throw servicesError;

      // Commission records will be created automatically by database trigger when appointment is marked as 'completed'
      // No need to create them here - this ensures commissions are only created for completed appointments
      console.log('💰 [DEBUG] Commission records will be created by trigger when appointment is completed');
      console.log('💰 [DEBUG] Commission records will be created by trigger when appointment is completed');

      // Update package sessions if used (only for new appointments, not reschedule)
      if (!rescheduleData) {
        console.log('📦 [DEBUG] Updating package sessions for new appointment');
        for (let i = 0; i < selectedServices.length; i++) {
          const selectedService = selectedServices[i];
          if (appointmentServices[i].used_package_session && selectedService.package_id) {
            console.log('📦 [DEBUG] Updating package session for service:', selectedService.service_id, 'package:', selectedService.package_id);
            // First get current sessions_remaining
            const { data: currentData } = await supabase
              .from('customer_package_services')
              .select('sessions_remaining')
              .eq('customer_package_id', selectedService.package_id)
              .eq('service_id', selectedService.service_id)
              .single();

            console.log('📦 [DEBUG] Current sessions remaining:', currentData?.sessions_remaining);

            if (currentData && currentData.sessions_remaining > 0) {
              const { error: updateError } = await supabase
                .from('customer_package_services')
                .update({
                  sessions_remaining: currentData.sessions_remaining - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('customer_package_id', selectedService.package_id)
                .eq('service_id', selectedService.service_id);

              if (updateError) {
                console.error('❌ [DEBUG] Error updating package sessions:', updateError);
                throw updateError;
              }
              console.log('✅ [DEBUG] Package session updated successfully');
            } else {
              console.warn('⚠️ [DEBUG] No sessions remaining or data not found');
            }
          }
        }
      }

      // Create or update customer record
      console.log('👤 [DEBUG] Processing customer data');
      if (selectedCustomer) {
        // Update existing customer
        console.log('🔄 [Customer] Atualizando cliente existente:', selectedCustomer.id);
        const updateData: any = {
          name: formData.customer_name,
          updated_at: new Date().toISOString()
        };

        // Only update professional_id if it's different and provided
        if (formData.professional_id && formData.professional_id !== selectedCustomer.professional_id) {
          updateData.professional_id = formData.professional_id;
          console.log('👨‍⚕️ [Customer] Atualizando professional_id para:', formData.professional_id);
        }

        // Add franchise_id if available
        if (franchiseId) {
          updateData.franchise_id = franchiseId;
        }

        console.log('📝 [Customer] Update data:', updateData);

        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', selectedCustomer.id);

        if (updateError) {
          console.error('❌ [Customer] Erro ao atualizar cliente:', updateError);
          throw updateError;
        }
        console.log('✅ [Customer] Cliente atualizado com sucesso');
      } else {
        // Create new customer with professional assignment
        console.log('➕ [Customer] Criando novo cliente');
        const customerData: any = {
          name: formData.customer_name,
          phone: formData.customer_phone
        };

        // Always assign professional_id if provided
        if (formData.professional_id) {
          customerData.professional_id = formData.professional_id;
          console.log('👨‍⚕️ [Customer] Atribuindo professional_id:', formData.professional_id);
        } else {
          console.warn('⚠️ [Customer] Nenhum professional_id fornecido para novo cliente');
        }

        // Add user_id for admin users
        if (user) {
          customerData.user_id = user.id;
          console.log('👑 [Customer] Adicionando user_id para admin:', user.id);
        }

        // Add franchise_id if available
        if (franchiseId) {
          customerData.franchise_id = franchiseId;
          console.log('🏢 [Customer] Adicionando franchise_id:', franchiseId);
        }

        console.log('📝 [Customer] Dados do novo cliente:', customerData);

        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ [Customer] Erro ao criar cliente:', insertError);
          throw insertError;
        }

        console.log('✅ [Customer] Novo cliente criado:', newCustomer);
      }

      // Refresh customers context to show the new customer in other components
      console.log('🔄 [Customer] Atualizando contexto de clientes...');
      await refreshCustomersFunc();

      // Reset form
      console.log('🔄 [DEBUG] Resetting form data');
      setFormData({
        customer_name: '',
        customer_phone: '',
        professional_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      });
      setSelectedCustomer(null);
      setSelectedServices([]);
      setCustomerPackages([]);

      console.log('✅ [DEBUG] Agendamento criado com sucesso, chamando onSuccess()');
      onSuccess();
    } catch (error) {
      console.error('❌ [DEBUG] ERRO ao criar agendamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : { error: String(error) };
      console.error('❌ [DEBUG] Detalhes do erro:', errorDetails);
      alert(`Erro ao criar agendamento: ${errorMessage}. Verifique o console para mais detalhes.`);
    } finally {
      console.log('🔄 [DEBUG] Finalizando processamento, setLoading(false)');
      setLoading(false);
    }
  };


  const handleConfirmOverlap = async () => {
    if (!overlapDetails) return;

    setLoading(true);
    setShowOverlapConfirmation(false);

    try {
      // Use the proposed start time (already in correct timezone)
      const appointmentDateTime = overlapDetails.proposedStart;

      // Calculate total price and prepare services
      console.log('💰 [DEBUG] Calculating total price and preparing services (overlap)');
      let totalPrice = 0;
      const appointmentServices = [];
      const currentServicesOverlap = servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices;

      for (const selectedService of selectedServices) {
        const service = currentServicesOverlap.find((s: any) => s.id === selectedService.service_id);
        if (!service) throw new Error('Serviço não encontrado');

        let price = service.price;
        let usedPackageSession = false;

        if (service.has_package && selectedService.use_package) {
           // Service has package available and user chose to use it
           price = 0;
           usedPackageSession = true;
           // Find which package to use for this service
           const availablePackage = customerPackages.find(cp =>
             cp.package.services.some(ps => ps.service_id === selectedService.service_id && (ps.customer_sessions as any)?.sessions_remaining > 0)
           );
           if (availablePackage) {
             selectedService.package_id = availablePackage.id;
           }
          }

        totalPrice += price;
        appointmentServices.push({
          service_id: selectedService.service_id,
          price,
          used_package_session: usedPackageSession
        });
      }

      console.log('💰 [DEBUG] Total price calculated (overlap):', totalPrice);
      console.log('🛠️ [DEBUG] Appointment services prepared (overlap):', appointmentServices);

      // Create or update appointment using scheduler context
      const appointmentData: any = {
        professional_id: formData.professional_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        appointment_date: appointmentDateTime.toISOString(),
        total_price: totalPrice,
        notes: formData.notes,
        status: 'pending',
        user_id: professional?.user_id || user?.id || null,
        franchise_id: professional?.franchise_id || franchiseId || null,
      };

      let appointment;
      if (rescheduleData) {
        // Update existing appointment for reschedule using scheduler context
        appointment = await updateAppointmentFunc(rescheduleData.id, appointmentData);

        // Delete old appointment services and commissions for reschedule
        await supabase.from('appointment_services').delete().eq('appointment_id', rescheduleData.id);
        await supabase.from('commission_records').delete().eq('appointment_id', rescheduleData.id);
      } else {
        // Create new appointment using scheduler context (which adds franchise_id)
        appointment = await createAppointmentFunc(appointmentData);
      }

      // Create appointment services
      console.log('🛠️ [DEBUG] Creating appointment services (overlap)');
      const servicesToInsert = appointmentServices.map((service, index) => ({
        appointment_id: appointment.id,
        service_id: service.service_id,
        price: service.price,
        used_package_session: service.used_package_session,
        customer_package_id: service.used_package_session ? selectedServices[index].package_id : null
      }));

      console.log('📝 [DEBUG] Services to insert (overlap):', servicesToInsert);

      const { data: insertedServices, error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert)
        .select('id, service_id, price');

      console.log('✅ [DEBUG] Inserted services (overlap):', insertedServices);

      if (servicesError) {
        console.error('❌ [DEBUG] Error inserting services (overlap):', servicesError);
        throw servicesError;
      }

      // Commission records will be created automatically by database trigger when appointment is marked as 'completed'
      // No need to create them here - this ensures commissions are only created for completed appointments
      console.log('💰 [DEBUG] Commission records will be created by trigger when appointment is completed');

      // Update package sessions if used (only for new appointments, not reschedule)
      if (!rescheduleData) {
        console.log('📦 [DEBUG] Updating package sessions for new appointment');
        for (let i = 0; i < selectedServices.length; i++) {
          const selectedService = selectedServices[i];
          if (appointmentServices[i].used_package_session && selectedService.package_id) {
            console.log('📦 [DEBUG] Updating package session for service:', selectedService.service_id, 'package:', selectedService.package_id);
            // First get current sessions_remaining
            const { data: currentData } = await supabase
              .from('customer_package_services')
              .select('sessions_remaining')
              .eq('customer_package_id', selectedService.package_id)
              .eq('service_id', selectedService.service_id)
              .single();

            console.log('📦 [DEBUG] Current sessions remaining:', currentData?.sessions_remaining);

            if (currentData && currentData.sessions_remaining > 0) {
              const { error: updateError } = await supabase
                .from('customer_package_services')
                .update({
                  sessions_remaining: currentData.sessions_remaining - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('customer_package_id', selectedService.package_id)
                .eq('service_id', selectedService.service_id);

              if (updateError) {
                console.error('❌ [DEBUG] Error updating package sessions:', updateError);
                throw updateError;
              }
              console.log('✅ [DEBUG] Package session updated successfully');
            } else {
              console.warn('⚠️ [DEBUG] No sessions remaining or data not found');
            }
          }
        }
      }

      // Create or update customer record
      if (selectedCustomer) {
        // Update existing customer
        console.log('🔄 [Customer Overlap] Atualizando cliente existente:', selectedCustomer.id);
        const updateData: any = {
          name: formData.customer_name,
          updated_at: new Date().toISOString()
        };

        // Only update professional_id if it's different and provided
        if (formData.professional_id && formData.professional_id !== selectedCustomer.professional_id) {
          updateData.professional_id = formData.professional_id;
          console.log('👨‍⚕️ [Customer Overlap] Atualizando professional_id para:', formData.professional_id);
        }

        // Add franchise_id if available
        if (franchiseId) {
          updateData.franchise_id = franchiseId;
        }

        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', selectedCustomer.id);

        if (updateError) {
          console.error('❌ [Customer Overlap] Erro ao atualizar cliente:', updateError);
          throw updateError;
        }
        console.log('✅ [Customer Overlap] Cliente atualizado com sucesso');
      } else {
        // Create new customer with professional assignment
        console.log('➕ [Customer Overlap] Criando novo cliente');
        const customerData: any = {
          name: formData.customer_name,
          phone: formData.customer_phone
        };

        // Always assign professional_id if provided
        if (formData.professional_id) {
          customerData.professional_id = formData.professional_id;
          console.log('👨‍⚕️ [Customer Overlap] Atribuindo professional_id:', formData.professional_id);
        } else {
          console.warn('⚠️ [Customer Overlap] Nenhum professional_id fornecido para novo cliente');
        }

        // Add user_id for admin users
        if (user) {
          customerData.user_id = user.id;
          console.log('👑 [Customer Overlap] Adicionando user_id para admin:', user.id);
        }

        // Add franchise_id if available
        if (franchiseId) {
          customerData.franchise_id = franchiseId;
          console.log('🏢 [Customer Overlap] Adicionando franchise_id:', franchiseId);
        }

        console.log('📝 [Customer Overlap] Dados do novo cliente:', customerData);

        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ [Customer Overlap] Erro ao criar cliente:', insertError);
          throw insertError;
        }

        console.log('✅ [Customer Overlap] Novo cliente criado:', newCustomer);
      }

      // Refresh customers context to show the new customer in other components
      console.log('🔄 [Customer Overlap] Atualizando contexto de clientes...');
      await refreshCustomersFunc();

      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        professional_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      });
      setSelectedCustomer(null);
      setSelectedServices([]);
      setCustomerPackages([]);
      setOverlapDetails(null);

      onSuccess();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOverlap = () => {
    setShowOverlapConfirmation(false);
    setOverlapDetails(null);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    selectedServices.forEach(selectedService => {
      const service = (servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).find(s => s.id === selectedService.service_id);
      if (service) {
        if (selectedService.use_package && selectedService.package_id) {
          // Package service is free
          total += 0;
        } else {
          total += service.price;
        }
      }
    });
    return total;
  };


  return (
    <div className="max-w-4xl mx-auto">
      {/* Overlap Confirmation Modal */}
      {showOverlapConfirmation && overlapDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirmação de Sobreposição de Horário
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">
                O horário selecionado ({overlapDetails.proposedStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {overlapDetails.proposedEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                conflita com os seguintes agendamentos:
              </p>
              <div className="space-y-2">
                {overlapDetails.conflictingAppointments.map((apt, index) => (
                  <div key={apt.id} className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-yellow-400">{apt.customer_name}</span>
                      <span className="text-sm text-yellow-500">
                        {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Ao concluir o agendamento, você confirma que consegue concluir dentro do prazo?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelOverlap}
                className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmOverlap}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#c4d82e] text-black rounded-lg hover:bg-[#c4d82e]/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Criando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cliente
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            >
              <option value="" className="bg-[#2a2a2a] text-white">Novo cliente</option>
              {effectiveCustomers.map(customer => (
                <option key={customer.id} value={customer.id} className="bg-[#2a2a2a] text-white">
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Cliente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="Nome completo"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              placeholder="+55 11 99999-9999"
              required
            />
          </div>
        </div>


        {/* Pacotes do Cliente */}
        {customerPackages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pacotes Disponíveis</h3>
            <div className="space-y-4">
              {customerPackages.map(pkg => (
                <div key={pkg.id} className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-green-400">{pkg.package.name}</span>
                    {pkg.expiration_date && (
                      <span className="text-green-500 text-sm">
                        válido até {new Date(pkg.expiration_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    {pkg.package.services.map(service => (
                      <div key={service.service_id} className="flex items-center justify-between bg-[#2a2a2a] border border-gray-600 rounded-lg p-3">
                        <div>
                          <span className="font-medium text-white">{service.service.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            ({(service.customer_sessions as any)?.[0]?.sessions_remaining || 0} de {service.quantity} sessões restantes)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const serviceData = effectiveServices.find(s => s.id === service.service_id);
                            if (serviceData && ((service.customer_sessions as any)?.[0]?.sessions_remaining || 0) > 0) {
                              setSelectedServices(prev => [...prev, {
                                service_id: service.service_id,
                                use_package: true,
                                package_id: pkg.id
                              }]);
                            }
                          }}
                          disabled={((service.customer_sessions as any)?.[0]?.sessions_remaining || 0) === 0}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition"
                        >
                          Usar Pacote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Serviços Avulsos
            </label>
            <button
              type="button"
              onClick={addService}
              className="flex items-center gap-2 text-[#c4d82e] hover:text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar Serviço
            </button>
          </div>

          {selectedServices.map((selectedService, index) => {
            const service = (servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices).find(s => s.id === selectedService.service_id);

            return (
              <div key={index} className="border border-gray-600 rounded-lg p-4 mb-4 bg-[#2a2a2a]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">
                    {selectedService.use_package ? 'Serviço do Pacote' : 'Serviço Avulso'} {index + 1}
                  </h4>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Serviço
                    </label>
                    <select
                      value={selectedService.service_id}
                      onChange={(e) => updateService(index, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                      required
                    >
                      <option value="" className="bg-[#1a1a1a] text-white">Selecione um serviço</option>
                      {effectiveServices.length === 0 ? (
                        <option value="" disabled className="bg-[#1a1a1a] text-gray-500">
                          {localLoading ? 'Carregando serviços...' : 'Nenhum serviço disponível - contate o administrador'}
                        </option>
                      ) : (
                        effectiveServices.map(service => (
                          <option key={service.id} value={service.id} className="bg-[#1a1a1a] text-white">
                            {service.name} - R$ {service.price.toFixed(2)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {service && service.has_package && (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedService.use_package}
                          onChange={(e) => {
                            setSelectedServices(prev => prev.map((s, i) =>
                              i === index ? { ...s, use_package: e.target.checked, package_id: e.target.checked ? undefined : s.package_id } : s
                            ));
                          }}
                          className="w-4 h-4 text-[#c4d82e] bg-gray-800 border-gray-600 rounded focus:ring-[#c4d82e] focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">Usar pacote</span>
                      </label>
                      <div className="text-xs text-green-400">
                        {service.package_sessions} sessões disponíveis
                      </div>
                    </div>
                  )}

                  {service && !service.has_package && (
                    <div className="text-sm text-gray-400">
                      Serviço avulso
                    </div>
                  )}
                </div>

                {service && (
                  <div className="mt-3 bg-[#1a1a1a] border border-gray-600 rounded-lg p-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className={`font-semibold ${selectedService.use_package ? 'text-green-400' : 'text-white'}`}>
                          {selectedService.use_package ? 'GRÁTIS (Pacote)' : `R$ ${service.price.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{service.duration_minutes} minutos</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedServices.length > 0 && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-green-400">
                  Total: R$ {calculateTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data
            </label>
            <DatePicker
              value={formData.appointment_date}
              onChange={(date) => {
                // Clear time selection and overlap details when date changes
                setFormData({
                  ...formData,
                  appointment_date: date,
                  appointment_time: ''
                });
                setOverlapDetails(null);
                setShowOverlapConfirmation(false);
              }}
              minDate={new Date()}
              placeholder="Selecione uma data"
              hasAppointments={datesWithAppointments}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profissional
            </label>
            <select
              value={formData.professional_id}
              onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
              className={`w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent ${selectedCustomer?.professional_id ? 'bg-[#1a1a1a] cursor-not-allowed' : ''}`}
              required
              disabled={!!selectedCustomer?.professional_id}
            >
              <option value="" className="bg-[#2a2a2a] text-white">Selecione um profissional</option>
              {effectiveProfessionals.length === 0 ? (
                <option value="" disabled className="bg-[#2a2a2a] text-gray-500">
                  Nenhum profissional disponível
                </option>
              ) : (
                effectiveProfessionals.map(prof => (
                  <option key={prof.id} value={prof.id} className="bg-[#2a2a2a] text-white">
                    {prof.name} - {prof.specialty}
                  </option>
                ))
              )}
            </select>
            {selectedCustomer?.professional_id && (
              <p className="text-sm text-[#c4d82e] mt-1">
                Profissional atribuído ao cliente: {selectedCustomer.professional?.name} - {selectedCustomer.professional?.specialty}
              </p>
            )}
          </div>
        </div>

        {/* Time Slot Picker */}
        {formData.appointment_date && formData.professional_id && (
          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
            <TimeSlotPicker
              selectedDate={formData.appointment_date}
              selectedProfessional={formData.professional_id}
              selectedServices={selectedServices}
              onTimeSelect={(time) => setFormData({ ...formData, appointment_time: time })}
              selectedTime={formData.appointment_time}
              services={servicesWithPackages.length > 0 ? servicesWithPackages : effectiveServices}
              franchiseId={franchiseId}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Observações
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando Agendamento...' : 'Criar Agendamento'}
          </button>
        </div>
      </form>
    </div>
  );
}