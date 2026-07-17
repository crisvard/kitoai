import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { DollarSign, Percent, Plus, Edit, Trash2, Save, X, CheckCircle } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Package {
  id: string;
  name: string;
  price: number;
}

interface CommissionConfig {
  id: string;
  professional_id: string;
  commission_type: 'service' | 'package';
  service_id?: string;
  package_id?: string;
  calculation_type: 'fixed' | 'percentage';
  commission_value: number;
  active: boolean;
  service?: Service;
  package?: Package;
  professional?: Professional;
}

export default function CommissionManager() {
  const { user } = useSchedulerAuth();
  const { franchiseId, userRole } = usePermissions();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [commissions, setCommissions] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCommission, setEditingCommission] = useState<CommissionConfig | null>(null);

  // Dados relacionados
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(new Map());
  const [packagesMap, setPackagesMap] = useState<Map<string, Package>>(new Map());
  const [professionalsMap, setProfessionalsMap] = useState<Map<string, Professional>>(new Map());
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    professional_id: '',
    commission_type: 'service' as 'service' | 'package',
    service_id: '',
    package_id: '',
    calculation_type: 'fixed' as 'fixed' | 'percentage',
    commission_value: 0,
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [COMMISSION MANAGER] Iniciando carregamento de dados...');
      console.log('🔑 [COMMISSION MANAGER] Contexto de permissões:', { franchiseId, userRole });

      // Load all data separately to avoid join issues
      let professionalsQuery = supabase
        .from('professionals')
        .select('id, name, specialty')
        .eq('active', true)
        .order('name');

      let servicesQuery = supabase
        .from('services')
        .select('id, name, price')
        .eq('active', true)
        .order('name');

      let packagesQuery = supabase
        .from('packages')
        .select('id, name, price')
        .order('name');

      let commissionsQuery = supabase
        .from('professional_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros de franquia
      if (franchiseId) {
        console.log('🔒 [COMMISSION MANAGER] Aplicando filtro de franquia:', franchiseId);
        professionalsQuery = professionalsQuery.eq('franchise_id', franchiseId);
        servicesQuery = servicesQuery.eq('franchise_id', franchiseId);
        packagesQuery = packagesQuery.eq('franchise_id', franchiseId);
        commissionsQuery = commissionsQuery.eq('franchise_id', franchiseId);
      } else if (userRole === 'admin') {
        console.log('👑 [COMMISSION MANAGER] Admin carregando dados globais (sem filtro)');
      } else {
        console.log('⚠️ [COMMISSION MANAGER] Contexto indefinido - carregando sem filtros');
      }

      const [professionalsRes, servicesRes, packagesRes, commissionsRes] = await Promise.all([
        professionalsQuery,
        servicesQuery,
        packagesQuery,
        commissionsQuery
      ]);

      // Create maps for quick lookup
      const servicesMap = new Map();
      (servicesRes.data || []).forEach(service => {
        servicesMap.set(service.id, service);
      });

      const packagesMap = new Map();
      (packagesRes.data || []).forEach(pkg => {
        packagesMap.set(pkg.id, pkg);
      });

      const professionalsMap = new Map();
      (professionalsRes.data || []).forEach(prof => {
        professionalsMap.set(prof.id, prof);
      });

      // Combine commission data with related entities
      const commissionsWithData = (commissionsRes.data || []).map(commission => ({
        ...commission,
        service: commission.service_id ? servicesMap.get(commission.service_id) : null,
        package: commission.package_id ? packagesMap.get(commission.package_id) : null,
        professional: professionalsMap.get(commission.professional_id) || null
      }));

      console.log('✅ [COMMISSION MANAGER] Dados carregados:');
      console.log('  👥 Profissionais:', professionalsRes.data?.length || 0);
      console.log('  🛠️ Serviços:', servicesRes.data?.length || 0);
      console.log('  📦 Pacotes:', packagesRes.data?.length || 0);
      console.log('  💰 Comissões:', commissionsRes.data?.length || 0);

      // Log detalhado das comissões
      if (commissionsRes.data && commissionsRes.data.length > 0) {
        console.log('📋 [COMMISSION MANAGER] Detalhes das comissões carregadas:');
        commissionsRes.data.forEach((commission, index) => {
          console.log(`  ${index + 1}. ${commission.professional_id} -> ${commission.commission_type} (${commission.calculation_type}: ${commission.commission_value}) - Franchise: ${commission.franchise_id || 'N/A'}`);
        });
      }

      setProfessionals(professionalsRes.data || []);
      setServices(servicesRes.data || []);
      setPackages(packagesRes.data || []);
      setServicesMap(servicesMap);
      setPackagesMap(packagesMap);
      setProfessionalsMap(professionalsMap);
      setCommissions(commissionsWithData);
    } catch (error) {
      console.error('❌ [COMMISSION MANAGER] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      professional_id: '',
      commission_type: 'service',
      service_id: '',
      package_id: '',
      calculation_type: 'fixed',
      commission_value: 0,
      active: true
    });
    setEditingCommission(null);
    setShowForm(false);
  };

  const handleEdit = (commission: CommissionConfig) => {
    setFormData({
      professional_id: commission.professional_id,
      commission_type: commission.commission_type,
      service_id: commission.service_id || '',
      package_id: commission.package_id || '',
      calculation_type: commission.calculation_type,
      commission_value: commission.commission_value,
      active: commission.active
    });
    setEditingCommission(commission);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const commissionData = {
        professional_id: formData.professional_id,
        commission_type: formData.commission_type,
        service_id: formData.commission_type === 'service' ? formData.service_id : null,
        package_id: formData.commission_type === 'package' ? formData.package_id : null,
        calculation_type: formData.calculation_type,
        commission_value: formData.commission_value,
        active: formData.active,
        franchise_id: franchiseId // Adicionar franchise_id
      };

      console.log('💾 [COMMISSION SAVE] Salvando configuração de comissão...');
      console.log('📊 [COMMISSION SAVE] Dados:', commissionData);
      console.log('🔑 [COMMISSION SAVE] Franchise ID:', franchiseId);
      console.log('🗄️ [COMMISSION SAVE] Tabela: professional_commissions');

      if (editingCommission) {
        console.log('✏️ [COMMISSION SAVE] Operação: UPDATE (editar comissão existente)');
        console.log('🆔 [COMMISSION SAVE] ID da comissão:', editingCommission.id);

        // Update existing commission
        const { error } = await supabase
          .from('professional_commissions')
          .update(commissionData)
          .eq('id', editingCommission.id);

        if (error) {
          console.error('❌ [COMMISSION SAVE] Erro no UPDATE:', error);
          throw error;
        }

        console.log('✅ [COMMISSION SAVE] UPDATE realizado com sucesso');
      } else {
        console.log('➕ [COMMISSION SAVE] Operação: INSERT (nova comissão)');

        // Create new commission
        const { error } = await supabase
          .from('professional_commissions')
          .insert(commissionData);

        if (error) {
          console.error('❌ [COMMISSION SAVE] Erro no INSERT:', error);
          throw error;
        }

        console.log('✅ [COMMISSION SAVE] INSERT realizado com sucesso');
      }

      console.log('🎉 [COMMISSION SAVE] Configuração de comissão salva com sucesso!');
      console.log('🔄 [COMMISSION SAVE] Recarregando dados...');

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving commission:', error);
      alert('Erro ao salvar configuração de comissão');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommissionSelection = (id: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCommissions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCommissions(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(commissions.map(commission => commission.id));
      setSelectedCommissions(allIds);
      setSelectAll(true);
    }
  };

  const deleteSelectedCommissions = async () => {
    if (selectedCommissions.size === 0) return;

    const count = selectedCommissions.size;
    if (!confirm(`Tem certeza que deseja excluir ${count} configuração${count > 1 ? 'ões' : ''} de comissão${count > 1 ? 's' : ''} selecionada${count > 1 ? 's' : ''}?`)) return;

    try {
      const idsToDelete = Array.from(selectedCommissions);

      const { error } = await supabase
        .from('professional_commissions')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setSelectedCommissions(new Set());
      setSelectAll(false);
      loadData();
    } catch (error) {
      console.error('Error deleting selected commissions:', error);
      alert('Erro ao excluir configurações de comissão selecionadas');
    }
  };

  const handleDelete = async (commissionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração de comissão?')) return;

    try {
      console.log('🗑️ [COMMISSION DELETE] Excluindo configuração de comissão...');
      console.log('🆔 [COMMISSION DELETE] ID da comissão:', commissionId);
      console.log('🗄️ [COMMISSION DELETE] Tabela: professional_commissions');

      const { error } = await supabase
        .from('professional_commissions')
        .delete()
        .eq('id', commissionId);

      if (error) {
        console.error('❌ [COMMISSION DELETE] Erro na exclusão:', error);
        throw error;
      }

      console.log('✅ [COMMISSION DELETE] Configuração excluída com sucesso');
      console.log('🔄 [COMMISSION DELETE] Recarregando dados...');
      loadData();
    } catch (error) {
      console.error('❌ [COMMISSION DELETE] Erro geral:', error);
      alert('Erro ao excluir configuração de comissão');
    }
  };

  const toggleActive = async (commission: CommissionConfig) => {
    try {
      const newStatus = !commission.active;
      console.log('🔄 [COMMISSION TOGGLE] Alterando status da comissão...');
      console.log('🆔 [COMMISSION TOGGLE] ID da comissão:', commission.id);
      console.log('📊 [COMMISSION TOGGLE] Novo status:', newStatus ? 'ATIVO' : 'INATIVO');
      console.log('🗄️ [COMMISSION TOGGLE] Tabela: professional_commissions');

      const { error } = await supabase
        .from('professional_commissions')
        .update({ active: newStatus })
        .eq('id', commission.id);

      if (error) {
        console.error('❌ [COMMISSION TOGGLE] Erro ao alterar status:', error);
        throw error;
      }

      console.log('✅ [COMMISSION TOGGLE] Status alterado com sucesso');
      console.log('🔄 [COMMISSION TOGGLE] Recarregando dados...');
      loadData();
    } catch (error) {
      console.error('❌ [COMMISSION TOGGLE] Erro geral:', error);
    }
  };

  const getCommissionDisplay = (commission: CommissionConfig) => {
    const value = commission.commission_value;
    const type = commission.calculation_type;

    if (type === 'fixed') {
      return `R$ ${value.toFixed(2)}`;
    } else {
      return `${value}%`;
    }
  };

  if (loading && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pr-12">
        <div>
          <h2 className="text-2xl font-bold text-white">Comissões dos Profissionais</h2>
          <p className="text-gray-400 mt-1">Configure comissões por serviço ou pacote vendido</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Nova Comissão
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingCommission ? 'Editar Comissão' : 'Nova Comissão'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profissional
                </label>
                <select
                  value={formData.professional_id}
                  onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Comissão
                </label>
                <select
                  value={formData.commission_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    commission_type: e.target.value as 'service' | 'package',
                    service_id: '',
                    package_id: ''
                  })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="service">Por Serviço</option>
                  <option value="package">Por Pacote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.commission_type === 'service' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Serviço
                  </label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
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
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pacote
                  </label>
                  <select
                    value={formData.package_id}
                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um pacote</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - R$ {pkg.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Cálculo
                </label>
                <select
                  value={formData.calculation_type}
                  onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value as 'fixed' | 'percentage' })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="fixed">Valor Fixo</option>
                  <option value="percentage">Percentual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor da Comissão
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2 flex items-center">
                  {formData.calculation_type === 'fixed' ? (
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Percent className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.calculation_type === 'percentage' ? 100 : undefined}
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  placeholder={formData.calculation_type === 'fixed' ? 'Ex: 15.00' : 'Ex: 10'}
                  required
                />
                <span className="absolute right-3 top-2 text-sm text-gray-400">
                  {formData.calculation_type === 'fixed' ? 'R$' : '%'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#c4d82e] hover:bg-[#c4d82e]/80 text-black px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Commissions List */}
      {/* Selection Controls */}
      {commissions.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                <div
                  onClick={toggleSelectAll}
                  className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                    ${commissions.length > 0 && commissions.every(commission => selectedCommissions.has(commission.id))
                      ? 'bg-[#c4d82e] border-[#c4d82e] shadow-lg shadow-[#c4d82e]/50'
                      : 'border-gray-500 bg-[#2a2a2a] hover:border-[#c4d82e]/50 group-hover:shadow-md group-hover:shadow-[#c4d82e]/20'
                    }
                  `}
                >
                  {commissions.length > 0 && commissions.every(commission => selectedCommissions.has(commission.id)) && (
                    <CheckCircle className="w-4 h-4 text-black animate-in zoom-in-50 duration-200" />
                  )}
                </div>
                <span className="font-medium group-hover:text-white transition-colors duration-200">
                  Selecionar Todos ({commissions.length})
                </span>
              </label>
              {selectedCommissions.size > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/20 border border-[#c4d82e]/30 rounded-full animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <CheckCircle className="w-4 h-4 text-[#c4d82e]" />
                  <span className="text-sm text-[#c4d82e] font-medium">
                    {selectedCommissions.size} selecionada{selectedCommissions.size > 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
                  <div className="w-4 h-4 rounded border-2 border-gray-500"></div>
                  <span className="text-sm text-gray-400 font-medium">
                    Nenhuma selecionada
                  </span>
                </div>
              )}
            </div>
            {selectedCommissions.size > 0 && (
              <button
                onClick={deleteSelectedCommissions}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionadas ({selectedCommissions.size})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {commissions.length === 0 ? (
          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma comissão configurada</h3>
            <p className="text-gray-400">Configure comissões para seus profissionais</p>
          </div>
        ) : (
          commissions.map(commission => (
            <div
              key={commission.id}
              onClick={() => toggleCommissionSelection(commission.id)}
              className={`
                relative cursor-pointer bg-[#2a2a2a] border rounded-lg p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10 overflow-hidden
                ${selectedCommissions.has(commission.id)
                  ? 'border-[#c4d82e] bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 shadow-lg shadow-[#c4d82e]/20 ring-2 ring-[#c4d82e]/30'
                  : 'border-gray-600 hover:bg-gray-700'
                }
              `}
            >
              {/* Selection indicator */}
              {selectedCommissions.has(commission.id) && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-white">
                      {commission.professional?.name}
                    </span>
                    <span className="text-sm text-gray-400">
                      {commission.professional?.specialty}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      commission.active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {commission.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-300">
                      {commission.commission_type === 'service' ? 'Serviço:' : 'Pacote:'}
                      <span className="text-white ml-1">
                        {commission.service?.name || commission.package?.name}
                      </span>
                    </span>

                    <span className="text-gray-300">
                      Comissão:
                      <span className="text-[#c4d82e] font-medium ml-1">
                        {getCommissionDisplay(commission)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(commission)}
                    className={`px-3 py-1 text-xs rounded ${
                      commission.active
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {commission.active ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleEdit(commission)}
                    className="p-2 text-gray-400 hover:text-white transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(commission.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}