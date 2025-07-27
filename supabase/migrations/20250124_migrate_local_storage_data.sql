-- Migration: Migrate localStorage data to Supabase with Clerk compatibility
-- This migration creates tables for data currently stored in localStorage
-- Following the checklist for Clerk free plan limitations

-- =====================================================
-- 1. CREATE REALM_GRIDS TABLE
-- =====================================================

-- Create realm_grids table with proper structure
CREATE TABLE IF NOT EXISTS public.realm_grids (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL, -- Using text for Clerk compatibility
    grid_data jsonb,
    character_position jsonb,
    is_current boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, is_current)
);

-- Create indexes for realm_grids
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_id ON public.realm_grids(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_grids_current ON public.realm_grids(is_current) WHERE is_current = true;

-- Enable RLS for realm_grids (temporarily disabled for Clerk compatibility)
-- ALTER TABLE public.realm_grids ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for realm_grids (temporarily disabled)
-- CREATE POLICY "Users can view their own grids"
--     ON public.realm_grids
--     FOR SELECT
--     USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert their own grids"
--     ON public.realm_grids
--     FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update their own grids"
--     ON public.realm_grids
--     FOR UPDATE
--     USING (auth.uid()::text = user_id)
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete their own grids"
--     ON public.realm_grids
--     FOR DELETE
--     USING (auth.uid()::text = user_id);

-- =====================================================
-- 2. CREATE NEW TABLES FOR LOCALSTORAGE DATA
-- =====================================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL UNIQUE,
    preferences_data jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS for user_preferences (temporarily disabled for Clerk compatibility)
-- ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences (temporarily disabled)
-- CREATE POLICY "Users can view their own preferences"
--     ON public.user_preferences
--     FOR SELECT
--     USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert their own preferences"
--     ON public.user_preferences
--     FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update their own preferences"
--     ON public.user_preferences
--     FOR UPDATE
--     USING (auth.uid()::text = user_id)
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete their own preferences"
--     ON public.user_preferences
--     FOR DELETE
--     USING (auth.uid()::text = user_id);

-- Create tile_inventory table
CREATE TABLE IF NOT EXISTS public.tile_inventory (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL,
    tile_type text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    cost integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tile_type)
);

-- Create indexes for tile_inventory
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_id ON public.tile_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_inventory_tile_type ON public.tile_inventory(tile_type);

-- Enable RLS for tile_inventory (temporarily disabled for Clerk compatibility)
-- ALTER TABLE public.tile_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tile_inventory (temporarily disabled)
-- CREATE POLICY "Users can view their own tile inventory"
--     ON public.tile_inventory
--     FOR SELECT
--     USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert their own tile inventory"
--     ON public.tile_inventory
--     FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update their own tile inventory"
--     ON public.tile_inventory
--     FOR UPDATE
--     USING (auth.uid()::text = user_id)
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete their own tile inventory"
--     ON public.tile_inventory
--     FOR DELETE
--     USING (auth.uid()::text = user_id);

-- Create image_descriptions table
CREATE TABLE IF NOT EXISTS public.image_descriptions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL,
    image_path text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, image_path)
);

-- Create indexes for image_descriptions
CREATE INDEX IF NOT EXISTS idx_image_descriptions_user_id ON public.image_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_image_descriptions_image_path ON public.image_descriptions(image_path);

-- Enable RLS for image_descriptions (temporarily disabled for Clerk compatibility)
-- ALTER TABLE public.image_descriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for image_descriptions (temporarily disabled)
-- CREATE POLICY "Users can view their own image descriptions"
--     ON public.image_descriptions
--     FOR SELECT
--     USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert their own image descriptions"
--     ON public.image_descriptions
--     FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update their own image descriptions"
--     ON public.image_descriptions
--     FOR UPDATE
--     USING (auth.uid()::text = user_id)
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete their own image descriptions"
--     ON public.image_descriptions
--     FOR DELETE
--     USING (auth.uid()::text = user_id);

-- Create game_settings table
CREATE TABLE IF NOT EXISTS public.game_settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL UNIQUE,
    settings_data jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for game_settings
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON public.game_settings(user_id);

