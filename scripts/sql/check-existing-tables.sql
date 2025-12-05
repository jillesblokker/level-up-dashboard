-- Check what tables already exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'character_stats',
  'quest_progress', 
  'challenge_progress',
  'milestone_progress',
  'kingdom_grid'
)
ORDER BY table_name;

-- Check the structure of existing tables
\dt+ character_stats;
\dt+ quest_progress;
\dt+ challenge_progress;
\dt+ milestone_progress;
\dt+ kingdom_grid;

-- Check if tables have the right columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
  'character_stats',
  'quest_progress',
  'challenge_progress', 
  'milestone_progress',
  'kingdom_grid'
)
ORDER BY table_name, ordinal_position;
