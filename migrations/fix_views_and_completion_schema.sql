-- 1. Drop dependent views (Cascade or Explicit)
DROP VIEW IF EXISTS user_quest_progress CASCADE;
DROP VIEW IF EXISTS clean_quest_completions CASCADE;

-- 2. Drop the Foreign Key Constraint (Critical step!)
-- We cannot have a FK to 'quests' if we store both UUIDs and non-UUID numbers in this column.
-- Also TEXT column cannot FK to UUID column.
ALTER TABLE quest_completion DROP CONSTRAINT IF EXISTS fk_quest;

-- 3. Alter table schema - This is the core fix for UUID support
-- We change quest_id to TEXT to allow alphanumeric IDs (UUIDs)
ALTER TABLE quest_completion ALTER COLUMN quest_id TYPE text;

-- 3a. Ensure required columns exist (Fixes 'column does not exist' errors)
ALTER TABLE quest_completion ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE quest_completion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE quest_completion ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE quest_completion ADD COLUMN IF NOT EXISTS gold_earned INTEGER DEFAULT 0;

-- 3. Recreate clean_quest_completions View
CREATE VIEW clean_quest_completions AS
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    xp_earned,
    gold_earned,
    created_at,
    updated_at
FROM quest_completion 
WHERE completed = true
ORDER BY completed_at DESC;

-- 4. Grant Select on clean_quest_completions
GRANT SELECT ON clean_quest_completions TO authenticated;

-- 5. Recreate user_quest_progress View (Simple fallback)
CREATE VIEW user_quest_progress AS
SELECT 
    user_id,
    quest_id,
    completed,
    completed_at
FROM quest_completion;

-- 6. Update Smart Quest Completion Function (Ensure it handles TEXT IDs)
CREATE OR REPLACE FUNCTION smart_quest_completion(
    p_user_id TEXT,
    p_quest_id TEXT,
    p_completed BOOLEAN,
    p_xp_reward INTEGER DEFAULT 50,
    p_gold_reward INTEGER DEFAULT 25
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_record RECORD;
BEGIN
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = p_user_id AND quest_id = p_quest_id;
    
    IF p_completed = true THEN
        IF v_existing_record IS NOT NULL THEN
            UPDATE quest_completion 
            SET 
                completed = true,
                completed_at = COALESCE(v_existing_record.completed_at, NOW()),
                xp_earned = GREATEST(v_existing_record.xp_earned, p_xp_reward),
                gold_earned = GREATEST(v_existing_record.gold_earned, p_gold_reward),
                updated_at = NOW()
            WHERE user_id = p_user_id AND quest_id = p_quest_id
            RETURNING * INTO v_existing_record;
        ELSE
            INSERT INTO quest_completion (
                user_id, quest_id, completed, completed_at, 
                xp_earned, gold_earned, created_at, updated_at
            ) VALUES (
                p_user_id, p_quest_id, true, NOW(), 
                p_xp_reward, p_gold_reward, NOW(), NOW()
            ) RETURNING * INTO v_existing_record;
        END IF;
        
        -- Also Update Character Stats (Simple addition)
        UPDATE character_stats
        SET experience = experience + p_xp_reward,
            gold = gold + p_gold_reward
        WHERE user_id = p_user_id;

        v_result := jsonb_build_object(
            'success', true,
            'action', 'completed',
            'record', to_jsonb(v_existing_record)
        );
        
    ELSE
        -- Uncomplete -> Delete Record (Smart Cleanup)
        IF v_existing_record IS NOT NULL THEN
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id AND quest_id = p_quest_id;
            
            -- Deduct Stats? (Optional, implies reverting rewards)
            UPDATE character_stats
            SET experience = GREATEST(0, experience - p_xp_reward),
                gold = GREATEST(0, gold - p_gold_reward)
            WHERE user_id = p_user_id;

            v_result := jsonb_build_object(
                'success', true,
                'action', 'uncompleted'
            );
        ELSE
            v_result := jsonb_build_object('success', true, 'action', 'no_action');
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
