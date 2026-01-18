import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { DollarSign, Calendar, Filter, Users, ChevronLeft, ChevronRight, X, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

type PeriodFilter = 'day' | 'month';

interface CommissionDetail {
  id: string;
  professional_id: string;
  service_name: string;
  service_price: number;
  commission_amount: number;
  commission_type: string;
  commission_value: number;
  status: string;
  created_at: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  isPlaceholder?: boolean;
  appointments?: any[];
  professional?: {
    name: string;
    specialty: string;
  };
}

interface ProfessionalSummary {
  professional_id: string;
  professional_name: string;
  professional_specialty: string;
  total_gross: number;
  total_commission: number;
  service_count: number;
}

export default function CommissionDetailedReports() {
  const { user } = useSchedulerAuth();
  const { professionals: schedulerProfessionals } = useScheduler();
  const { franchiseId } = usePermissions();
  const [commissions, setCommissions] = useState<CommissionDetail[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<ProfessionalSummary[]>([]);
  const [packageSales, setPackageSales] = useState<number>(0);

  useEffect(() => {
    console.log('🔄 [REPORTS DEBUG] useEffect triggered:', {
      periodFilter,
      selectedProfessional,
      selectedDate,
      schedulerProfessionalsCount: schedulerProfessionals?.length || 0,
      franchiseId
    });
    loadProfessionals();
    loadData();
  }, [periodFilter, selectedProfessional, selectedDate, schedulerProfessionals, franchiseId]);

  const loadProfessionals = async () => {
    console.log('👥 [REPORTS DEBUG] loadProfessionals called');
    console.log('👥 [REPORTS DEBUG] schedulerProfessionals:', schedulerProfessionals?.length || 0, 'profissionais no contexto');

    // Use professionals from scheduler context
    setProfessionals(schedulerProfessionals);

    console.log('✅ [REPORTS DEBUG] Profissionais definidos no estado local:', schedulerProfessionals?.length || 0);
  };

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    switch (periodFilter) {
      case 'day':
        // Trabalhar com datas locais diretamente
        startDate = new Date(selectedDate + 'T00:00:00');
        endDate = new Date(selectedDate + 'T23:59:59');
        break;
      case 'month':
        // Para mês, calcular primeiro e último dia
        const date = new Date(selectedDate);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
    console.log('🔍 [REPORTS DEBUG] Iniciando loadData...');
    console.log('📅 [REPORTS DEBUG] Período:', periodFilter, 'Data:', selectedDate);
    console.log('👤 [REPORTS DEBUG] Profissional selecionado:', selectedProfessional);
    console.log('🏢 [REPORTS DEBUG] Franchise ID:', franchiseId);

    if (!user) {
      console.log('❌ [REPORTS DEBUG] Usuário não encontrado');
      return;
    }

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('📅 [REPORTS DEBUG] Range de datas:', startDate.toISOString(), 'até', endDate.toISOString());

      // Build query for appointments with commission calculations - exclude package sessions
      let query = supabase
        .from('appointments')
        .select(`
          id,
          professional_id,
          appointment_date,
          total_price,
          franchise_id,
          status,
          professionals!inner(id, name, specialty),
          appointment_services!inner(
            service_id,
            price,
            used_package_session,
            services!inner(id, name)
          )
        `)
        .eq('status', 'completed')
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .order('appointment_date', { ascending: false });

      // Apply franchise filter if in franchise context
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
        console.log('🏢 [REPORTS DEBUG] Aplicando filtro de franquia:', franchiseId);
      }

      if (selectedProfessional !== 'all') {
        query = query.eq('professional_id', selectedProfessional);
        console.log('👤 [REPORTS DEBUG] Aplicando filtro de profissional:', selectedProfessional);
      }

      console.log('🔍 [REPORTS DEBUG] Executando query de appointments...');
      const { data: appointmentsData, error: appointmentsError } = await query;

      if (appointmentsError) {
        console.error('❌ [REPORTS DEBUG] Erro na query de appointments:', appointmentsError);
        throw appointmentsError;
      }

      console.log('✅ [REPORTS DEBUG] Dados de appointments carregados:', appointmentsData?.length || 0, 'registros');

      // Process appointments and calculate commissions - exclude package sessions
      console.log('💰 [REPORTS DEBUG] Processando comissões (excluindo pacotes)...');
      const processedCommissions: CommissionDetail[] = [];

      for (const appointment of appointmentsData || []) {
        // Process each service in the appointment
        for (const appointmentService of appointment.appointment_services || []) {
          // Skip if this service used a package session
          if (appointmentService.used_package_session) {
            console.log('📦 [REPORTS DEBUG] Pulando serviço que usou pacote:', appointmentService.service_id);
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
          let commissionValue = 0;
          let commissionType: 'fixed' | 'percentage' = 'percentage';

          if (commissionConfig) {
            if (commissionConfig.calculation_type === 'fixed') {
              commissionAmount = commissionConfig.commission_value;
              commissionValue = commissionConfig.commission_value;
              commissionType = 'fixed';
            } else if (commissionConfig.calculation_type === 'percentage') {
              commissionAmount = appointmentService.price * (commissionConfig.commission_value / 100);
              commissionValue = commissionConfig.commission_value;
              commissionType = 'percentage';
            }
          } else {
            // No commission configuration found - set to 0%
            commissionAmount = 0;
            commissionValue = 0;
            commissionType = 'percentage';
          }

          const serviceName = (appointmentService.services as any)?.name || 'Serviço não encontrado';

          processedCommissions.push({
            id: `${appointment.id}-${serviceId}`, // Unique ID for each service
            professional_id: appointment.professional_id,
            service_name: serviceName,
            service_price: appointmentService.price,
            commission_amount: commissionAmount,
            commission_type: commissionConfig?.calculation_type || 'fixed',
            commission_value: commissionConfig?.commission_value || 0,
            status: 'paid',
            created_at: appointment.appointment_date,
            customer_name: null,
            customer_phone: null,
            professional: (appointment.professionals as any) || null
          });
        }
      }

      console.log('✅ [REPORTS DEBUG] Comissões processadas:', processedCommissions.length, 'registros');

      const commissionsWithProfessionals = processedCommissions;

      // Calculate summary by professional
      console.log('📊 [REPORTS DEBUG] Calculando resumos por profissional...');
      const summaryMap = new Map<string, ProfessionalSummary>();

      commissionsWithProfessionals.forEach(commission => {
        const profId = commission.professional_id;
        if (!summaryMap.has(profId)) {
          summaryMap.set(profId, {
            professional_id: profId,
            professional_name: commission.professional?.name || 'N/A',
            professional_specialty: commission.professional?.specialty || 'N/A',
            total_gross: 0,
            total_commission: 0,
            service_count: 0
          });
        }

        const summary = summaryMap.get(profId)!;
        summary.total_gross += commission.service_price;
        summary.total_commission += commission.commission_amount;
        summary.service_count += 1;

        console.log('💰 [REPORTS DEBUG] Comissão processada:', {
          profId,
          service_price: commission.service_price,
          commission_amount: commission.commission_amount,
          running_total_gross: summary.total_gross,
          running_total_commission: summary.total_commission
        });
      });

      // Use processed commissions directly
      const finalCommissions = commissionsWithProfessionals;
      console.log('📋 [REPORTS DEBUG] Comissões finais:', finalCommissions.length);

      // Calculate totals
      const totalGross = Array.from(summaryMap.values()).reduce((sum, prof) => sum + prof.total_gross, 0);
      const totalCommission = Array.from(summaryMap.values()).reduce((sum, prof) => sum + prof.total_commission, 0);
      const totalNetProfit = totalGross - totalCommission;

      console.log('💵 [REPORTS DEBUG] Totais calculados:', {
        totalGross,
        totalCommission,
        totalNetProfit,
        professionalCount: summaryMap.size
      });

      setCommissions(finalCommissions);
      setSummary(Array.from(summaryMap.values()));
    } catch (error) {
      console.error('❌ [REPORTS DEBUG] Erro geral no loadData:', error);
      console.error('❌ [REPORTS DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    } finally {
      console.log('🏁 [REPORTS DEBUG] loadData finalizado');
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
    // Ensure consistent date formatting by using UTC methods
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPeriodLabel = () => {
    const date = new Date(selectedDate);
    switch (periodFilter) {
      case 'day':
        return `Dia ${date.toLocaleDateString('pt-BR')}`;
      case 'month':
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      default:
        return '';
    }
  };

  const totalGross = summary.reduce((sum, prof) => sum + prof.total_gross, 0);
  const totalCommission = summary.reduce((sum, prof) => sum + prof.total_commission, 0);
  const totalNetProfit = totalGross - totalCommission;

  console.log('💰 [REPORTS DEBUG] Totais finais para exibição:', {
    totalGross,
    totalCommission,
    totalNetProfit,
    summaryCount: summary.length
  });

  const generateCSV = () => {
    if (commissions.length === 0) return;

    // Cabeçalhos do CSV (apenas as colunas solicitadas)
    const headers = [
      'Data',
      'Profissional',
      'Serviço',
      'Valor Bruto',
      'Comissão',
      'Valor Comissão',
      'Lucro Líquido'
    ];

    // Dados do CSV
    const csvData = commissions.map(commission => [
      commission.isPlaceholder ? 'N/A' : formatDate(commission.created_at),
      commission.professional?.name || 'N/A',
      commission.isPlaceholder ? 'Nenhum serviço' : commission.service_name,
      commission.isPlaceholder ? '0,00' : formatCurrency(commission.service_price).replace('R$', '').trim(),
      commission.isPlaceholder ? 'N/A' : (commission.commission_type === 'fixed'
        ? `R$ ${commission.commission_value.toFixed(2)}`
        : `${commission.commission_value}%`),
      commission.isPlaceholder ? '0,00' : formatCurrency(commission.commission_amount).replace('R$', '').trim(),
      commission.isPlaceholder ? '0,00' : formatCurrency(commission.service_price - commission.commission_amount).replace('R$', '').trim()
    ]);

    // Adicionar linha de totais
    csvData.push([
      'TOTAL',
      '',
      '',
      formatCurrency(totalGross).replace('R$', '').trim(),
      '',
      formatCurrency(totalCommission).replace('R$', '').trim(),
      formatCurrency(totalNetProfit).replace('R$', '').trim()
    ]);

    // Converter para CSV
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-comissoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MonthPicker Component - Simplified
  function MonthPicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
    const selectedDate = new Date(value);
    const currentYear = new Date().getFullYear();

    // Generate years from current year back to 2020
    const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const handleMonthChange = (monthIndex: string) => {
      const year = selectedDate.getFullYear();
      const newDate = new Date(year, parseInt(monthIndex), 1);
      onChange(newDate.toISOString().split('T')[0]);
    };

    const handleYearChange = (year: string) => {
      const month = selectedDate.getMonth();
      const newDate = new Date(parseInt(year), month, 1);
      onChange(newDate.toISOString().split('T')[0]);
    };

    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Ano
          </label>
          <select
            value={selectedDate.getFullYear()}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Mês
          </label>
          <select
            value={selectedDate.getMonth()}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // DatePicker Component
  function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const selectedDate = value ? new Date(value) : null;

    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const handleDateSelect = (date: Date) => {
      onChange(date.toISOString().split('T')[0]);
      setIsOpen(false);
    };

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days: Date[] = [];

      const firstDayOfWeek = firstDay.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, 1 - i);
        days.push(prevDate);
      }

      for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push(new Date(year, month, day));
      }

      const lastDayOfWeek = lastDay.getDay();
      for (let i = 1; i < 7 - lastDayOfWeek; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push(nextDate);
      }

      return days;
    };

    const isToday = (date: Date): boolean => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date): boolean => {
      return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
    };

    const isCurrentMonth = (date: Date): boolean => {
      return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="relative">
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
          <input
            type="text"
            value={formatDate(selectedDate)}
            onClick={() => setIsOpen(!isOpen)}
            readOnly
            placeholder="Selecione uma data"
            className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 cursor-pointer focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
          />
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-gray-500 rounded-xl shadow-2xl z-[9999] max-w-[320px] transform scale-95 origin-bottom-left overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-gray-600">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>

              <h3 className="text-sm font-semibold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Fechar"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 p-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 p-2 pt-0">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const today = isToday(date);
                const selected = isSelected(date);
                const currentMonthDay = isCurrentMonth(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      h-8 w-8 text-xs font-medium rounded transition-all relative
                      ${selected
                        ? 'bg-[#c4d82e] text-black'
                        : today
                          ? 'bg-blue-600 text-white'
                          : currentMonthDay
                            ? 'text-white hover:bg-gray-700'
                            : 'text-gray-500'
                      }
                      ${!selected && !today && currentMonthDay ? 'hover:bg-gray-700' : ''}
                    `}
                  >
                    {date.getDate()}
                    {today && !selected && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-blue-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div id="commission-report" className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#c4d82e]/20 p-3 rounded-2xl">
          <DollarSign className="w-8 h-8 text-[#c4d82e]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Comissões Detalhadas</h1>
          <p className="text-gray-400 mt-2 text-lg">Relatório completo de serviços e comissões por período</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
            >
              <option value="day">Dia</option>
              <option value="month">Mês</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {periodFilter === 'month' ? 'Selecionar Mês e Ano' : 'Data'}
            </label>
            {periodFilter === 'month' ? (
              <MonthPicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            ) : (
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profissional
            </label>
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
            >
              <option value="all">Todos os profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name} - {prof.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-400">
            <span className="font-medium">Período selecionado:</span> {getPeriodLabel()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#c4d82e]/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Bruto</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalGross)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#c4d82e]/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#c4d82e]/20 rounded-2xl">
              <DollarSign className="w-6 h-6 text-[#c4d82e]" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Comissão</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#c4d82e]/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Profissionais</p>
              <p className="text-2xl font-bold text-white">{summary.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#c4d82e]/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Lucro Líquido Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalNetProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Records Table */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        <div
          className="overflow-x-auto overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-[#c4d82e]/50 scrollbar-track-white/5 hover:scrollbar-thumb-[#c4d82e]/70"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(196, 216, 46, 0.5) rgba(255, 255, 255, 0.05)'
          }}
        >
          <table className="w-full min-w-max">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Profissional
                </th>
                {periodFilter === 'day' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Valor Bruto
                </th>
                {periodFilter === 'month' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Comissão
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Valor Comissão
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Lucro Líquido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={periodFilter === 'day' ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="w-8 h-8 text-gray-500" />
                      <p className="text-sm">Nenhuma comissão encontrada para o período selecionado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                commissions.map((commission, index) => (
                  <tr key={commission.id} className="hover:bg-white/5 transition-colors duration-200 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {commission.isPlaceholder ? 'N/A' : formatDate(commission.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#c4d82e]/20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#c4d82e]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {commission.professional?.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {commission.professional?.specialty}
                          </div>
                        </div>
                      </div>
                    </td>
                    {periodFilter === 'day' && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {commission.isPlaceholder ? 'N/A' : (commission.customer_name || 'N/A')}
                        </div>
                        {commission.customer_phone && !commission.isPlaceholder && (
                          <div className="text-xs text-gray-400">
                            {commission.customer_phone}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {commission.isPlaceholder ? 'Nenhum serviço' : commission.service_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-green-400">
                        {commission.isPlaceholder ? formatCurrency(0) : formatCurrency(commission.service_price)}
                      </div>
                    </td>
                    {periodFilter === 'month' && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {commission.isPlaceholder ? 'N/A' : (commission.commission_type === 'fixed'
                            ? `R$ ${commission.commission_value.toFixed(2)}`
                            : `${commission.commission_value}%`)}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#c4d82e]">
                        {commission.isPlaceholder ? formatCurrency(0) : formatCurrency(commission.commission_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-400">
                        {commission.isPlaceholder ? formatCurrency(0) : formatCurrency(commission.service_price - commission.commission_amount)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={generateCSV}
          className="flex items-center gap-3 px-6 py-3 bg-[#c4d82e] text-black font-semibold rounded-xl hover:bg-[#c4d82e]/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#c4d82e]/30"
        >
          <Printer className="w-5 h-5" />
          Baixar Relatório (CSV)
        </button>
      </div>
    </div>
  );
}