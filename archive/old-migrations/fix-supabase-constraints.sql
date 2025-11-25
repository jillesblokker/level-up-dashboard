-- Fix Supabase Constraints: Add missing unique constraints for migration
-- Run this in your Supabase SQL editor if the migration failed

-- 1. Add unique constraint to character_stats if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'character_stats_user_id_key'
    ) THEN
        ALTER TABLE character_stats ADD CONSTRAINT character_stats_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Add unique constraint to active_perks if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'active_perks_user_id_perk_name_key'
    ) THEN
        ALTER TABLE active_perks ADD CONSTRAINT active_perks_user_id_perk_name_key UNIQUE (user_id, perk_name);
    END IF;
END $$;

-- 3. Add unique constraint to game_settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'game_settings_user_id_setting_key_key'
    ) THEN
        ALTER TABLE game_settings ADD CONSTRAINT game_settings_user_id_setting_key_key UNIQUE (user_id, setting_key);
    END IF;
END $$;

-- 4. Verify the constraints exist
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('character_stats', 'active_perks', 'game_settings')
AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name; 