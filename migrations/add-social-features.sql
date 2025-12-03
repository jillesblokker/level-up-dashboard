-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_quest_received', 'friend_quest_completed', 'friend_request_accepted')),
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to quests table for friend quests
ALTER TABLE quests 
ADD COLUMN IF NOT EXISTS is_friend_quest BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sender_id TEXT,
ADD COLUMN IF NOT EXISTS recipient_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_recipient_id ON quests(recipient_id);

-- Enable RLS (Row Level Security)
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for friends table
-- Users can read their own friendships
CREATE POLICY "Users can view their own friendships" ON friends
    FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

-- Users can insert friend requests
CREATE POLICY "Users can send friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own friendships (accept/reject)
CREATE POLICY "Users can update their own friendships" ON friends
    FOR UPDATE USING (auth.uid()::text = friend_id OR auth.uid()::text = user_id);

-- Policies for notifications table
-- Users can read their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id);

-- System can insert notifications (or users triggering events)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Ideally restricted, but needed for friend requests triggering notifications

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id);
