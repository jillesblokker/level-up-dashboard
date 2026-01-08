
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client'; // Use the server-client if available, or just standard client with service key if needed. 
// Actually we should use the pattern from /api/quests/new which uses `auth()` and manual supabase init or the helper.
// Let's use the robust pattern.

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const client = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await client
            .from('chronicle_entries')
            .select('*')
            .eq('user_id', userId)
            .order('entry_date', { ascending: false });

        if (error) {
            console.error('[API/chronicle] Select Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API/chronicle] Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { content, mood_score, entry_date } = body;

        // Validation
        if (!content || !mood_score) {
            return NextResponse.json({ error: 'Missing content or mood' }, { status: 400 });
        }

        const client = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await client
            .from('chronicle_entries')
            .upsert({
                user_id: userId,
                entry_date: entry_date || new Date().toISOString().split('T')[0],
                content,
                mood_score
            }, { onConflict: 'user_id, entry_date' })
            .select()
            .single();

        if (error) {
            console.error('[API/chronicle] Upsert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('[API/chronicle] Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
