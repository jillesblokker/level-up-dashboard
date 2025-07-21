-- ==========================================
-- FIX CHALLENGE CATEGORIES TO MATCH FRONTEND
-- ==========================================

-- Update challenge categories to match the frontend workout plan categories
UPDATE public.challenges 
SET category = 'Push/Legs/Core'
WHERE category = 'Push Day (Chest, Shoulders, Triceps)';

UPDATE public.challenges 
SET category = 'Pull/Shoulder/Core'
WHERE category = 'Pull Day (Back, Biceps)';

UPDATE public.challenges 
SET category = 'Legs/Arms/Core'
WHERE category = 'Leg Day';

UPDATE public.challenges 
SET category = 'Legs/Arms/Core'
WHERE category = 'Core & Flexibility';

UPDATE public.challenges 
SET category = 'HIIT & Full Body'
WHERE category = 'HIIT & Full Body';

-- ✅ VERIFY UPDATED CATEGORIES
SELECT DISTINCT category, COUNT(*) as count 
FROM public.challenges 
GROUP BY category
ORDER BY category; 