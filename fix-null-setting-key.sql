-- Fix the NULL setting_key issue and ensure constraints work properly
-- This will fix the Winter Festival toggle problem

-- 1. First, let's see what we're working with
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;

-- 2. Update the existing record to have a proper setting_key
-- This record contains horse position data, so let's give it a proper key
UPDATE public.game_settings 
SET setting_key = 'horse_position'
WHERE setting_key IS NULL 
AND setting_value::text LIKE '%horsePos%';

-- 3. Drop any existing constraints that might be causing issues
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_setting_key_key;

-- 4. Add the correct unique constraint (user_id, setting_key)
ALTER TABLE public.game_settings 
ADD CONSTRAINT game_settings_user_id_setting_key_key 
UNIQUE (user_id, setting_key);

-- 5. Verify the fix worked
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;

-- 6. Test inserting a new setting to verify the constraint works
INSERT INTO public.game_settings (user_id, setting_key, setting_value, updated_at)
VALUES ('user_2z5XXhrBfLdbU0P6AUCBco0CJWC', 'winter_festival_active', '{"value": "true"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;

-- 7. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'winter_festival_active';

-- 8. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'winter_festival_active';

-- 9. Final verification
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;
