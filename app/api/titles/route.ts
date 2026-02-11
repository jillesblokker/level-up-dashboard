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

        // Fetch all title definitions
        const { data: allTitles, error: titlesError } = await supabaseServer
            .from('titles')
            .select('*')
            .order('required_level', { ascending: true });

        if (titlesError) {
            console.error("Error fetching titles:", titlesError);
            return NextResponse.json({ error: "Failed to fetch titles" }, { status: 500 });
        }

        // Fetch user's unlocked titles
        const { data: userTitles, error: userTitlesError } = await supabaseServer
            .from('user_titles')
            .select('*')
            .eq('user_id', userId);

        if (userTitlesError) {
            console.error("Error fetching user titles:", userTitlesError);
            return NextResponse.json({ error: "Failed to fetch user titles" }, { status: 500 });
        }

        // Combine data
        const titlesWithStatus = allTitles.map((title: any) => {
            const unlocked = userTitles?.find((ut: any) => ut.title_id === title.id);
            return {
                ...title,
                is_unlocked: !!unlocked,
                is_equipped: unlocked?.is_equipped || false,
                unlocked_at: unlocked?.unlocked_at || null
            };
        });

        return NextResponse.json({ titles: titlesWithStatus });
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
        const { titleId, action } = body;

        if (action === 'equip') {
            // Check ownership
            const { data: ownership, error: checkError } = await supabaseServer
                .from('user_titles')
                .select('id')
                .eq('user_id', userId)
                .eq('title_id', titleId)
                .single();

            if (checkError || !ownership) {
                return NextResponse.json({ error: "Title not unlocked" }, { status: 403 });
            }

            // Un-equip all
            await supabaseServer
                .from('user_titles')
                .update({ is_equipped: false })
                .eq('user_id', userId);

            // Equip new
            const { error } = await supabaseServer
                .from('user_titles')
                .update({ is_equipped: true })
                .eq('user_id', userId)
                .eq('title_id', titleId);

            if (error) {
                console.error("Error equipping title:", error);
                throw error;
            }

            // Sync to character_stats.title
            const { data: titleDef } = await supabaseServer
                .from('titles')
                .select('name')
                .eq('id', titleId)
                .single();

            if (titleDef) {
                await supabaseServer
                    .from('character_stats')
                    .update({ title: titleDef.name })
                    .eq('user_id', userId);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
