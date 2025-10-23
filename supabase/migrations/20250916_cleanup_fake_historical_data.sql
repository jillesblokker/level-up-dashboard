-- Clean up fake historical data created by the restoration API
-- This removes completion records that were artificially created for testing

-- 1. Show what we're about to delete
DO $$
DECLARE
    fake_records INTEGER;
    real_records INTEGER;
BEGIN
    -- Count records created by the restoration API (they have completion_date but no real completed_at)
    SELECT COUNT(*) INTO fake_records
    FROM quest_completion 
    WHERE completion_date IS NOT NULL 
      AND completed_at = (completion_date || 'T12:00:00.000Z')::timestamp;
    
    -- Count real records (different completed_at from the restoration pattern)
    SELECT COUNT(*) INTO real_records
    FROM quest_completion 
    WHERE completion_date IS NOT NULL 
      AND completed_at != (completion_date || 'T12:00:00.000Z')::timestamp;
    
    RAISE NOTICE '🔍 Found % fake records (restoration API created)', fake_records;
    RAISE NOTICE '🔍 Found % real records (user completed)', real_records;
END $$;

-- 2. Delete fake records created by restoration API
DELETE FROM quest_completion 
WHERE completion_date IS NOT NULL 
  AND completed_at = (completion_date || 'T12:00:00.000Z')::timestamp;

-- 3. Show cleanup results
DO $$
DECLARE
    remaining_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_records FROM quest_completion;
    RAISE NOTICE '✅ Cleanup complete! Remaining records: %', remaining_records;
    RAISE NOTICE '🎯 Only real user completions remain';
END $$;
