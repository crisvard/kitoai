import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

interface CommissionRecord {
  id: string;
  professional_id: string;
  service_name: string;
  service_price: number;
  commission_amount: number;
  commission_type: string;
  commission_value: number;
  status: string;
  created_at: string;
  professional?: {
    name: string;
    specialty: string;
  };
}

interface CommissionSummary {
  total_pending: number;
  total_paid: number;
  total_overall: number;
  professional_count: number;
}

export default function CommissionReports({ professionalFirst = false }: { professionalFirst?: boolean }) {
   const { user } = useAuth();
   const { franchiseId } = usePermissions();
   const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
   const [summary, setSummary] = useState<CommissionSummary | null>(null);
   const [loading, setLoading] = useState(false);
   const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
   const [filterProfessional, setFilterProfessional] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [filterStatus, filterProfessional]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Build query for appointments with commission calculations - exclude package sessions
      let query = supabase
        .from('appointments')
        .select(`
          id,
          professional_id,
          appointment_date,
          franchise_id,
          professionals!inner(id, name, specialty),
          appointment_services!inner(
            service_id,
            price,
            used_package_session,
            services!inner(id, name)
          )
        `)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      // Apply franchise filter if in franchise context
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      }

      if (filterProfessional !== 'all') {
        query = query.eq('professional_id', filterProfessional);
      }

      const { data: appointmentsData, error: appointmentsError } = await query;

      if (appointmentsError) throw appointmentsError;

      // Process appointments and calculate commissions - exclude package sessions
      const processedCommissions: CommissionRecord[] = [];

      for (const appointment of appointmentsData || []) {
        // Process each service in the appointment
        for (const appointmentService of appointment.appointment_services || []) {
          // Skip if this service used a package session
          if (appointmentService.used_package_session) {
            continue;
          }

          // Get commission configuration for this professional and service
          const serviceId = appointmentService.service_id;
          if (!serviceId) continue;

          const { data: commissionConfig, error: configError } = await supabase
            .from('professional_commissions')
            .select('commission_value, calculation_type')
            .eq('professional_id', appointment.professional_id)
            .eq('service_id', serviceId)
            .single();

          let commissionAmount = 0;
          if (commissionConfig) {
            if (commissionConfig.calculation_type === 'fixed') {
              commissionAmount = commissionConfig.commission_value;
            } else if (commissionConfig.calculation_type === 'percentage') {
              commissionAmount = appointmentService.price * (commissionConfig.commission_value / 100);
            }
          } else {
            // Fallback: use default value
            commissionAmount = 20;
          }

          const serviceName = (appointmentService.services as any)?.name || 'Serviço não encontrado';

          processedCommissions.push({
            id: `${appointment.id}-${serviceId}`,
            professional_id: appointment.professional_id,
            service_name: serviceName,
            service_price: appointmentService.price,
            commission_amount: commissionAmount,
            commission_type: commissionConfig?.calculation_type || 'fixed',
            commission_value: commissionConfig?.commission_value || 0,
            status: 'paid',
            created_at: appointment.appointment_date,
            professional: (appointment.professionals as any) || null
          });
        }
      }

      // Apply status filter
      let filteredCommissions = processedCommissions;
      if (filterStatus !== 'all') {
        filteredCommissions = processedCommissions.filter(c => c.status === filterStatus);
      }

      // Calculate summary
      const summary = {
        total_pending: filteredCommissions.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.commission_amount, 0) || 0,
        total_paid: filteredCommissions.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.commission_amount, 0) || 0,
        total_overall: filteredCommissions.reduce((sum, r) => sum + r.commission_amount, 0) || 0,
        professional_count: new Set(filteredCommissions.map(c => c.professional_id)).size || 0
      };

      setCommissions(filteredCommissions);
      setSummary(summary);
    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'paid': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCommissionTypeDisplay = (type: string, value: number) => {
    if (type === 'fixed') {
      return `R$ ${value.toFixed(2)}`;
    } else {
      return `${value}%`;
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatório de Comissões</h2>
          <p className="text-gray-400 mt-1">Acompanhe as comissões dos seus profissionais</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Geral</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(summary.total_overall)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pendente</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(summary.total_pending)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pago</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(summary.total_paid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Profissionais</p>
                <p className="text-lg font-semibold text-white">{summary.professional_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {professionalFirst ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profissional
                </label>
                <select
                  value={filterProfessional}
                  onChange={(e) => setFilterProfessional(e.target.value)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="all">Todos os Profissionais</option>
                  {Array.from(new Set(commissions.map(c => c.professional_id)))
                    .map(profId => {
                      const prof = commissions.find(c => c.professional_id === profId)?.professional;
                      return prof ? (
                        <option key={profId} value={profId}>
                          {prof.name} - {prof.specialty}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid')}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid')}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profissional
                </label>
                <select
                  value={filterProfessional}
                  onChange={(e) => setFilterProfessional(e.target.value)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  {Array.from(new Set(commissions.map(c => c.professional_id)))
                    .map(profId => {
                      const prof = commissions.find(c => c.professional_id === profId)?.professional;
                      return prof ? (
                        <option key={profId} value={profId}>
                          {prof.name} - {prof.specialty}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Commission Records Table */}
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valor do Serviço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valor Recebido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma comissão encontrada
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {commission.professional?.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {commission.professional?.specialty}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {commission.service_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {formatCurrency(commission.service_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {getCommissionTypeDisplay(commission.commission_type, commission.commission_value)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#c4d82e]">
                      {formatCurrency(commission.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(commission.status)}`}>
                        {commission.status === 'pending' ? 'Pendente' :
                         commission.status === 'paid' ? 'Pago' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(commission.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}