import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
    try {
        // Check Clerk auth
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                error: 'Not authenticated',
                clerkAuth: false,
                timestamp: new Date().toISOString()
            }, { status: 401 });
        }

        // Check Supabase connection
        const { count, error } = await supabaseServer
            .from('challenges')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({
                clerkAuth: true,
                userId,
                supabaseError: error.message,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        return NextResponse.json({
            clerkAuth: true,
            userId,
            challengesCount: count,
            supabaseConnected: true,
            timestamp: new Date().toISOString(),
            message: 'All systems operational'
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
