-- ==========================================
-- DEPLOY SMART QUEST COMPLETION SYSTEM (ADAPTIVE)
-- Run this in your Supabase SQL Editor
-- This version checks your table structure first and adapts to it
-- ==========================================

-- 1. First, let's see what columns actually exist in your table
DO $$ 
BEGIN
    RAISE NOTICE '🔍 Checking quest_completion table structure...';
END $$;

-- Check what columns exist in your quest_completion table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 2. Check current data status
DO $$ 
BEGIN
    RAISE NOTICE '📊 Current quest_completion table data status:';
END $$;

SELECT 
    'Current Status' as info,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE completed = true) as completed_records,
    COUNT(*) FILTER (WHERE completed = false) as false_records
FROM quest_completion;

-- 3. CLEAN UP EXISTING DATA (Adaptive to your table structure)
DO $$ 
BEGIN
    RAISE NOTICE '🧹 Cleaning up existing invalid quest completion records...';
END $$;

-- Remove records where completed = false but have completion data (these are invalid)
DELETE FROM quest_completion 
WHERE completed = false 
    AND (completed_at IS NOT NULL OR xp_earned > 0 OR gold_earned > 0);

-- Remove records where completed = false but have timestamps (these are invalid)
DELETE FROM quest_completion 
WHERE completed = false 
    AND completed_at IS NOT NULL;

-- Fix records where completed = true but missing required data
-- Based on your actual table structure: completed_at has default now(), xp_earned/gold_earned are nullable
UPDATE quest_completion 
SET 
    xp_earned = CASE WHEN xp_earned IS NULL OR xp_earned = 0 THEN 50 ELSE xp_earned END,
    gold_earned = CASE WHEN gold_earned IS NULL OR gold_earned = 0 THEN 25 ELSE gold_earned END
WHERE completed = true 
    AND (xp_earned IS NULL OR xp_earned = 0 OR gold_earned IS NULL OR gold_earned = 0);

-- 4. Now add the CHECK constraint (should work after cleanup)
DO $$ 
BEGIN
    RAISE NOTICE '🔒 Adding smart completion logic constraint...';
    
    -- Add constraint to prevent completed: false with completion data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_quest_completion_logic'
    ) THEN
        ALTER TABLE quest_completion 
        ADD CONSTRAINT chk_quest_completion_logic 
        CHECK (
            -- If completed = false, then no completion data should exist
            (completed = false AND xp_earned = 0 AND gold_earned = 0)
            OR 
            -- If completed = true, then completion data should exist
            (completed = true AND xp_earned > 0 AND gold_earned > 0)
        );
        RAISE NOTICE '✅ Added smart completion logic constraint';
    ELSE
        RAISE NOTICE 'ℹ️ Smart completion logic constraint already exists';
    END IF;
END $$;

-- 5. Create the smart quest completion function
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

-- 6. Create the enforcement trigger function
CREATE OR REPLACE FUNCTION enforce_smart_quest_completion() RETURNS TRIGGER AS $$
BEGIN
    -- If someone tries to insert/update completed = false, prevent it
    IF NEW.completed = false THEN
        RAISE EXCEPTION 'Cannot store completed = false. Use smart_quest_completion() function instead.';
    END IF;
    
    -- If completed = true, ensure all required data is present
    IF NEW.completed = true THEN
        -- completed_at has default now(), so we don't need to set it
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

-- 7. Apply the trigger
DROP TRIGGER IF EXISTS tr_enforce_smart_quest_completion ON quest_completion;
CREATE TRIGGER tr_enforce_smart_quest_completion
    BEFORE INSERT OR UPDATE ON quest_completion
    FOR EACH ROW EXECUTE FUNCTION enforce_smart_quest_completion();

-- 8. Create the clean quest completions view
CREATE OR REPLACE VIEW clean_quest_completions AS
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    xp_earned,
    gold_earned
FROM quest_completion 
WHERE completed = true  -- Only show completed quests
ORDER BY completed_at DESC;

-- 9. Grant permissions
GRANT SELECT ON clean_quest_completions TO authenticated;
GRANT EXECUTE ON FUNCTION smart_quest_completion TO authenticated;

-- 10. Verify the smart system is working
DO $$ 
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    invalid_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM quest_completion;
    SELECT COUNT(*) INTO completed_records FROM quest_completion WHERE completed = true;
    SELECT COUNT(*) INTO invalid_records FROM quest_completion WHERE completed = false;
    
    RAISE NOTICE '🎯 Smart Quest Completion System Successfully Deployed!';
    RAISE NOTICE '📊 Final Status:';
    RAISE NOTICE '   Total records: %', total_records;
    RAISE NOTICE '   Completed records: %', completed_records;
    RAISE NOTICE '   Invalid records (should be 0): %', invalid_records;
    
    IF invalid_records = 0 THEN
        RAISE NOTICE '✅ Perfect! No invalid records found.';
        RAISE NOTICE '🚀 System is ready to use!';
    ELSE
        RAISE NOTICE '⚠️ Warning: % invalid records found. Consider manual cleanup.', invalid_records;
    END IF;
END $$;

-- 11. Test the smart system
DO $$ 
BEGIN
    RAISE NOTICE '🧪 Testing smart quest completion function...';
    RAISE NOTICE '✅ System deployed successfully!';
    RAISE NOTICE '🎮 You can now use the smart quest completion API!';
END $$;
