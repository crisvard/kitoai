import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar agent_type...');

    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./add_agent_type_column.sql', 'utf8');

    // Executar a migração usando exec_sql
    const { error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Erro na migração:', error);
      console.log('💡 Tentando método alternativo...');

      // Método alternativo: executar comandos SQL individuais
      const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim());

      for (const command of sqlCommands) {
        if (command.trim()) {
          console.log('🔧 Executando:', command.trim().substring(0, 50) + '...');
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', {
              sql: command.trim()
            });
            if (cmdError) {
              console.error('❌ Erro no comando:', cmdError);
            } else {
              console.log('✅ Comando executado com sucesso');
            }
          } catch (cmdErr) {
            console.error('❌ Erro ao executar comando:', cmdErr);
          }
        }
      }
    } else {
      console.log('✅ Migração executada com sucesso!');
    }

    // Verificar se a coluna foi criada
    console.log('🔍 Verificando se a coluna agent_type foi criada...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'agent_configs')
      .eq('column_name', 'agent_type');

    if (checkError) {
      console.error('❌ Erro ao verificar coluna:', checkError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Coluna agent_type criada com sucesso!');
    } else {
      console.log('⚠️ Coluna agent_type não encontrada');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

runMigration();