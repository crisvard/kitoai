-- Adicionar campos necessários para controle de pagamentos e validade
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Criar tabela para histórico de pagamentos (opcional mas recomendado)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL,
  asaas_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  plan_type TEXT, -- 'monthly' ou 'annual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para tabela payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Asaas webhook payments" ON payments
FOR INSERT USING (true);

CREATE POLICY "Asaas webhook update payments" ON payments
FOR UPDATE USING (true);