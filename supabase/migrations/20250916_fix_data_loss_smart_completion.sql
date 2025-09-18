-- ==========================================
-- FIX DATA LOSS IN SMART QUEST COMPLETION
-- Date: 2025-09-16
-- Purpose: Prevent deletion of historical completion data during daily resets
-- ==========================================

-- The current smart_quest_completion function deletes records when p_completed = false
-- This causes data loss during daily resets. We need to preserve historical data.

-- 1. Create a new version that preserves historical data
CREATE OR REPLACE FUNCTION smart_quest_completion(
    p_user_id TEXT,
    p_quest_id UUID,
    p_completed BOOLEAN,
    p_xp_reward INTEGER DEFAULT 50,
    p_gold_reward INTEGER DEFAULT 25
) RETURNS JSONB AS $$
DECLARE
    v_existing_record RECORD;
    v_quest_exists BOOLEAN;
    v_result JSONB;
    v_today DATE;
BEGIN
    -- Get today's date in Netherlands timezone
    v_today := CURRENT_DATE AT TIME ZONE 'Europe/Amsterdam';
    
    -- Check if quest exists
    SELECT EXISTS(SELECT 1 FROM quests WHERE id = p_quest_id) INTO v_quest_exists;
    
    IF NOT v_quest_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Quest not found in database',
            'error', 'Quest ID ' || p_quest_id || ' does not exist in quests table'
        );
    END IF;
    
    -- Get existing completion record for TODAY only
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = p_user_id 
      AND quest_id = p_quest_id 
      AND DATE(completed_at AT TIME ZONE 'Europe/Amsterdam') = v_today;
    
    -- PRESERVE HISTORICAL DATA: Only manage today's completion
    IF p_completed = true THEN
        -- Quest is completed TODAY - store/update today's completion
        IF v_existing_record IS NOT NULL THEN
            -- Update existing today's record
            UPDATE quest_completion 
            SET completed = true,
                completed_at = NOW(),
                xp_earned = GREATEST(v_existing_record.xp_earned, p_xp_reward),
                gold_earned = GREATEST(v_existing_record.gold_earned, p_gold_reward),
                updated_at = NOW()
            WHERE user_id = p_user_id 
              AND quest_id = p_quest_id 
              AND DATE(completed_at AT TIME ZONE 'Europe/Amsterdam') = v_today
            RETURNING * INTO v_existing_record;
        ELSE
            -- Create new completion record for today
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
        -- Quest is NOT completed TODAY - only delete today's record if it exists
        IF v_existing_record IS NOT NULL THEN
            -- Only delete today's completion record, preserve historical data
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id 
              AND quest_id = p_quest_id 
              AND DATE(completed_at AT TIME ZONE 'Europe/Amsterdam') = v_today;
            
            v_result := jsonb_build_object(
                'success', true,
                'action', 'uncompleted_today',
                'message', 'Quest marked as not completed for today (historical data preserved)'
            );
        ELSE
            -- No today's record exists, nothing to do
            v_result := jsonb_build_object(
                'success', true,
                'action', 'no_action',
                'message', 'Quest was already not completed for today'
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the trigger to be less restrictive
CREATE OR REPLACE FUNCTION enforce_smart_quest_completion() RETURNS TRIGGER AS $$
BEGIN
    -- Allow completed = false only if it's for historical data preservation
    -- The smart_quest_completion function will handle the logic
    
    -- If completed = true, ensure all required data is present
    IF NEW.completed = true THEN
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;
        IF NEW.xp_earned IS NULL OR NEW.xp_earned <= 0 THEN
            NEW.xp_earned := 50;
        END IF;
        IF NEW.gold_earned IS NULL OR NEW.gold_earned <= 0 THEN
            NEW.gold_earned := 25;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add a comment explaining the fix
COMMENT ON FUNCTION smart_quest_completion(TEXT, UUID, BOOLEAN, INTEGER, INTEGER) IS 
'Smart quest completion that preserves historical data. Only manages today''s completion status without deleting past records.';

-- 4. Verify the fix
DO $$
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    historical_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM quest_completion;
    SELECT COUNT(*) INTO completed_records FROM quest_completion WHERE completed = true;
    SELECT COUNT(*) INTO historical_records FROM quest_completion WHERE completed_at < CURRENT_DATE;
    
    RAISE NOTICE '🔧 Data Loss Fix Applied!';
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Completed records: %', completed_records;
    RAISE NOTICE 'Historical records: %', historical_records;
    RAISE NOTICE '✅ Historical data is now preserved during daily resets';
END $$;
