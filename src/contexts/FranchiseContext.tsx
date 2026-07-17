import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Franchise {
  id: string;
  name: string;
  phone_number: string;
  monthly_revenue: number;
  active_sessions: number;
  created_at: string;
}

interface FranchiseContextType {
  currentFranchise: Franchise | null;
  franchises: Franchise[];
  loading: boolean;
  loadFranchise: (id: string) => Promise<void>;
  loadAllFranchises: () => Promise<void>;
  setCurrentFranchise: (franchise: Franchise, navigate: (path: string) => void) => void;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

export function FranchiseProvider({ children }: { children: React.ReactNode }) {
  const [currentFranchise, setCurrentFranchise] = useState<Franchise | null>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar franquia da URL ou localStorage
  useEffect(() => {
    const franchiseId = localStorage.getItem('currentFranchiseId');
    if (franchiseId) {
      loadFranchise(franchiseId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadFranchise = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setCurrentFranchise(data);
        localStorage.setItem('currentFranchiseId', id);
        localStorage.setItem('currentFranchise', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading franchise:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFranchises = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data } = await supabase
        .from('franchises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setFranchises(data || []);
    } catch (error) {
      console.error('Error loading franchises:', error);
      setFranchises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFranchiseSelection = (franchise: Franchise, navigate: (path: string) => void) => {
    setCurrentFranchise(franchise);
    localStorage.setItem('currentFranchiseId', franchise.id);
    localStorage.setItem('currentFranchise', JSON.stringify(franchise));
    navigate(`/franchise/${franchise.id}/dashboard`);
  };

  return (
    <FranchiseContext.Provider value={{
      currentFranchise,
      franchises,
      loading,
      loadFranchise,
      loadAllFranchises,
      setCurrentFranchise: handleFranchiseSelection
    }}>
      {children}
    </FranchiseContext.Provider>
  );
}

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (context === undefined) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
}