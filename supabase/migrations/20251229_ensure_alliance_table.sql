CREATE TABLE IF NOT EXISTS alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    members TEXT [] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure RLS is disabled as it seems to be the intended design for this table per prev migrations
ALTER TABLE alliances DISABLE ROW LEVEL SECURITY;
-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_alliances_members ON alliances USING GIN (members);
-- Grant permissions if necessary (though service role bypasses this, good for completeness)
GRANT ALL ON alliances TO service_role;
GRANT ALL ON alliances TO postgres;
GRANT ALL ON alliances TO anon;
GRANT ALL ON alliances TO authenticated;