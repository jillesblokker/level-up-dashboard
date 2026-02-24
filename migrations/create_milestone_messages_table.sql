-- Create table for dynamic milestone messages
CREATE TABLE IF NOT EXISTS milestone_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_key TEXT NOT NULL,
    character_name TEXT NOT NULL,
    message TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_milestone_messages_key ON milestone_messages(milestone_key);
-- Insert Meditation Milestones
INSERT INTO milestone_messages (milestone_key, character_name, message)
VALUES (
        'meditation_10',
        'Oaky',
        'Ten moments of stillness... even the oldest trees started with a single quiet breath.'
    ),
    (
        'meditation_10',
        'Icey',
        'Ten meditations. Your mind is becoming as clear and calm as a frozen lake.'
    ),
    (
        'meditation_25',
        'Seqoio',
        'Twenty-five sessions. Your roots of mindfulness are growing deep into the earth.'
    ),
    (
        'meditation_50',
        'Necrion',
        'Fifty moments of silence. Even the void is impressed by your inner peace.'
    );
-- Insert Dungeon Milestones
INSERT INTO milestone_messages (milestone_key, character_name, message)
VALUES (
        'dungeon_victory',
        'Flamio',
        'BOOM! That dungeon didn''t stand a chance against your fire!'
    ),
    (
        'dungeon_victory',
        'Rockie',
        'Hmph. You actually survived. Your resolve is harder than I thought.'
    ),
    (
        'dungeon_victory_5',
        'Drakon',
        'Five dungeons conquered. The scent of victory clings to you like dragon fire!'
    ),
    (
        'dungeon_victory_10',
        'Montano',
        'TEN TRIUMPHS! You are truly a Master of the Depths!'
    ),
    (
        'dungeon_defeat',
        'Icey',
        'You fell? Don''t let it freeze your resolve. Get back up and try a cooler approach.'
    );
-- Insert Economy / Resource Milestones
INSERT INTO milestone_messages (milestone_key, character_name, message)
VALUES (
        'gold_1000',
        'Glimmer',
        'A thousand gold pieces! You have a real eye for treasures, don''t you?'
    ),
    (
        'gold_5000',
        'Vulcana',
        'Five thousand gold! Use that wealth to forge a glorious future!'
    ),
    (
        'level_10',
        'Dolphio',
        'Level ten! You''re making huge waves in this kingdom!'
    ),
    (
        'level_20',
        'Seqoio',
        'Level twenty. You are becoming a landmark in these lands, sturdy and tall.'
    );
-- Insert Social Milestones
INSERT INTO milestone_messages (milestone_key, character_name, message)
VALUES (
        'ally_help_10',
        'Leaf',
        'You''ve helped your friends ten times! You''re such a kind soul!'
    ),
    (
        'ally_help_25',
        'Divero',
        'Twenty-five acts of kindness. You''re truly going with the flow of friendship.'
    );