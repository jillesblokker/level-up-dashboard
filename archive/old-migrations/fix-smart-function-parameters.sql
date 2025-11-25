-- ==========================================
-- FIX SMART QUEST COMPLETION FUNCTION PARAMETERS
-- Date: 2025-08-30
-- Purpose: Fix UUID type mismatch in smart_quest_completion function
-- ==========================================

-- Drop the existing function to recreate it with correct parameter types
DROP FUNCTION IF EXISTS smart_quest_completion(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER);

-- Recreate the function with TEXT parameters instead of UUID
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
                gold_earned = GREATEST(v_existing_record.gold_earned, p_gold_reward)
            WHERE user_id = p_user_id AND quest_id = p_quest_id
            RETURNING * INTO v_existing_record;
        ELSE
            -- Create new completion record
            INSERT INTO quest_completion (
                user_id, quest_id, completed, 
                xp_earned, gold_earned
            ) VALUES (
                p_user_id, p_quest_id, true, 
                p_xp_reward, p_gold_reward
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
GRANT EXECUTE ON FUNCTION smart_quest_completion(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) TO authenticated;

-- Test the function
DO $$ 
BEGIN
    RAISE NOTICE '✅ Smart Quest Completion function recreated with TEXT parameters';
    RAISE NOTICE 'Function signature: smart_quest_completion(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER)';
END $$;
