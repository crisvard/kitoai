-- ============================================================
-- FIX: user_phone_numbers — criação + RLS policies corretas
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vapi_phone_number_id TEXT NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  provider VARCHAR(50) DEFAULT 'twilio', -- twilio, vonage, vapi, telnyx
  nickname VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON public.user_phone_numbers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_phone_numbers_vapi_user
  ON public.user_phone_numbers(user_id, vapi_phone_number_id);

-- 3. Habilitar RLS
ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- 4. RLS: SELECT (usuários veem apenas os próprios)
DROP POLICY IF EXISTS "Users can view own phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Users can view own phone numbers"
  ON public.user_phone_numbers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- 5. RLS: INSERT (usuários inserem apenas com seu próprio user_id)
DROP POLICY IF EXISTS "Users can insert own phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Users can insert own phone numbers"
  ON public.user_phone_numbers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. RLS: UPDATE
DROP POLICY IF EXISTS "Users can update own phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Users can update own phone numbers"
  ON public.user_phone_numbers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. RLS: DELETE
DROP POLICY IF EXISTS "Users can delete own phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Users can delete own phone numbers"
  ON public.user_phone_numbers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 8. Trigger updated_at (precisa da função update_updated_at_column existir)
DROP TRIGGER IF EXISTS update_user_phone_numbers_updated_at ON public.user_phone_numbers;
CREATE TRIGGER update_user_phone_numbers_updated_at
  BEFORE UPDATE ON public.user_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'user_phone_numbers OK — tabela e policies aplicadas!' AS status;
