-- Migration to add Scratch Cards and Mythics Collection

-- Table for unopened packs
CREATE TABLE IF NOT EXISTS public.user_packs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    pack_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'legendary', etc.
    source TEXT NOT NULL, -- 'market', 'kingdom_drop', 'realm_event', 'onboarding'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for collected cards
CREATE TABLE IF NOT EXISTS public.user_mythic_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL, -- e.g., 'knight', 'dragon', 'potion'
    variant_id TEXT NOT NULL, -- e.g., 'base', 'holo', 'gold'
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON public.user_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mythic_cards_user_id ON public.user_mythic_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mythic_cards_collection ON public.user_mythic_cards(user_id, card_id, variant_id);

-- RLS policies
ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mythic_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own packs" 
ON public.user_packs FOR SELECT 
USING (auth.uid()::text = user_id OR current_setting('request.jwt.claims', true)::json->>'sub' = user_id);

CREATE POLICY "Users can insert their own packs" 
ON public.user_packs FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR current_setting('request.jwt.claims', true)::json->>'sub' = user_id);

CREATE POLICY "Users can delete their own packs" 
ON public.user_packs FOR DELETE 
USING (auth.uid()::text = user_id OR current_setting('request.jwt.claims', true)::json->>'sub' = user_id);

CREATE POLICY "Users can view their own mythic cards" 
ON public.user_mythic_cards FOR SELECT 
USING (auth.uid()::text = user_id OR current_setting('request.jwt.claims', true)::json->>'sub' = user_id);

CREATE POLICY "Users can insert their own mythic cards" 
ON public.user_mythic_cards FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR current_setting('request.jwt.claims', true)::json->>'sub' = user_id);
