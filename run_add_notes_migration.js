import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Executando migração: Adicionar coluna notes à tabela user_websites');

    const sql = `
      ALTER TABLE public.user_websites
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return;
    }

    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Resultado:', data);

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

runMigration();