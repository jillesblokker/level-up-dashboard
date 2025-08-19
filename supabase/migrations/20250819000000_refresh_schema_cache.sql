-- Force Supabase to refresh its schema cache
-- This migration makes a small change to force schema refresh

-- Add a comment to the table to trigger schema refresh
COMMENT ON TABLE public.game_settings IS 'Game settings table - refreshed schema cache';

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'game_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
