-- Force fix for user_id type changes by dropping ALL policies first
-- This addresses the "cannot alter type of a column used in a policy definition" error

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop ALL policies on notifications table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' 
          AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.notifications';
        RAISE NOTICE 'Dropped policy % on notifications', r.policyname;
    END LOOP;

    -- 2. Drop ALL policies on inventory_items table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'inventory_items' 
          AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.inventory_items';
        RAISE NOTICE 'Dropped policy % on inventory_items', r.policyname;
    END LOOP;

    -- 3. Now it is safe to alter the column types to TEXT
    -- We use text to support both UUID and Clerk's string-based user IDs
    ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
    ALTER TABLE public.inventory_items ALTER COLUMN user_id TYPE TEXT;
    
    RAISE NOTICE 'Successfully altered user_id columns to TEXT';

    -- 4. Re-create standardized policies using public.get_current_user_id()
    -- This function is assumed to exist and handle auth correctly
    
    -- Notifications Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can manage their own notifications'
    ) THEN
        CREATE POLICY "Users can manage their own notifications" ON public.notifications 
        FOR ALL USING (user_id = public.get_current_user_id());
    END IF;

    -- Inventory Items Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inventory_items' AND policyname = 'Users can manage their own inventory_items'
    ) THEN
        CREATE POLICY "Users can manage their own inventory_items" ON public.inventory_items 
        FOR ALL USING (user_id = public.get_current_user_id());
    END IF;

    RAISE NOTICE 'Successfully recreated RLS policies';
END $$;
