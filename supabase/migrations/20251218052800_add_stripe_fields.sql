-- Adicionar campos Stripe na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Adicionar campos Stripe na tabela payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'asaas',
ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes para ter payment_method correto
UPDATE payments SET payment_method = 'asaas' WHERE payment_method IS NULL;