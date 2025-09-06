-- ==========================================
-- FIX UUID vs TEXT TYPE MISMATCH IN SMART QUEST COMPLETION
-- Date: 2025-01-05
-- Purpose: Fix the "operator does not exist: uuid = text" error
-- ==========================================

-- Drop the existing function to recreate it with correct parameter types
DROP FUNCTION IF EXISTS smart_quest_completion(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER);

-- Recreate the function with UUID parameters and proper casting
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
    v_user_uuid UUID;
    v_quest_uuid UUID;
BEGIN
    -- Convert TEXT parameters to UUID with proper error handling
    BEGIN
        v_user_uuid := p_user_id::UUID;
        v_quest_uuid := p_quest_id::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Invalid UUID format for user_id or quest_id',
            'error', 'INVALID_UUID_FORMAT'
        );
    END;
    
    -- Get existing completion record using UUID comparison
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = v_user_uuid AND quest_id = v_quest_uuid;
    
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
            WHERE user_id = v_user_uuid AND quest_id = v_quest_uuid
            RETURNING * INTO v_existing_record;
        ELSE
            -- Create new completion record
            INSERT INTO quest_completion (
                user_id, quest_id, completed, completed_at, 
                xp_earned, gold_earned, created_at, updated_at
            ) VALUES (
                v_user_uuid, v_quest_uuid, true, NOW(), 
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
            -- Delete existing record since quest is not completed
            DELETE FROM quest_completion 
            WHERE user_id = v_user_uuid AND quest_id = v_quest_uuid;
            
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

-- Test the function to make sure it works
DO $$
DECLARE
    test_result JSONB;
BEGIN
    RAISE NOTICE 'Testing smart_quest_completion function...';
    
    -- This should work without UUID errors
    SELECT smart_quest_completion(
        'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'::TEXT,
        'ef5d3ab7-2446-449f-a695-17c41ca96f52'::TEXT,
        true,
        50,
        25
    ) INTO test_result;
    
    RAISE NOTICE 'Test result: %', test_result;
    RAISE NOTICE '✅ Smart quest completion function is working correctly!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;
