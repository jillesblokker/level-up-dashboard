-- Fix the real game_settings table structure
-- Based on the actual columns: id, user_id, setting_value, created_at, updated_at, setting_key

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

-- 2. Check current constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'game_settings' 
AND table_schema = 'public';

-- 3. Drop any existing constraints that might be causing issues
ALTER TABLE public.game_settings 
DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;

ALTER TABLE public.game_settings 
DROP CONSTRAINT IF EXISTS game_settings_user_id_setting_key_key;

-- 4. Update the existing record to have a proper setting_key
-- This record appears to contain horse position data, so let's give it a proper key
UPDATE public.game_settings 
SET setting_key = 'horse_position'
WHERE setting_key IS NULL 
AND setting_value::text LIKE '%horsePos%';

-- 5. Add the correct unique constraint (user_id, setting_key)
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

-- 7. Test inserting a new setting
INSERT INTO public.game_settings (user_id, setting_key, setting_value, updated_at)
VALUES ('user_2z5XXhrBfLdbU0P6AUCBco0CJWC', 'winter_festival_active', '{"value": "true"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;

-- 8. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'winter_festival_active';

-- 9. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'winter_festival_active';
