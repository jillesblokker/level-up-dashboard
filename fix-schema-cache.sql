-- Fix Supabase Schema Cache Issue
-- Run this in your Supabase SQL Editor to refresh the schema cache

-- 1. Add a comment to force schema refresh
COMMENT ON TABLE public.game_settings IS 'Game settings table - refreshed schema cache';

-- 2. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if any data exists
SELECT COUNT(*) as total_settings FROM public.game_settings;

-- 4. Test inserting a setting
INSERT INTO public.game_settings (user_id, setting_key, setting_value)
VALUES ('test-user', 'test-key', '{"value": "test-value"}')
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- 5. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'test-key';

-- 6. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'test-key';
