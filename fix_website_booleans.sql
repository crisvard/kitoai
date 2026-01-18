-- ============================================
-- FIX: CONVERT WEBSITE BOOLEANS TO TRUE
-- ============================================

UPDATE profiles
SET 
  trial_website_active = true,
  website_active = true
WHERE id = '0f08d10e-78d7-4a75-8081-b3e5bf5d8e0e';
