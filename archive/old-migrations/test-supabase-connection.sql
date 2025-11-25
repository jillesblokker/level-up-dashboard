-- Simple test to check Supabase connection
-- Run this first to see if the connection works

-- Test 1: Check if we can query existing tables
SELECT 'connection_test' as status, NOW() as timestamp;

-- Test 2: Check if character_stats table exists (should work)
SELECT COUNT(*) as character_stats_count FROM character_stats LIMIT 1;

-- Test 3: Check if kingdom_grid table exists (should work)
SELECT COUNT(*) as kingdom_grid_count FROM kingdom_grid LIMIT 1;

-- Test 4: List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
