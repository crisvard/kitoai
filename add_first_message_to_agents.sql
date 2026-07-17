-- Add first_message column to user_agents
ALTER TABLE public.user_agents 
ADD COLUMN IF NOT EXISTS first_message TEXT DEFAULT 'Olá! Como posso ajudar você hoje?';

COMMENT ON COLUMN public.user_agents.first_message IS 'Mensagem inicial que o agente diz ao iniciar a ligação';
