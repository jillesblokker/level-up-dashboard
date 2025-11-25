-- Fix the game_settings table structure (Corrected Version)
-- This will fix the column names and structure

-- 1. First, let's see what we're working with
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

-- 2. Rename the existing columns to match expected structure
-- Rename settings_data to setting_value
ALTER TABLE public.game_settings 
RENAME COLUMN settings_data TO setting_value;

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add setting_key column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_settings' 
        AND column_name = 'setting_key'
    ) THEN
        ALTER TABLE public.game_settings ADD COLUMN setting_key TEXT;
    END IF;
END $$;

-- 4. Drop the old constraint if it exists (to avoid conflicts)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'game_settings_user_id_setting_key_key'
    ) THEN
        ALTER TABLE public.game_settings DROP CONSTRAINT game_settings_user_id_setting_key_key;
    END IF;
END $$;

-- 5. Add the correct unique constraint
ALTER TABLE public.game_settings 
ADD CONSTRAINT game_settings_user_id_setting_key_key 
UNIQUE (user_id, setting_key);

-- 6. Verify the table structure now
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

-- 7. Test inserting a setting
INSERT INTO public.game_settings (user_id, setting_key, setting_value, updated_at)
VALUES ('test-user', 'test-key', '{"value": "test-value"}', NOW())
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- 8. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'test-key';

-- 9. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'test-key';
