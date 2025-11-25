-- Check challenge_completion table structure and constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'challenge_completion' 
  AND table_schema = 'public';

-- Check all challenge completions for a specific user
-- Replace 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC' with your actual user ID
SELECT 
    id,
    user_id,
    challenge_id,
    completed,
    date,
    created_at
FROM challenge_completion
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
ORDER BY created_at DESC
LIMIT 20;

-- Check today's completions specifically
SELECT 
    id,
    user_id,
    challenge_id,
    completed,
    date,
    created_at
FROM challenge_completion
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
  AND date = CURRENT_DATE
ORDER BY created_at DESC;
