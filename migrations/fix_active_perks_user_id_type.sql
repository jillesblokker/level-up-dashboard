-- Migration to fix user_id column type in active_perks table
-- Converts user_id from UUID to TEXT to support Clerk authentication user IDs.

ALTER TABLE public.active_perks DROP CONSTRAINT IF EXISTS active_perks_user_id_fkey;
ALTER TABLE public.active_perks DROP CONSTRAINT IF EXISTS active_perks_user_id_perk_name_key;

ALTER TABLE public.active_perks ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.active_perks ADD CONSTRAINT active_perks_user_id_perk_name_key UNIQUE (user_id, perk_name);
