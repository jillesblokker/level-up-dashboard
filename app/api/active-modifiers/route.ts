import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server-client";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date().toISOString();

        const { data: modifiers, error } = await supabaseServer
            .from('active_modifiers')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', now);

        if (error) {
            console.error("Error fetching modifiers:", error);
            return NextResponse.json({ error: "Failed to fetch modifiers" }, { status: 500 });
        }

        return NextResponse.json({ modifiers });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, effect, durationHours = 24, source = 'potion' } = body;

        if (!name || !effect) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        // Upsert logic: If modifier with same name exists, update expiration?
        // Or just insert new one? Usually unique per name.
        // Let's delete old one first to avoid duplicates
        await supabaseServer
            .from('active_modifiers')
            .delete()
            .eq('user_id', userId)
            .eq('name', name);

        const { error } = await supabaseServer
            .from('active_modifiers')
            .insert({
                user_id: userId,
                name,
                effect,
                expires_at: expiresAt.toISOString(),
                source
            });

        if (error) {
            console.error("Error adding modifier:", error);
            throw error;
        }

        return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
