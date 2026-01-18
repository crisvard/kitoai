import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

interface Professional {
  id: string;
  name: string;
  specialty: string;
  role: string;
  email: string;
  user_id: string | null;
  franchise_id: string | null;
}

interface ProfessionalAuthContextType {
  professional: Professional | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const ProfessionalAuthContext = createContext<ProfessionalAuthContextType | undefined>(undefined);

export function ProfessionalAuthProvider({ children }: { children: ReactNode }) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if professional is logged in on mount
    const storedProfessional = localStorage.getItem('professional_auth');
    if (storedProfessional) {
      try {
        setProfessional(JSON.parse(storedProfessional));
      } catch (error) {
        console.error('Error parsing stored professional data:', error);
        localStorage.removeItem('professional_auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Professional login attempt for:', email);
      setLoading(true);

      // Get professional data from database and verify password
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (profError || !profData) {
        console.error('Professional data not found or error:', profError);
        return false;
      }

      // Verify password (base64 encoded)
      const hashedPassword = btoa(password); // Same encoding used in ProfessionalsManager
      if (profData.password_hash !== hashedPassword) {
        console.error('Invalid password for professional');
        return false;
      }

      console.log('Professional data found and password verified:', profData.name);

      const professionalData: Professional = {
        id: profData.id,
        name: profData.name,
        specialty: profData.specialty || '',
        role: profData.role || 'professional',
        email: email,
        user_id: profData.user_id,
        franchise_id: profData.franchise_id
      };

      setProfessional(professionalData);
      localStorage.setItem('professional_auth', JSON.stringify(professionalData));
      console.log('Professional login successful');
      return true;

    } catch (error) {
      console.error('Professional login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setProfessional(null);
    localStorage.removeItem('professional_auth');
    // Clear any admin auth session when professional logs out
    supabase.auth.signOut();
  };

  return (
    <ProfessionalAuthContext.Provider value={{
      professional,
      login,
      logout,
      loading
    }}>
      {children}
    </ProfessionalAuthContext.Provider>
  );
}

export function useProfessionalAuth() {
  const context = useContext(ProfessionalAuthContext);
  if (context === undefined) {
    throw new Error('useProfessionalAuth must be used within a ProfessionalAuthProvider');
  }
  return context;
}