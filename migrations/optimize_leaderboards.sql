-- OPTIMIZATION: Leaderboard Views
-- Moves heavy counting logic from the API (Node.js) to the Database (PostgreSQL)
-- This prevents memory crashes when users have thousands of tiles/quests.
-- 1. Tiles Leaderboard View
-- Calculates total tiles placed per user
CREATE OR REPLACE VIEW view_leaderboard_tiles AS
SELECT user_id,
    COUNT(*) as tile_count
FROM realm_tiles
GROUP BY user_id;
-- 2. Monthly Quests View
-- Calculates quests completed THIS MONTH per user
CREATE OR REPLACE VIEW view_leaderboard_quests_monthly AS
SELECT user_id,
    COUNT(*) as quest_count
FROM quest_completion
WHERE completed_at >= date_trunc('month', NOW())
GROUP BY user_id;
-- Grant access to these views (standard Supabase setup)
ALTER VIEW view_leaderboard_tiles OWNER TO postgres;
ALTER VIEW view_leaderboard_quests_monthly OWNER TO postgres;
GRANT SELECT ON view_leaderboard_tiles TO anon,
    authenticated,
    service_role;
GRANT SELECT ON view_leaderboard_quests_monthly TO anon,
    authenticated,
    service_role;