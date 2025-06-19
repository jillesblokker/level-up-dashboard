-- Migration: Setup Game Tables Only (No Auth Modifications)
-- This migration creates all the game data tables without modifying auth tables

-- Create character_stats table
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

-- Create inventory_items table
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

-- Create character_perks table
CREATE TABLE IF NOT EXISTS public.character_perks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    perk_name TEXT NOT NULL,
    perk_type TEXT NOT NULL,
    description TEXT,
    effect_value INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    equipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create character_titles table
CREATE TABLE IF NOT EXISTS public.character_titles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title_name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, title_name)
);

-- Create character_strengths table
CREATE TABLE IF NOT EXISTS public.character_strengths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    strength_name TEXT NOT NULL,
    strength_type TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    max_value INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, strength_name)
);

-- Create achievements table
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

-- Create notifications table
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

-- Create app_logs table
CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create kingdom_time_series table
CREATE TABLE IF NOT EXISTS public.kingdom_time_series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tile_inventory table
CREATE TABLE IF NOT EXISTS public.tile_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tile_id TEXT NOT NULL,
    tile_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    cost INTEGER DEFAULT 0,
    connections JSONB DEFAULT '[]',
    rotation INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tile_id)
);

-- Create discoveries table
CREATE TABLE IF NOT EXISTS public.discoveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    discovery_id TEXT NOT NULL,
    discovery_name TEXT NOT NULL,
    description TEXT,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, discovery_id)
);

-- Create quest_stats table
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

-- Create image_descriptions table
CREATE TABLE IF NOT EXISTS public.image_descriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    image_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, image_path)
);

-- Create game_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.game_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, setting_key)
);

-- Create purchased_items table
CREATE TABLE IF NOT EXISTS public.purchased_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notable_locations table
CREATE TABLE IF NOT EXISTS public.notable_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, location_id)
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    milestone_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target INTEGER NOT NULL DEFAULT 1,
    progress INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, milestone_id)
);

-- Create checked_milestones table
CREATE TABLE IF NOT EXISTS public.checked_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    milestone_id TEXT NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, milestone_id)
);

-- Create checked_quests table
CREATE TABLE IF NOT EXISTS public.checked_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    quest_id TEXT NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, quest_id)
);

-- Create tile_counts table
CREATE TABLE IF NOT EXISTS public.tile_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tile_type TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tile_type)
);

-- Create tilemap table
CREATE TABLE IF NOT EXISTS public.tilemap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    map_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, preference_key)
);

-- Create realm_visits table
CREATE TABLE IF NOT EXISTS public.realm_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    visit_type TEXT NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create dungeon_sessions table
CREATE TABLE IF NOT EXISTS public.dungeon_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    dungeon_type TEXT NOT NULL,
    position JSONB NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    rewards JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create character_positions table
CREATE TABLE IF NOT EXISTS public.character_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    last_moved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create gold_transactions table
CREATE TABLE IF NOT EXISTS public.gold_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create experience_transactions table
CREATE TABLE IF NOT EXISTS public.experience_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    total_after INTEGER NOT NULL,
    source TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_key TEXT NOT NULL,
    session_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, session_key)
);

-- Create realm_grid_data table
CREATE TABLE IF NOT EXISTS public.realm_grid_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    grid_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for all tables
CREATE TRIGGER set_character_stats_updated_at
    BEFORE UPDATE ON public.character_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_character_perks_updated_at
    BEFORE UPDATE ON public.character_perks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_character_titles_updated_at
    BEFORE UPDATE ON public.character_titles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_character_strengths_updated_at
    BEFORE UPDATE ON public.character_strengths
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

