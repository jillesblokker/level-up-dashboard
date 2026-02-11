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

        // Fetch current stats to verify eligibility
        const { data: stats, error: fetchError } = await supabaseServer
            .from('character_stats')
            .select('level, experience, ascension_level')
            .eq('user_id', userId)
            .single();

        if (fetchError || !stats) {
            return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
        }

        const currentLevel = stats.level || 1;
        const currentAscension = stats.ascension_level || 0;

        // Requirement: Level 100
        if (currentLevel < 100) {
            return NextResponse.json({ error: "Level 100 required to ascend" }, { status: 400 });
        }

        // Perform Ascension
        const newAscensionLevel = currentAscension + 1;

        const { data: updatedStats, error: updateError } = await supabaseServer
            .from('character_stats')
            .update({
                level: 1,
                experience: 0,
                ascension_level: newAscensionLevel
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) {
            console.error("Ascension update failed", updateError);
            return NextResponse.json({ error: "Failed to process ascension" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Ascension successful! Level reset, Ascension increased.",
            stats: updatedStats
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
