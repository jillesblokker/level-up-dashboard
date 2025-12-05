-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id bigint generated always as identity primary key,
    user_id text not null,
    type text not null,
    data jsonb default '{}'::jsonb,
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Grant access
GRANT ALL ON notifications TO authenticated;
