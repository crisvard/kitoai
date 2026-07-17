-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: professional_working_hours
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_working_hours'
  ) THEN '✅ professional_working_hours EXISTS' ELSE '❌ professional_working_hours MISSING - WILL CREATE' END as table_status;

-- Criar tabela professional_working_hours se não existir
CREATE TABLE IF NOT EXISTS public.professional_working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, day_of_week)
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professional_working_hours' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professional_working_hours' AND column_name = 'professional_id') THEN '✅ professional_id' ELSE '❌ professional_id MISSING' END as professional_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professional_working_hours' AND column_name = 'day_of_week') THEN '✅ day_of_week' ELSE '❌ day_of_week MISSING' END as day_of_week_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_professional_id ON public.professional_working_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_day ON public.professional_working_hours(day_of_week);

-- Habilitar RLS
ALTER TABLE public.professional_working_hours ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view working hours for professionals they can access" ON public.professional_working_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_working_hours.professional_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage working hours for own professionals" ON public.professional_working_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_working_hours.professional_id
      AND p.user_id = auth.uid()
    )
  );

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_professional_working_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_professional_working_hours_updated_at
  BEFORE UPDATE ON public.professional_working_hours
  FOR EACH ROW EXECUTE FUNCTION public.handle_professional_working_hours_updated_at();

SELECT '✅ professional_working_hours table verification and setup completed!' as status;