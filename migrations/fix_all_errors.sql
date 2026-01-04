-- Comprehensive fix for missing tables and columns causing 500/400 errors
-- 1. FIX MONSTER SPAWNS TABLE
CREATE TABLE IF NOT EXISTS monster_spawns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    monster_type TEXT NOT NULL,
    spawned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    defeated BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE
);
-- Ensure columns exist (idempotent)
DO $$ BEGIN -- Add defeated
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'monster_spawns'
        AND column_name = 'defeated'
) THEN
ALTER TABLE monster_spawns
ADD COLUMN defeated BOOLEAN DEFAULT FALSE;
END IF;
-- Add reward_claimed
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'monster_spawns'
        AND column_name = 'reward_claimed'
) THEN
ALTER TABLE monster_spawns
ADD COLUMN reward_claimed BOOLEAN DEFAULT FALSE;
END IF;
END $$;
-- Enable RLS for monster_spawns
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;
-- Create policy for monster_spawns
DROP POLICY IF EXISTS "Users can manage their own monster spawns" ON monster_spawns;
CREATE POLICY "Users can manage their own monster spawns" ON monster_spawns USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
-- 2. FIX GOLD TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS gold_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    -- 'gain' or 'spend'
    source TEXT NOT NULL,
    -- e.g. 'reward', 'purchase'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS for gold_transactions
ALTER TABLE gold_transactions ENABLE ROW LEVEL SECURITY;
-- Create policy for gold_transactions
DROP POLICY IF EXISTS "Users can read their own gold transactions" ON gold_transactions;
CREATE POLICY "Users can read their own gold transactions" ON gold_transactions FOR
SELECT USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "Users can insert their own gold transactions" ON gold_transactions;
CREATE POLICY "Users can insert their own gold transactions" ON gold_transactions FOR
INSERT WITH CHECK (user_id = auth.uid()::text);
-- 3. FIX TILE INVENTORY TABLE
CREATE TABLE IF NOT EXISTS tile_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    tile_id TEXT NOT NULL,
    tile_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    name TEXT,
    cost INTEGER DEFAULT 0,
    connections JSONB DEFAULT '[]'::jsonb,
    rotation INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(user_id, tile_id)
);
-- Enable RLS for tile_inventory
ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY;
-- Create policy for tile_inventory
DROP POLICY IF EXISTS "Users can manage their own tile inventory" ON tile_inventory;
CREATE POLICY "Users can manage their own tile inventory" ON tile_inventory USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
-- Grant permissions if needed (usually handled by default, but ensuring service role has access)
GRANT ALL ON TABLE monster_spawns TO service_role;
GRANT ALL ON TABLE gold_transactions TO service_role;
GRANT ALL ON TABLE tile_inventory TO service_role;