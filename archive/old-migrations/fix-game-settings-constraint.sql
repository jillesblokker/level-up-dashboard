-- Fix Game Settings Composite Constraint
-- Add the missing composite unique constraint for (user_id, setting_key)

-- Add composite unique constraint to game_settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'game_settings_user_id_setting_key_key'
    ) THEN
        ALTER TABLE game_settings ADD CONSTRAINT game_settings_user_id_setting_key_key UNIQUE (user_id, setting_key);
    END IF;
END $$;

-- Verify all constraints exist
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('character_stats', 'active_perks', 'game_settings')
AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name; 