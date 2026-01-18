// Script para executar o fix do sistema de comissões
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeCommissionFix() {
  console.log('🔧 Executando correção do sistema de comissões...');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./fix_commission_system.sql', 'utf8');
    
    console.log('📖 Arquivo SQL carregado, executando...');

    // Executar o SQL usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return;
    }

    console.log('✅ Correção aplicada com sucesso!');
    console.log('📊 Resultado:', data);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
executeCommissionFix();