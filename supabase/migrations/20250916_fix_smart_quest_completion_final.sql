-- Final fix for smart_quest_completion function
-- Remove references to non-existent created_at and updated_at columns

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

    -- Check if completion record already exists
    SELECT * INTO v_existing_record
    FROM quest_completion 
    WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid;

    IF p_completed THEN
        -- Mark as completed
        IF v_existing_record IS NULL THEN
            -- Insert new completion record
            INSERT INTO quest_completion (user_id, quest_id, completed, xp_earned, gold_earned)
            VALUES (p_user_id, p_quest_id::uuid, true, p_xp_reward, p_gold_reward);
            
            RETURN jsonb_build_object(
                'success', true,
                'action', 'inserted',
                'message', 'Quest marked as completed',
                'xp_earned', p_xp_reward,
                'gold_earned', p_gold_reward
            );
        ELSE
            -- Update existing record
            UPDATE quest_completion 
            SET completed = true, xp_earned = p_xp_reward, gold_earned = p_gold_reward
            WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid;
            
            RETURN jsonb_build_object(
                'success', true,
                'action', 'updated',
                'message', 'Quest completion updated',
                'xp_earned', p_xp_reward,
                'gold_earned', p_gold_reward
            );
        END IF;
    ELSE
        -- Mark as incomplete (delete the record)
        IF v_existing_record IS NOT NULL THEN
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id AND quest_id = p_quest_id::uuid;
            
            RETURN jsonb_build_object(
                'success', true,
                'action', 'deleted',
                'message', 'Quest marked as incomplete',
                'deletedRecord', jsonb_build_object(
                    'quest_id', p_quest_id,
                    'user_id', p_user_id
                )
            );
        ELSE
            RETURN jsonb_build_object(
                'success', true,
                'action', 'no_change',
                'message', 'Quest was already incomplete'
            );
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Database error occurred',
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;
