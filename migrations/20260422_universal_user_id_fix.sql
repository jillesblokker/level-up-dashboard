-- Final Universal Fix for Clerk-to-Supabase user_id type mismatch
-- This version handles the "cannot change return type" error by
-- explicitly dropping the helper function before recreating it.

-- 1. Force the helper function to be TEXT-based
-- We use CASCADE to ensure all policies depending on the old function are also dropped
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_id(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_id() 
RETURNS TEXT 
AS $$ 
BEGIN 
    RETURN COALESCE(
        current_setting('request.user_id', true),
        current_setting('request.jwt.claim.sub', true),
        auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon, authenticated, service_role;

-- 2. Standardize set_user_context
CREATE OR REPLACE FUNCTION public.set_user_context(user_id TEXT) RETURNS void AS $$ 
BEGIN 
    PERFORM set_config('request.user_id', user_id, true);
    PERFORM set_config('request.jwt.claim.sub', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Loop through all tables and fix the user_id column
DO $$ 
DECLARE
    t RECORD;
    policy_record RECORD;
BEGIN
    FOR t IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'user_id' 
          AND table_name IN (
            'inventory_items', 
            'user_preferences', 
            'game_settings',
            'quest_stats', 
            'milestones', 
            'milestone_stats', 
            'character_stats',
            'seasonal_hunt',
            'seasonal_hunt_items',
            'notable_locations',
            'purchased_items',
            'image_descriptions',
            'checked_milestones',
            'checked_quests',
            'meditations',
            'quest_completions',
            'notifications',
            'discovery_stats',
            'creature_interactions',
            'quest_progress',
            'milestone_progress',
            'kingdom_event_log',
            'property_timers',
            'gold_transactions',
            'experience_transactions',
            'streaks'
          )
    LOOP
        -- A. Drop all policies on this table first to avoid type mismatch errors during ALTER
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t.table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, t.table_name);
        END LOOP;

        -- B. Convert to TEXT (this handles both UUID and existing TEXT)
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id TYPE TEXT', t.table_name);
            RAISE NOTICE 'Converted %.user_id to TEXT', t.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped %.user_id conversion (might already be TEXT or have constraints): %', t.table_name, SQLERRM;
        END;

        -- C. Re-enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.table_name);

        -- D. Create the standardized policy
        EXECUTE format('CREATE POLICY "Users can manage their own %I" ON public.%I FOR ALL USING (user_id = public.get_current_user_id())', t.table_name, t.table_name);
        
        RAISE NOTICE 'Restored RLS policy for %', t.table_name;
    END LOOP;
END $$;
