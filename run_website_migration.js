import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runWebsiteMigration() {
  try {
    console.log('🚀 Iniciando migração do serviço de Websites...\n');

    // Executar criação da tabela
    console.log('📋 Executando: create_website_services_table.sql');
    const tableSql = fs.readFileSync('./create_website_services_table.sql', 'utf8');
    const tableSqlCommands = tableSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd && !cmd.startsWith('--'));

    for (let i = 0; i < tableSqlCommands.length; i++) {
      const command = tableSqlCommands[i];
      console.log(`  [${i + 1}/${tableSqlCommands.length}] Executando comando...`);
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.error(`    ❌ Erro: ${error.message}`);
        } else {
          console.log(`    ✅ Sucesso`);
        }
      } catch (err) {
        console.error(`    ❌ Erro: ${err}`);
      }
    }

    // Executar adição de campos ao profile
    console.log('\n📋 Executando: add_website_fields_to_profile.sql');
    const profileSql = fs.readFileSync('./add_website_fields_to_profile.sql', 'utf8');
    const profileSqlCommands = profileSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd && !cmd.startsWith('--'));

    for (let i = 0; i < profileSqlCommands.length; i++) {
      const command = profileSqlCommands[i];
      console.log(`  [${i + 1}/${profileSqlCommands.length}] Executando comando...`);
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.error(`    ❌ Erro: ${error.message}`);
        } else {
          console.log(`    ✅ Sucesso`);
        }
      } catch (err) {
        console.error(`    ❌ Erro: ${err}`);
      }
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n📌 Próximas ações:');
    console.log('   1. Reload do navegador (Ctrl+F5)');
    console.log('   2. Ir para Dashboard');
    console.log('   3. Procurar por "Serviços de Website"');
    console.log('   4. Clicar em "Contratar" ou "Gerenciar Sites"\n');

  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

runWebsiteMigration();
