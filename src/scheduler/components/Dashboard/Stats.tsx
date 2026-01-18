import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Briefcase, Filter, BarChart3 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';

interface StatsData {
  totalAppointments: number;
  totalRevenue: number;
  projectedRevenue: number;
  professionalCount: number;
  serviceCount: number;
}

type PeriodFilter = 'day' | 'week' | 'month' | 'year';

export default function Stats({ onReportsClick, onProfessionalsClick, onServicesClick, onAppointmentsClick, franchiseId }: { onReportsClick?: () => void; onProfessionalsClick?: () => void; onServicesClick?: () => void; onAppointmentsClick?: () => void; franchiseId?: string }) {
  const { user } = useSchedulerAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [stats, setStats] = useState<StatsData>({
    totalAppointments: 0,
    totalRevenue: 0,
    projectedRevenue: 0,
    professionalCount: 0,
    serviceCount: 0
  });

  useEffect(() => {
    loadStats();
  }, [user, periodFilter, franchiseId]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (periodFilter) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(startOfWeek);
        endDate.setDate(startOfWeek.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { startDate, endDate };
  };

  const loadStats = async () => {
    if (!user) return;

    const { startDate, endDate } = getDateRange();

    console.log('📊 [Stats] Carregando estatísticas:', { franchiseId, periodFilter });

    // Construir queries com filtro de franchiseId quando disponível
    let appointmentsQuery = supabase
      .from('appointments')
      .select('total_price, status, appointment_date')
      .eq('user_id', user.id)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString());

    let packagesQuery = supabase
      .from('customer_packages')
      .select('package:packages(price), purchase_date')
      .eq('paid', true)
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString());

    let professionalsQuery = supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    let servicesQuery = supabase
      .from('services')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true);

    // Aplicar filtro de franquia se disponível
    if (franchiseId) {
      console.log('🔒 [Stats] Aplicando filtros de franquia:', franchiseId);
      appointmentsQuery = appointmentsQuery.eq('franchise_id', franchiseId);
      packagesQuery = packagesQuery.eq('franchise_id', franchiseId);
      professionalsQuery = professionalsQuery.eq('franchise_id', franchiseId);
      servicesQuery = servicesQuery.eq('franchise_id', franchiseId);
    }

    const [appointmentsRes, packagesRes, professionalsRes, servicesRes] = await Promise.all([
      appointmentsQuery,
      packagesQuery,
      professionalsQuery,
      servicesQuery
    ]);

    // Calculate completed revenue (only completed appointments)
    const completedAppointments = appointmentsRes.data?.filter(apt => apt.status === 'completed') || [];
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + Number(apt.total_price), 0) || 0;

    // Calculate projected revenue (all appointments: pending, confirmed, completed)
    const allAppointments = appointmentsRes.data?.filter(apt =>
      ['pending', 'confirmed', 'completed'].includes(apt.status)
    ) || [];
    const projectedRevenue = allAppointments.reduce((sum, apt) => sum + Number(apt.total_price), 0) || 0;

    const totalAppointments = appointmentsRes.data?.length || 0;
    const packagesRevenue = packagesRes.data?.reduce((sum, pkg) => sum + Number((pkg.package as any)?.price || 0), 0) || 0;
    const professionalCount = professionalsRes.data?.length || 0;
    const serviceCount = servicesRes.data?.length || 0;

    console.log('📊 [Stats] Resultados carregados:', {
      totalAppointments,
      totalRevenue: totalRevenue + packagesRevenue,
      projectedRevenue: projectedRevenue + packagesRevenue,
      professionalCount,
      serviceCount,
      appointmentsCount: appointmentsRes.data?.length || 0,
      packagesCount: packagesRes.data?.length || 0,
      packagesRevenue: packagesRevenue,
      professionalsCount: professionalsRes.data?.length || 0,
      servicesCount: servicesRes.data?.length || 0,
      franchiseId
    });

    setStats({
      totalAppointments,
      totalRevenue: totalRevenue + packagesRevenue,
      projectedRevenue: projectedRevenue + packagesRevenue,
      professionalCount,
      serviceCount
    });
  };

  const statCards = [
    {
      title: 'Total de Agendamentos',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      clickable: true
    },
    {
      title: 'Receita Realizada',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-500/20',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Receita Projetada',
      value: `R$ ${stats.projectedRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Profissionais Ativos',
      value: stats.professionalCount,
      icon: Users,
      color: 'orange',
      bgColor: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      clickable: true
    },
    {
      title: 'Serviços Disponíveis',
      value: stats.serviceCount,
      icon: Briefcase,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      clickable: true
    },
    {
      title: 'Relatórios',
      value: 'Ver Análise',
      icon: BarChart3,
      color: 'indigo',
      bgColor: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      clickable: true
    }
  ];

  const periodOptions = [
    { value: 'day' as PeriodFilter, label: 'Hoje' },
    { value: 'week' as PeriodFilter, label: 'Esta Semana' },
    { value: 'month' as PeriodFilter, label: 'Este Mês' },
    { value: 'year' as PeriodFilter, label: 'Este Ano' }
  ];

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Estatísticas</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white text-sm focus:border-[#c4d82e] focus:outline-none"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-[#2a2a2a] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border ${stat.borderColor} rounded-2xl p-6 hover:bg-white/10 transition cursor-pointer`}
            onClick={stat.clickable ? (
              stat.title === 'Relatórios' ? onReportsClick :
              stat.title === 'Profissionais Ativos' ? onProfessionalsClick :
              stat.title === 'Serviços Disponíveis' ? onServicesClick :
              stat.title === 'Total de Agendamentos' ? onAppointmentsClick :
              undefined
            ) : undefined}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl border ${stat.borderColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
