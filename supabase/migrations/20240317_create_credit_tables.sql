-- Adicionar coluna de créditos ao perfil se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits NUMERIC DEFAULT 0;

-- Tabela de Pacotes de Créditos
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    credits_amount INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Histórico de Compras de Créditos
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES credit_packages(id) ON DELETE SET NULL,
    credits_amount INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'stripe')),
    asaas_payment_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir pacotes iniciais (opcional)
INSERT INTO credit_packages (name, description, credits_amount, price)
VALUES 
('Pacote Básico', '50 créditos para ligações', 50, 49.90),
('Pacote Intermediário', '150 créditos para ligações', 150, 129.90),
('Pacote Avançado', '500 créditos para ligações', 500, 399.90),
('Pacote Enterprise', '1500 créditos para ligações', 1500, 999.90)
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Opcional, mas recomendado)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas para credit_packages (Leitura pública ou autenticada)
CREATE POLICY "Leitura de pacotes de crédito" ON credit_packages
    FOR SELECT USING (true);

-- Políticas para credit_purchases (Usuário vê suas próprias compras)
CREATE POLICY "Usuários veem suas próprias compras" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);
