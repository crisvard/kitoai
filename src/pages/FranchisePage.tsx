import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Phone, DollarSign, Users, Settings, Trash2, Edit, Save, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

interface Franchise {
  id: string;
  name: string;
  phone_number: string;
  monthly_revenue: number;
  active_sessions: number;
  created_at: string;
}

interface FranchisePageProps {
  onBack: () => void;
}

const FranchisePage: React.FC<FranchisePageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFranchise, setNewFranchise] = useState({
    name: '',
    phone_number: '',
    monthly_revenue: 0
  });
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);

  // Load franchises from Supabase
  const loadFranchises = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('User ID:', user.id);

      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Franchises loaded:', data);
      setFranchises(data || []);
    } catch (err) {
      console.error('Error loading franchises:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar franquias');
    } finally {
      setLoading(false);
    }
  };

  // Add new franchise
  const addFranchise = async () => {
    try {
      if (!newFranchise.name.trim() || !newFranchise.phone_number.trim()) {
        throw new Error('Nome e número de telefone são obrigatórios');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('franchises')
        .insert({
          user_id: user.id,
          name: newFranchise.name.trim(),
          phone_number: newFranchise.phone_number.trim(),
          monthly_revenue: newFranchise.monthly_revenue,
          active_sessions: 0
        })
        .select();

      if (error) {
        throw error;
      }

      const newFranchiseData = data[0];

      setFranchises(prev => [newFranchiseData, ...prev]);
      resetForm();
      setShowAddModal(false);

      alert(`Franquia "${newFranchiseData.name}" criada com sucesso!`);
    } catch (err) {
      console.error('Error adding franchise:', err);
      alert(err instanceof Error ? err.message : 'Erro ao adicionar franquia');
    }
  };


  // Update franchise
  const updateFranchise = async () => {
    if (!editingFranchise) return;

    try {
      const { data, error } = await supabase
        .from('franchises')
        .update({
          name: editingFranchise.name,
          phone_number: editingFranchise.phone_number,
          monthly_revenue: editingFranchise.monthly_revenue,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingFranchise.id)
        .select();

      if (error) {
        throw error;
      }

      setFranchises(prev => prev.map(f => f.id === editingFranchise.id ? data[0] : f));
      setEditingFranchise(null);
    } catch (err) {
      console.error('Error updating franchise:', err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar franquia');
    }
  };

  // Delete franchise
  const deleteFranchise = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta franquia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('franchises')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setFranchises(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting franchise:', err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir franquia');
    }
  };

  const resetForm = () => {
    setNewFranchise({
      name: '',
      phone_number: '',
      monthly_revenue: 0
    });
  };

  useEffect(() => {
    loadFranchises();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar ao Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciamento de Franquias</h1>
          <p className="text-gray-400">Gerencie suas franquias e números de WhatsApp configurados</p>
        </div>

        {/* Banner de Trial Ativo - WhatsApp */}
        {profile?.trial_active && (
          <div className="mb-6 bg-gradient-to-r from-[#c4d82e]/10 to-[#b5c928]/10 border border-[#c4d82e]/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Trial Ativo - Agente WhatsApp</h3>
                  <p className="text-gray-300">
                    Expira em {profile.trial_end_date ? new Date(profile.trial_end_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#c4d82e] font-medium">Acesso Liberado</div>
                <div className="text-xs text-gray-400 mt-1">Durante o período de teste</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Suas Franquias</h2>
              <p className="text-gray-400">Visualize e gerencie todas as suas franquias ativas</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40"
            >
              <Plus className="w-5 h-5" />
              Adicionar Nova Franquia
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#c4d82e] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#c4d82e] ml-4">Carregando franquias...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <X className="w-6 h-6 text-red-400" />
                <div>
                  <h4 className="text-lg font-bold text-red-400 mb-1">Erro ao carregar franquias</h4>
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={loadFranchises}
                    className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          ) : franchises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma franquia encontrada</h3>
              <p className="text-gray-400 mb-4">Adicione sua primeira franquia para começar</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                Adicionar Franquia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {franchises.map(franchise => (
                <div
                  key={franchise.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#c4d82e]/40 rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-[#c4d82e]/20 hover:-translate-y-2"
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingFranchise(franchise)}
                      className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg flex items-center justify-center transition-colors"
                      title="Editar franquia"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => deleteFranchise(franchise.id)}
                      className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors"
                      title="Excluir franquia"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#c4d82e]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{franchise.name}</h3>
                      <p className="text-gray-400 text-sm">Franquia ativa</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center">
                        <Phone className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm">Número WhatsApp</p>
                        <p className="text-white font-semibold">{franchise.phone_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm">Faturamento Mensal</p>
                        <p className="text-white font-semibold">
                          R$ {franchise.monthly_revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm">Sessões Ativas</p>
                        <p className="text-white font-semibold">{franchise.active_sessions}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const { data: { user: currentUser } } = await supabase.auth.getUser();
                      console.log('🏢 [FranchisePage] Clicou no card da franquia:', {
                        franchiseId: franchise.id,
                        franchiseName: franchise.name,
                        userId: currentUser?.id
                      });
                      navigate(`/franchise/${franchise.id}/scheduler`);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center justify-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    Acessar Sistema
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Franchise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingFranchise ? 'Editar Franquia' : 'Adicionar Nova Franquia'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFranchise(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Users className="w-4 h-4" />
                  Nome da Franquia
                </label>
                <input
                  type="text"
                  value={editingFranchise ? editingFranchise.name : newFranchise.name}
                  onChange={(e) => {
                    if (editingFranchise) {
                      setEditingFranchise({...editingFranchise, name: e.target.value});
                    } else {
                      setNewFranchise({...newFranchise, name: e.target.value});
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="Ex: Kito Expert - Unidade Centro"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Phone className="w-4 h-4" />
                  Número WhatsApp
                </label>
                <input
                  type="text"
                  value={editingFranchise ? editingFranchise.phone_number : newFranchise.phone_number}
                  onChange={(e) => {
                    if (editingFranchise) {
                      setEditingFranchise({...editingFranchise, phone_number: e.target.value});
                    } else {
                      setNewFranchise({...newFranchise, phone_number: e.target.value});
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="Ex: 5511987654321"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 55 + DDD + número (sem espaços ou caracteres especiais)
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  Faturamento Mensal (R$)
                </label>
                <input
                  type="number"
                  value={editingFranchise ? editingFranchise.monthly_revenue : newFranchise.monthly_revenue}
                  onChange={(e) => {
                    if (editingFranchise) {
                      setEditingFranchise({...editingFranchise, monthly_revenue: parseFloat(e.target.value) || 0});
                    } else {
                      setNewFranchise({...newFranchise, monthly_revenue: parseFloat(e.target.value) || 0});
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="Ex: 15000.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFranchise(null);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingFranchise ? updateFranchise : addFranchise}
                className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {editingFranchise ? (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Adicionar Franquia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchisePage;