import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { useScheduler } from '../../contexts/SchedulerContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { DollarSign, Calendar, Users, Package, Printer, ChevronLeft, ChevronRight, X } from 'lucide-react';

type PeriodFilter = 'day' | 'month';

interface CombinedCommissionDetail {
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
  isPackageSale?: boolean;
  professional?: {
    name: string;
    specialty: string;
  };
}

export default function CombinedReports() {
  const { user } = useSchedulerAuth();
  const { professionals: schedulerProfessionals } = useScheduler();
  const { franchiseId } = usePermissions();
  const [combinedCommissions, setCombinedCommissions] = useState<CombinedCommissionDetail[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadProfessionals();
    loadCombinedData();
  }, [periodFilter, selectedProfessional, selectedDate, schedulerProfessionals, franchiseId]);

  const loadProfessionals = async () => {
    setProfessionals(schedulerProfessionals);
  };

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    switch (periodFilter) {
      case 'day':
        startDate = new Date(selectedDate + 'T00:00:00');
        endDate = new Date(selectedDate + 'T23:59:59');
        break;
      case 'month':
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

  const loadCombinedData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const allCommissions: CombinedCommissionDetail[] = [];

      // Load service commissions
      let appointmentsQuery = supabase
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

      if (franchiseId) {
        appointmentsQuery = appointmentsQuery.eq('franchise_id', franchiseId);
      }

      if (selectedProfessional !== 'all') {
        appointmentsQuery = appointmentsQuery.eq('professional_id', selectedProfessional);
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) throw appointmentsError;

      // Process service commissions
      for (const appointment of appointmentsData || []) {
        for (const appointmentService of appointment.appointment_services || []) {
          if (appointmentService.used_package_session) continue;

          const serviceId = appointmentService.service_id;
          if (!serviceId) continue;

          const { data: commissionConfig } = await supabase
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

          allCommissions.push({
            id: `${appointment.id}-${serviceId}`,
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
            isPackageSale: false,
            professional: (appointment.professionals as any)
          });
        }
      }

      // Load package sales
      let packagesQuery = supabase
        .from('customer_packages')
        .select(`
          id,
          purchase_date,
          paid,
          franchise_id,
          customer_id,
          package_id,
          packages!inner(id, name, price),
          customers!inner(professional_id, name, phone)
        `)
        .eq('paid', true)
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString())
        .order('purchase_date', { ascending: false });

      if (franchiseId) {
        packagesQuery = packagesQuery.eq('franchise_id', franchiseId);
      }

      const { data: packageSalesData, error: packageSalesError } = await packagesQuery;

      if (packageSalesError) throw packageSalesError;

      console.log('📦 [PACKAGE SALES] Dados retornados da query:', packageSalesData);
      if (packageSalesData && packageSalesData.length > 0) {
        console.log('🔍 [PACKAGE SALES] Estrutura do primeiro item:', packageSalesData[0]);
        console.log('🔍 [PACKAGE SALES] Packages do primeiro item:', packageSalesData[0].packages);
      }

      // Load package commission configurations
      console.log('🔍 [PACKAGE COMMISSIONS] Buscando configurações de comissão para pacotes...');
      console.log('🏢 [PACKAGE COMMISSIONS] Franchise ID:', franchiseId);

      let packageCommissionQuery = supabase
        .from('professional_commissions')
        .select('package_id, professional_id, calculation_type, commission_value, active, franchise_id')
        .eq('commission_type', 'package')
        .eq('active', true);

      // Note: Only filter by franchise if the table has franchise_id column
      // For now, we'll load all active package commissions and filter in memory if needed
      const { data: packageCommissionConfigs, error: packageCommissionError } = await packageCommissionQuery;

      if (packageCommissionError) {
        console.warn('⚠️ [PACKAGE COMMISSIONS] Erro ao buscar configurações:', packageCommissionError);
      }

      console.log('📊 [PACKAGE COMMISSIONS] Configurações brutas retornadas:', packageCommissionConfigs);

      // Create map for fast lookup: professional_id-package_id -> config
      const packageCommissionMap = new Map<string, any>();
      packageCommissionConfigs?.forEach(config => {
        const key = `${config.professional_id}-${config.package_id}`;
        packageCommissionMap.set(key, config);
        console.log('📋 [PACKAGE COMMISSIONS] Configuração carregada:', {
          key,
          type: config.calculation_type,
          value: config.commission_value
        });
      });

      console.log('✅ [PACKAGE COMMISSIONS] Carregadas', packageCommissionMap.size, 'configurações de pacote');

      // Process package sales
      for (const packageSale of packageSalesData || []) {
        const customerProfessionalId = (packageSale.customers as any)?.professional_id;

        if (!customerProfessionalId) continue;

        if (selectedProfessional !== 'all' && customerProfessionalId !== selectedProfessional) {
          continue;
        }

        const { data: professionalData } = await supabase
          .from('professionals')
          .select('id, name, specialty')
          .eq('id', customerProfessionalId)
          .single();

        if (!professionalData) continue;

        // 🔍 BUSCAR CONFIGURAÇÃO DE COMISSÃO USANDO O MAPA
        const packageId = (packageSale.packages as any)?.id;
        const commissionKey = `${customerProfessionalId}-${packageId}`;
        const packageCommissionConfig = packageCommissionMap.get(commissionKey);

        console.log('📦 [PACKAGE COMMISSION] Processando pacote:', {
          packageName: (packageSale.packages as any)?.name,
          packageId: packageId,
          professionalId: customerProfessionalId,
          professionalName: professionalData.name,
          commissionKey: commissionKey,
          configFound: !!packageCommissionConfig
        });

        let packageCommissionAmount = 0;
        let commissionValue = 0;
        let commissionType: 'fixed' | 'percentage' = 'percentage';

        if (packageCommissionConfig) {
          // ✅ CONFIGURAÇÃO ENCONTRADA - Usar valores reais da tabela professional_commissions
          console.log('✅ [PACKAGE COMMISSION] Configuração encontrada:', {
            type: packageCommissionConfig.calculation_type,
            value: packageCommissionConfig.commission_value
          });

          if (packageCommissionConfig.calculation_type === 'fixed') {
            packageCommissionAmount = packageCommissionConfig.commission_value;
            commissionValue = packageCommissionConfig.commission_value;
            commissionType = 'fixed';
          } else {
            // Percentual baseado no valor do pacote
            const packagePrice = (packageSale.packages as any)?.price || 0;
            packageCommissionAmount = packagePrice * (packageCommissionConfig.commission_value / 100);
            commissionValue = packageCommissionConfig.commission_value;
            commissionType = 'percentage';
          }

          console.log('💰 [PACKAGE COMMISSION] Comissão calculada:', {
            packagePrice: (packageSale.packages as any)?.price,
            commissionAmount: packageCommissionAmount,
            commissionType: commissionType,
            commissionValue: commissionValue
          });
        } else {
          // ❌ Nenhuma configuração encontrada - manter 0%
          console.log('🚫 [PACKAGE COMMISSION] Nenhuma configuração encontrada - comissão = 0%');
          packageCommissionAmount = 0;
          commissionValue = 0;
          commissionType = 'percentage';
        }

        allCommissions.push({
          id: `package-${packageSale.id}`,
          professional_id: customerProfessionalId,
          service_name: `PACOTE: ${(packageSale.packages as any)?.name}`,
          service_price: (packageSale.packages as any)?.price,
          commission_amount: packageCommissionAmount,
          commission_type: packageCommissionConfig?.calculation_type || 'percentage',
          commission_value: packageCommissionConfig?.commission_value || 10,
          status: 'paid',
          created_at: packageSale.purchase_date,
          customer_name: (packageSale.customers as any)?.name,
          customer_phone: (packageSale.customers as any)?.phone,
          isPackageSale: true,
          professional: professionalData
        });
      }

      // Sort by date
      allCommissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCombinedCommissions(allCommissions);
    } catch (error) {
      console.error('Error loading combined data:', error);
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

  const serviceCommissions = combinedCommissions.filter(c => !c.isPackageSale);
  const packageCommissions = combinedCommissions.filter(c => c.isPackageSale);

  const totalServiceValue = serviceCommissions.reduce((sum, c) => sum + c.service_price, 0);
  const totalPackageValue = packageCommissions.reduce((sum, c) => sum + c.service_price, 0);
  const totalServiceCommission = serviceCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalPackageCommission = packageCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  const totalValue = totalServiceValue + totalPackageValue;
  const totalCommission = totalServiceCommission + totalPackageCommission;
  const totalNetProfit = totalValue - totalCommission;

  const uniqueProfessionals = new Set(combinedCommissions.map(c => c.professional_id)).size;

  const generateCombinedCSV = () => {
    if (combinedCommissions.length === 0) return;

    const headers = [
      'Tipo',
      'Data',
      'Profissional',
      'Item/Serviço',
      'Valor Bruto',
      'Comissão',
      'Valor Comissão',
      'Lucro Líquido'
    ];

    const csvData = combinedCommissions.map(commission => [
      commission.isPackageSale ? 'Pacote' : 'Serviço',
      formatDate(commission.created_at),
      commission.professional?.name || 'N/A',
      commission.isPackageSale ? commission.service_name.replace('PACOTE: ', '') : commission.service_name,
      formatCurrency(commission.service_price).replace('R$', '').trim(),
      commission.commission_type === 'fixed'
        ? `R$ ${commission.commission_value.toFixed(2)}`
        : `${commission.commission_value}%`,
      formatCurrency(commission.commission_amount).replace('R$', '').trim(),
      formatCurrency(commission.service_price - commission.commission_amount).replace('R$', '').trim()
    ]);

    csvData.push([
      'TOTAL',
      '',
      '',
      '',
      formatCurrency(totalValue).replace('R$', '').trim(),
      '',
      formatCurrency(totalCommission).replace('R$', '').trim(),
      formatCurrency(totalNetProfit).replace('R$', '').trim()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-consolidado-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MonthPicker Component
  function MonthPicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
    const selectedDate = new Date(value);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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
          <label className="block text-xs font-medium text-gray-400 mb-1">Ano</label>
          <select
            value={selectedDate.getFullYear()}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Mês</label>
          <select
            value={selectedDate.getMonth()}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-200 hover:border-gray-500"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
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

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
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
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
        </div>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-gray-500 rounded-xl shadow-2xl z-[9999] max-w-[320px] transform scale-95 origin-bottom-left overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-gray-600">
              <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-700 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <h3 className="text-sm font-semibold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex items-center space-x-1">
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-700 rounded transition-colors" title="Fechar">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-700 rounded transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 p-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">{day}</div>
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
                      ${selected ? 'bg-[#c4d82e] text-black' : today ? 'bg-blue-600 text-white' : currentMonthDay ? 'text-white hover:bg-gray-700' : 'text-gray-500'}
                      ${!selected && !today && currentMonthDay ? 'hover:bg-gray-700' : ''}
                    `}
                  >
                    {date.getDate()}
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div id="combined-reports" className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-white/10 p-3 rounded-2xl">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Relatório Consolidado</h1>
          <p className="text-gray-400 mt-2 text-lg">Serviços e pacotes combinados em um único relatório</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
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
              <MonthPicker value={selectedDate} onChange={setSelectedDate} />
            ) : (
              <DatePicker value={selectedDate} onChange={setSelectedDate} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional</label>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <DollarSign className="w-6 h-6 text-green-400 group-hover:animate-bounce" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors duration-300">Total Bruto</p>
              <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300">
                {serviceCommissions.length} serviços + {packageCommissions.length} pacotes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <DollarSign className="w-6 h-6 text-blue-400 group-hover:animate-bounce" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors duration-300">Total Comissões</p>
              <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300">
                {formatCurrency(totalServiceCommission)} serviços + {formatCurrency(totalPackageCommission)} pacotes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <Users className="w-6 h-6 text-purple-400 group-hover:animate-bounce" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors duration-300">Profissionais Ativos</p>
              <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">{uniqueProfessionals}</p>
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300">
                Receberam comissões no período
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <DollarSign className="w-6 h-6 text-emerald-400 group-hover:animate-bounce" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors duration-300">Lucro Líquido</p>
              <p className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">{formatCurrency(totalNetProfit)}</p>
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300">
                Receita após deduzir comissões
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Table */}
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
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Item/Serviço
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Valor Bruto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Valor Comissão
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Lucro Líquido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {combinedCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="w-8 h-8 text-gray-500" />
                      <p className="text-sm">Nenhum dado encontrado para o período selecionado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                combinedCommissions.map((commission, index) => (
                  <tr key={commission.id} className="hover:bg-white/5 transition-colors duration-200 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                        {commission.isPackageSale ? (
                          <>
                            <Package className="w-3 h-3 mr-1" />
                            Pacote
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 mr-1" />
                            Serviço
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {formatDate(commission.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          commission.isPackageSale ? 'bg-purple-500/20' : 'bg-[#c4d82e]/20'
                        }`}>
                          {commission.isPackageSale ? (
                            <Package className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Users className="w-4 h-4 text-[#c4d82e]" />
                          )}
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
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {commission.isPackageSale
                          ? commission.service_name.replace('PACOTE: ', '')
                          : commission.service_name
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-green-400">
                        {formatCurrency(commission.service_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {commission.commission_type === 'fixed'
                          ? `R$ ${commission.commission_value.toFixed(2)}`
                          : `${commission.commission_value}%`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(commission.commission_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-emerald-400">
                        {formatCurrency(commission.service_price - commission.commission_amount)}
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
          onClick={generateCombinedCSV}
          className="flex items-center gap-3 px-6 py-3 bg-[#c4d82e] text-black font-semibold rounded-xl hover:bg-[#c4d82e]/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#c4d82e]/30"
        >
          <Printer className="w-5 h-5" />
          Baixar Relatório Consolidado (CSV)
        </button>
      </div>
    </div>
  );
}