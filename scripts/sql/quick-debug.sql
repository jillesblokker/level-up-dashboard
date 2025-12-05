-- Quick check of what categories exist vs what frontend expects

-- 1. Current challenge categories in database
SELECT DISTINCT category, COUNT(*) as count 
FROM public.challenges 
GROUP BY category
ORDER BY category;

-- 2. Current milestones categories  
SELECT DISTINCT category, COUNT(*) as count 
FROM public.milestones 
GROUP BY category
ORDER BY category; 