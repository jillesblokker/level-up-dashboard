import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin() {
    try {
        const { userId } = await auth();
        if (!userId) return false;

        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
        return userEmails.includes(adminEmail);
    } catch { return false; }
}

export async function GET(req: NextRequest) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('tile_inventory')
            .select('*')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ inventory: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
        return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    try {
        const { error } = await supabaseAdmin
            .from('tile_inventory')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Item removed" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