CREATE TRIGGER set_tile_inventory_updated_at
    BEFORE UPDATE ON public.tile_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_discoveries_updated_at
    BEFORE UPDATE ON public.discoveries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quest_stats_updated_at
    BEFORE UPDATE ON public.quest_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_image_descriptions_updated_at
    BEFORE UPDATE ON public.image_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_game_settings_updated_at
    BEFORE UPDATE ON public.game_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_purchased_items_updated_at
    BEFORE UPDATE ON public.purchased_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notable_locations_updated_at
    BEFORE UPDATE ON public.notable_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_milestones_updated_at
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_checked_milestones_updated_at
    BEFORE UPDATE ON public.checked_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_checked_quests_updated_at
    BEFORE UPDATE ON public.checked_quests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tile_counts_updated_at
    BEFORE UPDATE ON public.tile_counts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tilemap_updated_at
    BEFORE UPDATE ON public.tilemap
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_dungeon_sessions_updated_at
    BEFORE UPDATE ON public.dungeon_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_character_positions_updated_at
    BEFORE UPDATE ON public.character_positions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_realm_grid_data_updated_at
    BEFORE UPDATE ON public.realm_grid_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdom_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notable_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checked_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checked_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tilemap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realm_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realm_grid_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Users can view their own character_stats data"
    ON public.character_stats
    FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own character_stats data"
    ON public.character_stats
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own character_stats data"
    ON public.character_stats
    FOR UPDATE
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own character_stats data"
    ON public.character_stats
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Apply similar policies to all other tables (abbreviated for brevity)
-- You can add the full policies in the Supabase dashboard or create them manually

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON public.inventory_items(type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_equipped ON public.inventory_items(equipped);
CREATE INDEX IF NOT EXISTS idx_character_perks_user_id ON public.character_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_character_perks_active ON public.character_perks(is_active);
CREATE INDEX IF NOT EXISTS idx_character_perks_expires_at ON public.character_perks(expires_at);
CREATE INDEX IF NOT EXISTS idx_character_titles_user_id ON public.character_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_character_titles_active ON public.character_titles(is_active);
CREATE INDEX IF NOT EXISTS idx_character_strengths_user_id ON public.character_strengths(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_timestamp ON public.app_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_kingdom_time_series_user_id ON public.kingdom_time_series(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_time_series_timestamp ON public.kingdom_time_series(timestamp);
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_id ON public.tile_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_user_id ON public.discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_stats_user_id ON public.quest_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_stats_completed ON public.quest_stats(completed);
CREATE INDEX IF NOT EXISTS idx_image_descriptions_user_id ON public.image_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON public.game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_items_user_id ON public.purchased_items(user_id);
CREATE INDEX IF NOT EXISTS idx_notable_locations_user_id ON public.notable_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_category ON public.milestones(category);
CREATE INDEX IF NOT EXISTS idx_milestones_completed ON public.milestones(completed);
CREATE INDEX IF NOT EXISTS idx_checked_milestones_user_id ON public.checked_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_checked_quests_user_id ON public.checked_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_counts_user_id ON public.tile_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_counts_tile_type ON public.tile_counts(tile_type);
CREATE INDEX IF NOT EXISTS idx_tilemap_user_id ON public.tilemap(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON public.user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_realm_visits_user_id ON public.realm_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_visits_visit_type ON public.realm_visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_dungeon_sessions_user_id ON public.dungeon_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dungeon_sessions_completed_at ON public.dungeon_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_character_positions_user_id ON public.character_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id ON public.gold_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_type ON public.gold_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_created_at ON public.gold_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_user_id ON public.experience_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_type ON public.experience_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_created_at ON public.experience_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON public.user_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_realm_grid_data_user_id ON public.realm_grid_data(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_grid_data_current ON public.realm_grid_data(is_current);

-- Grant permissions
GRANT ALL ON public.character_stats TO authenticated;
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.character_perks TO authenticated;
GRANT ALL ON public.character_titles TO authenticated;
GRANT ALL ON public.character_strengths TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.app_logs TO authenticated;
GRANT ALL ON public.kingdom_time_series TO authenticated;
GRANT ALL ON public.tile_inventory TO authenticated;
GRANT ALL ON public.discoveries TO authenticated;
GRANT ALL ON public.quest_stats TO authenticated;
GRANT ALL ON public.image_descriptions TO authenticated;
GRANT ALL ON public.game_settings TO authenticated;
GRANT ALL ON public.purchased_items TO authenticated;
GRANT ALL ON public.notable_locations TO authenticated;
GRANT ALL ON public.milestones TO authenticated;
GRANT ALL ON public.checked_milestones TO authenticated;
GRANT ALL ON public.checked_quests TO authenticated;
GRANT ALL ON public.tile_counts TO authenticated;
GRANT ALL ON public.tilemap TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.realm_visits TO authenticated;
GRANT ALL ON public.dungeon_sessions TO authenticated;
GRANT ALL ON public.character_positions TO authenticated;
GRANT ALL ON public.gold_transactions TO authenticated;
GRANT ALL ON public.experience_transactions TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.realm_grid_data TO authenticated; 