-- Política para webhook Asaas (já aplicada, mas confirmando)
CREATE POLICY "Asaas webhook profiles update" ON profiles
FOR UPDATE USING (true)
WITH CHECK (true);