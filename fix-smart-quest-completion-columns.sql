-- Fix smart_quest_completion function to remove references to non-existent columns
-- Run this directly in your Supabase SQL editor

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
    -- Validate that the quest exists in either quests OR challenges table (cast TEXT to UUID)
    SELECT EXISTS(
        SELECT 1 FROM quests WHERE id = p_quest_id::uuid
        UNION
        SELECT 1 FROM challenges WHERE id = p_quest_id::uuid
    ) INTO v_quest_exists;
    
    IF NOT v_quest_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Quest not found in database',
            'error', 'Quest ID ' || p_quest_id || ' does not exist in quests or challenges table'
        );
    END IF;
    
    -- Get existing completion record (cast TEXT to UUID for quest_id)
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid;
    
    -- SMART LOGIC: Only store meaningful completion states
    IF p_completed = true THEN
        -- Quest is completed - store completion data
        IF v_existing_record IS NOT NULL THEN
            -- Update existing record (only update columns that exist)
            UPDATE quest_completion 
            SET 
                completed = true,
                completed_at = COALESCE(v_existing_record.completed_at, NOW()),
                xp_earned = GREATEST(v_existing_record.xp_earned, p_xp_reward),
                gold_earned = GREATEST(v_existing_record.gold_earned, p_gold_reward)
            WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid
            RETURNING * INTO v_existing_record;
        ELSE
            -- Create new completion record (only use columns that exist)
            INSERT INTO quest_completion (
                user_id, quest_id, completed, completed_at, 
                xp_earned, gold_earned
            ) VALUES (
                p_user_id, p_quest_id::uuid, true, NOW(), 
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
            WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid;
            
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

-- Test the function to make sure it works
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Test with a fake quest ID to see if validation works
    SELECT smart_quest_completion('test_user', '00000000-0000-0000-0000-000000000000', true) INTO test_result;
    
    IF test_result->>'success' = 'false' THEN
        RAISE NOTICE '✅ Function validation works correctly: %', test_result->>'message';
    ELSE
        RAISE NOTICE '⚠️ Function validation may not be working: %', test_result;
    END IF;
END $$;

RAISE NOTICE '✅ Smart quest completion function updated successfully!';
RAISE NOTICE 'The function now only references columns that actually exist in the quest_completion table.';
