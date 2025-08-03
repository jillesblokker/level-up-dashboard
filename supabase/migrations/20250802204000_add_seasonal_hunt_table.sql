-- Create seasonal_hunt table
CREATE TABLE IF NOT EXISTS public.seasonal_hunt (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    event_key TEXT NOT NULL,
    found BOOLEAN DEFAULT FALSE,
    found_at TIMESTAMP WITH TIME ZONE,
    position JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, event_key)
);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.seasonal_hunt TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seasonal_hunt_id_seq TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.seasonal_hunt TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.seasonal_hunt_id_seq TO authenticated;

-- Enable RLS
ALTER TABLE public.seasonal_hunt ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own seasonal hunt items" ON public.seasonal_hunt
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own seasonal hunt items" ON public.seasonal_hunt
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own seasonal hunt items" ON public.seasonal_hunt
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own seasonal hunt items" ON public.seasonal_hunt
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasonal_hunt_user_id ON public.seasonal_hunt(user_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_hunt_item_id ON public.seasonal_hunt(item_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_hunt_event_key ON public.seasonal_hunt(event_key);
CREATE INDEX IF NOT EXISTS idx_seasonal_hunt_found ON public.seasonal_hunt(found);

-- Set sequence owner
ALTER SEQUENCE public.seasonal_hunt_id_seq OWNED BY public.seasonal_hunt.id; 