// Script para atualizar webhook em números VAPI existentes
// Uso via Supabase: SELECT edge function update-vapi-agent com action=phone_update_webhook

// Função SQL para listar números que precisam de webhook
/*
SELECT 
  id,
  phone_number,
  vapi_phone_number_id,
  provider
FROM user_phone_numbers 
WHERE provider IN ('twilio', 'vapi')
ORDER BY created_at DESC;
*/

// Execute no Supabase SQL Editor para adicionar webhook campo
ALTER TABLE public.user_phone_numbers 
ADD COLUMN IF NOT EXISTS webhook_updated BOOLEAN DEFAULT false;