-- Enable RLS for game_settings (temporarily disabled for Clerk compatibility)
-- ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for game_settings (temporarily disabled)
-- CREATE POLICY "Users can view their own game settings"
--     ON public.game_settings
--     FOR SELECT
--     USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert their own game settings"
--     ON public.game_settings
--     FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update their own game settings"
--     ON public.game_settings
--     FOR UPDATE
--     USING (auth.uid()::text = user_id)
--     WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete their own game settings"
--     ON public.game_settings
--     FOR DELETE
--     USING (auth.uid()::text = user_id);

-- =====================================================
-- 3. CREATE MIGRATION FUNCTIONS
-- =====================================================

-- Function to migrate user localStorage data
CREATE OR REPLACE FUNCTION migrate_user_local_storage_data(
    p_user_id text,
    p_grid_data jsonb DEFAULT NULL,
    p_character_position jsonb DEFAULT NULL,
    p_tile_inventory jsonb DEFAULT NULL,
    p_user_preferences jsonb DEFAULT NULL,
    p_image_descriptions jsonb DEFAULT NULL,
    p_game_settings jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb := '{}';
    grid_id bigint;
    pref_id bigint;
    settings_id bigint;
BEGIN
    -- Migrate grid data
    IF p_grid_data IS NOT NULL THEN
        INSERT INTO public.realm_grids (user_id, grid_data, is_current)
        VALUES (p_user_id, p_grid_data, true)
        ON CONFLICT (user_id, is_current)
        DO UPDATE SET 
            grid_data = EXCLUDED.grid_data,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO grid_id;
        
        result := jsonb_set(result, '{grid_id}', to_jsonb(grid_id));
    END IF;

    -- Migrate character position
    IF p_character_position IS NOT NULL THEN
        UPDATE public.realm_grids 
        SET character_position = p_character_position,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = p_user_id AND is_current = true;
    END IF;

    -- Migrate tile inventory
    IF p_tile_inventory IS NOT NULL THEN
        -- Delete existing inventory for this user
        DELETE FROM public.tile_inventory WHERE user_id = p_user_id;
        
        -- Insert new inventory items
        INSERT INTO public.tile_inventory (user_id, tile_type, quantity, cost)
        SELECT 
            p_user_id,
            (value->>'type')::text,
            (value->>'owned')::integer,
            (value->>'cost')::integer
        FROM jsonb_each(p_tile_inventory)
        WHERE value->>'type' IS NOT NULL;
    END IF;

    -- Migrate user preferences
    IF p_user_preferences IS NOT NULL THEN
        INSERT INTO public.user_preferences (user_id, preferences_data)
        VALUES (p_user_id, p_user_preferences)
        ON CONFLICT (user_id)
        DO UPDATE SET 
            preferences_data = EXCLUDED.preferences_data,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO pref_id;
        
        result := jsonb_set(result, '{preferences_id}', to_jsonb(pref_id));
    END IF;

    -- Migrate image descriptions
    IF p_image_descriptions IS NOT NULL THEN
        -- Delete existing descriptions for this user
        DELETE FROM public.image_descriptions WHERE user_id = p_user_id;
        
        -- Insert new descriptions
        INSERT INTO public.image_descriptions (user_id, image_path, description)
        SELECT 
            p_user_id,
            key,
            value::text
        FROM jsonb_each(p_image_descriptions);
    END IF;

    -- Migrate game settings
    IF p_game_settings IS NOT NULL THEN
        INSERT INTO public.game_settings (user_id, settings_data)
        VALUES (p_user_id, p_game_settings)
        ON CONFLICT (user_id)
        DO UPDATE SET 
            settings_data = EXCLUDED.settings_data,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO settings_id;
        
        result := jsonb_set(result, '{settings_id}', to_jsonb(settings_id));
    END IF;

    RETURN result;
END;
$$;

-- Grant execute permission on the migration function
GRANT EXECUTE ON FUNCTION migrate_user_local_storage_data TO authenticated;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for new tables
GRANT ALL ON public.realm_grids TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.tile_inventory TO authenticated;
GRANT ALL ON public.image_descriptions TO authenticated;
GRANT ALL ON public.game_settings TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_current ON public.realm_grids(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_type ON public.tile_inventory(user_id, tile_type);
CREATE INDEX IF NOT EXISTS idx_image_descriptions_user_path ON public.image_descriptions(user_id, image_path); 