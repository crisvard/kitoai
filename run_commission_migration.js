import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hedxxbsieoazrmbayzab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk'
);

async function runCommissionMigration() {
  console.log('🚀 Executando migração para criar configurações de comissão...\n');

  const franchiseId = 'f5134ea8-ac99-4b36-bda3-a9398668021a';

  try {
    // 1. Verificar se já existem configurações
    console.log('1️⃣ Verificando configurações existentes...');
    const { data: existingConfigs, error: checkError } = await supabase
      .from('commission_configs')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('⚠️ Tabela commission_configs não existe. Você precisa criá-la manualmente no Supabase Dashboard.');
      console.log('📋 SQL para criar a tabela:');
      console.log(`
CREATE TABLE commission_configs (
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

-- Índices
CREATE INDEX idx_commission_configs_professional ON commission_configs(professional_id);
CREATE INDEX idx_commission_configs_service ON commission_configs(service_id);
CREATE INDEX idx_commission_configs_franchise ON commission_configs(franchise_id);
CREATE INDEX idx_commission_configs_active ON commission_configs(active);

-- RLS
ALTER TABLE commission_configs ENABLE ROW LEVEL SECURITY;

-- Políticas
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
      `);
      return;
    }

    if (existingConfigs && existingConfigs.length > 0) {
      console.log('✅ Tabela commission_configs já existe e tem dados');
    } else {
      console.log('📋 Tabela commission_configs existe mas está vazia');
    }

    // 2. Obter profissionais e serviços da franquia
    console.log('2️⃣ Obtendo profissionais e serviços da franquia...');
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('id, name')
      .eq('franchise_id', franchiseId)
      .eq('active', true);

    if (profError) {
      console.error('❌ Erro ao obter profissionais:', profError);
      return;
    }

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .eq('franchise_id', franchiseId)
      .eq('active', true);

    if (servicesError) {
      console.error('❌ Erro ao obter serviços:', servicesError);
      return;
    }

    console.log(`✅ Encontrados ${professionals?.length || 0} profissionais e ${services?.length || 0} serviços`);

    // 3. Criar configurações de comissão
    console.log('3️⃣ Criando configurações de comissão...');
    const configsToInsert = [];

    if (professionals && services) {
      professionals.forEach(prof => {
        services.forEach(service => {
          configsToInsert.push({
            professional_id: prof.id,
            service_id: service.id,
            commission_type: 'service',
            calculation_type: 'percentage',
            commission_value: 20.00, // 20%
            active: true,
            franchise_id: franchiseId
          });
        });
      });
    }

    console.log(`📝 Preparando ${configsToInsert.length} configurações para inserir...`);

    // 4. Inserir configurações em lotes
    const batchSize = 10;
    let inserted = 0;

    for (let i = 0; i < configsToInsert.length; i += batchSize) {
      const batch = configsToInsert.slice(i, i + batchSize);
      console.log(`🔄 Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(configsToInsert.length / batchSize)}...`);

      const { error: insertError } = await supabase
        .from('commission_configs')
        .insert(batch);

      if (insertError) {
        console.error('❌ Erro ao inserir lote:', insertError);
        // Continue tentando os próximos lotes
      } else {
        inserted += batch.length;
        console.log(`✅ Lote inserido com sucesso (${batch.length} configurações)`);
      }
    }

    console.log(`🎉 Total de configurações inseridas: ${inserted}`);

    // 5. Verificar resultado final
    console.log('5️⃣ Verificando configurações criadas...');
    const { data: finalConfigs, error: finalError } = await supabase
      .from('commission_configs')
      .select(`
        id,
        professional:professionals(name),
        service:services(name),
        calculation_type,
        commission_value,
        active
      `)
      .eq('franchise_id', franchiseId)
      .limit(10);

    if (finalError) {
      console.error('❌ Erro ao verificar configurações finais:', finalError);
    } else {
      console.log('✅ Configurações na franquia:', finalConfigs?.length || 0);
      if (finalConfigs && finalConfigs.length > 0) {
        console.log('📋 Amostra das configurações:');
        finalConfigs.slice(0, 5).forEach(config => {
          console.log(`   - ${config.professional?.name} + ${config.service?.name}: ${config.calculation_type} ${config.commission_value}${config.calculation_type === 'percentage' ? '%' : ' R$'}`);
        });
        if (finalConfigs.length > 5) {
          console.log(`   ... e mais ${finalConfigs.length - 5} configurações`);
        }
      }
    }

    console.log('\n🎉 Processo concluído!');
    console.log('💡 Agora os agendamentos concluídos devem gerar registros de comissão automaticamente.');

  } catch (error) {
    console.error('💥 Erro geral na migração:', error);
  }
}

runCommissionMigration();