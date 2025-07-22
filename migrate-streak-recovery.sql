-- ==========================================
-- STREAK RECOVERY MIGRATION
-- Run this in your Supabase SQL Editor to add streak recovery features
-- ==========================================

-- Add new columns to the streaks table for recovery features
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS resilience_points INTEGER DEFAULT 0;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS safety_net_used BOOLEAN DEFAULT false;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS missed_days_this_week INTEGER DEFAULT 0;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS last_missed_date DATE;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS consecutive_weeks_completed INTEGER DEFAULT 0;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS streak_broken_date DATE;
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS max_streak_achieved INTEGER DEFAULT 0;

-- Update existing streaks to set max_streak_achieved to current streak_days
UPDATE public.streaks 
SET max_streak_achieved = GREATEST(streak_days, COALESCE(max_streak_achieved, 0))
WHERE max_streak_achieved IS NULL OR max_streak_achieved < streak_days;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_streaks_resilience_points ON public.streaks(resilience_points);
CREATE INDEX IF NOT EXISTS idx_streaks_safety_net ON public.streaks(safety_net_used);
CREATE INDEX IF NOT EXISTS idx_streaks_last_missed ON public.streaks(last_missed_date);

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'streaks'
  AND column_name IN (
    'resilience_points', 
    'safety_net_used', 
    'missed_days_this_week', 
    'last_missed_date', 
    'consecutive_weeks_completed', 
    'streak_broken_date', 
    'max_streak_achieved'
  )
ORDER BY column_name;

-- Success message
SELECT 'Streak recovery migration completed successfully! 🎉' as status; 