-- Force Supabase to refresh its schema cache
-- This will resolve the "Could not find the 'settings_data' column" error

-- 1. First, let's see the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'game_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Force schema refresh by making a small change
-- Add a comment to the table to trigger schema refresh
COMMENT ON TABLE public.game_settings IS 'Game settings table - schema cache refreshed';

-- 3. Also add a comment to the settings_data column
COMMENT ON COLUMN public.game_settings.settings_data IS 'JSONB column for storing setting values';

-- 4. Verify the table structure again
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'game_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test inserting a setting to verify the schema cache is refreshed
INSERT INTO public.game_settings (user_id, setting_key, settings_data, updated_at)
VALUES ('test-user-456', 'test-setting', '{"value": "test-value"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = EXCLUDED.updated_at;

-- 6. Verify the insert worked
SELECT * FROM public.game_settings WHERE user_id = 'test-user-456';

-- 7. Clean up test data
DELETE FROM public.game_settings WHERE user_id = 'test-user-456';
