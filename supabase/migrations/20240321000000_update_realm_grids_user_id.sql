-- Change user_id column type from UUID to TEXT
ALTER TABLE public.realm_grids 
  ALTER COLUMN user_id TYPE TEXT;

-- Add is_public column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'realm_grids' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE public.realm_grids 
        ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Update RLS policies to use TEXT comparison
DROP POLICY IF EXISTS "Users can view their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can insert their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can update their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can delete their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Anyone can view public grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Allow anonymous table check" ON public.realm_grids;

-- Recreate policies with TEXT comparison
CREATE POLICY "Users can view their own grids"
    ON public.realm_grids
    FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can view public grids"
    ON public.realm_grids
    FOR SELECT
    USING (is_public = true);

CREATE POLICY "Allow anonymous table check"
    ON public.realm_grids
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can insert their own grids"
    ON public.realm_grids
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own grids"
    ON public.realm_grids
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own grids"
    ON public.realm_grids
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- Recreate index for user_id
DROP INDEX IF EXISTS idx_realm_grids_user_id;
CREATE INDEX idx_realm_grids_user_id ON public.realm_grids(user_id); 