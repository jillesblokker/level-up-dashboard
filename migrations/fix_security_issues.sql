/*
 Fix Security Advisor Issues
 1. Enable RLS on all identified tables.
 2. Ensure basic RLS policies exist (User-Private or Public-Read).
 3. Configure Views to security_invoker (Invoker rights) to respect RLS.
 */
-- 1. Configure Views
ALTER VIEW IF EXISTS public.clean_quest_completions
SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_quest_progress
SET (security_invoker = true);
ALTER VIEW IF EXISTS public.view_leaderboard_tiles
SET (security_invoker = true);
ALTER VIEW IF EXISTS public.view_leaderboard_quests_monthly
SET (security_invoker = true);
-- 2. Define Helper for User-Owned Tables
-- (Drops existing policy of given name to ensure update, then creates/enables)
CREATE OR REPLACE PROCEDURE enable_rls_and_create_user_policy(t_name TEXT, policy_name TEXT) LANGUAGE plpgsql AS $$ BEGIN -- Enable RLS
    EXECUTE 'ALTER TABLE IF EXISTS ' || t_name || ' ENABLE ROW LEVEL SECURITY';
-- Drop policy if exists
EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON ' || t_name;
-- Create policy (Allows SELECT, INSERT, UPDATE, DELETE for owner)
-- Matches user_id column to the authenticated user's ID
EXECUTE 'CREATE POLICY "' || policy_name || '" ON ' || t_name || ' FOR ALL USING (user_id = current_setting(''request.jwt.claim.sub'', true))';
END;
$$;
-- 3. Apply to User-Specific Tables
CALL enable_rls_and_create_user_policy(
    'notifications',
    'Users manage own notifications'
);
CALL enable_rls_and_create_user_policy(
    'quest_completion',
    'Users manage own quest completions'
);
CALL enable_rls_and_create_user_policy(
    'challenge_completion',
    'Users manage own challenge completions'
);
CALL enable_rls_and_create_user_policy('realm_tiles', 'Users manage own realm tiles');
CALL enable_rls_and_create_user_policy(
    'kingdom_tile_inventory',
    'Users manage own kingdom inventory'
);
CALL enable_rls_and_create_user_policy('character_stats', 'Users manage own stats');
CALL enable_rls_and_create_user_policy(
    'creature_interactions',
    'Users manage own creature interactions'
);
CALL enable_rls_and_create_user_policy(
    'quest_progress',
    'Users manage own quest progress'
);
CALL enable_rls_and_create_user_policy(
    'milestone_progress',
    'Users manage own milestone progress'
);
CALL enable_rls_and_create_user_policy(
    'user_preferences',
    'Users manage own preferences'
);
CALL enable_rls_and_create_user_policy('kingdom_event_log', 'Users view own logs');
-- 4. Shared / Public Tables policies
-- Quests (Public Read, Auth Write - being safe)
ALTER TABLE IF EXISTS quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Quests" ON quests;
CREATE POLICY "Public Read Quests" ON quests FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated Manage Quests" ON quests;
CREATE POLICY "Authenticated Manage Quests" ON quests FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Challenges (Public Read, Auth Write)
ALTER TABLE IF EXISTS challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Challenges" ON challenges;
CREATE POLICY "Public Read Challenges" ON challenges FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated Manage Challenges" ON challenges;
CREATE POLICY "Authenticated Manage Challenges" ON challenges FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Alliances (Allow all authenticated for now to avoid breakage)
ALTER TABLE IF EXISTS alliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Alliances" ON alliances;
CREATE POLICY "Authenticated Alliances" ON alliances FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Realm Data (Legacy? Allow all authenticated)
ALTER TABLE IF EXISTS realm_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Realm Data" ON realm_data;
CREATE POLICY "Authenticated Realm Data" ON realm_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Clean up
DROP PROCEDURE enable_rls_and_create_user_policy;