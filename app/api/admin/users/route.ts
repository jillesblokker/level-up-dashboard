import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface UserPreference {
    preference_key: string;
    preference_value: unknown;
}

interface GameStats {
    user_id: string;
    level?: number;
    gold?: number;
    experience?: number;
    [key: string]: unknown;
}

// Helper to verify admin status
async function isAdmin(request: Request): Promise<boolean> {
    try {
        const { userId } = await auth();

        if (!userId) {
            apiLogger.debug('Admin check failed: No userId from auth()');
            return false;
        }

        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());

        const isMatch = userEmails.includes(adminEmail);

        if (!isMatch) {
            apiLogger.warn('Admin check failed: Email mismatch');
        }

        return isMatch;
    } catch (e) {
        apiLogger.error('Exception in admin check:', e);
        return false;
    }
}

// Search Users
export async function GET(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const targetUserId = searchParams.get('userId');

    try {
        if (targetUserId) {
            // Fetch single user details + preferences
            const { data: stats } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .eq('user_id', targetUserId)
                .single();

            const { data: prefs } = await supabaseAdmin
                .from('user_preferences')
                .select('*')
                .eq('user_id', targetUserId);

            const preferences: Record<string, unknown> = {};
            if (prefs) {
                (prefs as UserPreference[]).forEach((p) => {
                    preferences[p.preference_key] = p.preference_value;
                });
            }

            return NextResponse.json({
                user: {
                    ...stats,
                    preferences
                }
            });
        }

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        apiLogger.debug(`Admin search query: ${query}`);

        try {
            const client = await clerkClient();

            // Search Clerk users
            const clerkUsers = await client.users.getUserList({
                query: query,
                limit: 20
            });

            if (clerkUsers.data.length === 0) {
                // Try email-specific search
                const emailUsers = await client.users.getUserList({
                    emailAddress: [query],
                    limit: 10
                });

                if (emailUsers.data.length > 0) {
                    clerkUsers.data.push(...emailUsers.data);
                }
            }

            if (clerkUsers.data.length === 0) {
                return NextResponse.json({ users: [] });
            }

            // Get user IDs from Clerk results
            const clerkUserIds = clerkUsers.data.map(u => u.id);

            // Fetch game data from Supabase for these users
            const { data: gameStats } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .in('user_id', clerkUserIds);

            // Combine Clerk profile data with game stats
            const enrichedUsers = clerkUsers.data.map(clerkUser => {
                const gameStat = (gameStats as GameStats[] | null)?.find(s => s.user_id === clerkUser.id);
                const displayName = clerkUser.username ||
                    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                    clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] ||
                    'Unknown';
                const email = clerkUser.emailAddresses[0]?.emailAddress || '';

                return {
                    user_id: clerkUser.id,
                    display_name: displayName,
                    email: email,
                    level: gameStat?.level || 1,
                    gold: gameStat?.gold || 0,
                    experience: gameStat?.experience || 0,
                    has_game_data: !!gameStat
                };
            });

            return NextResponse.json({ users: enrichedUsers });

        } catch (clerkError) {
            apiLogger.error('Clerk search error:', clerkError);

            // Fallback to database search if Clerk fails
            const { data: fallbackUsers } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .limit(20);

            return NextResponse.json({ users: fallbackUsers || [] });
        }

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Internal Error';
        apiLogger.error('Admin Users API Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Update User Stats or Preferences
export async function PUT(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, updates, type } = body;

    try {
        if (type === 'preference') {
            const key = Object.keys(updates)[0];
            if (!key) {
                return NextResponse.json({ error: 'No preference key provided' }, { status: 400 });
            }
            const value = updates[key];

            const { data, error } = await supabaseAdmin
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    preference_key: key,
                    preference_value: value
                }, { onConflict: 'user_id, preference_key' })
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, preference: data });
        } else {
            const { data, error } = await supabaseAdmin
                .from('character_stats')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, stats: data });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Update error';
        apiLogger.error('Admin Update Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Delete / Reset User
export async function DELETE(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action'); // 'reset' | 'delete' | 'reset_map' | 'reset_kingdom'

    if (!userId || !action) {
        return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    try {
        if (action === 'reset_map') {
            await supabaseAdmin.from('realm_data').delete().eq('user_id', userId);
            return NextResponse.json({ success: true, message: "Realm Map reset to default." });
        }

        if (action === 'reset_kingdom') {
            await supabaseAdmin.from('character_stats')
                .update({ kingdom_expansions: 0 })
                .eq('user_id', userId);
            return NextResponse.json({ success: true, message: "Kingdom stats reset." });
        }

        if (action === 'reset') {
            await supabaseAdmin.from('character_stats').update({
                level: 1,
                experience: 0,
                gold: 0,
                streak_tokens: 0,
                kingdom_expansions: 0
            }).eq('user_id', userId);

            await supabaseAdmin.from('tile_inventory').delete().eq('user_id', userId);

            return NextResponse.json({ success: true, message: "Account stats reset successfully" });
        }

        if (action === 'delete') {
            await supabaseAdmin.from('character_stats').delete().eq('user_id', userId);
            await supabaseAdmin.from('user_preferences').delete().eq('user_id', userId);
            await supabaseAdmin.from('realm_data').delete().eq('user_id', userId);
            await supabaseAdmin.from('tile_inventory').delete().eq('user_id', userId);
            await supabaseAdmin.from('streaks').delete().eq('user_id', userId);
            await supabaseAdmin.from('user_quests').delete().eq('user_id', userId);

            return NextResponse.json({ success: true, message: "Account deleted data successfully" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Delete error';
        apiLogger.error('Admin Delete Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
