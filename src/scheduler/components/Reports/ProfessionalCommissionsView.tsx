import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { DollarSign, Calendar, Clock, User, Printer } from 'lucide-react';

type ViewType = 'day' | 'month';

interface CommissionDetail {
  id: string;
  appointment_date: string;
  customer_name: string;
  services: string[];
  commission_amount: number;
  appointment_time: string;
}

interface DailyCommission {
  date: string;
  total_commission: number;
  appointment_count: number;
}

export default function ProfessionalCommissionsView() {
    const { professional } = useProfessionalAuth();
    const [viewType, setViewType] = useState<ViewType>('month');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [commissionDetails, setCommissionDetails] = useState<CommissionDetail[]>([]);
    const [dailyCommissions, setDailyCommissions] = useState<DailyCommission[]>([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [loading, setLoading] = useState(false);

    const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
      loadData();
    }, [professional, viewType, selectedDate, selectedMonth, selectedYear]);

    const loadData = async () => {
      if (!professional) return;

      setLoading(true);
      try {
        if (viewType === 'day') {
          await loadDayData();
        } else {
          await loadMonthData();
        }
      } catch (error) {
        console.error('Error loading commission data:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadDayData = async () => {
      if (!professional) return;

      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      console.log('=== DEBUG loadDayData ===');
      console.log('selectedDate:', selectedDate);
      console.log('dayStart (ISO):', dayStart.toISOString());
      console.log('dayEnd (ISO):', dayEnd.toISOString());
      console.log('professional.id:', professional.id);

      // Get commission records for the professional on the selected day
      const { data: commissionsData, error } = await supabase
        .from('commission_records')
        .select(`
          id,
          commission_amount,
          created_at,
          appointment:appointments!appointment_id(
            customer_name,
            appointment_date,
            appointment_services(
              service:services(name)
            )
          )
        `)
        .eq('professional_id', professional.id)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Raw commissionsData from Supabase:', commissionsData);

      // Process commission records
      const processedCommissions: CommissionDetail[] = [];
      let total = 0;

      for (const commission of commissionsData || []) {
        const appointment = commission.appointment as any;
        if (!appointment) continue;

        const appointmentTime = new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const services = Array.isArray(appointment.appointment_services)
          ? appointment.appointment_services.map((as: any) => as.service?.name || 'Serviço')
          : ['Serviço não informado'];

        processedCommissions.push({
          id: commission.id,
          appointment_date: appointment.appointment_date,
          customer_name: appointment.customer_name || 'Cliente não informado',
          services: services,
          commission_amount: commission.commission_amount,
          appointment_time: appointmentTime
        });

        total += commission.commission_amount;
      }

      setCommissionDetails(processedCommissions);
      setTotalCommission(total);
    };

    const loadMonthData = async () => {
      if (!professional) return;

      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      console.log('=== DEBUG loadMonthData ===');
      console.log('selectedYear:', selectedYear);
      console.log('selectedMonth:', selectedMonth);
      console.log('monthStart (ISO):', monthStart.toISOString());
      console.log('monthEnd (ISO):', monthEnd.toISOString());
      console.log('professional.id:', professional.id);

      // Get commission records for the professional in the month
      const { data: commissionsData, error } = await supabase
        .from('commission_records')
        .select(`
          commission_amount,
          created_at,
          appointment:appointments!appointment_id(
            appointment_date
          )
        `)
        .eq('professional_id', professional.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) throw error;

      console.log('Raw commissionsData from Supabase (month):', commissionsData);

      // Group by appointment date
      const dailyMap = new Map<string, { total: number; count: number }>();

      console.log('Processing monthly commissions...');
      for (const commission of commissionsData || []) {
        const appointment = commission.appointment as any;
        console.log('Monthly commission record:', commission);
        console.log('Monthly appointment data:', appointment);
        if (!appointment?.appointment_date) {
          console.log('Skipping monthly commission - no appointment_date');
          continue;
        }

        const date = new Date(appointment.appointment_date).toISOString().split('T')[0];
        console.log('Calculated date for grouping:', date, 'from appointment_date:', appointment.appointment_date);

        if (!dailyMap.has(date)) {
          dailyMap.set(date, { total: 0, count: 0 });
        }
        const dayData = dailyMap.get(date)!;
        dayData.total += commission.commission_amount;
        dayData.count += 1;
      }

      console.log('Daily map after processing:', Object.fromEntries(dailyMap));

      // Convert to array and sort by date
      const dailyCommissionsArray: DailyCommission[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          total_commission: data.total,
          appointment_count: data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const total = dailyCommissionsArray.reduce((sum, day) => sum + day.total_commission, 0);

      setDailyCommissions(dailyCommissionsArray);
      setTotalCommission(total);
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      // Parse date string correctly, avoiding timezone issues
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      return date.toLocaleDateString('pt-BR');
    };

    const getMonthName = (monthIndex: number) => {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return months[monthIndex];
    };

    const generateCSV = () => {
      if (viewType === 'day' && commissionDetails.length === 0) return;
      if (viewType === 'month' && dailyCommissions.length === 0) return;

      let headers: string[];
      let csvData: string[][];

      if (viewType === 'day') {
        // Relatório diário: Horário, Cliente, Serviços, Comissão
        headers = ['Horário', 'Cliente', 'Serviços', 'Comissão'];

        csvData = commissionDetails.map(commission => [
          commission.appointment_time,
          commission.customer_name,
          commission.services.join(', '),
          formatCurrency(commission.commission_amount).replace('R$', '').trim()
        ]);

        // Adicionar linha de total
        csvData.push([
          'TOTAL',
          '',
          '',
          formatCurrency(totalCommission).replace('R$', '').trim()
        ]);
      } else {
        // Relatório mensal: Data, Agendamentos, Comissão Total
        headers = ['Data', 'Agendamentos', 'Comissão Total'];

        csvData = dailyCommissions.map(dayCommission => [
          formatDate(dayCommission.date),
          dayCommission.appointment_count.toString(),
          formatCurrency(dayCommission.total_commission).replace('R$', '').trim()
        ]);

        // Adicionar linha de total
        const totalAppointments = dailyCommissions.reduce((sum, day) => sum + day.appointment_count, 0);
        csvData.push([
          'TOTAL',
          totalAppointments.toString(),
          formatCurrency(totalCommission).replace('R$', '').trim()
        ]);
      }

      // Converter para CSV
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileUrl = URL.createObjectURL(blob);

      const fileName = viewType === 'day'
        ? `relatorio-comissoes-diario-${selectedDate}.csv`
        : `relatorio-comissoes-mensal-${getMonthName(selectedMonth)}-${selectedYear}.csv`;

      link.setAttribute('href', fileUrl);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

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
            <h2 className="text-2xl font-bold text-white">Minhas Comissões</h2>
            <p className="text-gray-400 mt-1">Acompanhe suas comissões por dia ou mês</p>
          </div>
          <button
            onClick={generateCSV}
            className="flex items-center gap-3 px-6 py-3 bg-[#c4d82e] text-black font-semibold rounded-xl hover:bg-[#c4d82e]/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#c4d82e]/30"
          >
            <Printer className="w-5 h-5" />
            Baixar Relatório (CSV)
          </button>
        </div>

        {/* View Type Selector */}
        <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visualizar por
              </label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as ViewType)}
                className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                <option value="day">Dia</option>
                <option value="month">Mês</option>
              </select>
            </div>

            {viewType === 'day' && (
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
            )}

            {viewType === 'month' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year} className="bg-[#1a1a1a] text-white">{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  >
                    {[
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ].map((month, index) => (
                      <option key={index} value={index} className="bg-[#1a1a1a] text-white">{month}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="text-sm text-gray-400">
              <span className="font-medium">
                {viewType === 'day'
                  ? `Data selecionada: ${formatDate(selectedDate)}`
                  : `Mês selecionado: ${getMonthName(selectedMonth)} ${selectedYear}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Total Commission Card */}
        <div className="bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 border border-[#c4d82e]/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {viewType === 'day' ? 'Total do Dia' : 'Total do Mês'}
              </p>
              <p className="text-3xl font-bold text-[#c4d82e]">{formatCurrency(totalCommission)}</p>
            </div>
            <div className="bg-[#c4d82e]/20 p-4 rounded-2xl">
              <DollarSign className="w-8 h-8 text-[#c4d82e]" />
            </div>
          </div>
        </div>

        {/* Day View */}
        {viewType === 'day' && (
          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Serviços
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Comissão
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {commissionDetails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma comissão encontrada para esta data
                      </td>
                    </tr>
                  ) : (
                    commissionDetails.map((commission) => (
                      <tr key={commission.id} className="hover:bg-[#1a1a1a]">
                        <td className="px-4 py-3 text-sm text-white">
                          {commission.appointment_time}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {commission.customer_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {commission.services.join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#c4d82e]">
                          {formatCurrency(commission.commission_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Month View */}
        {viewType === 'month' && (
          <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Agendamentos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Comissão Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {dailyCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma comissão encontrada para este mês
                      </td>
                    </tr>
                  ) : (
                    dailyCommissions.map((dayCommission) => (
                      <tr key={dayCommission.date} className="hover:bg-[#1a1a1a]">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(dayCommission.date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {dayCommission.appointment_count} agendamento{dayCommission.appointment_count !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#c4d82e]">
                          {formatCurrency(dayCommission.total_commission)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
}