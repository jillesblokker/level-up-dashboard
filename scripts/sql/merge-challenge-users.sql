-- Merge challenge completion data from old user ID to current user ID
-- This will combine all challenge data under one user account

-- First, let's see what we're working with
SELECT 
    'Current challenge completion data' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM challenge_completion;

-- Show the different user IDs
SELECT 
    user_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM challenge_completion 
GROUP BY user_id;

-- Update all challenge completion records to use the current user ID
-- Replace 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC' with your actual current user ID if different
UPDATE challenge_completion 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id != 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';

-- Verify the update
SELECT 
    'After merge - challenge completion data' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM challenge_completion;

-- Show the final state
SELECT 
    user_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM challenge_completion 
GROUP BY user_id;

-- Also check milestone completion data
SELECT 
    'Milestone completion data' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM milestone_completion;

-- Update milestone completion records too if needed
UPDATE milestone_completion 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id != 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';

-- Final verification
SELECT 
    'Final state - all completion data' as info,
    'challenge_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM challenge_completion
UNION ALL
SELECT 
    'Final state - all completion data' as info,
    'milestone_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM milestone_completion;
