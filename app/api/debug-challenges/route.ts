import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force dynamic - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
        }

        // Bypass RLS completely with service role key
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        });

        // 1. Check Row Count
        const { count, error: countError } = await supabase
            .from('challenges')
            .select('*', { count: 'exact', head: true });

        // 2. Fetch Sample Data
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .limit(5);

        return NextResponse.json({
            success: true,
            count,
            countError,
            data,
            error,
            env: {
                url: supabaseUrl,
                hasKey: !!supabaseServiceKey
            }
        });

    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}
