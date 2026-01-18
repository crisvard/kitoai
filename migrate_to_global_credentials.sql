-- ============================================
-- MIGRATE TO GLOBAL CREDENTIALS
-- ============================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view own credentials" ON user_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON user_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON user_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON user_credentials;
DROP POLICY IF EXISTS "user_credentials_service_role_policy" ON user_credentials;

-- Step 2: Remove the UNIQUE constraint on user_id
ALTER TABLE user_credentials DROP CONSTRAINT IF EXISTS user_credentials_user_id_key;

-- Step 3: Make user_id nullable (for migration)
ALTER TABLE user_credentials ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Create new policies for global access
CREATE POLICY "Authenticated users can view global credentials" ON user_credentials
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert global credentials" ON user_credentials
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update global credentials" ON user_credentials
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "user_credentials_service_role_policy" ON user_credentials
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 5: Insert global credentials if not exists
INSERT INTO user_credentials (waha_url, waha_api_key, n8n_url, n8n_api_key, gemini_api_key)
SELECT 'https://waha.example.com', 'your-waha-api-key-here', 'https://n8n.example.com', 'your-n8n-api-key-here', 'your-gemini-api-key-here'
WHERE NOT EXISTS (SELECT 1 FROM user_credentials LIMIT 1);