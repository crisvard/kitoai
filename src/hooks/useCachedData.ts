import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCache } from './useCache';

interface UseCachedDataOptions {
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean; // Whether to fetch data
}

export const useCachedData = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: UseCachedDataOptions = {}
) => {
  const { user } = useAuth();
  const { getOrSet } = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ttl = 10 * 60 * 1000, enabled = true } = options; // Default 10 minutes TTL

  // Use ref to store queryFn to prevent recreation on every render
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetchData = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getOrSet(
        key,
        queryFnRef.current,
        {
          userId: user.id,
          ttl
        }
      );

      setData(result);
    } catch (err) {
      console.error(`Error fetching cached data for ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user, enabled, key, getOrSet, ttl]);

  const refetch = useCallback(async () => {
    // Force refetch by clearing cache and fetching again
    if (user) {
      localStorage.removeItem(`kito_expert_cache_${user.id}_${key}`);
    }
    await fetchData();
  }, [user, key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Specialized hooks for common data types
export const useCachedProfessionals = (options?: UseCachedDataOptions) => {
  const queryFn = async () => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  };

  return useCachedData('professionals', queryFn, options);
};

export const useCachedServices = (options?: UseCachedDataOptions) => {
  const queryFn = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  };

  return useCachedData('services', queryFn, options);
};

export const useCachedCustomers = (options?: UseCachedDataOptions) => {
  const queryFn = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  };

  return useCachedData('customers', queryFn, options);
};

export const useCachedPackages = (options?: UseCachedDataOptions) => {
  const queryFn = async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  };

  return useCachedData('packages', queryFn, options);
};