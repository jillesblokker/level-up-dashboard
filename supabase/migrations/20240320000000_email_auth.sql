-- Enable email authentication
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a table for storing user game data
CREATE TABLE IF NOT EXISTS public.user_game_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    game_progress JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Enable RLS on user_game_data
ALTER TABLE public.user_game_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user_game_data
CREATE POLICY "Users can view their own game data"
    ON public.user_game_data
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own game data"
    ON public.user_game_data
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game data"
    ON public.user_game_data
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_game_data (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create game data for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON public.user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_created_at ON public.user_game_data(created_at);
CREATE INDEX IF NOT EXISTS idx_user_game_data_updated_at ON public.user_game_data(updated_at); 