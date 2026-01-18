import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { User, Phone, Plus, Edit, Trash2, Package, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle, Search, Calendar } from 'lucide-react';

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
  created_at: string;
}

interface CustomerPackage {
  id: string;
  package: {
    name: string;
    price: number;
    expires_after_days: number | null;
    services: Array<{
      service_id: string;
      quantity: number;
      service: {
        name: string;
      };
      customer_sessions: Array<{
        sessions_remaining: number;
      }>;
    }>;
  };
  expiration_date: string | null;
  paid: boolean;
  created_at: string;
}


interface PackageOption {
  id: string;
  name: string;
  price: number;
  expires_after_days: number | null;
  services: Array<{
    service_id: string;
    quantity: number;
    service: {
      name: string;
    };
  }>;
}

interface CustomersManagerProps {
  onNavigateToAppointments?: (customer: Customer) => void;
}

export default function CustomersManager({ onNavigateToAppointments }: CustomersManagerProps) {
  const { user } = useSchedulerAuth();
  const { customers: schedulerCustomers, professionals: schedulerProfessionals, packages: schedulerPackages, loading: schedulerLoading, refreshCustomers, createCustomer, updateCustomer, deleteCustomer } = useScheduler();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPackages, setCustomerPackages] = useState<Record<string, CustomerPackage[]>>({});
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string; specialty: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [showPackagePurchase, setShowPackagePurchase] = useState(false);
  const [purchasingCustomer, setPurchasingCustomer] = useState<Customer | null>(null);
  const [purchasePackages, setPurchasePackages] = useState<string[]>([]);
  const [assignedProfessional, setAssignedProfessional] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    professional_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user, schedulerCustomers, schedulerProfessionals, schedulerPackages, schedulerLoading]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Use data from scheduler context instead of direct queries
      setCustomers(schedulerCustomers);
      setProfessionals(schedulerProfessionals);

      // Transform schedulerPackages to PackageOption format
      const transformedPackages: PackageOption[] = (schedulerPackages || []).map((pkg: any) => {
        console.log('🔄 [loadCustomers] Transformando pacote:', pkg.id, pkg.name, 'services:', pkg.services?.length || 0);

        const services = (pkg.services || []).map((ps: any) => ({
          service_id: ps.service_id,
          quantity: ps.quantity,
          service: {
            name: ps.service?.name || 'Serviço desconhecido'
          }
        }));

        console.log('✅ [loadCustomers] Pacote transformado:', pkg.id, 'com', services.length, 'serviços');

        return {
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          expires_after_days: pkg.expires_after_days,
          services: services
        };
      });

      console.log('📦 [loadCustomers] Total de pacotes transformados:', transformedPackages.length);
      setPackages(transformedPackages);

      // Load packages for each customer (this still needs to be done separately as it's not in the main context)
      const packagesMap: Record<string, CustomerPackage[]> = {};
      for (const customer of schedulerCustomers) {
        console.log('🔍 [loadCustomers] Loading packages for customer:', customer.id, 'franchise_id:', customer.franchise_id);

        // First get customer packages
        const { data: customerPackages, error: cpError } = await supabase
          .from('customer_packages')
          .select('id, package_id, expiration_date, paid, created_at')
          .eq('customer_id', customer.id)
          .eq('paid', true);

        if (cpError) {
          console.error('❌ [loadCustomers] Error loading customer packages:', cpError);
        }

        console.log('✅ [loadCustomers] Customer packages found:', customerPackages?.length || 0);

        if (customerPackages && customerPackages.length > 0) {
          // For each customer package, load package details and services
          const packagesWithDetails = [];
          for (const cp of customerPackages) {
            // Skip expired packages
            const isExpired = cp.expiration_date && new Date(cp.expiration_date) < new Date();
            if (isExpired) continue;

            const { data: packageData } = await supabase
              .from('packages')
              .select(`
                name,
                price,
                expires_after_days,
                services:package_services(
                  service_id,
                  quantity,
                  service:services!inner(name)
                )
              `)
              .eq('id', cp.package_id)
              .single();

            console.log('🔍 [loadCustomers] Package data for', cp.package_id, ':', JSON.stringify(packageData, null, 2));

            if (packageData) {
              // Load sessions remaining for each service
              const servicesWithSessions = [];
              for (const service of packageData.services || []) {
                console.log('🔍 [loadCustomers] Loading sessions for service:', service.service_id, 'customer_package:', cp.id, 'franchise_id:', customer.franchise_id);

                const { data: sessionData, error: sessionError } = await supabase
                  .from('customer_package_services')
                  .select('sessions_remaining')
                  .eq('customer_package_id', cp.id)
                  .eq('service_id', service.service_id)
                  .eq('franchise_id', customer.franchise_id)
                  .limit(1);

                if (sessionError) {
                  console.error('❌ [loadCustomers] Error loading session data:', sessionError);
                }

                console.log('🔍 [loadCustomers] Session data for customer_package', cp.id, 'service', service.service_id, ':', sessionData);

                const sessionsRemaining = sessionData && sessionData.length > 0 ? sessionData[0].sessions_remaining : 0;
                console.log('✅ [loadCustomers] Sessions remaining calculated:', sessionsRemaining);

                servicesWithSessions.push({
                  service_id: service.service_id,
                  quantity: service.quantity,
                  service: {
                    name: (service.service as any).name
                  },
                  customer_sessions: [{ sessions_remaining: sessionsRemaining }]
                });
              }

              packagesWithDetails.push({
                id: cp.id,
                expiration_date: cp.expiration_date,
                paid: cp.paid,
                created_at: cp.created_at,
                package: {
                  name: (packageData as any).name,
                  price: (packageData as any).price,
                  expires_after_days: (packageData as any).expires_after_days,
                  services: servicesWithSessions
                }
              });
            }
          }
          packagesMap[customer.id] = packagesWithDetails;
        } else {
          packagesMap[customer.id] = [];
        }
      }

      setCustomerPackages(packagesMap);

    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let customerId: string;

      if (editingCustomer) {
        // Update customer using context
        await updateCustomer(editingCustomer.id, {
          name: formData.name,
          phone: formData.phone,
          professional_id: formData.professional_id || null,
          updated_at: new Date().toISOString()
        });
        customerId = editingCustomer.id;
      } else {
        // Create customer using context
        const newCustomer = await createCustomer({
          name: formData.name,
          phone: formData.phone,
          professional_id: formData.professional_id || null
        });
        customerId = newCustomer.id;

        // Create customer packages if selected
        for (const packageId of selectedPackages) {
          const selectedPackage = packages.find(p => p.id === packageId);
          if (!selectedPackage) continue;

          await createCustomerPackage(customerId, selectedPackage);
        }
      }

      // Reset form
      setFormData({ name: '', phone: '', professional_id: '' });
      setSelectedPackages([]);
      setEditingCustomer(null);
      setShowForm(false);

      // Reload customers (context will handle refresh)
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      professional_id: customer.professional_id || ''
    });
    setShowForm(true);
  };

  const handlePurchasePackage = (customer: Customer) => {
    setPurchasingCustomer(customer);
    setPurchasePackages([]);
    setAssignedProfessional('');
    setShowPackagePurchase(true);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !purchasingCustomer || purchasePackages.length === 0) return;

    try {
      for (const packageId of purchasePackages) {
        const selectedPackage = packages.find(p => p.id === packageId);
        if (!selectedPackage) continue;

        await createCustomerPackage(purchasingCustomer.id, selectedPackage, assignedProfessional || undefined);
      }

      setShowPackagePurchase(false);
      setPurchasingCustomer(null);
      setPurchasePackages([]);
      setAssignedProfessional('');

      // Reload customers
      loadCustomers();
    } catch (error) {
      console.error('Error purchasing packages:', error);
      // Note: Operation may succeed despite error display
    }
  };

  const handleRenewPackage = async (customer: Customer, existingPackage: any) => {
    try {
      // Find the package by name since we don't have package_id in the existingPackage
      const selectedPackage = packages.find(p => p.name === existingPackage.package.name);
      if (!selectedPackage) {
        alert('Pacote não encontrado. Verifique se o pacote ainda está disponível.');
        return;
      }

      await createCustomerPackage(customer.id, selectedPackage);

      // Reload customers
      loadCustomers();
    } catch (error) {
      console.error('Error renewing package:', error);
      // Note: Operation may succeed despite error display
    }
  };

  const handleDeletePackage = async (customer: Customer, packageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote contratado? Todas as sessões restantes serão perdidas.')) return;

    try {
      // Delete customer_package_services first
      const { error: cpsError } = await supabase
        .from('customer_package_services')
        .delete()
        .eq('customer_package_id', packageId);

      if (cpsError) throw cpsError;

      // Delete customer_package
      const { error: cpError } = await supabase
        .from('customer_packages')
        .delete()
        .eq('id', packageId);

      if (cpError) throw cpError;

      // Reload customers
      loadCustomers();
      alert('Pacote excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Erro ao excluir pacote. Tente novamente.');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Todas as informações relacionadas serão perdidas.')) return;

    try {
      // Use context delete function
      await deleteCustomer(customerId);
      // Context will handle refresh
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Erro ao excluir cliente. Verifique se não há dependências ativas.');
    }
  };

  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.size === 0) return;

    const count = selectedCustomers.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} cliente${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}? Todas as informações relacionadas serão perdidas.`)) return;

    try {
      const idsToDelete = Array.from(selectedCustomers);

      // Delete each customer using context function
      for (const customerId of idsToDelete) {
        await deleteCustomer(customerId);
      }

      setSelectedCustomers(new Set());
      setSelectAll(false);
      // Context will handle refresh
    } catch (error) {
      console.error('Error deleting selected customers:', error);
      alert('Erro ao excluir clientes selecionados. Verifique se não há dependências ativas.');
    }
  };

  const createCustomerPackage = async (customerId: string, selectedPackage: PackageOption, assignedProfessional?: string) => {
    console.log('🚀 [createCustomerPackage] Iniciando criação de pacote:', {
      customerId,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      assignedProfessional
    });

    if (!user) {
      console.error('❌ [createCustomerPackage] Usuário não encontrado');
      return;
    }

    // Get customer's franchise_id
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('franchise_id')
      .eq('id', customerId)
      .single();

    if (customerError) {
      console.error('❌ [createCustomerPackage] Erro ao buscar customer franchise_id:', customerError);
      throw customerError;
    }
    const franchiseId = customerData.franchise_id;
    console.log('✅ [createCustomerPackage] Franchise ID obtido:', franchiseId);

    console.log('🔍 [createCustomerPackage] Package data:', {
      packageId: selectedPackage.id,
      name: selectedPackage.name,
      expires_after_days: selectedPackage.expires_after_days,
      services: selectedPackage.services.map(s => ({
        service_id: s.service_id,
        service_name: s.service.name,
        quantity: s.quantity
      }))
    });

    // Calculate expiration date if package has expires_after_days
    let expirationDate = null;
    if (selectedPackage.expires_after_days) {
      const purchaseDate = new Date();
      expirationDate = new Date(purchaseDate);
      expirationDate.setDate(purchaseDate.getDate() + selectedPackage.expires_after_days);

      console.log('📅 [createCustomerPackage] Expiration calculation:', {
        purchaseDate: purchaseDate.toISOString(),
        expires_after_days: selectedPackage.expires_after_days,
        expirationDate: expirationDate.toISOString()
      });
    } else {
      console.log('📅 [createCustomerPackage] No expiration configured');
    }

    // Create customer package
    const { data: customerPackage, error: cpError } = await supabase
      .from('customer_packages')
      .insert({
        user_id: '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e', // Usar user_id que existe na tabela users
        customer_id: customerId,
        package_id: selectedPackage.id,
        franchise_id: franchiseId,
        professional_id: assignedProfessional || null, // Salvar profissional atribuído
        paid: true,
        purchase_date: new Date().toISOString(),
        expiration_date: expirationDate?.toISOString()
      })
      .select()
      .single();

    if (cpError) throw cpError;

    // Create customer package services
    const servicesToInsert = selectedPackage.services
      .filter(service => service.service_id) // Skip services with null service_id
      .map(service => ({
        customer_package_id: customerPackage.id,
        service_id: service.service_id,
        franchise_id: franchiseId,
        sessions_remaining: service.quantity
      }));

    console.log('📋 [createCustomerPackage] Serviços a inserir:', servicesToInsert.length);
    servicesToInsert.forEach((service, index) => {
      console.log(`  ${index + 1}. Service ID: ${service.service_id}, Quantity: ${service.sessions_remaining}, Franchise: ${service.franchise_id}`);
    });

    if (servicesToInsert.length > 0) {
      console.log('💾 [createCustomerPackage] Executando INSERT em customer_package_services...');

      const { data: insertResult, error: cpsError } = await supabase
        .from('customer_package_services')
        .insert(servicesToInsert)
        .select();

      if (cpsError) {
        console.error('❌ [createCustomerPackage] Erro ao inserir customer_package_services:', cpsError);
        console.error('❌ [createCustomerPackage] Detalhes do erro:', {
          message: cpsError.message,
          details: cpsError.details,
          hint: cpsError.hint,
          code: cpsError.code
        });
        throw cpsError;
      }

      console.log('✅ [createCustomerPackage] customer_package_services inseridos com sucesso:', insertResult?.length || 0, 'registros');
      console.log('📊 [createCustomerPackage] Resultado do insert:', insertResult);
    } else {
      console.log('⚠️ [createCustomerPackage] Nenhum serviço para inserir');
    }

    // Se profissional atribuído, calcular e registrar comissão
    if (assignedProfessional) {
      console.log('💰 [createCustomerPackage] Calculando comissão para profissional:', assignedProfessional);

      try {
        // Buscar configuração de comissão para este pacote/profissional
        const { data: commissionConfig, error: configError } = await supabase
          .from('package_commissions')
          .select('commission_value, calculation_type')
          .eq('package_id', selectedPackage.id)
          .eq('professional_id', assignedProfessional)
          .eq('active', true)
          .single();

        if (configError) {
          console.warn('⚠️ [createCustomerPackage] Configuração de comissão não encontrada:', configError);
          console.warn('⚠️ [createCustomerPackage] Verifique se existe configuração para package_id:', selectedPackage.id, 'e professional_id:', assignedProfessional);
        } else if (commissionConfig) {
          // Calcular valor da comissão
          const commissionAmount = commissionConfig.calculation_type === 'fixed'
            ? commissionConfig.commission_value
            : selectedPackage.price * (commissionConfig.commission_value / 100);

          console.log('💰 [createCustomerPackage] Comissão calculada:', {
            packagePrice: selectedPackage.price,
            calculationType: commissionConfig.calculation_type,
            commissionValue: commissionConfig.commission_value,
            commissionAmount: commissionAmount
          });

          // Registrar comissão
          const { error: commissionError } = await supabase
            .from('commission_records')
            .insert({
              professional_id: assignedProfessional,
              service_name: `Pacote: ${selectedPackage.name}`,
              service_price: selectedPackage.price,
              commission_amount: commissionAmount,
              commission_type: commissionConfig.calculation_type,
              commission_value: commissionConfig.commission_value,
              status: 'paid',
              created_at: new Date().toISOString(),
              franchise_id: franchiseId,
              customer_package_id: customerPackage.id // Vincular à venda do pacote
            });

          if (commissionError) {
            console.error('❌ [createCustomerPackage] Erro ao registrar comissão:', commissionError);
          } else {
            console.log('✅ [createCustomerPackage] Comissão registrada com sucesso');
          }
        }
      } catch (commissionError) {
        console.error('❌ [createCustomerPackage] Erro no processamento de comissão:', commissionError);
        // Não falhar a compra se houver erro na comissão
      }
    }
  };


  const toggleCustomerSelection = (id: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredCustomers.map(customer => customer.id));
      setSelectedCustomers(allIds);
      setSelectAll(true);
    }
  };

  const handleNewAppointment = (customer: Customer) => {
    console.log('Navigating to appointments with customer:', customer);

    if (onNavigateToAppointments) {
      // Use the callback provided by parent component
      onNavigateToAppointments(customer);
    } else {
      // Fallback: save to sessionStorage and try navigation
      sessionStorage.setItem('prefillCustomer', JSON.stringify(customer));
      // Try to navigate using hash routing as fallback
      const url = '/#/appointments?customer=' + encodeURIComponent(JSON.stringify(customer));
      window.location.assign(url);
    }
  };


  const formatPhone = (phone: string) => {
    // Basic phone formatting for Brazilian numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Clientes</h2>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', professional_id: '' });
            setSelectedPackages([]);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            placeholder="Buscar por nome ou telefone..."
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-400">
            {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  placeholder="Nome completo"
                  required
                />
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  placeholder="+55 11 99999-9999"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profissional Responsável
              </label>
              <select
                value={formData.professional_id}
                onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                <option value="" className="bg-[#2a2a2a] text-white">Nenhum profissional atribuído</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id} className="bg-[#2a2a2a] text-white">
                    {prof.name} - {prof.specialty}
                  </option>
                ))}
              </select>
            </div>

            {!editingCustomer && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pacotes para Comprar
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-[#1a1a1a]">
                  {packages.map(pkg => (
                    <label key={pkg.id} className="flex items-center gap-3 p-2 hover:bg-[#2a2a2a] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPackages(prev => [...prev, pkg.id]);
                          } else {
                            setSelectedPackages(prev => prev.filter(id => id !== pkg.id));
                          }
                        }}
                        className="rounded border-gray-600 text-[#c4d82e] focus:ring-[#c4d82e] bg-[#2a2a2a]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{pkg.name}</div>
                        <div className="text-sm text-gray-400">R$ {pkg.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {pkg.services.map(s => `${s.service.name} (${s.quantity}x)`).join(', ')}
                        </div>
                      </div>
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                    </label>
                  ))}
                  {packages.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum pacote disponível
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black font-semibold py-2 px-4 rounded-lg transition"
              >
                {editingCustomer ? 'Atualizar' : 'Criar'} Cliente
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                  setFormData({ name: '', phone: '', professional_id: '' });
                  setSelectedPackages([]);
                }}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/10 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showPackagePurchase && purchasingCustomer && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Comprar Pacotes para {purchasingCustomer.name}
          </h3>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Atribuir Comissão ao Profissional (opcional)
              </label>
              <select
                value={assignedProfessional}
                onChange={(e) => setAssignedProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                <option value="">Nenhum profissional (sem comissão)</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id} className="bg-[#2a2a2a] text-white">
                    {prof.name} - {prof.specialty}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Selecione um profissional para gerar comissão na venda deste pacote
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pacotes Disponíveis
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-[#1a1a1a]">
                {packages.map(pkg => (
                  <label key={pkg.id} className="flex items-center gap-3 p-2 hover:bg-[#2a2a2a] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purchasePackages.includes(pkg.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPurchasePackages(prev => [...prev, pkg.id]);
                        } else {
                          setPurchasePackages(prev => prev.filter(id => id !== pkg.id));
                        }
                      }}
                      className="rounded border-gray-600 text-[#c4d82e] focus:ring-[#c4d82e] bg-[#2a2a2a]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{pkg.name}</div>
                      <div className="text-sm text-gray-400">R$ {pkg.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {pkg.services.map(s => `${s.service.name} (${s.quantity}x)`).join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
                {packages.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum pacote disponível
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={purchasePackages.length === 0}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comprar Pacotes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPackagePurchase(false);
                  setPurchasingCustomer(null);
                  setPurchasePackages([]);
                }}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/10 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selection Controls */}
      {filteredCustomers.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                <div
                  onClick={toggleSelectAll}
                  className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                    ${filteredCustomers.length > 0 && filteredCustomers.every(customer => selectedCustomers.has(customer.id))
                      ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                      : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                    }
                  `}
                >
                  {filteredCustomers.length > 0 && filteredCustomers.every(customer => selectedCustomers.has(customer.id)) && (
                    <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                  )}
                </div>
                <span className="font-medium group-hover:text-white transition-colors duration-200">
                  Selecionar Todos ({filteredCustomers.length})
                </span>
              </label>
              {selectedCustomers.size > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                  <span className="text-sm text-[#c4d82e] font-medium">
                    {selectedCustomers.size} selecionado{selectedCustomers.size > 1 ? 's' : ''}
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
            {selectedCustomers.size > 0 && (
              <button
                onClick={deleteSelectedCustomers}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados ({selectedCustomers.size})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredCustomers.map(customer => (
          <div
            key={customer.id}
            onClick={() => toggleCustomerSelection(customer.id)}
            className={`
              relative cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
              ${selectedCustomers.has(customer.id)
                ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                : 'border-white/10 hover:bg-white/10'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedCustomers.has(customer.id) && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                <CheckCircle className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="flex items-center justify-between pr-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c4d82e]/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{customer.name}</h3>
                  <p className="text-gray-400">{formatPhone(customer.phone)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNewAppointment(customer)}
                  className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black text-sm rounded-lg transition"
                  title="Novo Agendamento"
                >
                  <Calendar className="w-4 h-4" />
                  Novo Agendamento
                </button>
                <button
                  onClick={() => handlePurchasePackage(customer)}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition"
                  title="Comprar Pacote"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 text-gray-400 hover:text-[#c4d82e] hover:bg-[#c4d82e]/20 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#c4d82e]" />
                  <span className="font-medium text-white">Profissional Responsável</span>
                </div>
                <div className="bg-[#c4d82e]/10 border border-[#c4d82e]/30 rounded-lg p-3">
                  {customer.professional ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[#c4d82e]">{customer.professional.name}</span>
                        <span className="text-[#c4d82e]/80 ml-2">- {customer.professional.specialty}</span>
                      </div>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="px-3 py-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black text-sm rounded transition"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[#c4d82e]/80">Nenhum profissional atribuído</span>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="px-3 py-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black text-sm rounded transition"
                      >
                        Atribuir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-[#c4d82e]" />
                    <span className="font-medium text-white">Pacotes Contratados</span>
                  </div>
                  {customerPackages[customer.id] && customerPackages[customer.id].length > 0 ? (
                    <div className="space-y-2">
                      {customerPackages[customer.id].map(pkg => (
                        <div key={pkg.id} className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{pkg.package.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-green-400">
                                R$ {pkg.package.price?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-2">
                            <div>
                              <span className="font-medium">Compra:</span> {new Date(pkg.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div>
                              <span className="font-medium">Expira:</span> {pkg.expiration_date ? new Date(pkg.expiration_date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : 'Nunca'}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {pkg.package.services.map(service => (
                              <div key={service.service_id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-300">{service.service.name}</span>
                                <span className={service.customer_sessions[0]?.sessions_remaining === 0 ? 'text-red-400' : 'text-green-400'}>
                                  {service.customer_sessions[0]?.sessions_remaining || 0} restantes
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm bg-[#1a1a1a] rounded-lg">
                      Nenhum pacote contratado
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-white">Status dos Pacotes</span>
                  </div>
                  {customerPackages[customer.id] && customerPackages[customer.id].length > 0 ? (
                    <div className="space-y-2">
                      {customerPackages[customer.id].map(pkg => {
                        const isExpired = pkg.expiration_date && new Date(pkg.expiration_date) < new Date();
                        const hasSessions = pkg.package.services.some(service =>
                          (service.customer_sessions[0]?.sessions_remaining || 0) > 0
                        );

                        return (
                          <div key={pkg.id} className={`border rounded-lg p-3 ${isExpired || !hasSessions ? 'bg-red-500/20 border-red-500/30' : 'bg-green-500/20 border-green-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{pkg.package.name}</span>
                                {isExpired && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                {!isExpired && hasSessions && <CheckCircle className="w-4 h-4 text-green-400" />}
                              </div>
                              <button
                                onClick={() => handleRenewPackage(customer, pkg)}
                                className="p-1 text-[#c4d82e] hover:bg-[#c4d82e]/20 rounded transition"
                                title="Renovar pacote"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePackage(customer, pkg.id)}
                                className="p-1 text-red-400 hover:bg-red-500/20 rounded transition"
                                title="Excluir pacote"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {pkg.expiration_date && (
                              <div className={`text-sm mb-2 ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                Válido até {new Date(pkg.expiration_date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                            <div className="space-y-1">
                              {pkg.package.services.map(service => (
                                <div key={service.service_id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-300">{service.service.name}</span>
                                  <span className={service.customer_sessions[0]?.sessions_remaining === 0 ? 'text-red-400' : 'text-green-400'}>
                                    {service.customer_sessions[0]?.sessions_remaining || 0} sessões
                                  </span>
                                </div>
                              ))}
                            </div>
                            {isExpired && (
                              <div className="mt-2 text-xs text-red-400 font-medium">
                                Pacote expirado
                              </div>
                            )}
                            {!hasSessions && !isExpired && (
                              <div className="mt-2 text-xs text-orange-400 font-medium">
                                Sessões esgotadas
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm bg-[#1a1a1a] rounded-lg">
                      Nenhum pacote ativo
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && customers.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-400">Tente ajustar os termos da busca.</p>
          </div>
        )}

        {customers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-gray-400">Comece adicionando seu primeiro cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}