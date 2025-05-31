-- Insert default quests into QuestCompletionLog table
INSERT INTO "QuestCompletionLog" (
  "questName",
  "description",
  "category",
  "difficulty",
  "rewards",
  "progress",
  "completed",
  "isNew",
  "isAI"
) VALUES
  -- Might category
  ('300x Pushups', 'Complete 300 pushups', 'might', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Plank 3:00', 'Hold a plank for 3 minutes', 'might', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Walk', 'Go for a walk', 'might', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),

  -- Knowledge category
  ('Spanish', 'Practice Spanish', 'knowledge', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Duo Piano', 'Practice piano on Duolingo', 'knowledge', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Mindpal', 'Complete Mindpal exercises', 'knowledge', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Quick Typing', 'Practice typing speed', 'knowledge', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Read 5 Minutes', 'Read for at least 5 minutes', 'knowledge', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Vitamin D', 'Get some vitamin D', 'knowledge', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('24 Draw Lesson', 'Complete a drawing lesson', 'knowledge', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Daily Hype 4 Academy', 'Complete daily academy tasks', 'knowledge', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),

  -- Honor category
  ('Wake Up Before 10', 'Wake up before 10 AM', 'honor', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Toothbrushing', 'Brush your teeth', 'honor', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Handwriting', 'Practice handwriting', 'honor', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Shave', 'Shave', 'honor', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Barber', 'Visit the barber', 'honor', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),

  -- Castle category
  ('Dishwasher', 'Empty the dishwasher', 'castle', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Diaper Bin', 'Empty the diaper bin', 'castle', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Vacuuming', 'Vacuum the house', 'castle', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Water Plants', 'Water the plants', 'castle', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Bed Laundry', 'Do the bed laundry', 'castle', 'medium', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Trash Bin at the Road', 'Take out the trash', 'castle', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Paper on the Road', 'Take out the paper', 'castle', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),

  -- Craft category
  ('Doodle', 'Create a doodle', 'craft', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Animate', 'Create an animation', 'craft', 'hard', '{"xp": 50, "gold": 25}', 0, false, true, false),

  -- Vitality category
  ('Battubby', 'Take a bath', 'vitality', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false),
  ('Mango Food Fill', 'Eat a mango', 'vitality', 'easy', '{"xp": 50, "gold": 25}', 0, false, true, false); 