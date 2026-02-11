CREATE TABLE IF NOT EXISTS active_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    effect TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT
);
ALTER TABLE active_modifiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own modifiers" ON active_modifiers;
CREATE POLICY "Users can manage their own modifiers" ON active_modifiers FOR ALL USING (auth.uid() = user_id);