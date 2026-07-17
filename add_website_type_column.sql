-- ============================================
-- ADD WEBSITE TYPE COLUMN
-- ============================================
-- Add a column to differentiate between regular websites and lawyer-specific websites

ALTER TABLE public.user_websites 
  ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'standard' 
  CHECK (website_type IN ('standard', 'lawyer'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_websites_type ON public.user_websites(website_type);

-- Verify the column was added
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_websites' 
    AND column_name = 'website_type'
  ) THEN '✅ website_type column added successfully' 
  ELSE '❌ website_type column NOT found' 
  END as status;

-- Show schema of user_websites table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_websites'
ORDER BY ordinal_position;
