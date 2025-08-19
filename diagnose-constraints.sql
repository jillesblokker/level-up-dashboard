-- Comprehensive diagnostic for game_settings table
-- This will show us exactly what's happening

-- 1. Check all constraints on the table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'game_settings' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 2. Check the actual table structure
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

-- 3. Check what data currently exists
SELECT 
    id,
    user_id,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM public.game_settings
ORDER BY created_at;

-- 4. Check if there are any duplicate user_id entries
SELECT 
    user_id,
    COUNT(*) as count
FROM public.game_settings
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 5. Check if there are any duplicate (user_id, setting_key) entries
SELECT 
    user_id,
    setting_key,
    COUNT(*) as count
FROM public.game_settings
WHERE setting_key IS NOT NULL
GROUP BY user_id, setting_key
HAVING COUNT(*) > 1;
