import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Email
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        if (email !== 'jillesblokker@gmail.com') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, category, difficulty, xp, gold } = body;

        if (!title || !category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('quests')
            .insert({
                name: title,
                description: description || '',
                category: category,
                difficulty: difficulty || 'medium',
                xp_reward: xp || 50,
                gold_reward: gold || 25,
                is_active: true,
                user_id: null // Global quest
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, quest: data });

    } catch (err: any) {
        console.error("Admin Quests API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
