-- Pre-Release Performance Indexing Migration
-- High-frequency query optimizations for production load

-- 1. Quest Completion Index (User ID + Completion Timestamp)
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_completed_at
ON quest_completion(user_id, completed_at DESC);

-- 2. User Preferences Index (User ID + Preference Key)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_key
ON user_preferences(user_id, preference_key);

-- 3. Inventory Items Index (User ID + Item ID)
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_item
ON inventory_items(user_id, item_id);

-- 4. Active Modifiers Index (User ID + Expiration)
CREATE INDEX IF NOT EXISTS idx_active_modifiers_user_expires
ON active_modifiers(user_id, expires_at DESC);

-- 5. Market Listings Index (Status + Created At)
CREATE INDEX IF NOT EXISTS idx_market_listings_status_created
ON market_listings(status, created_at DESC);
