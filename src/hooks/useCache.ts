import { useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  userId?: string; // User-specific cache
}

export const useCache = () => {
  const CACHE_PREFIX = 'kito_expert_cache_';

  const getCacheKey = useCallback((key: string, userId?: string) => {
    return userId ? `${CACHE_PREFIX}${userId}_${key}` : `${CACHE_PREFIX}${key}`;
  }, []);

  const isExpired = useCallback((item: CacheItem<any>): boolean => {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }, []);

  const get = useCallback(<T>(key: string, options: CacheOptions = {}): T | null => {
    try {
      const cacheKey = getCacheKey(key, options.userId);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);

      if (isExpired(item)) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }, [getCacheKey, isExpired]);

  const set = useCallback(<T>(key: string, data: T, options: CacheOptions = {}): void => {
    try {
      const cacheKey = getCacheKey(key, options.userId);
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl
      };

      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }, [getCacheKey]);

  const remove = useCallback((key: string, userId?: string): void => {
    try {
      const cacheKey = getCacheKey(key, userId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }, [getCacheKey]);

  const clearUserCache = useCallback((userId: string): void => {
    try {
      const keys = Object.keys(localStorage);
      const userCacheKeys = keys.filter(key =>
        key.startsWith(`${CACHE_PREFIX}${userId}_`)
      );

      userCacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared ${userCacheKeys.length} cache items for user ${userId}`);
    } catch (error) {
      console.error('Cache clear user error:', error);
    }
  }, []);

  const clearAllCache = useCallback((): void => {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared ${cacheKeys.length} total cache items`);
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }, []);

  const getOrSet = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> => {
    // Try to get from cache first
    const cached = get<T>(key, options);
    if (cached !== null) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }

    // Fetch from source
    console.log(`Cache miss for key: ${key}, fetching from source`);
    const data = await fetcher();

    // Cache the result
    set(key, data, options);

    return data;
  }, [get, set]);

  return {
    get,
    set,
    remove,
    clearUserCache,
    clearAllCache,
    getOrSet
  };
};