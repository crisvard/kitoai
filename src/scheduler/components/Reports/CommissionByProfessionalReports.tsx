import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';

type PeriodFilter = 'day' | 'week' | 'month';

interface ProfessionalCommission {
  professional_id: string;
  professional_name: string;
  professional_specialty: string;
  total_gross: number;
  total_commission: number;
  net_amount: number; // total_gross - total_commission
  service_count: number;
  appointment_count: number;
}

export default function CommissionByProfessionalReports() {
   const { user } = useAuth();
   const { franchiseId } = usePermissions();
   const [professionals, setProfessionals] = useState<ProfessionalCommission[]>([]);
   const [loading, setLoading] = useState(false);
   const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [periodFilter, selectedDate]);

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    switch (periodFilter) {
      case 'day':
        // Trabalhar com datas locais diretamente
        startDate = new Date(selectedDate + 'T00:00:00');
        endDate = new Date(selectedDate + 'T23:59:59');
        break;
      case 'week':
        // Para semana, calcular início e fim da semana
        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = new Date(weekStart.toISOString().split('T')[0] + 'T00:00:00');
        endDate = new Date(weekEnd.toISOString().split('T')[0] + 'T23:59:59');
        break;
      case 'month':
        // Para mês, calcular primeiro e último dia
        const monthDate = new Date(selectedDate);
        const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        startDate = new Date(firstDay.toISOString().split('T')[0] + 'T00:00:00');
        endDate = new Date(lastDay.toISOString().split('T')[0] + 'T23:59:59');
        break;
      default:
        startDate = new Date(selectedDate + 'T00:00:00');
        endDate = new Date(selectedDate + 'T23:59:59');
    }

    return { startDate, endDate };
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Get appointments with services - exclude package sessions
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          id,
          professional_id,
          franchise_id,
          appointment_services!inner(
            service_id,
            price,
            used_package_session,
            services!inner(id, name)
          )
        `)
        .eq('status', 'completed')
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString());

      // Apply franchise filter if in franchise context
      if (franchiseId) {
        appointmentsQuery = appointmentsQuery.eq('franchise_id', franchiseId);
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) throw appointmentsError;

      // Get all professionals with franchise filter
      let professionalsQuery = supabase
        .from('professionals')
        .select('id, name, specialty');

      // Apply franchise filter to professionals
      if (franchiseId) {
        professionalsQuery = professionalsQuery.eq('franchise_id', franchiseId);
      } else if (user?.id) {
        professionalsQuery = professionalsQuery.eq('user_id', user.id);
      }

      const { data: professionalsData, error: professionalsError } = await professionalsQuery;

      if (professionalsError) throw professionalsError;

      // Calculate commissions by professional
      const professionalMap = new Map<string, ProfessionalCommission>();

      // Initialize all professionals with zero values
      (professionalsData || []).forEach(prof => {
        professionalMap.set(prof.id, {
          professional_id: prof.id,
          professional_name: prof.name,
          professional_specialty: prof.specialty,
          total_gross: 0,
          total_commission: 0,
          net_amount: 0,
          service_count: 0,
          appointment_count: 0
        });
      });

      // Process appointments and calculate commissions - exclude package sessions
      for (const appointment of appointmentsData || []) {
        for (const appointmentService of appointment.appointment_services || []) {
          // Skip if this service used a package session
          if (appointmentService.used_package_session) {
            continue;
          }

          const profId = appointment.professional_id;
          if (professionalMap.has(profId)) {
            const prof = professionalMap.get(profId)!;

            // Get commission configuration
            const { data: commissionConfig } = await supabase
              .from('professional_commissions')
              .select('commission_value, calculation_type')
              .eq('professional_id', profId)
              .eq('service_id', appointmentService.service_id)
              .single();

            let commissionAmount = 0;
            if (commissionConfig) {
              if (commissionConfig.calculation_type === 'fixed') {
                commissionAmount = commissionConfig.commission_value;
              } else if (commissionConfig.calculation_type === 'percentage') {
                commissionAmount = appointmentService.price * (commissionConfig.commission_value / 100);
              }
            } else {
              commissionAmount = 20; // fallback
            }

            prof.total_gross += appointmentService.price;
            prof.total_commission += commissionAmount;
            prof.service_count += 1;
          }
        }
      }

      // Get unique appointments per professional
      const appointmentPromises = Array.from(professionalMap.keys()).map(async (profId) => {
        const prof = professionalMap.get(profId)!;

        // Get unique appointments for this professional in the period
        let uniqueAppointmentsQuery = supabase
          .from('appointments')
          .select('id')
          .eq('professional_id', profId)
          .eq('status', 'completed')
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate);

        // Apply franchise filter to appointments
        if (franchiseId) {
          uniqueAppointmentsQuery = uniqueAppointmentsQuery.eq('franchise_id', franchiseId);
        }

        const { data: appointmentsData, error: appointmentsError } = await uniqueAppointmentsQuery;

        if (!appointmentsError && appointmentsData) {
          prof.appointment_count = appointmentsData.length;
        }

        // Calculate net amount (gross - commission)
        prof.net_amount = prof.total_gross - prof.total_commission;

        return prof;
      });

      const professionalsWithAppointments = await Promise.all(appointmentPromises);

      // Filter out professionals with no activity in the period
      const activeProfessionals = professionalsWithAppointments.filter(prof =>
        prof.total_gross > 0 || prof.total_commission > 0
      );

      // Sort by total gross descending
      activeProfessionals.sort((a, b) => b.total_gross - a.total_gross);

      setProfessionals(activeProfessionals);
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

  const getPeriodLabel = () => {
    const date = new Date(selectedDate);
    switch (periodFilter) {
      case 'day':
        return `Dia ${date.toLocaleDateString('pt-BR')}`;
      case 'week':
        const { startDate, endDate } = getDateRange();
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return `Semana ${startDateObj.toLocaleDateString('pt-BR')} - ${endDateObj.toLocaleDateString('pt-BR')}`;
      case 'month':
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      default:
        return '';
    }
  };

  const totalGross = professionals.reduce((sum, prof) => sum + prof.total_gross, 0);
  const totalCommission = professionals.reduce((sum, prof) => sum + prof.total_commission, 0);
  const totalNet = professionals.reduce((sum, prof) => sum + prof.net_amount, 0);

  if (loading) {
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
          <h2 className="text-2xl font-bold text-white">Comissões por Profissional</h2>
          <p className="text-gray-400 mt-1">Resumo de valores gerados por profissional</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            >
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
          </div>

          <div className="text-sm text-gray-400">
            <span className="font-medium">Período selecionado:</span> {getPeriodLabel()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Bruto</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(totalGross)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c4d82e]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#c4d82e]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Comissão</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Valor Líquido</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(totalNet)}</p>
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
              <p className="text-lg font-semibold text-white">{professionals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professionals Table */}
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Serviços
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Agendamentos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valor Bruto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valor Líquido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nenhum profissional com atividade no período selecionado
                  </td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.professional_id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {professional.professional_name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {professional.professional_specialty}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {professional.service_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {professional.appointment_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {formatCurrency(professional.total_gross)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#c4d82e]">
                      {formatCurrency(professional.total_commission)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-400">
                      {formatCurrency(professional.net_amount)}
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