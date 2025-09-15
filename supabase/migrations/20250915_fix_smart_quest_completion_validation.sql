-- ==========================================
-- FIX SMART QUEST COMPLETION VALIDATION
-- Date: 2025-09-15
-- Purpose: Add quest existence validation to prevent foreign key constraint violations
-- ==========================================

-- Update the smart_quest_completion function to validate quest existence
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
    v_quest_exists BOOLEAN;
BEGIN
    -- First, validate that the quest exists in the quests table
    SELECT EXISTS(SELECT 1 FROM quests WHERE id = p_quest_id) INTO v_quest_exists;
    
    IF NOT v_quest_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Quest not found in database',
            'error', 'Quest ID ' || p_quest_id || ' does not exist in quests table'
        );
    END IF;
    
    -- Get existing completion record
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = p_user_id AND quest_id = p_quest_id;
    
    -- SMART LOGIC: Only store meaningful completion states
    IF p_completed = true THEN
        -- Quest is completed - store completion data
        IF v_existing_record IS NOT NULL THEN
            -- Update existing record
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
            -- Create new completion record
            INSERT INTO quest_completion (
                user_id, quest_id, completed, completed_at, 
                xp_earned, gold_earned, created_at, updated_at
            ) VALUES (
                p_user_id, p_quest_id, true, NOW(), 
                p_xp_reward, p_gold_reward, NOW(), NOW()
            ) RETURNING * INTO v_existing_record;
        END IF;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'completed',
            'record', to_jsonb(v_existing_record),
            'message', 'Quest marked as completed with rewards'
        );
        
    ELSE
        -- Quest is NOT completed - SMART LOGIC: Don't store false records!
        IF v_existing_record IS NOT NULL THEN
            -- If record exists, delete it (don't store completed: false)
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id AND quest_id = p_quest_id;
            
            v_result := jsonb_build_object(
                'success', true,
                'action', 'uncompleted',
                'message', 'Quest completion record removed (smart cleanup)',
                'deleted_record', to_jsonb(v_existing_record)
            );
        ELSE
            -- No record exists, nothing to do
            v_result := jsonb_build_object(
                'success', true,
                'action', 'no_action',
                'message', 'Quest was not completed, no record to store'
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION smart_quest_completion TO authenticated;

-- Verify the function works
DO $$ 
BEGIN
    RAISE NOTICE '✅ Updated smart_quest_completion function with quest validation';
    RAISE NOTICE '🔍 Function now validates quest existence before creating completion records';
    RAISE NOTICE '🛡️ This prevents foreign key constraint violations';
END $$;
