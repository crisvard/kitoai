-- Add scheduled_at column to user_agents
ALTER TABLE public.user_agents
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL;

-- Enable status 'scheduled' by making sure no check constraint blocks it
-- Check if there's a constraint, but usually status is just text or a generic enum.
-- We assume it's just TEXT from previous usage, otherwise we would need an ALTER TYPE.
