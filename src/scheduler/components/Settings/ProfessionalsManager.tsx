import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { Plus, Edit2, Trash2, User, Settings, Key, CheckCircle } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  specialty: string;
  email: string;
  active: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

export default function ProfessionalsManager() {
  const { user } = useSchedulerAuth();
  const { professionals: schedulerProfessionals, services: schedulerServices, createProfessional, updateProfessional, deleteProfessional } = useScheduler();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [selectedProfessionals, setSelectedProfessionals] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfessionals();
    loadServices();
  }, [user, schedulerProfessionals, schedulerServices]);

  const loadProfessionals = async () => {
    if (!user) return;

    // Use professionals from scheduler context
    setProfessionals(schedulerProfessionals);
    setLoading(false);
  };

  const loadServices = async () => {
    if (!user) return;

    // Use services from scheduler context
    setServices(schedulerServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.name || !formData.specialty) {
      alert('Nome e especialidade são obrigatórios');
      return;
    }

    if (!editingProfessional) {
      // Creating new professional - password is required
      if (!formData.email || !formData.password) {
        alert('Email e senha são obrigatórios para novos profissionais');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert('As senhas não coincidem');
        return;
      }

      if (formData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setLoading(true);
    try {
      if (editingProfessional) {
        // Update existing professional using context
        const updateData: any = {
          name: formData.name,
          specialty: formData.specialty
        };

        // If password is provided in edit mode, update it
        if (formData.password) {
          if (formData.password !== formData.confirmPassword) {
            alert('As senhas não coincidem');
            setLoading(false);
            return;
          }
          if (formData.password.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
          }
          updateData.password_hash = btoa(formData.password);
        }

        await updateProfessional(editingProfessional.id, updateData);
      } else {
        // Create new professional using context
        const hashedPassword = btoa(formData.password);

        const professionalData = {
          name: formData.name,
          specialty: formData.specialty,
          email: formData.email,
          password_hash: hashedPassword,
          role: 'professional',
          active: true
        };

        console.log('👤 [ProfessionalsManager] Enviando dados para criação:', professionalData);
        await createProfessional(professionalData);
      }

      setIsModalOpen(false);
      setEditingProfessional(null);
      setFormData({ name: '', specialty: '', email: '', password: '', confirmPassword: '' });
      loadProfessionals();
    } catch (error) {
      console.error('Error saving professional:', error);
      alert(`Erro ao salvar profissional: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    // Fechar todos os outros modais antes de abrir
    setIsServicesModalOpen(false);
    setIsCredentialsModalOpen(false);
    setSelectedProfessional(null);

    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      specialty: professional.specialty,
      email: '',
      password: '',
      confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const toggleProfessionalSelection = (id: string) => {
    const newSelected = new Set(selectedProfessionals);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProfessionals(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProfessionals(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(professionals.map(professional => professional.id));
      setSelectedProfessionals(allIds);
      setSelectAll(true);
    }
  };

  const deleteSelectedProfessionals = async () => {
    if (selectedProfessionals.size === 0) return;

    const count = selectedProfessionals.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} profissional${count > 1 ? 'is' : ''} selecionado${count > 1 ? 's' : ''}?`)) return;

    try {
      const idsToDelete = Array.from(selectedProfessionals);

      // Delete each professional using context function
      for (const id of idsToDelete) {
        await deleteProfessional(id);
      }

      setSelectedProfessionals(new Set());
      setSelectAll(false);
      // Context will handle refresh
    } catch (error) {
      console.error('Error deleting selected professionals:', error);
      alert('Erro ao excluir profissionais selecionados');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
    if (!user) return;

    try {
      // Use context delete function
      await deleteProfessional(id);
      // Context will handle refresh
    } catch (error) {
      console.error('Error deleting professional:', error);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!user) return;

    try {
      // Use context update function
      await updateProfessional(id, { active: !active });
      // Context will handle refresh
    } catch (error) {
      console.error('Error updating professional:', error);
    }
  };

  const openServicesModal = (professional: Professional) => {
    // Fechar todos os outros modais antes de abrir
    setIsModalOpen(false);
    setIsCredentialsModalOpen(false);
    setEditingProfessional(null);
    setFormData({ name: '', specialty: '', email: '', password: '', confirmPassword: '' });

    setSelectedProfessional(professional);
    setIsServicesModalOpen(true);
  };

  const openCredentialsModal = (professional: Professional) => {
    // Fechar todos os outros modais antes de abrir
    setIsModalOpen(false);
    setIsServicesModalOpen(false);
    setEditingProfessional(null);
    setSelectedProfessional(null);
    setFormData({ name: '', specialty: '', email: '', password: '', confirmPassword: '' });

    setSelectedProfessional(professional);
    setIsCredentialsModalOpen(true);
  };

  const loadProfessionalServices = async (professionalId: string) => {
    try {
      // Query professional_services junction table to get all services for this professional
      const { data, error } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('Error loading professional services:', error);
        return [];
      }

      return data?.map(item => item.service_id) || [];
    } catch (error) {
      console.error('Error in loadProfessionalServices:', error);
      return [];
    }
  };

  const updateProfessionalServices = async (professionalId: string, serviceIds: string[]) => {
    try {
      // Step 1: Delete all existing service assignments for this professional
      // This allows us to cleanly replace with new assignments
      const { error: deleteError } = await supabase
        .from('professional_services')
        .delete()
        .eq('professional_id', professionalId);

      if (deleteError) throw deleteError;

      // Step 2: Insert new service assignments
      if (serviceIds.length > 0) {
        const assignments = serviceIds.map(serviceId => ({
          professional_id: professionalId,
          service_id: serviceId
        }));

        const { error: insertError } = await supabase
          .from('professional_services')
          .insert(assignments);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating professional services:', error);
      throw error;
    }
  };

  const updateProfessionalCredentials = async (professionalId: string, email: string, password: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Hash the password using base64 encoding (same as creation)
      const hashedPassword = btoa(password);

      const { error } = await supabase
        .from('professionals')
        .update({
          email: email,
          password_hash: hashedPassword
        })
        .eq('id', professionalId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error updating professional credentials:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }
  
  // Credentials Modal Component
  function CredentialsModal({
    professional,
    onClose,
    onUpdate
  }: {
    professional: Professional;
    onClose: () => void;
    onUpdate: (professionalId: string, email: string, password: string) => Promise<void>;
  }) {
    const [formData, setFormData] = useState({
      email: professional.email || '',
      password: '',
      confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!formData.email) {
        setError('Preencha o email');
        return;
      }

      if (!formData.password) {
        setError('Preencha a senha');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      setLoading(true);
      try {
        await onUpdate(professional.id, formData.email, formData.password);
        onClose();
      } catch (error) {
        console.error('Error updating credentials:', error);
        setError('Erro ao atualizar credenciais. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Alterar Email e Senha - {professional.name}
          </h3>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
  
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
  
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Profissionais</h2>
          <button
            onClick={() => {
              setEditingProfessional(null);
              setFormData({ name: '', specialty: '', email: '', password: '', confirmPassword: '' });
              setIsModalOpen(true);
            }}
            className="bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Profissional
          </button>
        </div>

        {/* Selection Controls */}
        {professionals.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                  <div
                    onClick={toggleSelectAll}
                    className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                      ${professionals.length > 0 && professionals.every(professional => selectedProfessionals.has(professional.id))
                        ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                        : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                      }
                    `}
                  >
                    {professionals.length > 0 && professionals.every(professional => selectedProfessionals.has(professional.id)) && (
                      <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                    )}
                  </div>
                  <span className="font-medium group-hover:text-white transition-colors duration-200">
                    Selecionar Todos ({professionals.length})
                  </span>
                </label>
                {selectedProfessionals.size > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                    <span className="text-sm text-[#c4d82e] font-medium">
                      {selectedProfessionals.size} selecionado{selectedProfessionals.size > 1 ? 's' : ''}
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
              {selectedProfessionals.size > 0 && (
                <button
                  onClick={deleteSelectedProfessionals}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Selecionados ({selectedProfessionals.size})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              onClick={() => toggleProfessionalSelection(professional.id)}
              className={`
                relative cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border rounded-3xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
                ${selectedProfessionals.has(professional.id)
                  ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                  : 'border-white/10 hover:bg-white/10'
                }
              `}
            >
              {/* Selection indicator */}
              {selectedProfessionals.has(professional.id) && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="flex items-center justify-between pr-12">
                <div className="flex items-center gap-3">
                  <div className="bg-[#c4d82e]/20 p-2 rounded-full">
                    <User className="w-5 h-5 text-[#c4d82e]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{professional.name}</h3>
                    <p className="text-sm text-gray-400">{professional.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(professional.id, professional.active);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      professional.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {professional.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(professional);
                    }}
                    className="p-2 text-gray-400 hover:text-[#c4d82e] transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCredentialsModal(professional);
                    }}
                    className="p-2 text-gray-400 hover:text-green-400 transition"
                    title="Alterar Email e Senha"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openServicesModal(professional);
                    }}
                    className="p-2 text-gray-400 hover:text-[#c4d82e] transition"
                    title="Gerenciar Serviços"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(professional.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {professionals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum profissional cadastrado
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="mt-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome
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
                Especialidade
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                placeholder="Ex: Cabeleireiro, Manicure..."
              />
            </div>

            {!editingProfessional && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProfessional(null);
                  setFormData({ name: '', specialty: '', email: '', password: '', confirmPassword: '' });
                }}
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

      {/* Services Assignment Modal */}
      {isServicesModalOpen && selectedProfessional && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
          <ServicesAssignmentModal
            professional={selectedProfessional}
            services={services}
            onClose={() => {
              setIsServicesModalOpen(false);
              setSelectedProfessional(null);
            }}
            onUpdate={updateProfessionalServices}
            loadProfessionalServices={loadProfessionalServices}
          />
        </div>
      )}

      {/* Credentials Modal */}
      {isCredentialsModalOpen && selectedProfessional && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
          <CredentialsModal
            professional={selectedProfessional}
            onClose={() => {
              setIsCredentialsModalOpen(false);
              setSelectedProfessional(null);
            }}
            onUpdate={updateProfessionalCredentials}
          />
        </div>
      )}
    </>
  );
}

// Services Assignment Modal Component
function ServicesAssignmentModal({
  professional,
  services,
  onClose,
  onUpdate,
  loadProfessionalServices
}: {
  professional: Professional;
  services: Service[];
  onClose: () => void;
  onUpdate: (professionalId: string, serviceIds: string[]) => Promise<void>;
  loadProfessionalServices: (professionalId: string) => Promise<string[]>;
}) {
  const [assignedServices, setAssignedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssignedServices();
  }, [professional.id]);

  const loadAssignedServices = async () => {
    try {
      const assigned = await loadProfessionalServices(professional.id);
      setAssignedServices(assigned);
    } catch (error) {
      console.error('Error loading assigned services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setAssignedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(professional.id, assignedServices);
      onClose();
    } catch (error) {
      console.error('Error saving services:', error);
      alert('Erro ao salvar serviços. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          Serviços de {professional.name}
        </h3>

        <div className="space-y-3 mb-6">
          {services.map(service => (
            <label key={service.id} className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:bg-[#2a2a2a] cursor-pointer">
              <input
                type="checkbox"
                checked={assignedServices.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
                className="h-4 w-4 text-[#c4d82e] focus:ring-[#c4d82e] bg-[#2a2a2a] border-gray-600 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{service.name}</div>
                <div className="text-sm text-gray-400">
                  R$ {service.price.toFixed(2)} • {service.duration_minutes} min
                </div>
              </div>
            </label>
          ))}

          {services.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum serviço disponível
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
  );
}