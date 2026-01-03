-- Add CHECK constraint to prevent negative inventory quantities
-- This is a safety net at the database level
-- First, ensure no existing negative quantities (set to 0)
UPDATE kingdom_inventory
SET quantity = 0
WHERE quantity < 0;
-- Add CHECK constraint to prevent future negative values
DO $$ BEGIN -- Check if constraint already exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kingdom_inventory_quantity_non_negative'
) THEN
ALTER TABLE kingdom_inventory
ADD CONSTRAINT kingdom_inventory_quantity_non_negative CHECK (quantity >= 0);
RAISE NOTICE 'Added non-negative constraint to kingdom_inventory.quantity';
ELSE RAISE NOTICE 'Constraint kingdom_inventory_quantity_non_negative already exists';
END IF;
END $$;
-- Similarly for character_stats build_tokens and streak_tokens
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'character_stats_build_tokens_non_negative'
) THEN
ALTER TABLE character_stats
ADD CONSTRAINT character_stats_build_tokens_non_negative CHECK (build_tokens >= 0);
RAISE NOTICE 'Added non-negative constraint to character_stats.build_tokens';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'character_stats_streak_tokens_non_negative'
) THEN
ALTER TABLE character_stats
ADD CONSTRAINT character_stats_streak_tokens_non_negative CHECK (streak_tokens >= 0);
RAISE NOTICE 'Added non-negative constraint to character_stats.streak_tokens';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'character_stats_gold_non_negative'
) THEN
ALTER TABLE character_stats
ADD CONSTRAINT character_stats_gold_non_negative CHECK (gold >= 0);
RAISE NOTICE 'Added non-negative constraint to character_stats.gold';
END IF;
END $$;
-- Add comment explaining the constraints
COMMENT ON CONSTRAINT kingdom_inventory_quantity_non_negative ON kingdom_inventory IS 'Ensures inventory quantities cannot go negative. Client code should check before decrementing.';