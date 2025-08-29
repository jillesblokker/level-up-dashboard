-- ==========================================
-- SMART QUEST COMPLETION SYSTEM
-- Date: 2025-08-29
-- Purpose: Implement intelligent quest completion logic that prevents completed: false
-- ==========================================

-- 1. First, let's clean up any existing invalid records
DO $$ 
BEGIN
    RAISE NOTICE '🧹 Cleaning up invalid quest completion records...';
END $$;

-- Remove records where completed = false but have completion data (these are invalid)
DELETE FROM quest_completion 
WHERE completed = false 
    AND (completed_at IS NOT NULL OR xp_earned > 0 OR gold_earned > 0);

-- Remove records where completed = false but have timestamps (these are invalid)
DELETE FROM quest_completion 
WHERE completed = false 
    AND completed_at IS NOT NULL;

-- 2. Add a CHECK constraint to prevent completed: false with completion data
DO $$ 
BEGIN
    -- Add constraint to prevent completed: false with completion data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_quest_completion_logic'
    ) THEN
        ALTER TABLE quest_completion 
        ADD CONSTRAINT chk_quest_completion_logic 
        CHECK (
            -- If completed = false, then no completion data should exist
            (completed = false AND completed_at IS NULL AND xp_earned = 0 AND gold_earned = 0)
            OR 
            -- If completed = true, then completion data should exist
            (completed = true AND completed_at IS NOT NULL AND xp_earned > 0 AND gold_earned > 0)
        );
        RAISE NOTICE '✅ Added smart completion logic constraint';
    ELSE
        RAISE NOTICE 'ℹ️ Smart completion logic constraint already exists';
    END IF;
END $$;

-- 3. Create a function that intelligently handles quest completion
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

-- 4. Create a trigger that enforces the smart logic
CREATE OR REPLACE FUNCTION enforce_smart_quest_completion() RETURNS TRIGGER AS $$
BEGIN
    -- If someone tries to insert/update completed = false, prevent it
    IF NEW.completed = false THEN
        RAISE EXCEPTION 'Cannot store completed = false. Use smart_quest_completion() function instead.';
    END IF;
    
    -- If completed = true, ensure all required data is present
    IF NEW.completed = true THEN
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;
        IF NEW.xp_earned IS NULL OR NEW.xp_earned = 0 THEN
            NEW.xp_earned := 50; -- Default XP
        END IF;
        IF NEW.gold_earned IS NULL OR NEW.gold_earned = 0 THEN
            NEW.gold_earned := 25; -- Default gold
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply the trigger
DROP TRIGGER IF EXISTS tr_enforce_smart_quest_completion ON quest_completion;
CREATE TRIGGER tr_enforce_smart_quest_completion
    BEFORE INSERT OR UPDATE ON quest_completion
    FOR EACH ROW EXECUTE FUNCTION enforce_smart_quest_completion();

-- 6. Create a view for clean quest completion data
CREATE OR REPLACE VIEW clean_quest_completions AS
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
WHERE completed = true  -- Only show completed quests
ORDER BY completed_at DESC;

-- 7. Grant permissions
GRANT SELECT ON clean_quest_completions TO authenticated;
GRANT EXECUTE ON FUNCTION smart_quest_completion TO authenticated;

-- 8. Verify the smart system
DO $$ 
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    invalid_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM quest_completion;
    SELECT COUNT(*) INTO completed_records FROM quest_completion WHERE completed = true;
    SELECT COUNT(*) INTO invalid_records FROM quest_completion WHERE completed = false;
    
    RAISE NOTICE '🎯 Smart Quest Completion System Active!';
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Completed records: %', completed_records;
    RAISE NOTICE 'Invalid records (should be 0): %', invalid_records;
    
    IF invalid_records = 0 THEN
        RAISE NOTICE '✅ Perfect! No invalid records found.';
    ELSE
        RAISE NOTICE '⚠️ Warning: % invalid records found. Consider running cleanup.', invalid_records;
    END IF;
END $$;
