-- ============================================
-- FIX: ADD RLS SELECT POLICY FOR PROFILES
-- ============================================
-- This allows authenticated users to read their own profile data
-- Including website_active and trial_website_active fields

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create SELECT policy for authenticated users
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- This policy allows users to read only their own profile
-- The condition auth.uid() = id ensures RLS enforcement
