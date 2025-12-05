-- Debug script to check quest IDs and data types
-- Run this in Supabase SQL editor to understand the data structure

-- Check quests table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'quests' 
ORDER BY ordinal_position;

-- Check quest_completion table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- Check if the problematic quest ID exists
SELECT 
    id, 
    name, 
    category,
    pg_typeof(id) as id_type
FROM quests 
WHERE id = 'c134aea7-ae0e-4c15-a4b9-a12b8d02396b';

-- Check quest_completion records for this quest
SELECT 
    id,
    quest_id,
    user_id,
    completed,
    pg_typeof(quest_id) as quest_id_type
FROM quest_completion 
WHERE quest_id = 'c134aea7-ae0e-4c15-a4b9-a12b8d02396b';

-- Show sample quest IDs and their types
SELECT 
    id, 
    name,
    pg_typeof(id) as id_type
FROM quests 
LIMIT 5;
