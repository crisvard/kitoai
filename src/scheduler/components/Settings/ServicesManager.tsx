import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { Plus, Edit2, Trash2, Scissors, CheckCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
}

export default function ServicesManager() {
  const { user } = useSchedulerAuth();
  const { franchiseId: contextFranchiseId } = usePermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: ''
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadServices();
  }, [user, contextFranchiseId]);

  const loadServices = async () => {
    if (!user) return;

    let query = supabase
      .from('services')
      .select('*')
      .order('name');

    // Aplicar filtro de franquia se estiver em contexto de franquia
    if (contextFranchiseId) {
      console.log('🔒 [ServicesManager] Filtrando serviços por franquia:', contextFranchiseId);
      query = query.eq('franchise_id', contextFranchiseId);
    } else {
      console.log('👑 [ServicesManager] Carregando serviços globais (sem filtro de franquia)');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading services:', error);
    } else {
      setServices(data || []);
      console.log(`✅ [ServicesManager] Carregados ${data?.length || 0} serviços`);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes)
      };

      if (editingService) {
        let updateQuery = supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)
          .eq('user_id', user.id);

        // Aplicar filtro de franquia se necessário
        if (contextFranchiseId) {
          updateQuery = updateQuery.eq('franchise_id', contextFranchiseId);
        }

        const { error } = await updateQuery;

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
      } else {
        // Usar user_id que existe na tabela users (mesmo para todas as franquias)
        const serviceUserId = '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e';

        if (contextFranchiseId) {
          console.log('🔒 [ServicesManager] Criando serviço para franquia:', contextFranchiseId, 'user_id:', serviceUserId);
        } else {
          console.log('👑 [ServicesManager] Criando serviço global com user_id:', serviceUserId);
        }

        const insertData: any = {
          user_id: serviceUserId,
          ...serviceData,
          active: true
        };

        // Adicionar franchise_id se estiver em contexto de franquia
        if (contextFranchiseId) {
          insertData.franchise_id = contextFranchiseId;
        }

        console.log('📝 [ServicesManager] Dados sendo salvos na tabela services:', insertData);
        console.log('📍 [ServicesManager] Tabela destino: services');
        console.log('👤 [ServicesManager] user_id enviado:', user.id);

        const { error } = await supabase
          .from('services')
          .insert(insertData);

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
      }

      setIsModalOpen(false);
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '' });
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      const err = error as any;
      if (err?.message) {
        console.error('Error message:', err.message);
      }
      if (err?.details) {
        console.error('Error details:', err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString()
    });
    setIsModalOpen(true);
  };

  const toggleServiceSelection = (id: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedServices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedServices(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(services.map(service => service.id));
      setSelectedServices(allIds);
      setSelectAll(true);
    }
  };

  const deleteSelectedServices = async () => {
    if (selectedServices.size === 0) return;

    const count = selectedServices.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} serviço${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}? Todas as associações serão removidas.`)) return;

    try {
      const idsToDelete = Array.from(selectedServices);

      // Delete customer package services for selected services
      const { error: cpsError } = await supabase
        .from('customer_package_services')
        .delete()
        .in('service_id', idsToDelete);

      if (cpsError) throw cpsError;

      // Delete package services for selected services
      const { error: psError } = await supabase
        .from('package_services')
        .delete()
        .in('service_id', idsToDelete);

      if (psError) throw psError;

      // Delete appointment services for selected services
      const { error: asError } = await supabase
        .from('appointment_services')
        .delete()
        .in('service_id', idsToDelete);

      if (asError) throw asError;

      // Finally, delete the services
      let deleteQuery = supabase
        .from('services')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);

      // Aplicar filtro de franquia se necessário
      if (contextFranchiseId) {
        deleteQuery = deleteQuery.eq('franchise_id', contextFranchiseId);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      setSelectedServices(new Set());
      setSelectAll(false);
      loadServices();
    } catch (error) {
      console.error('Error deleting selected services:', error);
      alert('Erro ao excluir serviços selecionados. Verifique se não há dependências ativas.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço? Todas as associações serão removidas.')) return;
    if (!user) return;

    try {
      // Delete customer package services for this service
      const { error: cpsError } = await supabase
        .from('customer_package_services')
        .delete()
        .eq('service_id', id);

      if (cpsError) throw cpsError;

      // Delete package services for this service
      const { error: psError } = await supabase
        .from('package_services')
        .delete()
        .eq('service_id', id);

      if (psError) throw psError;

      // Delete appointment services for this service (this will cascade to appointments if needed)
      const { error: asError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('service_id', id);

      if (asError) throw asError;

      // Finally, delete the service
      let deleteQuery = supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      // Aplicar filtro de franquia se necessário
      if (contextFranchiseId) {
        deleteQuery = deleteQuery.eq('franchise_id', contextFranchiseId);
      }

      const { error } = await deleteQuery;

      if (error) throw error;
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Erro ao excluir serviço. Verifique se não há dependências ativas.');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!user) return;

    try {
      let updateQuery = supabase
        .from('services')
        .update({ active: !active })
        .eq('id', id)
        .eq('user_id', user.id);

      // Aplicar filtro de franquia se necessário
      if (contextFranchiseId) {
        updateQuery = updateQuery.eq('franchise_id', contextFranchiseId);
      }

      const { error } = await updateQuery;

      if (error) throw error;
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Serviços</h2>
          <button
            onClick={() => {
              setEditingService(null);
              setFormData({ name: '', description: '', price: '', duration_minutes: '' });
              setIsModalOpen(true);
            }}
            className="bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        </div>

        {/* Selection Controls */}
        {services.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                  <div
                    onClick={toggleSelectAll}
                    className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                      ${services.length > 0 && services.every(service => selectedServices.has(service.id))
                        ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                        : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                      }
                    `}
                  >
                    {services.length > 0 && services.every(service => selectedServices.has(service.id)) && (
                      <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                    )}
                  </div>
                  <span className="font-medium group-hover:text-white transition-colors duration-200">
                    Selecionar Todos ({services.length})
                  </span>
                </label>
                {selectedServices.size > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                    <span className="text-sm text-[#c4d82e] font-medium">
                      {selectedServices.size} selecionado{selectedServices.size > 1 ? 's' : ''}
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
              {selectedServices.size > 0 && (
                <button
                  onClick={deleteSelectedServices}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Selecionados ({selectedServices.size})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => toggleServiceSelection(service.id)}
              className={`
                relative cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-3xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
                ${selectedServices.has(service.id)
                  ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                  : 'border-white/10 hover:bg-white/10'
                }
              `}
            >
              {/* Selection indicator */}
              {selectedServices.has(service.id) && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#c4d82e]/20 p-2 rounded-full">
                    <Scissors className="w-5 h-5 text-[#c4d82e]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{service.name}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>R$ {service.price.toFixed(2)}</span>
                      <span>{service.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(service.id, service.active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-gray-400 hover:text-[#c4d82e] transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum serviço cadastrado
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingService ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome do Serviço
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                rows={3}
                placeholder="Descrição do serviço..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}