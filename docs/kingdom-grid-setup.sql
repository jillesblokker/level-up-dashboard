-- Create kingdom_grid table for saving kingdom building placements
CREATE TABLE IF NOT EXISTS public.kingdom_grid (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    grid JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add RLS policies for kingdom_grid table
ALTER TABLE public.kingdom_grid ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own kingdom grid
CREATE POLICY "Users can read their own kingdom grid" ON public.kingdom_grid
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own kingdom grid
CREATE POLICY "Users can insert their own kingdom grid" ON public.kingdom_grid
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own kingdom grid
CREATE POLICY "Users can update their own kingdom grid" ON public.kingdom_grid
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own kingdom grid
CREATE POLICY "Users can delete their own kingdom grid" ON public.kingdom_grid
    FOR DELETE USING (auth.uid() = user_id); 