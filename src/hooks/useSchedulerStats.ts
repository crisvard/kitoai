import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';

interface SchedulerStats {
  todayAppointments: number;
  totalAppointments: number;
  activeCustomers: number;
  totalProfessionals: number;
  loading: boolean;
}

export const useSchedulerStats = (franchiseId?: string): SchedulerStats => {
  const { user } = useAuth();
  const { franchiseId: contextFranchiseId } = usePermissions();
  
  // Priorizar franchiseId passado como prop (para FranchiseSchedulerPage)
  // Se não houver prop, usar do contexto de permissões
  const effectiveFranchiseId = franchiseId || contextFranchiseId;
  const [stats, setStats] = useState<SchedulerStats>({
    todayAppointments: 0,
    totalAppointments: 0,
    activeCustomers: 0,
    totalProfessionals: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) return;

    console.log('📊 [useSchedulerStats] useEffect triggered:', { userId: user.id, effectiveFranchiseId, franchiseId });

    const loadStats = async () => {
      try {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        console.log('📊 [useSchedulerStats] Carregando estatísticas - franchiseId:', effectiveFranchiseId);

        // Execute queries individually for better error handling
        console.log('🔍 [useSchedulerStats] Executando queries...');

        // Today's appointments
        let todayAppointmentsQuery = supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('appointment_date', startOfDay.toISOString())
          .lte('appointment_date', endOfDay.toISOString());

        if (effectiveFranchiseId) {
          todayAppointmentsQuery = todayAppointmentsQuery.eq('franchise_id', effectiveFranchiseId);
        }

        const todayAppointmentsResult = await todayAppointmentsQuery;

        // Total appointments
        let totalAppointmentsQuery = supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        if (effectiveFranchiseId) {
          totalAppointmentsQuery = totalAppointmentsQuery.eq('franchise_id', effectiveFranchiseId);
        }

        const totalAppointmentsResult = await totalAppointmentsQuery;

        // Active customers
        console.log('👥 [useSchedulerStats] Executando query de clientes:', {
          userId: user.id,
          effectiveFranchiseId,
          isAdminMode: !effectiveFranchiseId
        });

        let activeCustomersQuery = supabase
          .from('customers')
          .select('id', { count: 'exact' });

        // Se estamos no modo admin (sem franchise_id), não filtrar por user_id
        // para mostrar todos os clientes do sistema
        if (effectiveFranchiseId) {
          // Modo franquia: filtrar por franchise_id
          activeCustomersQuery = activeCustomersQuery.eq('franchise_id', effectiveFranchiseId);
          console.log('🏢 [useSchedulerStats] Modo franquia - filtrando por franchise_id:', effectiveFranchiseId);
        } else {
          // Modo admin: não filtrar por user_id, mostrar todos os clientes
          console.log('👑 [useSchedulerStats] Modo admin - mostrando todos os clientes');
        }

        const activeCustomersResult = await activeCustomersQuery;
        console.log('👥 [useSchedulerStats] Resultado da query de clientes:', {
          count: activeCustomersResult.count,
          error: activeCustomersResult.error,
          data: activeCustomersResult.data?.length
        });

        // Total professionals
        let totalProfessionalsQuery = supabase
          .from('professionals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('active', true);

        if (effectiveFranchiseId) {
          totalProfessionalsQuery = totalProfessionalsQuery.eq('franchise_id', effectiveFranchiseId);
        }

        const totalProfessionalsResult = await totalProfessionalsQuery;

        const activeCustomersCount = activeCustomersResult.count || 0;
        console.log('📊 [useSchedulerStats] Resultado final activeCustomers:', activeCustomersCount);

        setStats({
          todayAppointments: todayAppointmentsResult.count || 0,
          totalAppointments: totalAppointmentsResult.count || 0,
          activeCustomers: activeCustomersCount,
          totalProfessionals: totalProfessionalsResult.count || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error loading scheduler stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, [user, contextFranchiseId, franchiseId]);

  return stats;
};