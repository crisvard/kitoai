# 🚀 Guia Passo a Passo: Resolver Erro 403

## ⚡ Resumo do Problema
- **Erro:** HTTP 403 Forbidden
- **Causa:** RLS policies estão bloqueando UPDATE/DELETE de agendamentos
- **Razão Raiz:** JWT user_metadata vazio (não tem role e franchise_id)
- **Solução:** Mudar RLS para verificar tabela `professionals` em vez de JWT

---

## ✅ Passo 1: Verificar Dados no Banco (Opcional)

Se quiser confirmar o problema antes de aplicar a solução, execute isto no Supabase:

**URL:** https://app.supabase.com → Seu Projeto → SQL Editor → New Query

```sql
-- Verificar seu user_id
SELECT auth.uid() as seu_user_id;

-- Verificar se você existe na tabela professionals
SELECT * FROM professionals 
WHERE user_id = (SELECT auth.uid());
```

**Resultado esperado:**
- ✅ Linha encontrada na tabela `professionals`
- ✅ Campo `role` = 'admin' ou 'professional'
- ✅ Campo `franchise_id` preenchido
- ✅ Campo `active` = true

Se tudo acima está OK, o problema é 100% as RLS policies.

---

## 🔧 Passo 2: Aplicar a Solução (Obrigatório)

### Opção A: Via Arquivo (Recomendado)

1. **Abra o arquivo de solução:**
   ```
   /Kito Expert - Dashboard/COPIAR_COLAR_SQL.sql
   ```

2. **Copie TUDO** (linhas 1 até o final):
   ```
   Ctrl+A para selecionar tudo
   Ctrl+C para copiar
   ```

3. **Vá para Supabase:**
   - https://app.supabase.com
   - Seu Projeto → **SQL Editor**
   - Clique em **New Query**

4. **Cole o SQL:**
   ```
   Ctrl+V para colar
   ```

5. **Execute:**
   - Clique em **Run** (canto superior direito)
   - Ou pressione **Cmd+Enter** (Mac) / **Ctrl+Enter** (Linux/Windows)

6. **Resultado esperado:**
   ```
   ✅ CREATE POLICY (3 vezes = sucesso)
   ```

### Opção B: Copiar Manualmente (se não funcionar a opção A)

Se a Opção A não funcionar, copie este SQL no Supabase:

```sql
-- LIMPAR POLICIES ANTIGAS
DROP POLICY IF EXISTS "Admin can do everything on appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Professional can manage own franchise appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Customer can manage own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admin full access to all appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Franchise full access to own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can access appointments from their franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admin can access all appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admins can view appointments in their business" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admins can insert appointments in their business" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admins can update appointments in their business" ON appointments CASCADE;
DROP POLICY IF EXISTS "Admins can delete appointments in their business" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can only view appointments from their franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can create appointments in their franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can update appointments in their franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can delete appointments in their franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can access appointments from accessible franchises" ON appointments CASCADE;
DROP POLICY IF EXISTS "Allow appointment operations for franchise users" ON appointments CASCADE;
DROP POLICY IF EXISTS "franchise_users_can_view_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "franchise_users_can_insert_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "franchise_users_can_update_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "franchise_users_can_delete_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "allow_authenticated_users_view_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "allow_authenticated_users_insert_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "allow_authenticated_users_update_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "allow_authenticated_users_delete_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "simple_appointments_access" ON appointments CASCADE;
DROP POLICY IF EXISTS "allow_authenticated_users_appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Allow anonymous access to appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments CASCADE;

-- HABILITAR RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- NOVA POLICY: ADMIN
CREATE POLICY "Admin full access to appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.user_id = auth.uid()
    AND professionals.role = 'admin'
    AND professionals.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.user_id = auth.uid()
    AND professionals.role = 'admin'
    AND professionals.active = true
  )
);

-- NOVA POLICY: PROFISSIONAL
CREATE POLICY "Professional manage franchise appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.user_id = auth.uid()
    AND professionals.role = 'professional'
    AND professionals.franchise_id = appointments.franchise_id
    AND professionals.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.user_id = auth.uid()
    AND professionals.role = 'professional'
    AND professionals.franchise_id = appointments.franchise_id
    AND professionals.active = true
  )
);

-- NOVA POLICY: CUSTOMER
CREATE POLICY "Customer own appointments"
ON appointments FOR ALL
TO authenticated
USING (appointments.user_id = auth.uid())
WITH CHECK (appointments.user_id = auth.uid());
```

