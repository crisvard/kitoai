import { createContext, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SchedulerAuthContextType {
  user: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SchedulerAuthContext = createContext<SchedulerAuthContextType | undefined>(undefined);

export function SchedulerAuthProvider({ children }: { children: React.ReactNode }) {
  // Use o AuthProvider principal em vez de duplicar a lógica
  const { user, loading } = useAuth();

  const signUp = async (email: string, password: string) => {
    // Esta função não deveria ser usada no contexto scheduler
    // Os admins fazem login pelo AuthProvider principal
    throw new Error('Use o AuthProvider principal para autenticação de admin');
  };

  const signIn = async (email: string, password: string) => {
    // Esta função não deveria ser usada no contexto scheduler
    throw new Error('Use o AuthProvider principal para autenticação de admin');
  };

  const signOut = async () => {
    // Esta função não deveria ser usada no contexto scheduler
    throw new Error('Use o AuthProvider principal para logout de admin');
  };

  return (
    <SchedulerAuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </SchedulerAuthContext.Provider>
  );
}

export function useSchedulerAuth() {
  const context = useContext(SchedulerAuthContext);
  if (context === undefined) {
    throw new Error('useSchedulerAuth must be used within a SchedulerAuthProvider');
  }
  return context;
}