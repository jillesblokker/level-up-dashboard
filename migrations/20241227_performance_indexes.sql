-- Performance Indexes for Level Up Dashboard
-- Optimized for quest queries, stats updates, and notification retrieval
-- 1. Quest Completion Queries
-- Frequently filters by user_id and date (e.g., getting today's status)
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_completed ON quest_completion(user_id, completed_at DESC);
-- Used for deleting recent completions and checking status
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_quest_date ON quest_completion(user_id, quest_id, completed_at DESC);
-- 2. Quests Filtering
-- Filtering by category is common (Errands vs Progression)
CREATE INDEX IF NOT EXISTS idx_quests_user_category ON quests(user_id, category);
-- 3. Notification Retrieval
-- Fetching unread notifications is high frequency
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)
WHERE is_read = false;
-- 4. Character Stats Lookup
-- Lookups by user_id are fundamental
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON character_stats(user_id);
-- 5. Streaks
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);