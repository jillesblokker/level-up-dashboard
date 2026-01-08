import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Email
        const client = await clerkClient();
        const adminUser = await client.users.getUser(adminId);
        const email = adminUser.emailAddresses.find(e => e.id === adminUser.primaryEmailAddressId)?.emailAddress;

        if (email !== 'jillesblokker@gmail.com') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, tileId } = body; // Target User ID and Tile ID

        if (!userId || !tileId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert or Update Tile Inventory for the target user
        // We'll mimic the logic from the regular API but for the target user

        // Check if tile exists
        const { data: existing, error: fetchError } = await supabase
            .from('tile_inventory')
            .select('*')
            .eq('user_id', userId)
            .eq('tile_id', tileId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        let resultData;

        if (existing) {
            // Update quantity
            const { data, error } = await supabase
                .from('tile_inventory')
                .update({ quantity: existing.quantity + 1 })
                .eq('user_id', userId)
                .eq('tile_id', tileId)
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        } else {
            // Insert new tile
            // We need to know the tile type. Since we passed tileId like 'grass-1', we can infer or pass type.
            // For simplicity in the admin tool, let's assume tileId starts with type or we pass type.
            // In the UI I set tileId to values like 'grass-1', 'forest-1'. 
            // Let's assume tile_type = tileId.split('-')[0]
            const tileType = tileId.split('-')[0];

            const { data, error } = await supabase
                .from('tile_inventory')
                .insert({
                    user_id: userId,
                    tile_id: tileId,
                    tile_type: tileType,
                    name: tileType.charAt(0).toUpperCase() + tileType.slice(1), // Simple capitalization
                    quantity: 1,
                    cost: 0, // Gifted
                    connections: [],
                    rotation: 0,
                    last_updated: new Date().toISOString(),
                    version: 1,
                })
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        }

        return NextResponse.json({ success: true, tile: resultData });

    } catch (err: any) {
        console.error("Admin Tile Assignment Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
