-- Create user_preferences table for storing all user game preferences and settings
-- This will replace localStorage usage for game settings, preferences, and UI state

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of user_id and preference_key
    UNIQUE(user_id, preference_key)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON public.user_preferences(preference_key);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only access their own preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON public.user_preferences TO authenticated;
GRANT USAGE ON SEQUENCE public.user_preferences_id_seq TO authenticated;

-- Insert some default preferences for existing users (optional)
-- This can be run after the table is created to migrate existing localStorage data
