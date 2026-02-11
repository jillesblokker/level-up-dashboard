import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server-client";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { level } = body;

        if (typeof level !== 'number') {
            return NextResponse.json({ error: "Invalid level" }, { status: 400 });
        }

        // Fetch titles eligible for this level
        const { data: eligibleTitles } = await supabaseServer
            .from('titles')
            .select('*')
            .lte('required_level', level);

        if (!eligibleTitles || eligibleTitles.length === 0) {
            return NextResponse.json({ unlockedCount: 0 });
        }

        // Fetch already unlocked
        const { data: userTitles } = await supabaseServer
            .from('user_titles')
            .select('title_id')
            .eq('user_id', userId);

        const unlockedIds = new Set(userTitles?.map((ut: any) => ut.title_id) || []);

        const newUnlocks = [];

        for (const title of eligibleTitles) {
            if (!unlockedIds.has(title.id)) {
                newUnlocks.push({
                    user_id: userId,
                    title_id: title.id,
                    is_equipped: false
                });
            }
        }

        if (newUnlocks.length > 0) {
            const { error } = await supabaseServer
                .from('user_titles')
                .insert(newUnlocks);

            if (error) {
                console.error("Error unlocking titles:", error);
                throw error;
            }
        }

        return NextResponse.json({ unlockedCount: newUnlocks.length, newTitles: newUnlocks.map(u => u.title_id) });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
