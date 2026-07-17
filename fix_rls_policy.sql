-- Política para usuários autenticados atualizarem seus próprios perfis
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para webhook Asaas (já aplicada, mas confirmando)
CREATE POLICY "Asaas webhook profiles update" ON profiles
FOR UPDATE USING (true)
WITH CHECK (true);