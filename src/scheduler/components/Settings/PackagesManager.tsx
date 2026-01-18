import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { Package, Plus, Edit, Trash2, DollarSign, Calendar, CheckCircle, X } from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  expires_after_days: number | null;
  active: boolean;
  created_at: string;
  services?: PackageService[];
}

interface PackageService {
  id: string;
  service_id: string;
  quantity: number;
  service: {
    name: string;
    price: number;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function PackagesManager() {
  const { userRole, franchiseId } = usePermissions();
  const { packages: contextPackages, services: contextServices, loading: contextLoading, refreshPackages } = useScheduler();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [packageSales, setPackageSales] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [packageServices, setPackageServices] = useState<{ service_id: string; quantity: number }[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    expires_after_days: '',
    active: true
  });

  // Get user from localStorage as fallback since we can't use useAuth here
  // Using the same logic as SchedulerContext
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getCurrentUser = () => {
      try {
        // Try different possible keys
        const possibleKeys = ['supabase.auth.token', 'sb-hedxxbsieoazrmbayzab-auth-token', 'supabase-auth-token'];
        let authData = null;

        for (const key of possibleKeys) {
          authData = localStorage.getItem(key);
          if (authData) break;
        }

        if (authData) {
          const parsed = JSON.parse(authData);

          // Try different possible structures
          let userData = null;
          if (parsed?.currentSession?.user) {
            userData = parsed.currentSession.user;
          } else if (parsed?.user) {
            userData = parsed.user;
          } else if (parsed?.data?.user) {
            userData = parsed.data.user;
          }

          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error getting user from localStorage:', e);
        setUser(null);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (showSales) {
      loadPackageSales();
    }
  }, [showSales]);

  // Load all services (including inactive ones) for package editing
  // NOTE: For package creation/editing, we load ALL services regardless of franchise
  // to allow creating packages with services from different franchises
  useEffect(() => {
    const loadAllServices = async () => {
      console.log('🔍 [PackagesManager] loadAllServices chamado');
      console.log('👤 user:', !!user);

      if (!user) {
        console.log('❌ [PackagesManager] Sem usuário - abortando');
        return;
      }

      try {
        // Load ALL active services for package creation (no franchise filter)
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) {
          console.error('❌ [PackagesManager] Erro na query:', error);
          throw error;
        }

        console.log('✅ [PackagesManager] Serviços carregados:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('📋 [PackagesManager] Lista de serviços:');
          data.forEach(service => {
            console.log(`  - ${service.name} (ID: ${service.id}, Franchise: ${service.franchise_id})`);
          });
        } else {
          console.log('📋 [PackagesManager] Nenhum serviço encontrado');
        }

        setAllServices(data || []);
        console.log('💾 [PackagesManager] allServices atualizado');
      } catch (error) {
        console.error('💥 [PackagesManager] Erro geral:', error);
      }
    };

    loadAllServices();
  }, [user]);

  const loadPackageSales = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_packages')
        .select(`
          id,
          purchase_date,
          paid,
          customer:customers(name, phone),
          package:packages(name, price)
        `)
        .eq('user_id', user.id)
        .eq('paid', true)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPackageSales(data || []);
    } catch (error) {
      console.error('Error loading package sales:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || packageServices.length === 0) return;

    // Validate that all services have valid IDs
    if (packageServices.some(ps => !ps.service_id)) {
      alert('Todos os serviços devem ser selecionados');
      return;
    }

    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        expires_after_days: formData.expires_after_days ? parseInt(formData.expires_after_days) : null,
        active: formData.active
      };

      let packageId: string;

      if (editingPackage) {
        // Update package
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        packageId = editingPackage.id;

        // Delete existing package services FIRST
        const { error: deleteError } = await supabase
          .from('package_services')
          .delete()
          .eq('package_id', packageId);

        if (deleteError) throw deleteError;
      } else {
        // Create package with franchise_id
        const packageWithFranchise = {
          ...packageData,
          user_id: '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e', // Usar user_id que existe na tabela users
          franchise_id: franchiseId // Add franchise_id for proper isolation
        };

        const { data, error } = await supabase
          .from('packages')
          .insert(packageWithFranchise)
          .select()
          .single();

        if (error) throw error;
        packageId = data.id;
      }

      // Insert package services - ensure no duplicates
      const servicesToInsert = packageServices.map(ps => ({
        package_id: packageId,
        service_id: ps.service_id,
        quantity: ps.quantity
      }));

      // Check for duplicate service_ids in the array
      const uniqueServiceIds = new Set(servicesToInsert.map(s => s.service_id));
      if (uniqueServiceIds.size !== servicesToInsert.length) {
        alert('Não é permitido adicionar o mesmo serviço mais de uma vez');
        return;
      }

      const { error: servicesError } = await supabase
        .from('package_services')
        .insert(servicesToInsert);

      if (servicesError) {
        console.error('Services error details:', servicesError);
        throw servicesError;
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        expires_after_days: '',
        active: true
      });
      setPackageServices([]);
      setEditingPackage(null);
      setShowForm(false);

