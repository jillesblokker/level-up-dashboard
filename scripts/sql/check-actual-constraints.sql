-- Check what constraints actually exist on game_settings table
-- This will show us the real problem

-- 1. Show all constraints on the table
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

-- 2. Show the current data
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;
