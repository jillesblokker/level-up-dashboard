-- Diagnose quest_completion table structure
-- Run this in your Supabase SQL editor to see what columns actually exist

-- 1. Check the actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 2. Check if there are any constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.quest_completion'::regclass;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'quest_completion';

-- 4. Check sample data (if any exists)
SELECT COUNT(*) as total_records FROM quest_completion;

-- 5. Show a sample record structure (if data exists)
SELECT * FROM quest_completion LIMIT 1;

-- 6. Check if the smart_quest_completion function exists
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'smart_quest_completion';
