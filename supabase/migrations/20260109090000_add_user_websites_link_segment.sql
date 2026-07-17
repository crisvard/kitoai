-- Add optional metadata fields to user_websites
-- Required by /websites UI: Nome do Site, Segmento, Link

ALTER TABLE public.user_websites
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT;

CREATE INDEX IF NOT EXISTS idx_user_websites_segment ON public.user_websites(segment);