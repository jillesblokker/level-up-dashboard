-- ==========================================
-- FIX CHALLENGE CATEGORIES TO MATCH FRONTEND
-- ==========================================

-- Update challenge categories to match what the frontend expects
-- Frontend expects: Push/Legs/Core, Pull/Shoulder/Core, Core & Flexibility, HIIT & Full Body

-- Update Push Day challenges to Push/Legs/Core
UPDATE public.challenges 
SET category = 'Push/Legs/Core' 
WHERE category = 'Push Day (Chest, Shoulders, Triceps)';

-- Update Pull Day challenges to Pull/Shoulder/Core  
UPDATE public.challenges 
SET category = 'Pull/Shoulder/Core' 
WHERE category = 'Pull Day (Back, Biceps)';

-- Update Leg Day challenges to Push/Legs/Core (since legs are part of push/legs/core)
UPDATE public.challenges 
SET category = 'Push/Legs/Core' 
WHERE category = 'Leg Day';

-- Core & Flexibility and HIIT & Full Body should already be correct

-- Verify the changes
SELECT DISTINCT category, COUNT(*) as count 
FROM public.challenges 
GROUP BY category
ORDER BY category;
