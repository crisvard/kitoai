-- =====================================================
-- SQL para adicionar campos de pagamento do Agente de Ligações
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar campos de pagamento específicos para Ligações
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ligacoes_monthly_plan_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ligacoes_annual_plan_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ligacoes_billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS ligacoes_plan_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ligacoes_payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ligacoes_next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ligacoes_last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ligacoes_stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ligacoes_stripe_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ligacoes_payment_overdue_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ligacoes_grace_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ligacoes_last_overdue_check TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN profiles.ligacoes_monthly_plan_active IS 'Indica se o plano mensal de Ligações está ativo';
COMMENT ON COLUMN profiles.ligacoes_annual_plan_active IS 'Indica se o plano anual de Ligações está ativo';
COMMENT ON COLUMN profiles.ligacoes_billing_cycle IS 'Ciclo de cobrança: monthly ou annual';
COMMENT ON COLUMN profiles.ligacoes_plan_expires_at IS 'Data de expiração do plano de Ligações';
COMMENT ON COLUMN profiles.ligacoes_payment_status IS 'Status do pagamento: pending, paid, cancelled, expired';
COMMENT ON COLUMN profiles.ligacoes_next_billing_date IS 'Próxima data de cobrança';
COMMENT ON COLUMN profiles.ligacoes_last_payment_date IS 'Data do último pagamento';
COMMENT ON COLUMN profiles.ligacoes_stripe_subscription_id IS 'ID da assinatura Stripe para Ligações';
COMMENT ON COLUMN profiles.ligacoes_stripe_payment_id IS 'ID do último pagamento Stripe para Ligações';
COMMENT ON COLUMN profiles.ligacoes_payment_overdue_days IS 'Dias de atraso no pagamento';
COMMENT ON COLUMN profiles.ligacoes_grace_period_end IS 'Fim do período de tolerância para pagamento';
COMMENT ON COLUMN profiles.ligacoes_last_overdue_check IS 'Última verificação de atraso';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'ligacoes_%'
ORDER BY column_name;
