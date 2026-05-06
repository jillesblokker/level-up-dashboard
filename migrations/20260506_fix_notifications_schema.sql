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
        ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;
