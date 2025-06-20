-- Apply all necessary migrations to Supabase database
-- This script creates all the missing tables that the app needs

-- 1. Create realm_grids table
CREATE TABLE IF NOT EXISTS public.realm_grids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grid integer[][] NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT false
);

-- 2. Create character_stats table
CREATE TABLE IF NOT EXISTS public.character_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    character_name TEXT DEFAULT 'Adventurer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('resource', 'item', 'creature', 'scroll', 'equipment', 'artifact', 'book', 'mount', 'weapon', 'shield', 'armor')),
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

-- 4. Create checked_quests table
CREATE TABLE IF NOT EXISTS public.checked_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    quest_id TEXT NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, quest_id)
);

-- 5. Create quest_stats table
CREATE TABLE IF NOT EXISTS public.quest_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- 6. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- 7. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create app_logs table
CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create game_settings table
CREATE TABLE IF NOT EXISTS public.game_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, setting_key)
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_realm_grids_updated_at
    BEFORE UPDATE ON public.realm_grids
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_character_stats_updated_at
    BEFORE UPDATE ON public.character_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_checked_quests_updated_at
    BEFORE UPDATE ON public.checked_quests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quest_stats_updated_at
    BEFORE UPDATE ON public.quest_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_achievements_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_game_settings_updated_at
    BEFORE UPDATE ON public.game_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security on all tables
ALTER TABLE public.realm_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checked_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for realm_grids
DROP POLICY IF EXISTS "Users can view their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can insert their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can update their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Users can delete their own grids" ON public.realm_grids;
DROP POLICY IF EXISTS "Allow anonymous table check" ON public.realm_grids;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own grids"
    ON public.realm_grids
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations (for app initialization)
CREATE POLICY "Allow anonymous operations"
    ON public.realm_grids
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for character_stats
DROP POLICY IF EXISTS "Users can manage their own character stats" ON public.character_stats;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own character stats"
    ON public.character_stats
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous character stats operations"
    ON public.character_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for inventory_items
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory_items;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own inventory"
    ON public.inventory_items
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous inventory operations"
    ON public.inventory_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for checked_quests
DROP POLICY IF EXISTS "Users can manage their own checked quests" ON public.checked_quests;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own checked quests"
    ON public.checked_quests
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous checked quests operations"
    ON public.checked_quests
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for quest_stats
DROP POLICY IF EXISTS "Users can manage their own quest stats" ON public.quest_stats;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own quest stats"
    ON public.quest_stats
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous quest stats operations"
    ON public.quest_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for achievements
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own achievements"
    ON public.achievements
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous achievements operations"
    ON public.achievements
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own notifications"
    ON public.notifications
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous notifications operations"
    ON public.notifications
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for app_logs
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.app_logs;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own logs"
    ON public.app_logs
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous logs operations"
    ON public.app_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for game_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.game_settings;

-- Allow authenticated users full access to their own data
CREATE POLICY "Authenticated users can manage their own settings"
    ON public.game_settings
    FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Allow anonymous users to perform basic operations
CREATE POLICY "Allow anonymous settings operations"
    ON public.game_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.realm_grids TO authenticated;
GRANT ALL ON public.realm_grids TO anon;
GRANT ALL ON public.character_stats TO authenticated;
GRANT ALL ON public.character_stats TO anon;
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO anon;
GRANT ALL ON public.checked_quests TO authenticated;
GRANT ALL ON public.checked_quests TO anon;
GRANT ALL ON public.quest_stats TO authenticated;
GRANT ALL ON public.quest_stats TO anon;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO anon;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.app_logs TO authenticated;
GRANT ALL ON public.app_logs TO anon;
GRANT ALL ON public.game_settings TO authenticated;
GRANT ALL ON public.game_settings TO anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_id ON public.realm_grids(user_id);
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checked_quests_user_id ON public.checked_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_stats_user_id ON public.quest_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON public.game_settings(user_id);

-- Success message
SELECT 'All tables created successfully!' as status; 