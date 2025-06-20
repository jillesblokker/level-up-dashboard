-- Final Migration Script for Clerk Authentication
-- This script drops all existing game tables and recreates them with the correct schema,
-- using TEXT for user_id to support Clerk's string-based User IDs.

-- Drop existing tables in reverse order of creation to handle dependencies
DROP TABLE IF EXISTS public.game_settings;
DROP TABLE IF EXISTS public.app_logs;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.achievements;
DROP TABLE IF EXISTS public.quest_stats;
DROP TABLE IF EXISTS public.checked_quests;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.character_stats;
DROP TABLE IF EXISTS public.realm_grids;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create realm_grids table
CREATE TABLE public.realm_grids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    grid integer[][] NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_id ON public.realm_grids(user_id);
DROP TRIGGER IF EXISTS set_realm_grids_updated_at ON public.realm_grids;
CREATE TRIGGER set_realm_grids_updated_at BEFORE UPDATE ON public.realm_grids FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create character_stats table
CREATE TABLE public.character_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Changed from UUID to TEXT for Clerk
    gold INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    character_name TEXT DEFAULT 'Adventurer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);
DROP TRIGGER IF EXISTS set_character_stats_updated_at ON public.character_stats;
CREATE TRIGGER set_character_stats_updated_at BEFORE UPDATE ON public.character_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create inventory_items table
CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    emoji TEXT,
    image TEXT,
    stats JSONB,
    equipped BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER set_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create checked_quests table
CREATE TABLE public.checked_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    quest_id TEXT NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_checked_quests_user_id ON public.checked_quests(user_id);
DROP TRIGGER IF EXISTS set_checked_quests_updated_at ON public.checked_quests;
CREATE TRIGGER set_checked_quests_updated_at BEFORE UPDATE ON public.checked_quests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Create quest_stats table
CREATE TABLE public.quest_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    quest_id TEXT NOT NULL,
    quest_name TEXT NOT NULL,
    category TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_quest_stats_user_id ON public.quest_stats(user_id);
DROP TRIGGER IF EXISTS set_quest_stats_updated_at ON public.quest_stats;
CREATE TRIGGER set_quest_stats_updated_at BEFORE UPDATE ON public.quest_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Create achievements table
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
DROP TRIGGER IF EXISTS set_achievements_updated_at ON public.achievements;
CREATE TRIGGER set_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create app_logs table
CREATE TABLE public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);

-- 10. Create game_settings table
CREATE TABLE public.game_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, setting_key)
);
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON public.game_settings(user_id);
DROP TRIGGER IF EXISTS set_game_settings_updated_at ON public.game_settings;
CREATE TRIGGER set_game_settings_updated_at BEFORE UPDATE ON public.game_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS and set policies for all tables
-- Loop through all tables and set up policies
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
            'realm_grids', 'character_stats', 'inventory_items', 'checked_quests', 'quest_stats', 
            'achievements', 'notifications', 'app_logs', 'game_settings'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Policy for authenticated users to manage their own data, using the JWT 'sub' claim for Clerk user ID
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage their own data" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Authenticated users can manage their own data" ON public.%I FOR ALL USING ((auth.jwt() ->> ''sub'') = user_id) WITH CHECK ((auth.jwt() ->> ''sub'') = user_id);', t);
        
        -- Policy for allowing read access to server-side processes that might not have a user session
        EXECUTE format('DROP POLICY IF EXISTS "Allow service_role read access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Allow service_role read access" ON public.%I FOR SELECT USING (auth.role() = ''service_role'');', t);
    END LOOP;
END;
$$;

-- Grant schema and table permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

SELECT 'Final migration script for Clerk completed successfully!' as status; 