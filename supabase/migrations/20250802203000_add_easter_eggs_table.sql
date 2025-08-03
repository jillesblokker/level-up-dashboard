-- Create easter_eggs table
CREATE TABLE IF NOT EXISTS public.easter_eggs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    egg_id INTEGER NOT NULL,
    found BOOLEAN DEFAULT FALSE,
    found_at TIMESTAMP WITH TIME ZONE,
    position JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, egg_id)
);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.easter_eggs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.easter_eggs_id_seq TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.easter_eggs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.easter_eggs_id_seq TO authenticated;

-- Enable RLS
ALTER TABLE public.easter_eggs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own eggs" ON public.easter_eggs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own eggs" ON public.easter_eggs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own eggs" ON public.easter_eggs
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own eggs" ON public.easter_eggs
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_easter_eggs_user_id ON public.easter_eggs(user_id);
CREATE INDEX IF NOT EXISTS idx_easter_eggs_egg_id ON public.easter_eggs(egg_id);
CREATE INDEX IF NOT EXISTS idx_easter_eggs_found ON public.easter_eggs(found);

-- Set sequence owner
ALTER SEQUENCE public.easter_eggs_id_seq OWNED BY public.easter_eggs.id; 