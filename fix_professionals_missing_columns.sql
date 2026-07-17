-- ============================================================
-- SCRIPT COMPLETO - SISTEMA DE AGENDAMENTOS KitoAI
-- Funciona tanto para tabelas NOVAS quanto para as JÁ EXISTENTES
-- Execute TODO de uma vez no Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- FUNÇÃO update_updated_at (necessária para os triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- REMOVER FK CONSTRAINTS PROBLEMÁTICAS (user_id -> public.users)
-- Estas FKs causam erro 23503 pois referenciam a tabela pública
-- 'users', não auth.users. Vamos removê-las para usar user_id
-- apenas como referência informal (sem constraint).
-- ============================================================
DO $$ BEGIN
  ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_packages DROP CONSTRAINT IF EXISTS customer_packages_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.professional_working_hours DROP CONSTRAINT IF EXISTS professional_working_hours_user_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

-- Drop FKs antigas/anônimas de commission_records -> appointments
-- (evita o erro PGRST201 de relacionamento ambíguo)
DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_appointment_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_appointment_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_professional_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_professional_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_customer_package_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.commission_records DROP CONSTRAINT IF EXISTS commission_records_franchise_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 1. PROFESSIONALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.professionals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS specialty       TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS password_hash   TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS role            TEXT DEFAULT 'professional';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS active          BOOLEAN DEFAULT true;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS user_id         UUID;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS franchise_id    UUID;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();
UPDATE public.professionals SET active = true WHERE active IS NULL;

-- ============================================================
-- 2. SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS active        BOOLEAN DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS user_id       UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS franchise_id  UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();
UPDATE public.services SET active = true WHERE active IS NULL;

-- ============================================================
-- 3. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone           TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS professional_id UUID;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id         UUID;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS franchise_id    UUID;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- FK customer -> professional (só adiciona se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customers_professional_id_fkey'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_professional_id_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 4. APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name    TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_phone   TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'pending';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_price      NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS professional_id  UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id          UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS franchise_id     UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();
-- Colunas com NOT NULL sem default que bloqueiam inserts — remover a restrição:
DO $$ BEGIN ALTER TABLE public.appointments ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'appointment';
DO $$ BEGIN ALTER TABLE public.appointments ALTER COLUMN service_type SET DEFAULT 'appointment';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.appointments ALTER COLUMN service_type DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;
UPDATE public.appointments SET service_type = 'appointment' WHERE service_type IS NULL;

-- Mesma correção para outras tabelas com user_id NOT NULL:
DO $$ BEGIN ALTER TABLE public.professionals  ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.services       ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.customers      ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.packages       ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_professional_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_professional_id_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. APPOINTMENT_SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL,
  service_id     UUID NOT NULL,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  used_package_session BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointment_services ADD COLUMN IF NOT EXISTS used_package_session BOOLEAN DEFAULT false;
ALTER TABLE public.appointment_services ADD COLUMN IF NOT EXISTS customer_package_id  UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointment_services_appointment_id_fkey'
  ) THEN
    ALTER TABLE public.appointment_services
      ADD CONSTRAINT appointment_services_appointment_id_fkey
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointment_services_service_id_fkey'
  ) THEN
    ALTER TABLE public.appointment_services
      ADD CONSTRAINT appointment_services_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 6. PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS description        TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS expires_after_days  INTEGER;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS active             BOOLEAN DEFAULT true;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS user_id            UUID;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS franchise_id       UUID;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 7. PACKAGE_SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.package_services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id  UUID NOT NULL,
  service_id  UUID NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'package_services_package_id_fkey'
  ) THEN
    ALTER TABLE public.package_services
      ADD CONSTRAINT package_services_package_id_fkey
      FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'package_services_service_id_fkey'
  ) THEN
    ALTER TABLE public.package_services
      ADD CONSTRAINT package_services_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 8. CUSTOMER_PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_packages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL,
  package_id      UUID NOT NULL,
  paid            BOOLEAN DEFAULT false,
  purchase_date   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS user_id        UUID;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS franchise_id   UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_packages_customer_id_fkey'
  ) THEN
    ALTER TABLE public.customer_packages
      ADD CONSTRAINT customer_packages_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_packages_package_id_fkey'
  ) THEN
    ALTER TABLE public.customer_packages
      ADD CONSTRAINT customer_packages_package_id_fkey
      FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 9. CUSTOMER_PACKAGE_SERVICES (sessões restantes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_package_services (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_package_id UUID NOT NULL,
  service_id          UUID NOT NULL,
  sessions_remaining  INTEGER NOT NULL DEFAULT 0,
  franchise_id        UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_package_services_cp_fkey'
  ) THEN
    ALTER TABLE public.customer_package_services
      ADD CONSTRAINT customer_package_services_cp_fkey
      FOREIGN KEY (customer_package_id) REFERENCES public.customer_packages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_package_services_service_fkey'
  ) THEN
    ALTER TABLE public.customer_package_services
      ADD CONSTRAINT customer_package_services_service_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 10. PROFESSIONAL_SERVICES (serviços do profissional)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.professional_services (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL,
  service_id      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'professional_services_professional_fkey'
  ) THEN
    ALTER TABLE public.professional_services
      ADD CONSTRAINT professional_services_professional_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'professional_services_service_fkey'
  ) THEN
    ALTER TABLE public.professional_services
      ADD CONSTRAINT professional_services_service_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'professional_services'
      AND indexname = 'professional_services_unique'
  ) THEN
    CREATE UNIQUE INDEX professional_services_unique
      ON public.professional_services(professional_id, service_id);
  END IF;