---

## 🔄 Passo 3: Atualizar Frontend (Cache)

Após executar o SQL no Supabase:

1. **Limpar cache do navegador:**
   - **Chrome:** Ctrl+Shift+Delete (Windows/Linux) ou Cmd+Shift+Delete (Mac)
   - **Firefox:** Ctrl+Shift+Delete (Windows/Linux) ou Cmd+Shift+Delete (Mac)
   - Selecione "Cookies and Cached Images"
   - Clique em "Clear Data"

2. **Fazer logout:**
   - Saia da sua conta

3. **Fazer login novamente:**
   - Use suas credenciais de franqueado/admin

---

## ✨ Passo 4: Testar

Agora tente realizar as operações que estavam falhando:

### Teste 1: Confirmar Agendamento
- Abra a lista de agendamentos
- Clique em um agendamento
- Clique em "Confirmar"
- **Esperado:** ✅ Sem erro, status muda para "confirmado"

### Teste 2: Concluir Agendamento
- Abra um agendamento confirmado
- Clique em "Concluir"
- **Esperado:** ✅ Sem erro, status muda para "concluído"

### Teste 3: Cancelar Agendamento
- Abra um agendamento
- Clique em "Cancelar"
- **Esperado:** ✅ Sem erro, status muda para "cancelado"

### Teste 4: Reagendar Agendamento
- Abra um agendamento
- Clique em "Reagendar"
- Selecione novo horário
- Clique em "Salvar"
- **Esperado:** ✅ Sem erro, agendamento movido para novo horário

### Teste 5: Deletar Agendamento
- Abra um agendamento
- Clique em "Deletar" (ou ícone de lixo)
- Confirme exclusão
- **Esperado:** ✅ Sem erro 403, agendamento removido

---

## 🐛 Se Ainda Tiver Erro 403

Se após os passos acima ainda receber erro 403:

### Diagnóstico 1: Verificar se as policies foram criadas
```sql
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;
```

**Resultado esperado:**
- Deve listar 3 policies:
  - "Admin full access to appointments"
  - "Professional manage franchise appointments"
  - "Customer own appointments"

### Diagnóstico 2: Verificar se professional existe
```sql
SELECT * FROM professionals 
WHERE user_id = auth.uid();
```

**Resultado esperado:**
- Deve retornar 1 linha
- `role` = 'admin' ou 'professional'
- `active` = true
- `franchise_id` preenchido

### Diagnóstico 3: Testar SELECT direto
```sql
SELECT COUNT(*) as total FROM appointments;
```

**Resultado esperado:**
- Se retorna número ≥ 0: RLS está funcionando para SELECT
- Se retorna erro: RLS bloqueando leitura (mais grave)

### Se nada funcionar:

Execute este SQL **como medida de emergência temporária** (desabilita RLS):

```sql
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
```

**⚠️ AVISO:** Isto abre o acesso a TODOS os dados. Use apenas temporariamente enquanto investiga.

Depois contacte suporte com os resultados dos 3 diagnósticos acima.

---

## 📊 Como As Novas Policies Funcionam

| Usuário | Condition | Pode fazer |
|---------|-----------|-----------|
| **Admin** | `role = 'admin'` | ✅ TUDO (SELECT, INSERT, UPDATE, DELETE) |
| **Professional** | `role = 'professional' AND franchise_id = appointment.franchise_id` | ✅ Gerenciar agendamentos sua franquia |
| **Customer** | `user_id = appointment.user_id` | ✅ Gerenciar seus próprios agendamentos |
| **Ninguém** | Nenhuma condition verdadeira | ❌ HTTP 403 Forbidden |

---

## 🎯 Checklist Final

- [ ] Copiei e executei o SQL no Supabase
- [ ] Vi "CREATE POLICY" 3 vezes sem erros
- [ ] Fiz logout e login novamente
- [ ] Limpei o cache do navegador
- [ ] Testei confirmar um agendamento
- [ ] Testei concluir um agendamento
- [ ] Testei cancelar um agendamento
- [ ] Testei reagendar um agendamento
- [ ] Testei deletar um agendamento
- [ ] Todas as 5 operações funcionam ✅

---

## 📞 Suporte

Se algo não funcionar:

1. Execute o **Diagnóstico 1** acima (verificar policies)
2. Execute o **Diagnóstico 2** acima (verificar professional)
3. Execute o **Diagnóstico 3** acima (testar SELECT)
4. Compartilhe os resultados com o time de desenvolvimento

