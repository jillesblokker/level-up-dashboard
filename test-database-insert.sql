-- Test database insert for game_settings table
-- Run this in your Supabase SQL Editor to test if the table structure works

-- 1. First, let's see what's currently in the table
SELECT * FROM public.game_settings;

-- 2. Try to insert a test record
INSERT INTO public.game_settings (user_id, setting_key, settings_data, updated_at)
VALUES ('test-user-123', 'test_setting', '{"value": "test-value"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = EXCLUDED.updated_at;

-- 3. Check if the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'test_setting';

-- 4. Try to update the same record
INSERT INTO public.game_settings (user_id, setting_key, settings_data, updated_at)
VALUES ('test-user-123', 'test_setting', '{"value": "updated-value"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = EXCLUDED.updated_at;

-- 5. Check the updated record
SELECT * FROM public.game_settings WHERE setting_key = 'test_setting';

-- 6. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'test_setting';

-- 7. Verify cleanup
SELECT * FROM public.game_settings WHERE setting_key = 'test_setting';
