import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

        const { error } = await supabase
            .from('meditations')
            .insert({
                user_id: userId,
                completed_at: new Date().toISOString()
            });

        if (error) {
            logger.error("Meditation record error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // --- Milestone Check ---
        let milestoneMessage = null;
        try {
            const { count } = await supabase
                .from('meditations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (count === 10 || count === 25 || count === 50) {
                const { getMilestoneMessage } = await import('@/lib/milestone-manager');
                milestoneMessage = await getMilestoneMessage(`meditation_${count}`);
            }
        } catch (mErr) {
            logger.warn("Milestone check error:", mErr);
        }

        return NextResponse.json({
            success: true,
            milestoneMessage
        });
    } catch (error) {
        logger.error("Meditation API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
