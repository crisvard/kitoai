import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔥 [SUPABASE] Configuração carregada:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl,
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'N/A'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔥 [SUPABASE] Variáveis de ambiente ausentes:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas. Verifique seu .env e reinicie o dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔥 [SUPABASE] Cliente criado');