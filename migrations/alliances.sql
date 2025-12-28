CREATE TABLE IF NOT EXISTS alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    members TEXT [] DEFAULT '{}',
    -- Array of user_ids
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE alliances DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alliances_members ON alliances USING GIN (members);