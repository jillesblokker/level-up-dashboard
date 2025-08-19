-- Fix the database constraint issue
-- The problem: game_settings table has wrong unique constraint (user_id only)
-- It should have: (user_id, setting_key) to allow multiple settings per user

-- 1. First, let's see what constraints currently exist
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'game_settings' 
AND table_schema = 'public';

-- 2. Drop the incorrect constraint (user_id only)
ALTER TABLE public.game_settings 
DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;

-- 3. Add the correct constraint (user_id, setting_key)
ALTER TABLE public.game_settings 
ADD CONSTRAINT game_settings_user_id_setting_key_key 
UNIQUE (user_id, setting_key);

-- 4. Verify the new constraint
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'game_settings' 
AND table_schema = 'public';

-- 5. Test inserting multiple settings for the same user
INSERT INTO public.game_settings (user_id, setting_key, settings_data, updated_at)
VALUES ('test-user-123', 'setting_1', '{"value": "value1"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.game_settings (user_id, setting_key, settings_data, updated_at)
VALUES ('test-user-123', 'setting_2', '{"value": "value2"}', NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = EXCLUDED.updated_at;

-- 6. Verify both settings exist
SELECT * FROM public.game_settings WHERE user_id = 'test-user-123';

-- 7. Clean up test data
DELETE FROM public.game_settings WHERE user_id = 'test-user-123';
