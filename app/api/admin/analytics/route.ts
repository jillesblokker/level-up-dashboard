import { NextRequest, NextResponse } from 'next/server';
import { verifyClerkJWT } from '@/lib/supabase/jwt-verification';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(request: Request): Promise<boolean> {
    try {
        const authResult = await verifyClerkJWT(request);
        if (!authResult.success || !authResult.userId) return false;

        const client = await clerkClient();
        const user = await client.users.getUser(authResult.userId);

        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
        return userEmails.includes(adminEmail);
    } catch { return false; }
}

export async function GET(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Parallelize queries for performance
        const [
            usersResult,
            goldResult,
            xpResult,
            questsResult,
            activeAnnouncements
        ] = await Promise.all([
            supabaseAdmin.from('character_stats').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('character_stats').select('gold'),
            supabaseAdmin.from('character_stats').select('level'),
            supabaseAdmin.from('quest_completion').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('system_announcements').select('*').eq('is_active', true)
        ]);

        const totalUsers = usersResult.count || 0;
        const totalQuestsCompleted = questsResult.count || 0;

        // aggregate manually since we don't have sum() easily via standard client without rpc
        const allGold = (goldResult.data || []).reduce((sum, row) => sum + (row.gold || 0), 0);
        const allLevels = (xpResult.data || []).reduce((sum, row) => sum + (row.level || 1), 0);
        const avgLevel = totalUsers > 0 ? (allLevels / totalUsers).toFixed(1) : 0;

        return NextResponse.json({
            stats: {
                totalUsers,
                totalGold: allGold,
                averageLevel: avgLevel,
                totalQuestsCompleted
            },
            announcements: activeAnnouncements.data || []
        });

    } catch (e: any) {
        console.error("Analytics Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Post new announcement
export async function POST(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { message, type, expiresAt } = body;

        if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('system_announcements')
            .insert({
                message,
                type: type || 'info',
                is_active: true,
                expires_at: expiresAt || null
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, announcement: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Delete/Deactivate announcement
export async function DELETE(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
        .from('system_announcements')
        .update({ is_active: false })
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
