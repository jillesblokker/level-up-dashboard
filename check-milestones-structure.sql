-- Check the actual structure of milestones table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'milestones'
ORDER BY ordinal_position;

-- Also check what existing data looks like
SELECT * FROM public.milestones LIMIT 3; 