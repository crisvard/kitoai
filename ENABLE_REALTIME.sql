-- Ativar o Realtime para as tabelas essenciais do Discador
-- Isso garante que as inscrições realtime do Front-end detectem as alterações de Ligações do backend

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agent_contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_contacts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_agents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_agents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agent_call_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_call_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agent_daily_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_daily_stats;
  END IF;
END $$;


-- -----------------------------------------------------
-- POLÍTICAS RLS PARA agent_call_history (CORRIGE O BUG DE NÃO REFLITIR NO FRONTEND)
-- -----------------------------------------------------
-- Se a tabela agent_call_history foi criada manualmente no Dashboard sem políticas RLS,
-- o frontend não consegue ler o histórico, retornando vazio e exibindo "Nenhum histórico".

ALTER TABLE public.agent_call_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Cria a política apenas se ela ainda não existir
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'agent_call_history' 
        AND policyname = 'Users can view their own agent call history'
  ) THEN
      CREATE POLICY "Users can view their own agent call history"
      ON public.agent_call_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'agent_call_history' 
        AND policyname = 'Users can insert their own agent call history'
  ) THEN
      CREATE POLICY "Users can insert their own agent call history"
      ON public.agent_call_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'agent_call_history' 
        AND policyname = 'Users can update their own agent call history'
  ) THEN
      CREATE POLICY "Users can update their own agent call history"
      ON public.agent_call_history FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'agent_call_history' 
        AND policyname = 'Users can delete their own agent call history'
  ) THEN
      CREATE POLICY "Users can delete their own agent call history"
      ON public.agent_call_history FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
