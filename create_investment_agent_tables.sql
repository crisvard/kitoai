-- ============================================================
-- TABELAS PARA O AGENTE DE INVESTIMENTOS / TRADING BOT
-- ============================================================

-- Tabela de configuração do agente de investimentos por usuário
CREATE TABLE IF NOT EXISTS user_agent_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
    exchange text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_configured boolean DEFAULT false,
    is_active boolean DEFAULT false,
    is_trading boolean DEFAULT false,
    trading_started_at timestamptz,
    trading_stopped_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de status do agente
CREATE TABLE IF NOT EXISTS agent_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    name text NOT NULL,
    exchange text NOT NULL,
    is_active boolean DEFAULT false,
    is_trading boolean DEFAULT false,
    balance numeric DEFAULT 0,
    total_profit numeric DEFAULT 0,
    total_trades integer DEFAULT 0,
    winning_trades integer DEFAULT 0,
    losing_trades integer DEFAULT 0,
    last_trade_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de sinais de trading
CREATE TABLE IF NOT EXISTS trading_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_id uuid REFERENCES agent_status(id),
    pair text NOT NULL,
    action text NOT NULL CHECK (action IN ('buy', 'sell', 'hold')),
    strength integer CHECK (strength >= 0 AND strength <= 100),
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    strategy text,
    confidence integer CHECK (confidence >= 0 AND confidence <= 100),
    indicators jsonb DEFAULT '{}'::jsonb,
    executed boolean DEFAULT false,
    executed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Tabela de ordens executadas
CREATE TABLE IF NOT EXISTS trading_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_id uuid REFERENCES agent_status(id),
    exchange text NOT NULL,
    pair text NOT NULL,
    type text NOT NULL CHECK (type IN ('market', 'limit', 'stop_loss', 'stop_limit')),
    side text NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity numeric NOT NULL,
    price numeric,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'failed')),
    filled_quantity numeric DEFAULT 0,
    filled_price numeric,
    order_id text,
    external_id text,
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    filled_at timestamptz
);

-- Tabela de posições abertas
CREATE TABLE IF NOT EXISTS trading_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_id uuid REFERENCES agent_status(id),
    exchange text NOT NULL,
    pair text NOT NULL,
    side text NOT NULL CHECK (side IN ('long', 'short')),
    quantity numeric NOT NULL,
    entry_price numeric NOT NULL,
    current_price numeric,
    unrealized_pnl numeric DEFAULT 0,
    realized_pnl numeric DEFAULT 0,
    stop_loss numeric,
    take_profit numeric,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
    opened_at timestamptz DEFAULT now(),
    closed_at timestamptz
);

-- Tabela de posições de portfólio (holdings)
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    exchange text NOT NULL,
    symbol text NOT NULL,
    quantity numeric NOT NULL DEFAULT 0,
    average_price numeric NOT NULL DEFAULT 0,
    current_price numeric,
    total_value numeric DEFAULT 0,
    profit_loss numeric DEFAULT 0,
    profit_loss_percent numeric DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, exchange, symbol)
);

-- Tabela de histórico de saldo
CREATE TABLE IF NOT EXISTS balance_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    exchange text NOT NULL,
    currency text NOT NULL,
    balance numeric NOT NULL,
    balance_usd numeric,
    change_type text NOT NULL CHECK (change_type IN ('deposit', 'withdrawal', 'trade', 'fee', 'adjustment', 'pnl')),
    order_id uuid REFERENCES trading_orders(id),
    position_id uuid REFERENCES trading_positions(id),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Tabela de logs de trading
CREATE TABLE IF NOT EXISTS trading_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_id uuid REFERENCES agent_status(id),
    level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

ALTER TABLE user_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_agent_config
CREATE POLICY "Users can view own agent config"
    ON user_agent_config FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent config"
    ON user_agent_config FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent config"
    ON user_agent_config FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para agent_status
CREATE POLICY "Users can view own agent status"
    ON agent_status FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent status"
    ON agent_status FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent status"
    ON agent_status FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent status"
    ON agent_status FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para trading_signals
CREATE POLICY "Users can view own trading signals"
    ON trading_signals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading signals"
    ON trading_signals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Políticas para trading_orders
CREATE POLICY "Users can view own trading orders"
    ON trading_orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading orders"
    ON trading_orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading orders"
    ON trading_orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para trading_positions
CREATE POLICY "Users can view own trading positions"
    ON trading_positions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading positions"
    ON trading_positions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading positions"
    ON trading_positions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading positions"
    ON trading_positions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para portfolio_holdings
CREATE POLICY "Users can view own portfolio holdings"
    ON portfolio_holdings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio holdings"
    ON portfolio_holdings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio holdings"
    ON portfolio_holdings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio holdings"
    ON portfolio_holdings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para balance_history
CREATE POLICY "Users can view own balance history"
    ON balance_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance history"
    ON balance_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Políticas para trading_logs
CREATE POLICY "Users can view own trading logs"
    ON trading_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading logs"
    ON trading_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agent_status_user_id ON agent_status(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_exchange ON agent_status(exchange);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON trading_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_pair ON trading_signals(pair);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_pair ON trading_orders(pair);
CREATE INDEX IF NOT EXISTS idx_trading_positions_user_id ON trading_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);
CREATE INDEX IF NOT EXISTS idx_trading_positions_pair ON trading_positions(pair);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_exchange ON portfolio_holdings(exchange);
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id ON balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_exchange ON balance_history(exchange);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_logs_user_id ON trading_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_logs_level ON trading_logs(level);
CREATE INDEX IF NOT EXISTS idx_trading_logs_created_at ON trading_logs(created_at DESC);

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_agent_config_updated_at
    BEFORE UPDATE ON user_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_status_updated_at
    BEFORE UPDATE ON agent_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_orders_updated_at
    BEFORE UPDATE ON trading_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_positions_updated_at
    BEFORE UPDATE ON trading_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para obter estatísticas do agente
CREATE OR REPLACE FUNCTION get_agent_stats(p_user_id uuid, p_agent_id uuid)
RETURNS TABLE (
    total_trades bigint,
    winning_trades bigint,
    losing_trades bigint,
    win_rate numeric,
    total_profit numeric,
    total_loss numeric,
    net_profit numeric,
    avg_profit numeric,
    avg_loss numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint AS total_trades,
        COUNT(*) FILTER (WHERE realized_pnl > 0)::bigint AS winning_trades,
        COUNT(*) FILTER (WHERE realized_pnl < 0)::bigint AS losing_trades,
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE realized_pnl > 0)::numeric / COUNT(*)::numeric) * 100 
            ELSE 0 
        END AS win_rate,
        COALESCE(SUM(realized_pnl) FILTER (WHERE realized_pnl > 0), 0)::numeric AS total_profit,
        COALESCE(ABS(SUM(realized_pnl) FILTER (WHERE realized_pnl < 0)), 0)::numeric AS total_loss,
        COALESCE(SUM(realized_pnl), 0)::numeric AS net_profit,
        COALESCE(AVG(realized_pnl) FILTER (WHERE realized_pnl > 0), 0)::numeric AS avg_profit,
        COALESCE(AVG(realized_pnl) FILTER (WHERE realized_pnl < 0), 0)::numeric AS avg_loss
    FROM trading_positions
    WHERE user_id = p_user_id 
        AND agent_id = p_agent_id 
        AND status = 'closed';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INSERÇÕES INICIAIS DE TESTE
-- ============================================================

-- A função está pronta para uso. Não há dados iniciais necessários.
