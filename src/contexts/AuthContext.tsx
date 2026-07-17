import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCache } from '../hooks/useCache';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearUserCache } = useCache();

  useEffect(() => {
    // Inject Mock User if using sample DB keys
    const isMockAuth = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project');

    if (isMockAuth) {
      console.warn("🔐 MOCK AUTH ACTIVE: Bypassing Supabase Login.");
      const mockUser = {
        id: 'mock-user-123',
        email: 'admin@kito.ai',
        role: 'authenticated',
        user_metadata: { name: 'Admin Kito' }
      } as unknown as User;

      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {

      // Check if there are tokens in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
          } else {
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error('Exception setting session:', err);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const isMockAuth = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project');

    if (isMockAuth) {
      console.warn("🔐 MOCK AUTH ACTIVE: Simulated Login Success.");
      const mockUser = {
        id: 'mock-user-123',
        email: email,
        role: 'authenticated',
        user_metadata: { name: 'Admin Kito' }
      } as unknown as User;
      setUser(mockUser);
      return { user: mockUser, session: {} };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Registro na tabela users será criado na primeira visita à "Minha conta"

    return data;
  };

  const signOut = async () => {
    console.log('🔐 Iniciando logout completo...');

    // Clear user-specific cache
    if (user?.id) {
      clearUserCache(user.id);
      console.log(`🗑️ Cache do usuário ${user.id} limpo`);
    }

    // Clear all localStorage (including any cached data)
    localStorage.clear();
    console.log('🗑️ localStorage limpo');

    // Clear session storage (for any session-specific data)
    sessionStorage.clear();
    console.log('🗑️ sessionStorage limpo');

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro no logout do Supabase:', error);
      throw error;
    }

    console.log('✅ Logout do Supabase realizado');

    // Redirect to login page (using current domain)
    const currentDomain = window.location.origin;
    const loginUrl = `${currentDomain}/login`;
    console.log(`🔄 Redirecionando para: ${loginUrl}`);
    window.location.href = loginUrl;
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};