import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'franchise' | 'professional' | null;

interface PermissionsContextType {
  userRole: UserRole;
  franchiseId: string | null;
  professionalId: string | null;
  isLoading: boolean;
  hasPermission: (action: string, resource: string) => boolean;
  getAccessibleFranchiseIds: () => string[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [franchiseId, setFranchiseId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determinePermissions = async () => {
      if (authLoading) return;

      console.log('🔐 PermissionsContext: Determinando permissões...');
      console.log('📍 Current path:', location.pathname);
      console.log('👤 User authenticated:', !!user);

      if (!user) {
        // Usuário não autenticado
        setUserRole(null);
        setFranchiseId(null);
        setProfessionalId(null);
        setIsLoading(false);
        return;
      }

      try {
        // Verificar se o usuário é um profissional associado a uma franquia
        // Buscar TODOS os profissionais do usuário e priorizar o que tem franchise_id
        const { data: professionals, error } = await supabase
          .from('professionals')
          .select('id, franchise_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Erro ao buscar profissionais:', error);
        }

        // Encontrar o profissional com franchise_id (priorizar esse)
        const professionalWithFranchise = professionals?.find(p => p.franchise_id);
        const anyProfessional = professionals?.[0]; // Primeiro profissional encontrado

        // Determinar tipo de usuário baseado na rota e dados do profissional
        if (location.pathname.startsWith('/franchise/')) {
          // Rota de franquia - verificar se é profissional dessa franquia ou admin
          const match = location.pathname.match(/\/franchise\/([^\/]+)/);
          if (match) {
            const routeFranchiseId = match[1];

            // Verificar se o usuário é profissional desta franquia específica
            const professionalForThisFranchise = professionals?.find(p =>
              p.franchise_id === routeFranchiseId
            );

            if (professionalForThisFranchise) {
              // É profissional desta franquia
              setUserRole('franchise');
              setFranchiseId(routeFranchiseId);
              setProfessionalId(professionalForThisFranchise.id);
              console.log('🏢 [PermissionsContext] Profissional acessando própria franquia:', {
                userRole: 'franchise',
                franchiseId: routeFranchiseId,
                professionalId: professionalForThisFranchise.id
              });
            } else {
              // Não é profissional desta franquia - trata como admin visualizando
              setUserRole('admin');
              setFranchiseId(routeFranchiseId);
              setProfessionalId(null);
              console.log('👑 [PermissionsContext] Admin visualizando franquia:', routeFranchiseId);
            }
          }
        } else {
          // Para rotas que não são específicas de franquia, sempre trata como admin
          // independente de ter profissionais associados a franquias
          setUserRole('admin');
          setFranchiseId(null);
          setProfessionalId(anyProfessional?.id || null);
          console.log('👑 [PermissionsContext] Usuário admin global identificado (rota não específica de franquia)', {
            anyProfessional: anyProfessional?.id,
            professionalsCount: professionals?.length,
            hasProfessionalWithFranchise: !!professionalWithFranchise
          });
        }
      } catch (error) {
        console.error('Erro ao determinar permissões:', error);
        // Fallback para admin
        setUserRole('admin');
        setFranchiseId(null);
        setProfessionalId(null);
      }

      setIsLoading(false);
    };

    determinePermissions();
  }, [user, authLoading, location.pathname]);

  const hasPermission = (action: string, resource: string): boolean => {
    if (!userRole) return false;

    // Regras de permissão baseadas no tipo de usuário
    switch (userRole) {
      case 'admin':
        // Admin tem todas as permissões
        return true;

      case 'franchise':
        // Franquia só pode acessar seus próprios dados
        return ['read', 'write', 'create', 'update', 'delete'].includes(action) &&
               ['appointments', 'customers', 'professionals', 'services', 'packages'].includes(resource);

      case 'professional':
        // Profissional só pode acessar seus agendamentos
        return ['read', 'update'].includes(action) &&
               ['appointments'].includes(resource);

      default:
        return false;
    }
  };

  const getAccessibleFranchiseIds = (): string[] => {
    switch (userRole) {
      case 'admin':
        // Admin pode acessar todas as franquias (implementar busca real depois)
        return [];

      case 'franchise':
        // Franquia só acessa ela mesma
        return franchiseId ? [franchiseId] : [];

      case 'professional':
        // Profissional acessa a franquia onde trabalha (implementar depois)
        return [];

      default:
        return [];
    }
  };

  const value: PermissionsContextType = {
    userRole,
    franchiseId,
    professionalId,
    isLoading,
    hasPermission,
    getAccessibleFranchiseIds,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}