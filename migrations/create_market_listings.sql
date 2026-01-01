-- Create market_listings table
CREATE TABLE IF NOT EXISTS market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id TEXT NOT NULL,
    -- references user_id from auth (Clerk ID)
    item_type TEXT NOT NULL CHECK (item_type IN ('tile', 'consumable', 'equipment')),
    item_id TEXT NOT NULL,
    -- The specific ID or code of the item
    quantity INTEGER DEFAULT 1,
    -- How many items in this listing
    price INTEGER NOT NULL,
    -- Price in Gold
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index for fast searching
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_seller ON market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_item_type ON market_listings(item_type);
-- RLS Policies
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
-- 1. Everyone can read active listings
CREATE POLICY "Everyone can view active listings" ON market_listings FOR
SELECT USING (status = 'active');
-- 2. Sellers can view their own listings regardless of status
CREATE POLICY "Sellers can view own listings" ON market_listings FOR
SELECT USING (
        seller_id = current_setting('request.jwt.claim.sub', true)
    );
-- 3. Authenticated users can create listings
CREATE POLICY "Users can create listings" ON market_listings FOR
INSERT WITH CHECK (
        seller_id = current_setting('request.jwt.claim.sub', true)
    );
-- 4. Sellers can update their own listings (e.g. to cancel)
CREATE POLICY "Sellers can update own listings" ON market_listings FOR
UPDATE USING (
        seller_id = current_setting('request.jwt.claim.sub', true)
    );
-- Note: 'Buying' will likely be handled by a Postgres Function (RPC) or a highly privileged Server Action 
-- to ensure atomicity (deduct gold, add item, mark sold), so we don't strictly need a public UPDATE policy for buying here yet.