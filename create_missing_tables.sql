-- ============================================
-- CREATE MISSING TABLES FOR N8N FLOW
-- ============================================

-- Create professionals table (for agent tools)
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table (for agent tools)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional_working_hours table (for agent tools)
CREATE TABLE IF NOT EXISTS professional_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update whatsapp_user_ids table structure if needed
-- Add missing 'active' column that the flow expects
ALTER TABLE whatsapp_user_ids ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update agent_configs table structure if needed
-- Ensure it has the fields the flow expects
ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS additional_instructions JSONB;

-- Enable RLS for new tables
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_working_hours ENABLE ROW LEVEL SECURITY;

-- Create policies for professionals
CREATE POLICY "Users can view own professionals" ON professionals
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professionals" ON professionals
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own professionals" ON professionals
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own professionals" ON professionals
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for appointments
CREATE POLICY "Users can view own appointments" ON appointments
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON appointments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON appointments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON appointments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for professional_working_hours
CREATE POLICY "Users can view own working hours" ON professional_working_hours
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own working hours" ON professional_working_hours
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own working hours" ON professional_working_hours
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own working hours" ON professional_working_hours
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_user_id ON professional_working_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_professional_id ON professional_working_hours(professional_id);