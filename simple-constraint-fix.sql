-- Simple fix: Remove the conflicting constraints first
-- This will fix the Winter Festival toggle issue

-- 1. Drop the conflicting constraints (user_id only)
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_key;
ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_user_id_unique;

-- 2. Verify the constraints are gone
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

-- 3. Show current data
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;
