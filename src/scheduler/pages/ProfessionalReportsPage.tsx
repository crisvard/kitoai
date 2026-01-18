import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProfessionalAuth } from '../contexts/ProfessionalAuthContext';
import { BarChart3, DollarSign, Calendar as CalendarIcon, Clock } from 'lucide-react';
import ProfessionalCommissionsView from '../components/Reports/ProfessionalCommissionsView';

type ReportPeriod = 'year' | 'semester' | 'quarter' | 'month' | 'last_month';
type ReportView = 'overview' | 'commissions';

interface ReportData {
  completedRevenue: number;
  pendingRevenue: number;
  confirmedRevenue: number;
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  confirmedCount: number;
  totalCommissions: number;
}

export default function ProfessionalReportsPage() {
  const { professional } = useProfessionalAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedView, setSelectedView] = useState<ReportView>('overview');
  const [reportData, setReportData] = useState<ReportData>({
    completedRevenue: 0,
    pendingRevenue: 0,
    confirmedRevenue: 0,
    totalRevenue: 0,
    completedCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    totalCommissions: 0
  });
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadReportData();
  }, [professional, selectedYear, selectedPeriod, selectedView]);

  const getDateRange = () => {
    const year = selectedYear;
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        break;
      case 'semester':
        const currentMonth = new Date().getMonth();
        const isFirstSemester = currentMonth < 6;
        startDate = new Date(year, isFirstSemester ? 0 : 6, 1);
        endDate = new Date(year, isFirstSemester ? 5 : 11, isFirstSemester ? 30 : 31, 23, 59, 59);
        break;
      case 'quarter':
        const quarter = Math.floor(new Date().getMonth() / 3);
        startDate = new Date(year, quarter * 3, 1);
        endDate = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59);
        break;
      case 'month':
        const month = new Date().getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
        break;
      case 'last_month':
        const currentDate = new Date();
        const lastMonth = currentDate.getMonth() - 1;
        const lastMonthYear = lastMonth < 0 ? year - 1 : year;
        const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth;
        startDate = new Date(lastMonthYear, adjustedLastMonth, 1);
        endDate = new Date(lastMonthYear, adjustedLastMonth + 1, 0, 23, 59, 59);
        break;
      default:
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    return { startDate, endDate };
  };

  const loadReportData = async () => {
    if (!professional) return;

    setLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      if (selectedView === 'overview') {
        // Get completed appointments
        const { data: completedData } = await supabase
          .from('shared_appointment_data')
          .select('total_price, status')
          .eq('professional_id', professional.id)
          .eq('status', 'completed')
          .gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString());

        // Get pending appointments
        const { data: pendingData } = await supabase
          .from('shared_appointment_data')
          .select('total_price, status')
          .eq('professional_id', professional.id)
          .eq('status', 'pending')
          .gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString());

        // Get confirmed appointments
        const { data: confirmedData } = await supabase
          .from('shared_appointment_data')
          .select('total_price, status')
          .eq('professional_id', professional.id)
          .eq('status', 'confirmed')
          .gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString());

        // Get commissions for the professional (only from completed appointments)
        const { data: commissionsData } = await supabase
          .from('commission_records')
          .select(`
            commission_amount,
            appointment:appointments(status)
          `)
          .eq('professional_id', professional.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const completedRevenue = completedData?.reduce((sum, apt) =>
          sum + Number(apt.total_price || 0), 0) || 0;

        const pendingRevenue = pendingData?.reduce((sum, apt) =>
          sum + Number(apt.total_price || 0), 0) || 0;

        const confirmedRevenue = confirmedData?.reduce((sum, apt) =>
          sum + Number(apt.total_price || 0), 0) || 0;

        const totalRevenue = completedRevenue + pendingRevenue + confirmedRevenue;
        const completedCount = completedData?.length || 0;
        const pendingCount = pendingData?.length || 0;
        const confirmedCount = confirmedData?.length || 0;

        // Filter commissions to only include those from completed appointments
        const completedCommissions = commissionsData?.filter(record => {
          const appointment = record.appointment as any;
          return appointment?.status === 'completed';
        }) || [];

        // Calculate total commissions (only from completed appointments)
        const totalCommissions = completedCommissions.reduce((sum, commission) =>
          sum + Number(commission.commission_amount), 0) || 0;

        setReportData({
          completedRevenue,
          pendingRevenue,
          confirmedRevenue,
          totalRevenue,
          completedCount,
          pendingCount,
          confirmedCount,
          totalCommissions
        });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'year': return `Ano ${selectedYear}`;
      case 'semester': {
        const currentMonth = new Date().getMonth();
        return `${currentMonth < 6 ? '1º' : '2º'} Semestre ${selectedYear}`;
      }
      case 'quarter': {
        const quarter = Math.floor(new Date().getMonth() / 3) + 1;
        return `${quarter}º Trimestre ${selectedYear}`;
      }
      case 'month': {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[new Date().getMonth()]} ${selectedYear}`;
      }
      case 'last_month': {
        const currentDate = new Date();
        const lastMonth = currentDate.getMonth() - 1;
        const lastMonthYear = lastMonth < 0 ? selectedYear - 1 : selectedYear;
        const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth;
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[adjustedLastMonth]} ${lastMonthYear}`;
      }
      default: return `Ano ${selectedYear}`;
    }
  };

  const totalAppointments = reportData.pendingCount + reportData.confirmedCount + reportData.completedCount;

  const pendingPercentage = totalAppointments > 0 ?
    (reportData.pendingCount / totalAppointments) * 100 : 0;

  const confirmedPercentage = totalAppointments > 0 ?
    (reportData.confirmedCount / totalAppointments) * 100 : 0;

  const completedPercentage = totalAppointments > 0 ?
    (reportData.completedCount / totalAppointments) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Relatórios de Agendamentos</h1>
        <p className="text-gray-400">Análise detalhada dos seus agendamentos</p>
      </div>

      {/* View Tabs */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-8">
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === 'overview'
                ? 'bg-[#c4d82e] text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setSelectedView('commissions')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === 'commissions'
                ? 'bg-[#c4d82e] text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Minhas Comissões
          </button>
        </div>
      </div>

      {/* Filters - Only show for overview */}
      {selectedView === 'overview' && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year} className="bg-[#2a2a2a] text-white">{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
                className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                <option value="year" className="bg-[#2a2a2a] text-white">Ano Completo</option>
                <option value="semester" className="bg-[#2a2a2a] text-white">Semestre Atual</option>
                <option value="quarter" className="bg-[#2a2a2a] text-white">Trimestre Atual</option>
                <option value="month" className="bg-[#2a2a2a] text-white">Mês Atual</option>
                <option value="last_month" className="bg-[#2a2a2a] text-white">Mês Anterior</option>
              </select>
            </div>

            <div className="text-sm text-gray-400">
              <span className="font-medium">Período selecionado:</span> {getPeriodLabel()}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Comissões Recebidas</p>
                  <p className="text-2xl font-bold text-white">R$ {reportData.totalCommissions.toFixed(2)}</p>
                </div>
                <div className="bg-[#c4d82e]/20 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-[#c4d82e]" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Agendamentos Concluídos</p>
                  <p className="text-2xl font-bold text-white">{reportData.completedCount}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Agendamentos Confirmados</p>
                  <p className="text-2xl font-bold text-white">{reportData.confirmedCount}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Agendamentos Pendentes</p>
                  <p className="text-2xl font-bold text-white">{reportData.pendingCount}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Distribuição de Receitas</h2>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Pending slice */}
                  {pendingPercentage > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="20"
                      strokeDasharray={`${pendingPercentage * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  )}

                  {/* Confirmed slice */}
                  {confirmedPercentage > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray={`${confirmedPercentage * 2.51} 251`}
                      strokeDashoffset={`${-pendingPercentage * 2.51}`}
                      transform="rotate(-90 50 50)"
                    />
                  )}

                  {/* Completed slice */}
                  {completedPercentage > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${completedPercentage * 2.51} 251`}
                      strokeDashoffset={`${-(pendingPercentage + confirmedPercentage) * 2.51}`}
                      transform="rotate(-90 50 50)"
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-lg font-bold text-white">{totalAppointments}</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-400 rounded"></div>
                    <div>
                      <p className="font-medium text-white">Pendentes</p>
                      <p className="text-sm text-gray-400">{reportData.pendingCount} agendamento{reportData.pendingCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{pendingPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <div>
                      <p className="font-medium text-white">Confirmados</p>
                      <p className="text-sm text-gray-400">{reportData.confirmedCount} agendamento{reportData.confirmedCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{confirmedPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <div>
                      <p className="font-medium text-white">Concluídos</p>
                      <p className="text-sm text-gray-400">{reportData.completedCount} agendamento{reportData.completedCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{completedPercentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {selectedView === 'commissions' && (
        <ProfessionalCommissionsView />
      )}
    </div>
  );
}
