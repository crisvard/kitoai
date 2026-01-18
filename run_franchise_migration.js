import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Executando migração para adicionar suporte a franquias...');

  try {
    // SQL para adicionar colunas franchise_id
    const migrationSQL = `
      -- Adicionar coluna franchise_id nas tabelas principais do scheduler
      ALTER TABLE professionals ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
      ALTER TABLE customer_packages ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;

      -- Criar índices para melhor performance das consultas por franquia
      CREATE INDEX IF NOT EXISTS idx_professionals_franchise_id ON professionals(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_services_franchise_id ON services(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_customers_franchise_id ON customers(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_packages_franchise_id ON packages(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_customer_packages_franchise_id ON customer_packages(franchise_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_franchise_id ON appointments(franchise_id);
    `;

    // Executar a migração usando rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Erro na migração:', error);
      return;
    }

    console.log('Migração executada com sucesso!');

    // Agora configurar RLS
    console.log('Configurando Row Level Security...');

    const rlsSQL = `
      -- Habilitar RLS nas tabelas
      ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customer_package_services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE shared_appointment_data ENABLE ROW LEVEL SECURITY;

      -- Políticas para professionals
      DROP POLICY IF EXISTS "Users can view their own professionals" ON professionals;
      CREATE POLICY "Users can view professionals from their franchises" ON professionals
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para services
      DROP POLICY IF EXISTS "Users can view their own services" ON services;
      CREATE POLICY "Users can view services from their franchises" ON services
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para customers
      DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
      CREATE POLICY "Users can view customers from their franchises" ON customers
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para packages
      DROP POLICY IF EXISTS "Users can view their own packages" ON packages;
      CREATE POLICY "Users can view packages from their franchises" ON packages
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para customer_packages
      DROP POLICY IF EXISTS "Users can view their own customer packages" ON customer_packages;
      CREATE POLICY "Users can view customer packages from their franchises" ON customer_packages
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para appointments
      DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
      CREATE POLICY "Users can view appointments from their franchises" ON appointments
          FOR ALL USING (
              user_id = auth.uid() OR
              franchise_id IN (
                  SELECT id FROM franchises WHERE user_id = auth.uid()
              )
          );

      -- Políticas para appointment_services
      DROP POLICY IF EXISTS "Users can view their own appointment services" ON appointment_services;
      CREATE POLICY "Users can view appointment services from their franchises" ON appointment_services
          FOR ALL USING (
              appointment_id IN (
                  SELECT id FROM appointments WHERE
                      user_id = auth.uid() OR
                      franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
              )
          );

      -- Políticas para shared_appointment_data
      DROP POLICY IF EXISTS "Users can view their own shared appointment data" ON shared_appointment_data;
      CREATE POLICY "Users can view shared appointment data from their franchises" ON shared_appointment_data
          FOR ALL USING (
              appointment_id IN (
                  SELECT id FROM appointments WHERE
                      user_id = auth.uid() OR
                      franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
              )
          );

      -- Políticas para customer_package_services
      DROP POLICY IF EXISTS "Users can view their own customer package services" ON customer_package_services;
      CREATE POLICY "Users can view customer package services from their franchises" ON customer_package_services
          FOR ALL USING (
              customer_package_id IN (
                  SELECT id FROM customer_packages WHERE
                      user_id = auth.uid() OR
                      franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
              )
          );

      -- Políticas para package_services
      DROP POLICY IF EXISTS "Users can view their own package services" ON package_services;
      CREATE POLICY "Users can view package services from their franchises" ON package_services
          FOR ALL USING (
              package_id IN (
                  SELECT id FROM packages WHERE
                      user_id = auth.uid() OR
                      franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
              )
          );
    `;

    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('Erro ao configurar RLS:', rlsError);
      return;
    }

    console.log('Row Level Security configurado com sucesso!');
    console.log('Migração completa!');

  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

runMigration();