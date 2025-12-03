import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

/**
 * DELETE /api/user/delete-account
 * 
 * Deletes the current user's account and all associated data.
 * This is a destructive operation that:
 * 1. Deletes all user data from Supabase (quests, challenges, stats, etc.)
 * 2. Deletes the user from Clerk
 * 3. Clears localStorage on the client
 */
export async function DELETE() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Delete Account] Starting deletion for user:', userId);

        // List of all tables that contain user data
        const tablesToClean = [
            'character_stats',
            'quest_completion',
            'quest_progress',     // Added
            'challenge_completion',
            'milestone_completion',
            'milestone_progress', // Added
            'quests',           // User's custom quests
            'challenges',       // User's custom challenges (if any)
            'milestones',       // User's custom milestones (if any)
            'streaks',
            'property_timers',
            'realm_grids',
            'realm_tiles',
            'tile_inventory',   // Added
            'inventory_items',
            'achievements',
            'kingdom_events',
            'kingdom_event_log', // Added
            'quest_favorites',
            'game_settings',
            'user_preferences',  // Added
            'image_descriptions', // Added
            'users',             // Added (custom users table if exists)
        ];

        // Delete user data from all tables
        const deletionResults = [];
        for (const table of tablesToClean) {
            try {
                const { error, count } = await supabaseServer
                    .from(table)
                    .delete()
                    .eq('user_id', userId);

                if (error) {
                    console.error(`[Delete Account] Error deleting from ${table}:`, error);
                    deletionResults.push({ table, success: false, error: error.message });
                } else {
                    console.log(`[Delete Account] Deleted ${count || 0} rows from ${table}`);
                    deletionResults.push({ table, success: true, count: count || 0 });
                }
            } catch (err) {
                console.error(`[Delete Account] Exception deleting from ${table}:`, err);
                deletionResults.push({
                    table,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
            }
        }

        // Delete the user from Clerk
        try {
            const clerk = await clerkClient();
            await clerk.users.deleteUser(userId);
            console.log('[Delete Account] User deleted from Clerk');
        } catch (clerkError) {
            console.error('[Delete Account] Error deleting from Clerk:', clerkError);
            return NextResponse.json({
                error: 'Failed to delete user from authentication system',
                details: clerkError instanceof Error ? clerkError.message : 'Unknown error',
                supabaseResults: deletionResults
            }, { status: 500 });
        }

        console.log('[Delete Account] Account deletion complete');

        return NextResponse.json({
            success: true,
            message: 'Account and all data deleted successfully',
            deletionResults
        });

    } catch (error) {
        console.error('[Delete Account] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
