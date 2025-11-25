-- Update legacy challenge categories to new workout plan categories
UPDATE challenges SET category = 'Push/Legs/Core' WHERE category = 'Push Day (Chest, Shoulders, Triceps)';
UPDATE challenges SET category = 'Pull/Shoulder/Core' WHERE category = 'Pull Day (Back, Biceps)';
UPDATE challenges SET category = 'Legs/Arms/Core' WHERE category = 'Leg Day';
