-- ==========================================
-- DEBUG DATA ISSUES
-- ==========================================

-- 1. CHECK WHAT CHALLENGE CATEGORIES EXIST
SELECT DISTINCT category, COUNT(*) as count 
FROM public.challenges 
GROUP BY category
ORDER BY category;

-- 2. CHECK WHAT MILESTONE CATEGORIES EXIST  
SELECT DISTINCT category, COUNT(*) as count 
FROM public.milestones 
GROUP BY category
ORDER BY category;

-- 3. CHECK IF CHALLENGE_COMPLETION TABLE EXISTS AND HAS PROPER STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'challenge_completion'
ORDER BY ordinal_position;

-- 4. CHECK IF MILESTONE_COMPLETION TABLE EXISTS AND HAS PROPER STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'milestone_completion'
ORDER BY ordinal_position;

-- 5. CHECK RLS POLICIES ARE CORRECTLY SET
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('challenges', 'challenge_completion', 'milestones', 'milestone_completion')
ORDER BY tablename, policyname;

-- 6. TEST IF WE CAN SELECT FROM CHALLENGES (should return data)
SELECT id, name, category, difficulty FROM public.challenges LIMIT 5;

-- 7. TEST IF WE CAN SELECT FROM MILESTONES (should return data)
SELECT id, name, category FROM public.milestones LIMIT 5; 