CREATE TABLE IF NOT EXISTS active_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    effect TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT
);
ALTER TABLE active_modifiers DISABLE ROW LEVEL SECURITY;