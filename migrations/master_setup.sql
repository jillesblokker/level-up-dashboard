-- MASTER SETUP SCRIPT FOR THRIVEHAVEN / LEVEL UP
-- This script initializes all core tables and functions with the correct schema
-- and security settings (RLS disabled for Clerk compatibility).
-- 0. Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- 1. CHARACTER STATS
CREATE TABLE IF NOT EXISTS character_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    gold INTEGER DEFAULT 0,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    title TEXT DEFAULT 'Novice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE character_stats DISABLE ROW LEVEL SECURITY;
-- 2. QUESTS (Definitions)
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    -- NULL for global/template quests
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'medium',
    xp_reward INTEGER DEFAULT 50,
    gold_reward INTEGER DEFAULT 25,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT true,
    recurrence_interval TEXT DEFAULT 'daily',
    sender_id TEXT,
    -- ID of ally who sent the quest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE quests DISABLE ROW LEVEL SECURITY;
-- 3. QUEST COMPLETION (Tracking)
CREATE TABLE IF NOT EXISTS quest_completion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    quest_id UUID REFERENCES quests(id),
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    xp_earned INTEGER DEFAULT 0,
    gold_earned INTEGER DEFAULT 0
);
ALTER TABLE quest_completion DISABLE ROW LEVEL SECURITY;
-- 4. USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    -- 'quest_received', 'quest_completed_ally', 'achievement', etc
    title TEXT,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
-- 6. SMART QUEST COMPLETION RPC
-- Atomically handles XP/Gold rewards when a quest is completed/uncompleted
CREATE OR REPLACE FUNCTION smart_quest_completion(
        p_user_id TEXT,
        p_quest_id UUID,
        p_completed BOOLEAN
    ) RETURNS JSONB AS $$
DECLARE v_xp INTEGER;
v_gold INTEGER;
v_result JSONB;
BEGIN -- 1. Get rewards from quest definition
SELECT xp_reward,
    gold_reward INTO v_xp,
    v_gold
FROM quests
WHERE id = p_quest_id;
IF v_xp IS NULL THEN v_xp := 50;
END IF;
IF v_gold IS NULL THEN v_gold := 25;
END IF;
IF p_completed THEN -- INSERT COMPLETION & ADD STATS
INSERT INTO quest_completion (
        user_id,
        quest_id,
        completed,
        xp_earned,
        gold_earned
    )
VALUES (p_user_id, p_quest_id, true, v_xp, v_gold);
UPDATE character_stats
SET experience = experience + v_xp,
    gold = gold + v_gold,
    updated_at = NOW()
WHERE user_id = p_user_id;
ELSE -- DELETE COMPLETION & REVOKE STATS (Last 24h only to prevent infinite neg stats)
DELETE FROM quest_completion
WHERE user_id = p_user_id
    AND quest_id = p_quest_id
    AND completed_at > (NOW() - INTERVAL '24 hours');
UPDATE character_stats
SET experience = GREATEST(0, experience - v_xp),
    gold = GREATEST(0, gold - v_gold),
    updated_at = NOW()
WHERE user_id = p_user_id;
END IF;
SELECT jsonb_build_object('success', true, 'xp', v_xp, 'gold', v_gold) INTO v_result;
RETURN v_result;
EXCEPTION
WHEN OTHERS THEN
SELECT jsonb_build_object('success', false, 'error', SQLERRM) INTO v_result;
RETURN v_result;
END;
$$ LANGUAGE plpgsql;
-- 7. ALLIANCE STREAKS TABLE (Phase 3)
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    alliance_id TEXT,
    current_streak INTEGER DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, alliance_id)
);
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
-- 8. ALLIANCES TABLE (Phase 3)
CREATE TABLE IF NOT EXISTS alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    members TEXT [] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE alliances DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alliances_members ON alliances USING GIN (members);