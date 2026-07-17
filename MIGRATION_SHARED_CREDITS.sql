-- ============================================
-- SHARED CREDITS AND CREDIT PACKAGES MIGRATION
-- ============================================

-- PROFILES: Add parent_profile_id for shared credits
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS parent_profile_id UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_parent_profile_id ON public.profiles(parent_profile_id);

-- CREDIT PACKAGES: Table for predefined credit options
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Credit Packages
INSERT INTO public.credit_packages (name, credits_amount, price)
VALUES 
  ('Bronze: 200 Créditos', 200, 100.00),
  ('Silver: 500 Créditos', 500, 250.00),
  ('Gold: 1000 Créditos', 1000, 500.00),
  ('Platinum: 2000 Créditos', 2000, 1000.00)
ON CONFLICT DO NOTHING;

-- ROW LEVEL SECURITY for credit_packages
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit packages" 
  ON public.credit_packages FOR SELECT 
  USING (active = true);

-- CREDIT PURCHASES: Track transactions
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id) ON DELETE SET NULL,
  asaas_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_asaas_id ON public.credit_purchases(asaas_payment_id);

-- ROW LEVEL SECURITY for credit_purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases" 
  ON public.credit_purchases FOR SELECT 
  TO authenticated USING (auth.uid() = user_id);

-- Function to handle sharing credits (lookup parent's credits)
CREATE OR REPLACE FUNCTION public.get_effective_credits(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_parent_id UUID;
  v_credits NUMERIC;
BEGIN
  -- Get parent_profile_id
  SELECT parent_profile_id INTO v_parent_id 
  FROM public.profiles 
  WHERE id = p_user_id;

  -- If has parent, get parent's credits, otherwise get own
  IF v_parent_id IS NOT NULL THEN
    SELECT credits INTO v_credits FROM public.profiles WHERE id = v_parent_id;
  ELSE
    SELECT credits INTO v_credits FROM public.profiles WHERE id = p_user_id;
  END IF;

  RETURN COALESCE(v_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
