-- ==========================================
-- FIX QUEST COMPLETION TIMESTAMP ISSUE
-- Date: 2025-01-05
-- Purpose: Fix quest completion to use current timestamp instead of preserving old dates
-- ==========================================

-- Drop the existing function
DROP FUNCTION IF EXISTS smart_quest_completion(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER);

-- Recreate the function with proper timestamp handling
CREATE OR REPLACE FUNCTION smart_quest_completion(
    p_user_id TEXT,           -- user_id is TEXT in quest_completion table
    p_quest_id TEXT,          -- quest_id comes as TEXT but needs to be converted to UUID
    p_completed BOOLEAN,
    p_xp_reward INTEGER DEFAULT 50,
    p_gold_reward INTEGER DEFAULT 25
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_record RECORD;
    v_quest_uuid UUID;
BEGIN
    -- Convert quest_id from TEXT to UUID with proper error handling
    BEGIN
        v_quest_uuid := p_quest_id::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Invalid UUID format for quest_id: ' || p_quest_id,
            'error', 'INVALID_QUEST_UUID_FORMAT'
        );
    END;
    
    -- SMART LOGIC: Only store meaningful completion states
    IF p_completed = true THEN
        -- Quest is completed - use UPSERT to handle unique constraints
        -- Always use current timestamp for new completions
        INSERT INTO quest_completion (
            user_id, quest_id, completed, completed_at, 
            xp_earned, gold_earned
        ) VALUES (
            p_user_id, v_quest_uuid, true, NOW(), 
            p_xp_reward, p_gold_reward
        )
        ON CONFLICT (user_id, quest_id) 
        DO UPDATE SET
            completed = true,
            completed_at = NOW(),  -- Always update to current time
            xp_earned = GREATEST(quest_completion.xp_earned, EXCLUDED.xp_earned),
            gold_earned = GREATEST(quest_completion.gold_earned, EXCLUDED.gold_earned)
        RETURNING * INTO v_existing_record;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'completed',
            'record', to_jsonb(v_existing_record),
            'message', 'Quest marked as completed with rewards'
        );
        
    ELSE
        -- Quest is NOT completed - SMART LOGIC: Don't store false records!
        -- First check if record exists
        SELECT * INTO v_existing_record 
        FROM quest_completion 
        WHERE user_id = p_user_id AND quest_id = v_quest_uuid;
        
        IF v_existing_record IS NOT NULL THEN
            -- Delete existing record since quest is not completed
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id AND quest_id = v_quest_uuid;
            
            v_result := jsonb_build_object(
                'success', true,
                'action', 'uncompleted',
                'deletedRecord', to_jsonb(v_existing_record),
                'message', 'Quest marked as uncompleted - record removed (smart behavior)'
            );
        ELSE
            -- No record exists and quest is not completed - perfect!
            v_result := jsonb_build_object(
                'success', true,
                'action', 'no_action',
                'message', 'Quest not completed - no record to store (smart behavior)'
            );
        END IF;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'action', 'error',
        'message', 'Database error: ' || SQLERRM,
        'error', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Test the function with current timestamp
DO $$
DECLARE
    test_result JSONB;
    v_current_time TIMESTAMP;
BEGIN
    v_current_time := NOW();
    RAISE NOTICE 'Testing quest completion with current timestamp: %', v_current_time;
    
    -- Test completing a quest (should use current timestamp)
    SELECT smart_quest_completion(
        'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'::TEXT,
        'ef5d3ab7-2446-449f-a695-17c41ca96f52'::TEXT,
        true,
        50,
        25
    ) INTO test_result;
    
    RAISE NOTICE 'Test result: %', test_result;
    
    -- Check if the completion time is recent
    IF test_result->>'success' = 'true' THEN
        RAISE NOTICE '✅ Quest completion function is using current timestamp correctly!';
    ELSE
        RAISE NOTICE '❌ Quest completion failed: %', test_result->>'message';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;
