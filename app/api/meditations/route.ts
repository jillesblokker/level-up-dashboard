import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            const { error } = await supabase
                .from('meditations')
                .insert({
                    user_id: userId,
                    completed_at: new Date().toISOString()
                });

            if (error) throw error;

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

            return { milestoneMessage };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            milestoneMessage: result.data?.milestoneMessage
        });
    } catch (error: any) {
        logger.error("Meditation API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