END $$;

-- ============================================================
-- 11. PROFESSIONAL_WORKING_HOURS (horários de trabalho)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.professional_working_hours (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL,
  day_of_week     INTEGER NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_available    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.professional_working_hours ADD COLUMN IF NOT EXISTS interval_minutes INTEGER DEFAULT 30;
ALTER TABLE public.professional_working_hours ADD COLUMN IF NOT EXISTS is_available    BOOLEAN DEFAULT true;
ALTER TABLE public.professional_working_hours ADD COLUMN IF NOT EXISTS user_id         UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'professional_working_hours_professional_fkey'
  ) THEN
    ALTER TABLE public.professional_working_hours
      ADD CONSTRAINT professional_working_hours_professional_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 12. PROFESSIONAL_COMMISSIONS (configuração de comissões)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.professional_commissions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id  UUID NOT NULL,
  commission_type  TEXT NOT NULL DEFAULT 'service',
  calculation_type TEXT NOT NULL DEFAULT 'fixed',
  commission_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.professional_commissions ADD COLUMN IF NOT EXISTS service_id      UUID;
ALTER TABLE public.professional_commissions ADD COLUMN IF NOT EXISTS package_id      UUID;
ALTER TABLE public.professional_commissions ADD COLUMN IF NOT EXISTS franchise_id    UUID;
ALTER TABLE public.professional_commissions ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'professional_commissions_professional_fkey'
  ) THEN
    ALTER TABLE public.professional_commissions
      ADD CONSTRAINT professional_commissions_professional_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 13. COMMISSION_RECORDS (registros automáticos de comissão)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commission_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id   UUID NOT NULL,
  appointment_id    UUID NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS service_id        UUID;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS package_id        UUID;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS calculation_type  TEXT;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS commission_value  NUMERIC(10,2);
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS franchise_id      UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'commission_records_professional_fkey'
  ) THEN
    ALTER TABLE public.commission_records
      ADD CONSTRAINT commission_records_professional_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'commission_records_appointment_fkey'
  ) THEN
    ALTER TABLE public.commission_records
      ADD CONSTRAINT commission_records_appointment_fkey
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- ÍNDICES de performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_professional  ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_franchise     ON public.appointments(franchise_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date          ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_customers_professional     ON public.customers(professional_id);
CREATE INDEX IF NOT EXISTS idx_customers_franchise        ON public.customers(franchise_id);
CREATE INDEX IF NOT EXISTS idx_professionals_franchise    ON public.professionals(franchise_id);
CREATE INDEX IF NOT EXISTS idx_services_franchise         ON public.services(franchise_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer ON public.customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_prof    ON public.commission_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_appt    ON public.commission_records(appointment_id);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
DO $$ BEGIN
  CREATE TRIGGER trg_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- RLS — Políticas para tabelas do scheduler
-- Profissionais usam auth customizada (localStorage), não JWT do Supabase.
-- As chamadas chegam como 'anon' e são bloqueadas pelo RLS.
-- Solução: desabilitar RLS nas tabelas do scheduler OU adicionar políticas permissivas.
-- ============================================================
ALTER TABLE public.appointments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_services     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_packages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_package_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_working_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_commissions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records         DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Reload do schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'professionals','services','customers','appointments',
    'appointment_services','packages','package_services',
    'customer_packages','customer_package_services',
    'professional_services','professional_working_hours',
    'professional_commissions','commission_records'
  )
ORDER BY table_name, ordinal_position;
