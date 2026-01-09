import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to verify admin status with detailed logging
async function isAdmin(request: Request): Promise<boolean> {
    console.log('[Admin Users API] isAdmin check started');
    console.log('[Admin Users API] Request URL:', request.url);

    try {
        // Step 1: Get userId from Clerk auth()
        console.log('[Admin Users API] Calling auth()...');
        const { userId } = await auth();
        console.log('[Admin Users API] auth() returned userId:', userId);

        if (!userId) {
            console.log('[Admin Users API] FAILED: No userId from auth()');
            return false;
        }

        // Step 2: Get user details from Clerk
        console.log('[Admin Users API] Fetching user from clerkClient...');
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        console.log('[Admin Users API] User fetched, emails:', user.emailAddresses.map(e => e.emailAddress));

        // Step 3: Check admin email
        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
        console.log('[Admin Users API] Checking admin email. Expected:', adminEmail, 'Found:', userEmails);

        const isMatch = userEmails.includes(adminEmail);
        console.log('[Admin Users API] Email match result:', isMatch);

        if (!isMatch) {
            console.log(`[Admin Users API] FAILED: Email mismatch`);
        } else {
            console.log('[Admin Users API] SUCCESS: Admin access granted');
        }

        return isMatch;
    } catch (e) {
        console.error('[Admin Users API] EXCEPTION in isAdmin:', e);
        return false;
    }
}

// Search Users
export async function GET(req: NextRequest) {
    console.log('[Admin Users API] GET request received');

    if (!await isAdmin(req)) {
        console.log('[Admin Users API] Returning 403 Forbidden');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const targetUserId = searchParams.get('userId');

    try {
        if (targetUserId) {
            // Fetch single user details + preferences
            const { data: stats, error: statsError } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .eq('user_id', targetUserId)
                .single();

            const { data: prefs, error: prefsError } = await supabaseAdmin
                .from('user_preferences')
                .select('*')
                .eq('user_id', targetUserId);

            const preferences: Record<string, any> = {};
            if (prefs) {
                prefs.forEach((p: any) => {
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
            console.log('[Admin Users API] Query too short, returning empty');
            return NextResponse.json({ users: [] });
        }

        console.log('[Admin Users API] Searching for query:', query);

        // Strategy: Search Clerk for users by name or email (source of truth for profiles)
        try {
            const client = await clerkClient();

            // Search Clerk users - this searches username, email, first_name, last_name
            const clerkUsers = await client.users.getUserList({
                query: query,
                limit: 20
            });

            console.log('[Admin Users API] Clerk search found:', clerkUsers.data.length, 'users');

            if (clerkUsers.data.length === 0) {
                // Also try email-specific search
                const emailUsers = await client.users.getUserList({
                    emailAddress: [query],
                    limit: 10
                });

                if (emailUsers.data.length > 0) {
                    clerkUsers.data.push(...emailUsers.data);
                }
            }

            if (clerkUsers.data.length === 0) {
                console.log('[Admin Users API] No users found in Clerk');
                return NextResponse.json({ users: [] });
            }

            // Get user IDs from Clerk results
            const clerkUserIds = clerkUsers.data.map(u => u.id);

            // Fetch game data from Supabase for these users
            const { data: gameStats, error: statsError } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .in('user_id', clerkUserIds);

            console.log('[Admin Users API] Game stats found:', gameStats?.length || 0);

            // Combine Clerk profile data with game stats
            const enrichedUsers = clerkUsers.data.map(clerkUser => {
                const gameStat = gameStats?.find(s => s.user_id === clerkUser.id);
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

            console.log('[Admin Users API] Returning', enrichedUsers.length, 'enriched users');
            return NextResponse.json({ users: enrichedUsers });

        } catch (clerkError: any) {
            console.error('[Admin Users API] Clerk search error:', clerkError.message);

            // Fallback to database search if Clerk fails
            const { data: fallbackUsers, error: fallbackError } = await supabaseAdmin
                .from('character_stats')
                .select('*')
                .limit(20);

            return NextResponse.json({ users: fallbackUsers || [] });
        }

        return NextResponse.json({ users: [] });

    } catch (err: any) {
        console.error("Admin Users API Error:", err);
        return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
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
    } catch (err: any) {
        console.error("Admin Update Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
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
            // Delete all realm data for this user to force a re-seed/fresh start
            await supabaseAdmin.from('realm_data').delete().eq('user_id', userId);

            return NextResponse.json({ success: true, message: "Realm Map reset to default." });
        }

        if (action === 'reset_kingdom') {
            // Reset kingdom expansions
            await supabaseAdmin.from('character_stats')
                .update({ kingdom_expansions: 0 })
                .eq('user_id', userId);

            // If kingdom layout is stored in realm_data under specific keys, deleting all realm_data in 'reset_map' covers it.
            // But if we want JUST kingdom, we might need a more specific query if we knew the key structure.
            // For now, let's assume 'reset_map' is the big hammer, and 'reset_kingdom' just resets the expansion stats.

            return NextResponse.json({ success: true, message: "Kingdom stats reset." });
        }

        if (action === 'reset') {
            // Reset character stats
            await supabaseAdmin.from('character_stats').update({
                level: 1,
                experience: 0,
                gold: 0,
                streak_tokens: 0,
                kingdom_expansions: 0
            }).eq('user_id', userId);

            // Clear Inventory
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

    } catch (err: any) {
        console.error("Admin Delete Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
