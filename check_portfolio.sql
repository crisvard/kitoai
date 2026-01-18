-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: portfolio
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'portfolio'
  ) THEN '✅ portfolio EXISTS' ELSE '❌ portfolio MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_id UUID REFERENCES exchanges(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  average_price DECIMAL(20,8),
  current_price DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio' AND column_name = 'symbol') THEN '✅ symbol' ELSE '❌ symbol MISSING' END as symbol_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio' AND column_name = 'amount') THEN '✅ amount' ELSE '❌ amount MISSING' END as amount_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio' AND column_name = 'average_price') THEN '✅ average_price' ELSE '❌ average_price MISSING' END as average_price_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);

-- Habilitar RLS
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "portfolio_policy" ON portfolio FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_portfolio_updated_at
  BEFORE UPDATE ON portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ portfolio table verification completed!' as status;