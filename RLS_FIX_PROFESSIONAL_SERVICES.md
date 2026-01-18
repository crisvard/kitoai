# ✅ RLS Policy Corrigida para Professional Services

## Problema
A query estava retornando vazio porque as RLS policies estavam bloqueando o acesso, mesmo que o professional_id fosse correto.

## Solução

Cole este SQL no Supabase SQL Editor:

```sql
-- ============================================
-- FIX: RLS Policy para professional_services
-- ============================================

-- HABILITAR RLS se não estiver habilitado
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

-- DELETAR policies antigas
DROP POLICY IF EXISTS "Professionals can read own services" ON professional_services;
DROP POLICY IF EXISTS "Users can manage professional services" ON professional_services;
DROP POLICY IF EXISTS "Enable read for professional services" ON professional_services;

-- ============================================
-- NOVA POLICY: Admin pode fazer tudo
-- ============================================
CREATE POLICY "Admin users can manage professional services"
ON professional_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = professional_services.professional_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = professional_services.professional_id
    AND p.user_id = auth.uid()
  )
);

-- ============================================
-- NOVA POLICY: Professional pode ler seus próprios serviços
-- ============================================
CREATE POLICY "Professional can read own services"
ON professional_services
FOR SELECT
USING (
  professional_id = auth.uid()
);

-- ============================================
-- Teste: Execute para verificar
-- ============================================

-- Para um professional specific, deve retornar dados:
SELECT * FROM professional_services 
WHERE professional_id = 'daadac73-adcb-4b12-8408-637b7cf62ec8';

-- Verificar se as policies foram criadas:
SELECT * FROM pg_policies WHERE tablename = 'professional_services';
```

## ⚠️ IMPORTANTE

Existe um problema com esta abordagem: você está usando `professional_id` como ID direto, mas as RLS policies esperavam que o `professional_id` == `auth.uid()`.

**Isto significa que você precisa:**

1. **Ou: Usar `email` do professional para filtrar em vez de ID**
2. **Ou: Passar a information do professional de outra forma**

## Qual é o seu Supabase Auth?

Como você está autenticando o professional? 
- Usando email/password do Supabase Auth?
- Usando um token customizado?
- Usando JWT?

Me diga para eu criar a policy correta! 🔐
