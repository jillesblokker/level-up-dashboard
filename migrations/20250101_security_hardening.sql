-- Security Hardening Migration
-- Created by Antigravity Audit
-- 1. Create session context setter for safe RLS impersonation
CREATE OR REPLACE FUNCTION public.set_user_context(user_id uuid) RETURNS void AS $$ BEGIN -- Set a localized configuration parameter for the current transaction
    PERFORM set_config('request.user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Helper to get the current user ID (works with both Auth and our custom context)
-- Use CASCADE to remove dependent policies that are blocking the update
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
CREATE OR REPLACE FUNCTION public.get_current_user_id() RETURNS uuid AS $$ BEGIN RETURN COALESCE(
        auth.uid(),
        current_setting('request.user_id', true)::uuid
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- 3. Restore policies dropped by CASCADE
-- We recreate them using the new function definition to ensure security
-- Property Timers
CREATE POLICY "Users can manage their own property timers" ON public.property_timers FOR ALL USING (user_id = public.get_current_user_id()::text);
-- Gold Transactions
CREATE POLICY "Users can view their own gold transactions" ON public.gold_transactions FOR
SELECT USING (user_id = public.get_current_user_id()::text);
CREATE POLICY "Users can insert their own gold transactions" ON public.gold_transactions FOR
INSERT WITH CHECK (user_id = public.get_current_user_id()::text);
-- Experience Transactions
CREATE POLICY "Users can view their own experience transactions" ON public.experience_transactions FOR
SELECT USING (user_id = public.get_current_user_id()::text);
CREATE POLICY "Users can insert their own experience transactions" ON public.experience_transactions FOR
INSERT WITH CHECK (user_id = public.get_current_user_id()::text);
-- 3. Example Policy Update (Commented out to prevent breaking existing access)
-- You should update your policies to use get_current_user_id() instead of auth.uid()
-- ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users see own items" ON public.inventory_items
--   FOR SELECT USING (user_id = public.get_current_user_id());