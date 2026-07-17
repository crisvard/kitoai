import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente do projeto principal
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
