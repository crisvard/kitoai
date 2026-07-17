import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Exchange } from '../types';

interface UseExchangesReturn {
  exchanges: Exchange[];
  loading: boolean;
  error: string | null;
  addExchange: (name: string, apiKey: string, apiSecret: string) => Promise<void>;
  removeExchange: (id: string) => Promise<void>;
  updateExchange: (id: string, updates: Partial<Exchange>) => Promise<void>;
  testConnection: (name: string, apiKey: string, apiSecret: string) => Promise<boolean>;
  refreshExchanges: () => Promise<void>;
}

export function useExchanges(): UseExchangesReturn {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error: fetchError } = await supabase
        .from('exchanges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setExchanges(data || []);
    } catch (err) {
      console.error('Erro ao buscar exchanges:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar exchanges');
    } finally {
      setLoading(false);
    }
  };

  const addExchange = async (name: string, apiKey: string, apiSecret: string) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validar inputs
      if (!name || !apiKey || !apiSecret) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Verificar se já existe exchange com este nome para o usuário
      const { data: existing } = await supabase
        .from('exchanges')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name)
        .single();

      if (existing) {
        throw new Error(`Você já possui uma conexão com ${name}`);
      }

      // Inserir nova exchange
      const { data, error: insertError } = await supabase
        .from('exchanges')
        .insert([
          {
            user_id: user.id,
            name,
            api_key: apiKey,
            api_secret: apiSecret,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar lista local
      setExchanges((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Erro ao adicionar exchange:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar exchange');
      throw err;
    }
  };

  const removeExchange = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('exchanges')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Atualizar lista local
      setExchanges((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      console.error('Erro ao remover exchange:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover exchange');
      throw err;
    }
  };

  const updateExchange = async (id: string, updates: Partial<Exchange>) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('exchanges')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar lista local
      setExchanges((prev) =>
        prev.map((ex) => (ex.id === id ? data : ex))
      );
    } catch (err) {
      console.error('Erro ao atualizar exchange:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar exchange');
      throw err;
    }
  };

  const testConnection = async (
    name: string,
    apiKey: string,
    apiSecret: string
  ): Promise<boolean> => {
    try {
      // TODO: Implementar teste real de conexão com a API da exchange
      // Por enquanto, apenas valida se os campos estão preenchidos
      
      if (!apiKey || apiKey.length < 10) {
        throw new Error('API Key inválida');
      }

      if (!apiSecret || apiSecret.length < 10) {
        throw new Error('API Secret inválida');
      }

      // Simular delay de teste de conexão
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Retornar sucesso (implementar validação real posteriormente)
      return true;
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      throw err;
    }
  };

  const refreshExchanges = async () => {
    await fetchExchanges();
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  return {
    exchanges,
    loading,
    error,
    addExchange,
    removeExchange,
    updateExchange,
    testConnection,
    refreshExchanges,
  };
}
