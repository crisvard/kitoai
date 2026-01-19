import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StripeKeys {
  publishableKey: string;
  webhookSecret?: string;
}

let stripeKeysCache: StripeKeys | null = null;
let keysPromise: Promise<StripeKeys> | null = null;

export const useStripeKeys = () => {
  const [keys, setKeys] = useState<StripeKeys | null>(stripeKeysCache);
  const [loading, setLoading] = useState(!stripeKeysCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have cached keys, use them
    if (stripeKeysCache) {
      setKeys(stripeKeysCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (keysPromise) {
      keysPromise.then(setKeys).catch((err) => setError(err.message));
      return;
    }

    // Start a new request
    keysPromise = fetchStripeKeys();

    keysPromise
      .then((fetchedKeys) => {
        stripeKeysCache = fetchedKeys;
        setKeys(fetchedKeys);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { keys, loading, error };
};

async function fetchStripeKeys(): Promise<StripeKeys> {
  console.log('🔧 [STRIPE-KEYS] Fetching PRODUCTION Stripe keys from Supabase Edge Function...');

  const { data, error } = await supabase.functions.invoke('get-stripe-config');

  if (error) {
    console.error('🔧 [STRIPE-KEYS] Error fetching production keys:', error);
    throw new Error(error.message);
  }

  if (!data?.publishableKey) {
    console.error('🔧 [STRIPE-KEYS] No publishable key received from production secrets');
    throw new Error('Stripe publishable key not found in production secrets');
  }

  console.log('🔧 [STRIPE-KEYS] Production keys loaded successfully');
  console.log('🔧 [STRIPE-KEYS] Using PRODUCTION mode - no test keys');

  return data;
}