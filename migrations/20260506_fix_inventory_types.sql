-- Fix inventory_items constraints and schema for Clerk compatibility
-- This script expands the allowed types and ensures user_id is TEXT

-- 1. Drop the existing type check constraint if it exists
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'inventory_items_type_check'
    ) THEN
        ALTER TABLE public.inventory_items DROP CONSTRAINT inventory_items_type_check;
    END IF;
END $$;

-- 2. Add a more comprehensive type check constraint
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_type_check 
CHECK (type IN (
    'resource', 'item', 'creature', 'scroll', 'equipment', 
    'artifact', 'book', 'mount', 'weapon', 'shield', 'armor', 
    'consumable', 'material', 'potion', 'tool', 'quest'
));

-- 3. Ensure user_id is TEXT (Clerk compatibility)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' 
          AND column_name = 'user_id'
    ) THEN
        -- Drop policies that might depend on the type
        DROP POLICY IF EXISTS "Users manage own inventory_items_unified" ON public.inventory_items;
        DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
        DROP POLICY IF EXISTS "Users can manage their own inventory_items" ON public.inventory_items;
        
        ALTER TABLE public.inventory_items ALTER COLUMN user_id TYPE TEXT;
        
        -- Re-create the policy
        CREATE POLICY "Users can manage their own inventory_items" ON public.inventory_items 
        FOR ALL USING (user_id = public.get_current_user_id());
    END IF;
END $$;
