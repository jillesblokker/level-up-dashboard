-- Clean up old completion records that don't have proper date format
-- This will help with the daily tracking system

-- First, let's see what completion records exist
SELECT 
    'challenge_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN date IS NULL THEN 1 END) as null_dates,
    COUNT(CASE WHEN date IS NOT NULL THEN 1 END) as valid_dates,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM public.challenge_completion
UNION ALL
SELECT 
    'milestone_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN date IS NULL THEN 1 END) as null_dates,
    COUNT(CASE WHEN date IS NOT NULL THEN 1 END) as valid_dates,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM public.milestone_completion;

-- Show sample records
SELECT 'challenge_completion samples' as info;
SELECT user_id, challenge_id, completed, date, created_at 
FROM public.challenge_completion 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'milestone_completion samples' as info;
SELECT user_id, milestone_id, completed, date, created_at 
FROM public.milestone_completion 
ORDER BY created_at DESC 
LIMIT 5;

-- Clean up challenge completion records that don't have proper date format
-- Keep only records with valid dates (YYYY-MM-DD format)
DELETE FROM public.challenge_completion 
WHERE date IS NULL 
   OR date = '' 
   OR date !~ '^\d{4}-\d{2}-\d{2}$';

-- Clean up milestone completion records that don't have proper date format
DELETE FROM public.milestone_completion 
WHERE date IS NULL 
   OR date = '' 
   OR date !~ '^\d{4}-\d{2}-\d{2}$';

-- Show final counts
SELECT 'After cleanup - challenge_completion' as info;
SELECT COUNT(*) as remaining_records FROM public.challenge_completion;

SELECT 'After cleanup - milestone_completion' as info;
SELECT COUNT(*) as remaining_records FROM public.milestone_completion;