      // Reload packages
      refreshPackages();
      alert('Pacote salvo com sucesso!');
    } catch (error) {
      console.error('Error saving package:', error);
      if (error instanceof Error && error.message.includes('duplicate')) {
        alert('Erro: Este pacote já contém este serviço. Verifique os serviços adicionados.');
      } else {
        alert(`Erro ao salvar pacote: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
      }
    }
  };

  const handleEdit = (pkg: PackageData) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      expires_after_days: pkg.expires_after_days?.toString() || '',
      active: pkg.active
    });
    setPackageServices(
      pkg.services?.map(ps => ({
        service_id: ps.service_id,
        quantity: ps.quantity
      })) || []
    );
    setShowForm(true);
  };

  const togglePackageSelection = (id: string) => {
    const newSelected = new Set(selectedPackages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPackages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPackages(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(contextPackages.map(pkg => pkg.id));
      setSelectedPackages(allIds);
      setSelectAll(true);
    }
  };

  const deleteSelectedPackages = async () => {
    if (selectedPackages.size === 0) return;

    const count = selectedPackages.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} pacote${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}? Todas as vendas relacionadas serão perdidas.`)) return;

    try {
      const idsToDelete = Array.from(selectedPackages);

      // For each package, delete its dependencies
      for (const packageId of idsToDelete) {
        // Get all customer packages for this package
        const { data: customerPackages } = await supabase
          .from('customer_packages')
          .select('id')
          .eq('package_id', packageId);

        if (customerPackages && customerPackages.length > 0) {
          const customerPackageIds = customerPackages.map(cp => cp.id);

          // Delete customer package services first
          const { error: cpsError } = await supabase
            .from('customer_package_services')
            .delete()
            .in('customer_package_id', customerPackageIds);

          if (cpsError) throw cpsError;

          // Delete customer packages
          const { error: cpError } = await supabase
            .from('customer_packages')
            .delete()
            .in('id', customerPackageIds);

          if (cpError) throw cpError;
        }

        // Delete package services
        const { error: psError } = await supabase
          .from('package_services')
          .delete()
          .eq('package_id', packageId);

        if (psError) throw psError;
      }

      // Finally, delete the packages
      const { error } = await supabase
        .from('packages')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setSelectedPackages(new Set());
      setSelectAll(false);
      refreshPackages();
    } catch (error) {
      console.error('Error deleting selected packages:', error);
      alert('Erro ao excluir pacotes selecionados. Verifique se não há dependências ativas.');
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote? Todas as vendas relacionadas serão perdidas.')) return;

    try {
      // First, get all customer packages for this package
      const { data: customerPackages } = await supabase
        .from('customer_packages')
        .select('id')
        .eq('package_id', packageId);

      if (customerPackages && customerPackages.length > 0) {
        const customerPackageIds = customerPackages.map(cp => cp.id);

        // Delete customer package services first
        const { error: cpsError } = await supabase
          .from('customer_package_services')
          .delete()
          .in('customer_package_id', customerPackageIds);

        if (cpsError) throw cpsError;

        // Delete customer packages
        const { error: cpError } = await supabase
          .from('customer_packages')
          .delete()
          .in('id', customerPackageIds);

        if (cpError) throw cpError;
      }

      // Delete package services
      const { error: psError } = await supabase
        .from('package_services')
        .delete()
        .eq('package_id', packageId);

      if (psError) throw psError;

      // Finally, delete the package
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      refreshPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Erro ao excluir pacote. Verifique se não há dependências ativas.');
    }
  };

  if (contextLoading.packages) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Pacotes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingPackage(null);
              setFormData({
                name: '',
                description: '',
                price: 0,
                expires_after_days: '',
                active: true
              });
              setPackageServices([]);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Novo Pacote
          </button>
          <button
            onClick={() => setShowSales(!showSales)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg transition"
          >
            <DollarSign className="w-4 h-4" />
            Vendas
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Pacote
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="Ex: Pacote Barba + Cabelo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                rows={3}
                placeholder="Descrição do pacote..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço Total
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dias para Expirar
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.expires_after_days || ''}
                  onChange={(e) => setFormData({ ...formData, expires_after_days: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Serviços Incluídos
                </label>
                <button
                  type="button"
                  onClick={() => setPackageServices(prev => [...prev, { service_id: '', quantity: 1 }])}
                  className="flex items-center gap-2 text-[#c4d82e] hover:text-white text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </button>
              </div>

              {packageServices.map((ps, index) => (
                <div key={index} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Serviço {index + 1}</h4>
                    {packageServices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPackageServices(prev => prev.filter((_, i) => i !== index))}
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
                        value={ps.service_id}
                        onChange={(e) => setPackageServices(prev => prev.map((item, i) =>
                          i === index ? { ...item, service_id: e.target.value } : item
                        ))}
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                        required
                      >
                        <option value="" className="bg-[#2a2a2a] text-white">Selecione um serviço</option>
                        {allServices.map(service => (
                          <option key={service.id} value={service.id} className="bg-[#2a2a2a] text-white">
                            {service.name} - R$ {service.price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ps.quantity}
                        onChange={(e) => setPackageServices(prev => prev.map((item, i) =>
                          i === index ? { ...item, quantity: parseInt(e.target.value) || 1 } : item
                        ))}
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {packageServices.length === 0 && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                  Adicione pelo menos um serviço ao pacote
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-600 text-[#c4d82e] focus:ring-[#c4d82e] bg-[#2a2a2a]"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-300">
                Pacote ativo
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black font-semibold py-2 px-4 rounded-lg transition"
              >
                {editingPackage ? 'Atualizar' : 'Criar'} Pacote
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPackage(null);
                  setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    expires_after_days: '',
                    active: true
                  });
                  setPackageServices([]);
                }}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/10 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showSales && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Vendas de Pacotes</h3>
            <button
              onClick={() => setShowSales(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {packageSales.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma venda registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {packageSales.map(sale => (
                <div key={sale.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{(sale.customer as any)?.name}</h4>
                      <p className="text-sm text-gray-400">{(sale.customer as any)?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">R$ {(sale.package as any)?.price?.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.purchase_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#c4d82e]" />
                    <span className="text-sm text-gray-300">{(sale.package as any)?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selection Controls */}
      {contextPackages.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                <div
                  onClick={toggleSelectAll}
                  className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                    ${contextPackages.length > 0 && contextPackages.every(pkg => selectedPackages.has(pkg.id))
                      ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                      : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                    }
                  `}
                >
                  {contextPackages.length > 0 && contextPackages.every((pkg: any) => selectedPackages.has(pkg.id)) && (
                    <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                  )}
                </div>
                <span className="font-medium group-hover:text-white transition-colors duration-200">
                  Selecionar Todos ({contextPackages.length})
                </span>
              </label>
              {selectedPackages.size > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                  <span className="text-sm text-[#c4d82e] font-medium">
                    {selectedPackages.size} selecionado{selectedPackages.size > 1 ? 's' : ''}
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
            {selectedPackages.size > 0 && (
              <button
                onClick={deleteSelectedPackages}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados ({selectedPackages.size})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {contextPackages.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => togglePackageSelection(pkg.id)}
            className={`
              relative cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
              ${selectedPackages.has(pkg.id)
                ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                : 'border-white/10 hover:bg-white/10'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedPackages.has(pkg.id) && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                <CheckCircle className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="flex items-center justify-between pr-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c4d82e]/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{pkg.name}</h3>
                  <p className="text-gray-400">{pkg.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 text-gray-400 hover:text-[#c4d82e] hover:bg-[#c4d82e]/20 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">R$ {pkg.price.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                {pkg.expires_after_days ? (
                  <>
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400">{pkg.expires_after_days} dias</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Ilimitado</span>
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-[#c4d82e]" />
                  <span className="text-sm font-medium text-white">Serviços Incluídos:</span>
                </div>
                <div className="space-y-1">
                  {pkg.services?.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between text-sm text-gray-300 bg-[#2a2a2a] px-2 py-1 rounded">
                      <span>{service.service.name}</span>
                      <span className="font-medium">{service.quantity}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!pkg.active && (
              <div className="mt-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                Inativo
              </div>
            )}
          </div>
        ))}

        {contextPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum pacote cadastrado</h3>
            <p className="text-gray-400">Comece criando seu primeiro pacote de serviços.</p>
          </div>
        )}
      </div>
    </div>
  );
}