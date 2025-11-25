-- Fix the database constraint issue
-- This will allow multiple settings per user

-- 1. Drop the incorrect constraint (user_id only)
ALTER TABLE public.game_settings 
DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;

-- 2. Add the correct constraint (user_id, setting_key)
ALTER TABLE public.game_settings 
ADD CONSTRAINT game_settings_user_id_setting_key_key 
UNIQUE (user_id, setting_key);

-- 3. Verify the new constraint
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'game_settings' 
AND table_schema = 'public';
