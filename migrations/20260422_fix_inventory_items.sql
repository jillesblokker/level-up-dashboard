-- Fix inventory_items table for Clerk compatibility and RLS
-- This script handles the "cannot change return type of existing function" error
-- by explicitly dropping the function before recreating it.

-- 1. DROP the function first (Crucial step to allow changing return type from UUID to TEXT)
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;

-- 2. Recreate the helper function using TEXT
CREATE OR REPLACE FUNCTION public.get_current_user_id() RETURNS TEXT AS $$ 
BEGIN 
    RETURN COALESCE(
        current_setting('request.user_id', true),
        current_setting('request.jwt.claim.sub', true),
        auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Drop existing policies to avoid type mismatch errors
DROP POLICY IF EXISTS "Users manage own inventory_items_unified" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON public.inventory_items;

-- 4. Convert user_id to TEXT
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' 
          AND column_name = 'user_id' 
    ) THEN
        ALTER TABLE public.inventory_items ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Converted inventory_items.user_id to TEXT';
    END IF;
END $$;

-- 5. Re-enable RLS and create policy
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory_items_unified" ON public.inventory_items
FOR ALL USING (user_id = public.get_current_user_id());

-- 6. Ensure necessary columns exist (is_default, star_rating)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'is_default') THEN
        ALTER TABLE public.inventory_items ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'star_rating') THEN
        ALTER TABLE public.inventory_items ADD COLUMN star_rating INTEGER DEFAULT 0;
    END IF;
END $$;
