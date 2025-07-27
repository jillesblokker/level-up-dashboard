-- Migration: Add missing UNIQUE constraints for migration tables
-- This migration adds the constraints that were missing from the initial migration

-- Add UNIQUE constraint to user_preferences table
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

-- Add UNIQUE constraint to game_settings table  
ALTER TABLE public.game_settings 
ADD CONSTRAINT game_settings_user_id_unique UNIQUE (user_id);

-- Add UNIQUE constraint to realm_grids table for (user_id, is_current)
ALTER TABLE public.realm_grids 
ADD CONSTRAINT realm_grids_user_current_unique UNIQUE (user_id, is_current); 