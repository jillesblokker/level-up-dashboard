import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    try {
        const { userId } = getAuth(req as any);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseServer
            .from('user_mythic_cards')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching mythics:', error);
            return NextResponse.json({ error: 'Failed to fetch mythics' }, { status: 500 });
        }

        return NextResponse.json({ mythics: data || [] });
    } catch (error) {
        console.error('Fetch mythics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
