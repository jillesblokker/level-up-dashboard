-- Diagnose the actual game_settings table structure
-- Run this to see what columns actually exist

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'game_settings'
) as table_exists;

-- 2. Show all columns in the table
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

-- 3. Show table constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'game_settings' 
AND table_schema = 'public';

-- 4. Show any data in the table
SELECT COUNT(*) as total_rows FROM public.game_settings;

-- 5. Show sample data (if any exists)
SELECT * FROM public.game_settings LIMIT 5;
