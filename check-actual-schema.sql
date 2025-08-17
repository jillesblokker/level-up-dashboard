-- Check the actual schema of quest_completion table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- Check what data actually exists for your user
SELECT * FROM quest_completion 
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
ORDER BY completed_at DESC 
LIMIT 10;
