/*
  # Crypto Exchange Management System

  1. New Tables
    - `exchanges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Exchange name (Binance, Bitso, OKEx, Toro)
      - `api_key` (text) - Encrypted API key
      - `api_secret` (text) - Encrypted API secret
      - `is_active` (boolean) - Whether exchange is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `portfolio`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `exchange_id` (uuid, references exchanges)
      - `symbol` (text) - Crypto symbol (BTC, ETH, etc)
      - `amount` (numeric) - Amount held
      - `average_price` (numeric) - Average purchase price
      - `current_price` (numeric) - Current market price
      - `updated_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `exchange_id` (uuid, references exchanges)
      - `type` (text) - buy or sell
      - `symbol` (text) - Crypto symbol
      - `amount` (numeric) - Amount transacted
      - `price` (numeric) - Price at transaction
      - `total` (numeric) - Total value
      - `status` (text) - pending, completed, failed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  api_key text,
  api_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exchanges"
  ON exchanges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchanges"
  ON exchanges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exchanges"
  ON exchanges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exchanges"
  ON exchanges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exchange_id uuid REFERENCES exchanges ON DELETE CASCADE,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  average_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio"
  ON portfolio FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio"
  ON portfolio FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON portfolio FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio"
  ON portfolio FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exchange_id uuid REFERENCES exchanges ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  symbol text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);