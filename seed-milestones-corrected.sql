-- ==========================================
-- SEED MILESTONES WITH CORRECT COLUMN NAMES
-- ==========================================

-- 🎯 SEED MILESTONES DATA (using correct structure: name, description, category, user_id, experience, gold)
INSERT INTO public.milestones (name, description, category, user_id, experience, gold) VALUES
-- Might category
('300 Pushups in One Day', 'Complete 300 pushups in a single day', 'might', NULL, 500, 250),
('Plank for 3 Minutes', 'Hold a plank for 3 minutes straight', 'might', NULL, 300, 150),
('Complete 100 Workouts', 'Complete 100 workout sessions', 'might', NULL, 1000, 500),
('Deadlift Your Body Weight', 'Successfully deadlift your own body weight', 'might', NULL, 400, 200),
('Run a Half Marathon', 'Complete a 13.1 mile run', 'might', NULL, 800, 400),

-- Knowledge category  
('365 Days of Learning', 'Learn something new every day for a year', 'knowledge', NULL, 2000, 1000),
('Read 50 Books', 'Read 50 books this year', 'knowledge', NULL, 1500, 750),
('Master a New Language', 'Achieve conversational fluency in a new language', 'knowledge', NULL, 2500, 1250),
('Complete an Online Course', 'Finish a comprehensive online course or certification', 'knowledge', NULL, 600, 300),
('Attend 20 Workshops', 'Participate in 20 educational workshops or seminars', 'knowledge', NULL, 1000, 500),

-- Honor category
('365 Acts of Kindness', 'Perform one act of kindness every day for a year', 'honor', NULL, 1800, 900),
('Volunteer 100 Hours', 'Volunteer 100 hours for a good cause', 'honor', NULL, 1200, 600),
('Mentor Someone', 'Actively mentor someone for 6+ months', 'honor', NULL, 800, 400),
('Environmental Warrior', 'Complete 50 eco-friendly actions', 'honor', NULL, 600, 300),

-- Castle category
('Organize Life Completely', 'Organize every area of your living space', 'castle', NULL, 600, 300),
('Build Something with Your Hands', 'Complete a major DIY project', 'castle', NULL, 800, 400),
('Garden Master', 'Successfully grow and harvest 10 different plants', 'castle', NULL, 500, 250),
('Home Chef', 'Cook every meal at home for 30 consecutive days', 'castle', NULL, 400, 200),

-- Craft category
('Master a Musical Instrument', 'Learn to play a song perfectly on an instrument', 'craft', NULL, 1000, 500),
('Create 50 Recipes', 'Create and perfect 50 original recipes', 'craft', NULL, 1200, 600),
('Photography Portfolio', 'Create a portfolio of 100 high-quality photos', 'craft', NULL, 800, 400),
('Write a Short Story', 'Complete and edit a 5,000+ word short story', 'craft', NULL, 600, 300),

-- Vitality category
('Run 1000 Miles', 'Run a total of 1000 miles', 'vitality', NULL, 2000, 1000),
('Perfect Sleep for 30 Days', 'Get 8+ hours of quality sleep for 30 consecutive days', 'vitality', NULL, 600, 300),
('Meditate for 365 Days', 'Meditate every day for a full year', 'vitality', NULL, 1800, 900),
('Yoga Master', 'Complete 100 yoga sessions', 'vitality', NULL, 800, 400),
('Stress-Free Month', 'Practice stress management techniques daily for 30 days', 'vitality', NULL, 500, 250),
('Drink Water Champion', 'Drink 8+ glasses of water daily for 100 days', 'vitality', NULL, 400, 200)

ON CONFLICT (name, category) DO NOTHING;

-- ✅ VERIFY RESULTS
SELECT COUNT(*) as milestones_count FROM public.milestones; 