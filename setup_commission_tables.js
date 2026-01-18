import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function setupCommissionTables() {
  try {
    console.log('🚀 Configurando tabelas de comissão...\n');

    // SQL para criar a tabela commission_configs
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS commission_configs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
          service_id UUID REFERENCES services(id) ON DELETE CASCADE,
          commission_type VARCHAR(50) NOT NULL DEFAULT 'service',
          calculation_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
          commission_value DECIMAL(10,2) NOT NULL,
          active BOOLEAN DEFAULT true,
          franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // SQL para criar índices
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_commission_configs_professional ON commission_configs(professional_id);
      CREATE INDEX IF NOT EXISTS idx_commission_configs_service ON commission_configs(service_id);
      CREATE INDEX IF NOT EXISTS idx_commission_configs_franchise ON commission_configs(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_commission_configs_active ON commission_configs(active);
    `;

    // SQL para RLS
    const rlsSQL = `
      ALTER TABLE commission_configs ENABLE ROW LEVEL SECURITY;
    `;

    // Políticas RLS
    const policiesSQL = `
      DROP POLICY IF EXISTS "Admin full access to commission_configs" ON commission_configs;
      DROP POLICY IF EXISTS "Professional manage own commission_configs" ON commission_configs;

      CREATE POLICY "Admin full access to commission_configs" ON commission_configs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM professionals
          WHERE professionals.user_id = auth.uid()
          AND professionals.role = 'admin'
          AND professionals.active = true
        )
      );

      CREATE POLICY "Professional manage own commission_configs" ON commission_configs
      FOR ALL USING (
        professional_id IN (
          SELECT id FROM professionals
          WHERE professionals.user_id = auth.uid()
          AND professionals.active = true
        )
      );
    `;

    // Executar SQLs
    const sqls = [createTableSQL, createIndexesSQL, rlsSQL, policiesSQL];

    for (let i = 0; i < sqls.length; i++) {
      console.log(`Executando SQL ${i + 1}/${sqls.length}...`);
      try {
        const { error } = await supabase.rpc('exec_sql', { query: sqls[i] });
        if (error) {
          console.error(`Erro no SQL ${i + 1}:`, error);
        } else {
          console.log(`✅ SQL ${i + 1} executado com sucesso`);
        }
      } catch (e) {
        console.error(`Erro ao executar SQL ${i + 1}:`, e.message);
      }
    }

    // Inserir configuração de teste
    console.log('\n⚙️ Inserindo configuração de comissão de teste...');
    const professionalId = '4533a1d1-ac01-48a6-889f-9a81c9b4ce3d';
    const franchiseId = 'f5134ea8-ac99-4b36-bda3-a9398668021a';

    const { data: insertData, error: insertError } = await supabase
      .from('commission_configs')
      .insert({
        professional_id: professionalId,
        commission_type: 'fixed',
        calculation_type: 'fixed',
        commission_value: 50.00,
        franchise_id: franchiseId,
        active: true
      })
      .select();

    if (insertError) {
      console.error('Erro ao inserir configuração:', insertError);
    } else {
      console.log('✅ Configuração inserida:', insertData);
    }

    // Verificar resultado
    const { data: configs, error: checkError } = await supabase
      .from('commission_configs')
      .select('*');

    console.log(`\n📊 Configurações encontradas: ${configs?.length || 0}`);
    if (configs?.length > 0) {
      configs.forEach(config => {
        console.log(`  - Profissional: ${config.professional_id}, Tipo: ${config.commission_type}, Valor: R$ ${config.commission_value}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

setupCommissionTables();