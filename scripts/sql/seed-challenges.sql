-- Insert basic workout challenges for each category
INSERT INTO challenges (name, description, category, difficulty, xp, gold) VALUES

-- Push Day (Chest, Shoulders, Triceps)
('Push-up', 'Start in high plank, keep core tight, lower to near-ground, push up (3x12)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Overhead Press', 'Stand tall, press dumbbells overhead, control the descent (3x10)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Tricep Dip', 'Sit on chair edge, lower body using arms, push back up (3x10)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Pike Push-up', 'Start in downward dog, lower head towards ground, push up (3x8)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Diamond Push-up', 'Make diamond with hands, perform push-up (3x8)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),

-- Pull Day (Back, Biceps)
('Pull-up', 'Hang from bar, pull up until chin over bar, lower with control (3x8)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Bent-over Row', 'Hinge at hips, pull dumbbells to your sides, squeeze shoulder blades (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Bicep Curl', 'Stand tall, curl dumbbells up, control the descent (3x15)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Reverse Fly', 'Hinge forward, spread arms wide with dumbbells, squeeze shoulder blades (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Hammer Curl', 'Hold dumbbells with neutral grip, curl up and down (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),

-- Leg Day
('Squat', 'Feet shoulder-width apart, lower hips back and down, drive through heels to stand (3x15)', 'Leg Day', 'medium', 50, 25),
('Lunge', 'Step forward into lunge, push back to starting position (3x10 per leg)', 'Leg Day', 'medium', 50, 25),
('Calf Raise', 'Rise up on toes, hold briefly, lower slowly (3x20)', 'Leg Day', 'medium', 50, 25),
('Glute Bridge', 'Lie on back, drive hips up, squeeze glutes at top (3x15)', 'Leg Day', 'medium', 50, 25),
('Wall Sit', 'Back against wall, slide down to 90-degree angle, hold (3x45 sec)', 'Leg Day', 'medium', 50, 25),

-- Core & Flexibility
('Plank', 'Hold high plank position, keep core tight, breathe steady (3x45 sec)', 'Core & Flexibility', 'medium', 50, 25),
('Russian Twist', 'Sit with legs up, twist torso side to side (3x20)', 'Core & Flexibility', 'medium', 50, 25),
('Dead Bug', 'Lie on back, extend opposite arm and leg, return to start (3x10 per side)', 'Core & Flexibility', 'medium', 50, 25),
('Cat-Cow Stretch', 'On hands and knees, arch and round your spine slowly (2x10)', 'Core & Flexibility', 'easy', 30, 15),
('Child Pose', 'Kneel and sit back on heels, reach arms forward (2x30 sec)', 'Core & Flexibility', 'easy', 30, 15),

-- HIIT & Full Body
('Burpee', 'Squat, jump to plank, jump in, explode up – repeat (3x15)', 'HIIT & Full Body', 'hard', 75, 35),
('Mountain Climber', 'Start in high plank, run knees to chest quickly (3x30 sec)', 'HIIT & Full Body', 'hard', 75, 35),
('Jump Squat', 'Squat down then jump explosively, land softly (3x20)', 'HIIT & Full Body', 'hard', 75, 35),
('Full Body Push-up', 'Choose board color to target chest/triceps/shoulders (3x12)', 'HIIT & Full Body', 'medium', 50, 25); 