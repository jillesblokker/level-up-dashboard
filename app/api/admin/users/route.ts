import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to verify admin status - uses auth() for API routes (not currentUser)
async function isAdmin() {
    try {
        const { userId } = await auth();
        if (!userId) {
            console.log("Admin check failed: No userId from auth()");
            return false;
        }

        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());

        const isMatch = userEmails.includes(adminEmail);

        if (!isMatch) {
            console.log(`Admin check failed. Expected: ${adminEmail}. Found: ${userEmails.join(', ')}`);
        } else {
            console.log("Admin access granted for:", adminEmail);
        }

        return isMatch;
    } catch (e) {
        console.error("Admin check failed with error:", e);
        return false;
    }
}

// Search Users
export async function GET(req: NextRequest) {
    if (!await isAdmin()) {
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

        if (!query || query.length < 3) {
            return NextResponse.json({ users: [] });
        }

        // Search strategy: 
        // 1. Search existing user_preferences for name matches (most reliable source of truth for display names)
        // 2. Search character_stats as backup

        // Strategy 1: Search user_preferences
        const { data: prefMatches, error: prefError } = await supabaseAdmin
            .from('user_preferences')
            .select('user_id, preference_value')
            .eq('preference_key', 'display_name'); // We can't easily ILIKE on jsonb value in this query builder without complex filters

        // Easier approach: Search character_stats since we migrated display_name there specifically for this.
        // If the migration worked, names should be there.
        const { data: statsMatches, error: statsError } = await supabaseAdmin
            .from('character_stats')
            .select('*')
            .ilike('display_name', `%${query}%`)
            .limit(10);

        if (statsError) throw statsError;

        return NextResponse.json({ users: statsMatches || [] });

    } catch (err: any) {
        console.error("Admin Users API Error:", err);
        return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
    }
}

// Update User Stats or Preferences
export async function PUT(req: NextRequest) {
    if (!await isAdmin()) {
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
    if (!await isAdmin()) {
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
