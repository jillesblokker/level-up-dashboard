-- Fix the conflicting constraints issue
-- Remove the wrong constraints and keep only the correct one

-- 1. Show current constraints (for verification)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'game_settings' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 2. Drop the conflicting constraints (user_id only) FIRST
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_key;
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;

-- 3. Keep only the correct constraint (user_id, setting_key)
-- This constraint should already exist, but let's verify it's working

-- 4. Show the constraints after cleanup
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'game_settings' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 5. Test inserting a new setting to verify it works
INSERT INTO public.game_settings (user_id, setting_key, setting_value, updated_at)
VALUES ('user_2z5XXhrBfLdbU0P6AUCBco0CJWC', 'winter_festival_active', '{"value": "true"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;

-- 6. Verify the insert worked
SELECT * FROM public.game_settings WHERE setting_key = 'winter_festival_active';

-- 7. Clean up test data
DELETE FROM public.game_settings WHERE setting_key = 'winter_festival_active';

-- 8. Final verification
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'game_settings' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;
