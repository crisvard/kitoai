import { useState, useEffect } from 'react';
import { UserWebsite, websiteService } from '../lib/services/websiteService';
import { useCache } from './useCache';

export const useUserWebsites = (userId?: string) => {
  const [websites, setWebsites] = useState<UserWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getFromCache, setInCache } = useCache();

  const fetchWebsites = async (forceRefresh = false) => {
    if (!userId) {
      console.log('🌐 [useUserWebsites] Sem userId');
      return;
    }

    const cacheKey = `user_websites_${userId}`;

    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log('🌐 [useUserWebsites] Cache hit');
        setWebsites(cached);
        return;
      }
    }

    try {
      setLoading(true);
      console.log('🌐 [useUserWebsites] Buscando sites do usuário...');
      
      const data = await websiteService.getUserWebsites(userId);
      
      setWebsites(data);
      setInCache(cacheKey, data);
      setError(null);
      
      console.log('✅ [useUserWebsites] Sites carregados:', data.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('❌ [useUserWebsites] Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateWebsite = async (
    websiteName: string,
    paymentId: string,
    paymentMethod: string = 'stripe'
  ) => {
    if (!userId) throw new Error('Sem userId');

    console.log('🌐 [useUserWebsites] Ativando novo site:', websiteName);
    
    const newWebsite = await websiteService.activateWebsite(
      userId,
      websiteName,
      paymentId,
      paymentMethod
    );

    setWebsites([newWebsite, ...websites]);
    setInCache(`user_websites_${userId}`, [newWebsite, ...websites]);
    
    return newWebsite;
  };

  const updateWebsite = async (
    websiteId: string,
    updates: Partial<UserWebsite>
  ) => {
    console.log('🌐 [useUserWebsites] Atualizando site:', websiteId);
    
    const updated = await websiteService.updateWebsite(websiteId, updates);
    
    setWebsites(websites.map(w => w.id === websiteId ? updated : w));
    setInCache(`user_websites_${userId}`, websites.map(w => w.id === websiteId ? updated : w));
    
    return updated;
  };

  const deleteWebsite = async (websiteId: string) => {
    console.log('🌐 [useUserWebsites] Deletando site:', websiteId);
    
    await websiteService.deleteWebsite(websiteId);
    
    const filtered = websites.filter(w => w.id !== websiteId);
    setWebsites(filtered);
    setInCache(`user_websites_${userId}`, filtered);
  };

  useEffect(() => {
    fetchWebsites();
  }, [userId]);

  return {
    websites,
    loading,
    error,
    fetchWebsites,
    activateWebsite,
    updateWebsite,
    deleteWebsite
  };
};
