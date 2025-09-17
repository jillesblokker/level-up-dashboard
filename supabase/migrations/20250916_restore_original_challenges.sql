-- ==========================================
-- RESTORE ORIGINAL CHALLENGES MIGRATION
-- Replace generic challenges with user's original specific challenges
-- ==========================================

-- First, clear existing challenges
DELETE FROM public.challenges;

-- Insert the user's original challenges
INSERT INTO public.challenges (name, description, category, difficulty, xp, gold) VALUES

-- Push/Legs/Core Category
('Push-up (blue – chest, push-up board, 3 positions)', 'Place hands on the blue slots (left, middle, right), perform 12 push-ups per position.', 'Push/Legs/Core', 'medium', 50, 25),
('Push-up (green – triceps, push-up board, 3 positions)', 'Place hands on the green slots and perform 10 triceps push-ups per position.', 'Push/Legs/Core', 'medium', 50, 25),
('Goblet Squat (with dumbbell/barbell)', 'Hold a dumbbell in front of your chest, squat deeply with control.', 'Push/Legs/Core', 'medium', 50, 25),
('Lunges (left & right)', 'Step forward deeply, bend your back knee toward the floor, alternate legs.', 'Push/Legs/Core', 'medium', 50, 25),
('Crunch', 'Lie on your back, feet flat, curl up toward your knees.', 'Push/Legs/Core', 'easy', 30, 15),
('Plank', 'Support on forearms and toes, hold your body straight and core tight.', 'Push/Legs/Core', 'medium', 50, 25),

-- Pull/Shoulder/Core Category
('Australian Pull-up (under table)', 'Grip the table edge, pull chest to the edge, lower with control.', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Dumbbell Bent-Over Row', 'Lean forward, keep back straight, row dumbbells to your ribs.', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Push-up (yellow – shoulders, 3 positions)', 'Place hands on yellow slots, lower your head between your hands.', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Push-up (red – shoulders, 3 positions)', 'Use red slots, perform push-ups targeting shoulders.', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Side Plank (left & right)', 'Support on one forearm, lift hips high and hold – do both sides.', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Lying Leg Raise', 'Lie flat, raise legs up, lower slowly while keeping back flat.', 'Pull/Shoulder/Core', 'medium', 50, 25),

-- Legs/Arms/Core Category
('Squat (barbell or 2 dumbbells)', 'Hold weight on shoulders, squat deep with control.', 'Legs/Arms/Core', 'medium', 50, 25),
('Dumbbell Deadlift', 'Stand tall, bend at hips, lower dumbbells close to legs and lift.', 'Legs/Arms/Core', 'medium', 50, 25),
('Dumbbell Bicep Curl', 'Stand tall, curl dumbbells to shoulders, lower slowly.', 'Legs/Arms/Core', 'medium', 50, 25),
('Dumbbell Shoulder Press', 'Press dumbbells overhead while standing or seated.', 'Legs/Arms/Core', 'medium', 50, 25),
('Reverse Plank', 'Sit with legs extended, lift hips, support on heels and hands.', 'Legs/Arms/Core', 'medium', 50, 25),
('Crunch', 'Lie back, feet flat, lift shoulders off the floor.', 'Legs/Arms/Core', 'easy', 30, 15),

-- HIIT & Full Body Category
('Burpee', 'Squat, jump to plank, jump in, explode up – repeat.', 'HIIT & Full Body', 'hard', 75, 35),
('Mountain Climber', 'Start in high plank, run knees to chest quickly.', 'HIIT & Full Body', 'hard', 75, 35),
('Jump Squat', 'Squat down then jump explosively, land softly.', 'HIIT & Full Body', 'hard', 75, 35),
('Dumbbell Row (repeat)', 'Same as bent-over row – hinge and pull dumbbells to sides.', 'HIIT & Full Body', 'medium', 50, 25),
('Lunge (with dumbbells)', 'Step forward, keep torso upright, push back up.', 'HIIT & Full Body', 'medium', 50, 25),
('Push-up (your choice of board color)', 'Choose board color to target chest/triceps/shoulders.', 'HIIT & Full Body', 'medium', 50, 25);

-- Verify the restoration
SELECT 
    category,
    COUNT(*) as challenge_count,
    STRING_AGG(name, ', ') as challenges
FROM public.challenges 
GROUP BY category 
ORDER BY category;
