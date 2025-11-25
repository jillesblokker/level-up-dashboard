import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { count, error } = await supabaseServer
            .from('challenges')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ count });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
