-- Fix User ID type mismatch in Security Functions
-- This migration updates the session context helpers to use TEXT instead of UUID
-- to support Clerk IDs (which are strings).

-- 1. Update set_user_context to accept TEXT
CREATE OR REPLACE FUNCTION public.set_user_context(user_id TEXT) RETURNS void AS $$ 
BEGIN 
    -- Set localized configuration parameters for the current transaction
    -- We set both to be safe, as different migrations might use different keys
    PERFORM set_config('request.user_id', user_id, true);
    PERFORM set_config('request.jwt.claim.sub', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update get_current_user_id to return TEXT and avoid UUID casting
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_id() RETURNS TEXT AS $$ 
BEGIN 
    RETURN COALESCE(
        auth.uid()::text,
        current_setting('request.user_id', true),
        current_setting('request.jwt.claim.sub', true)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Standardize policies for all user-owned tables
-- This ensures they all use the helper function which handles Clerk IDs correctly

DO $$ 
DECLARE
    t_name TEXT;
    tables TEXT[] := ARRAY[
        'notifications', 
        'quest_completion', 
        'challenge_completion', 
        'realm_tiles', 
        'kingdom_tile_inventory', 
        'character_stats', 
        'creature_interactions', 
        'quest_progress', 
        'milestone_progress', 
        'user_preferences', 
        'kingdom_event_log',
        'property_timers',
        'gold_transactions',
        'experience_transactions'
    ];
BEGIN
    FOR t_name IN SELECT unnest(tables)
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            -- Enable RLS
            EXECUTE 'ALTER TABLE public.' || t_name || ' ENABLE ROW LEVEL SECURITY';
            
            -- Drop existing user-management policies (cleaning up various names)
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own ' || t_name || '" ON public.' || t_name;
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own quest completions" ON public.quest_completion';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own challenge completions" ON public.challenge_completion';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own realm tiles" ON public.realm_tiles';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own kingdom inventory" ON public.kingdom_tile_inventory';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own stats" ON public.character_stats';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own creature interactions" ON public.creature_interactions';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own quest progress" ON public.quest_progress';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own milestone progress" ON public.milestone_progress';
            EXECUTE 'DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences';
            EXECUTE 'DROP POLICY IF EXISTS "Users view own logs" ON public.kingdom_event_log';
            EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own property timers" ON public.property_timers';
            
            -- Create unified policy
            EXECUTE 'CREATE POLICY "Users manage own ' || t_name || '_unified" ON public.' || t_name || 
                    ' FOR ALL USING (user_id = public.get_current_user_id())';
        END IF;
    Loop;
END $$;
