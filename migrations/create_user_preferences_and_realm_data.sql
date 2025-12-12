-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- Create realm_data table for storing realm/map state
CREATE TABLE IF NOT EXISTS realm_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    data_key TEXT NOT NULL,
    data_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data_key)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_realm_data_user_id ON realm_data(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_data_key ON realm_data(data_key);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE realm_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid()::text = user_id);

-- RLS Policies for realm_data
CREATE POLICY "Users can view their own realm data"
    ON realm_data FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own realm data"
    ON realm_data FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own realm data"
    ON realm_data FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own realm data"
    ON realm_data FOR DELETE
    USING (auth.uid()::text = user_id);
