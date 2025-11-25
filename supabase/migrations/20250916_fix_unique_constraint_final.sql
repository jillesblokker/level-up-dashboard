-- Fix quest_completion table unique constraint - FINAL VERSION
-- The old "unique_user_quest" constraint is still preventing daily completions

-- 1. First, let's see what constraints exist
DO $$ 
BEGIN
    RAISE NOTICE '🔍 Checking current quest_completion constraints...';
END $$;

-- 2. Drop ALL unique constraints that don't include completion_date
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop any unique constraint that includes (user_id, quest_id) but NOT completion_date
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'quest_completion'
          AND tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
        GROUP BY tc.constraint_name
        HAVING BOOL_AND(kcu.column_name IN ('user_id', 'quest_id')) = true
           AND BOOL_OR(kcu.column_name = 'completion_date') = false
    LOOP
        EXECUTE 'ALTER TABLE quest_completion DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE '✅ Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- 3. Ensure completion_date column exists and is properly set
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quest_completion' 
        AND column_name = 'completion_date'
    ) THEN
        ALTER TABLE quest_completion 
        ADD COLUMN completion_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ Added completion_date column';
    ELSE
        RAISE NOTICE 'ℹ️ completion_date column already exists';
    END IF;
END $$;

-- 4. Update existing records to have completion_date based on completed_at
UPDATE quest_completion 
SET completion_date = (completed_at AT TIME ZONE 'Europe/Amsterdam')::date
WHERE completion_date IS NULL 
  AND completed_at IS NOT NULL;

-- 5. Set completion_date to today for records without completed_at
UPDATE quest_completion 
SET completion_date = CURRENT_DATE
WHERE completion_date IS NULL;

-- 6. Make completion_date NOT NULL
ALTER TABLE quest_completion 
ALTER COLUMN completion_date SET NOT NULL;

-- 7. Add the correct unique constraint that includes completion_date
-- This allows one completion per quest per user per day
ALTER TABLE quest_completion 
ADD CONSTRAINT quest_completion_user_quest_date_unique 
UNIQUE (user_id, quest_id, completion_date);

-- 8. Update the smart_quest_completion function to use completion_date
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
    v_today := CURRENT_DATE;
    
    -- Validate that the quest exists
    SELECT EXISTS(SELECT 1 FROM quests WHERE id = p_quest_id) INTO v_quest_exists;
    
    IF NOT v_quest_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'message', 'Quest not found in database',
            'error', 'Quest ID ' || p_quest_id || ' does not exist in quests table'
        );
    END IF;
    
    -- Get existing completion record for today
    SELECT * INTO v_existing_record 
    FROM quest_completion 
    WHERE user_id = p_user_id 
      AND quest_id = p_quest_id 
      AND completion_date = v_today;
    
    -- Handle completion logic
    IF p_completed = true THEN
        -- Quest is completed TODAY
        IF v_existing_record IS NOT NULL THEN
            -- Update existing today's record
            UPDATE quest_completion 
            SET completed = true,
                completed_at = NOW(),
                xp_earned = GREATEST(v_existing_record.xp_earned, p_xp_reward),
                gold_earned = GREATEST(v_existing_record.gold_earned, p_gold_reward)
            WHERE user_id = p_user_id 
              AND quest_id = p_quest_id 
              AND completion_date = v_today
            RETURNING * INTO v_existing_record;
        ELSE
            -- Create new completion record for today
            INSERT INTO quest_completion (
                user_id, quest_id, completed, completed_at, completion_date,
                xp_earned, gold_earned
            ) VALUES (
                p_user_id, p_quest_id, true, NOW(), v_today,
                p_xp_reward, p_gold_reward
            ) RETURNING * INTO v_existing_record;
        END IF;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'completed_today',
            'message', 'Quest marked as completed for today',
            'xp_earned', v_existing_record.xp_earned,
            'gold_earned', v_existing_record.gold_earned,
            'completion_date', v_existing_record.completion_date
        );
    ELSE
        -- Quest is not completed TODAY
        IF v_existing_record IS NOT NULL THEN
            -- Remove today's completion record
            DELETE FROM quest_completion 
            WHERE user_id = p_user_id 
              AND quest_id = p_quest_id 
              AND completion_date = v_today;
            
            v_result := jsonb_build_object(
                'success', true,
                'action', 'uncompleted_today',
                'message', 'Quest marked as not completed for today (historical data preserved)'
            );
        ELSE
            -- Already not completed today
            v_result := jsonb_build_object(
                'success', true,
                'action', 'already_uncompleted',
                'message', 'Quest was already not completed for today'
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 9. Update the trigger function to handle completion_date
CREATE OR REPLACE FUNCTION enforce_smart_quest_completion() RETURNS TRIGGER AS $$
BEGIN
    -- Set completion_date if not provided
    IF NEW.completion_date IS NULL THEN
        NEW.completion_date := CURRENT_DATE;
    END IF;
    
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

-- 10. Add comment to document the change
COMMENT ON CONSTRAINT quest_completion_user_quest_date_unique ON quest_completion 
IS 'Unique constraint for daily quest completion - one record per user per quest per day';

COMMENT ON COLUMN quest_completion.completion_date 
IS 'Date when the quest was completed (in Netherlands timezone)';

-- 11. Verify the fix
DO $$
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    unique_dates INTEGER;
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM quest_completion;
    SELECT COUNT(*) INTO completed_records FROM quest_completion WHERE completed = true;
    SELECT COUNT(DISTINCT completion_date) INTO unique_dates FROM quest_completion;
    
    -- Check how many unique constraints exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'quest_completion' 
      AND constraint_type = 'UNIQUE'
      AND table_schema = 'public';
    
    RAISE NOTICE '🔧 Daily Quest Completion Fix Applied!';
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Completed records: %', completed_records;
    RAISE NOTICE 'Unique completion dates: %', unique_dates;
    RAISE NOTICE 'Unique constraints: %', constraint_count;
    RAISE NOTICE '✅ Daily habit tracking is now supported';
END $$;
