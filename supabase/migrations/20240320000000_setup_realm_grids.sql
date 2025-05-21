-- Create realm_grids table
CREATE TABLE IF NOT EXISTS public.realm_grids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grid integer[][] NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT false
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.realm_grids;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.realm_grids
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.realm_grids ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Anyone can view public grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Allow anonymous table check" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can insert their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can update their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can delete their own grids" ON public.realm_grids;

-- Create policies for realm_grids
-- Allow users to view their own grids
CREATE POLICY "Users can view their own grids"
    ON public.realm_grids
    FOR SELECT
    USING (auth.uid()::uuid = user_id);

-- Allow users to view public grids
CREATE POLICY "Anyone can view public grids"
    ON public.realm_grids
    FOR SELECT
    USING (is_public = true);

-- Allow anonymous users to check if table exists and perform basic operations
CREATE POLICY "Allow anonymous table check"
    ON public.realm_grids
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow users to insert their own grids
CREATE POLICY "Users can insert their own grids"
    ON public.realm_grids
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow users to update their own grids
CREATE POLICY "Users can update their own grids"
    ON public.realm_grids
    FOR UPDATE
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow users to delete their own grids
CREATE POLICY "Users can delete their own grids"
    ON public.realm_grids
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_id ON public.realm_grids(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_grids_version ON public.realm_grids(version);
CREATE INDEX IF NOT EXISTS idx_realm_grids_is_public ON public.realm_grids(is_public);

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON public.realm_grids TO authenticated;
GRANT ALL ON public.realm_grids TO anon;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE realm_grids_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realm_grids_id_seq TO anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon; 