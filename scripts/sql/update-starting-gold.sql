-- Update default value for gold in character_stats
ALTER TABLE character_stats ALTER COLUMN gold SET DEFAULT 500;

-- Optional: If we want to ensure all *new* rows for existing users (unlikely for stats) but mainly for consistency.
-- We won't update existing users' gold unless they have 0 and only if intended, but safe to just set default for new insertions.
