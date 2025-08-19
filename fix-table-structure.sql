-- Fix the game_settings table structure
-- This will add the missing setting_value column and fix the table

-- 1. Add the missing setting_value column
ALTER TABLE public.game_settings 
ADD COLUMN IF NOT EXISTS setting_value JSONB;

-- 2. Make setting_value NOT NULL (after adding it)
ALTER TABLE public.game_settings 
ALTER COLUMN setting_value SET NOT NULL;

-- 3. Add the unique constraint if it doesn't exist
ALTER TABLE public.game_settings 
ADD CONSTRAINT IF NOT EXISTS game_settings_user_id_setting_key_key 
UNIQUE (user_id, setting_key);

-- 4. Verify the table structure now
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

-- 5. Test inserting a setting
INSERT INTO public.game_settings (user_id, setting_key, setting_value, updated_at)
VALUES ('test-user', 'test-key', '{"value": "test-value"}', NOW())
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- 6. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'test-key';

-- 7. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'test-key';
