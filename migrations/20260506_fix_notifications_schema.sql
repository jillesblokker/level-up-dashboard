-- Standardize notifications table column names
DO $$ 
BEGIN 
    -- 1. Check if 'read' column exists and rename to 'is_read'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
          AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
    END IF;

    -- 2. Ensure created_at exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 3. Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 4. Standardize user_id to TEXT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
          AND column_name = 'user_id'
    ) THEN
        -- Drop ALL policies on notifications to allow type change
        -- The user's error showed this specific policy name: "Users can manage their own notifications"
        DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users manage own notifications_unified" ON public.notifications;
        DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
        
        ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
        
        -- Re-create the standardized policy
        -- Using get_current_user_id() which is our standardized way to handle both Clerk and DB auth
        CREATE POLICY "Users can manage their own notifications" ON public.notifications 
        FOR ALL USING (user_id = public.get_current_user_id());
    END IF;
END $$;
