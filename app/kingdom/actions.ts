"use server";

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function getKingdomInventoryServerAction() {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return [];
    
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error("[Inventory Action] Error:", error);
      return [];
    }
    
    return (data || []).map((row: any) => ({
      ...row,
      id: row.item_id,
      stats: row.stats || {}
    }));
  } catch (err) {
    console.error("[Inventory Action] Catch:", err);
    return [];
  }
}
