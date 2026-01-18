-- Allow user_id to be null for global credentials
ALTER TABLE user_credentials ALTER COLUMN user_id DROP NOT NULL;