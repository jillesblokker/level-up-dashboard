import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to verify admin status
async function isAdmin() {
    try {
        const user = await currentUser();
        if (!user) return false;

        const adminEmail = (process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com').toLowerCase();
        // Check all emails
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());

        return userEmails.includes(adminEmail);
    } catch (e) {
        console.error("Admin check failed:", e);
        return false;
    }
}

// Search Users
export async function GET(req: NextRequest) {
    if (!await isAdmin()) {
        console.error("Admin check failed for user");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const targetUserId = searchParams.get('userId'); // Support getting single user details

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

            // Construct preferences object
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

        // Search in character_stats (where display_name lives)
        const { data, error } = await supabaseAdmin
            .from('character_stats')
            .select('*')
            .ilike('display_name', `%${query}%`)
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ users: data });

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
    const { userId, updates, type } = body; // type = 'stats' | 'preference'

    try {
        if (type === 'preference') {
            // Updage single preference
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
            // Default to stats update
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
    const action = searchParams.get('action'); // 'reset' | 'delete'

    if (!userId || !action) {
        return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    try {
        if (action === 'reset') {
            // Reset character stats to Level 1, 0 Gold, 0 XP
            await supabaseAdmin.from('character_stats').update({
                level: 1,
                experience: 0,
                gold: 0,
                streak_tokens: 0,
                kingdom_expansions: 0
            }).eq('user_id', userId);

            // Clear Inventory
            await supabaseAdmin.from('tile_inventory').delete().eq('user_id', userId);

            // Clear Quests (Optional: maybe keep global quests but reset progress?)
            // For now, let's just reset stats/inventory as that's the main "Game State"

            return NextResponse.json({ success: true, message: "Account reset successfully" });
        }

        if (action === 'delete') {
            // Delete EVERYTHING
            // Note: tables usually cascade but we can be explicit
            await supabaseAdmin.from('character_stats').delete().eq('user_id', userId);
            await supabaseAdmin.from('user_preferences').delete().eq('user_id', userId);
            await supabaseAdmin.from('realm_data').delete().eq('user_id', userId);
            await supabaseAdmin.from('tile_inventory').delete().eq('user_id', userId);
            await supabaseAdmin.from('streaks').delete().eq('user_id', userId);

            return NextResponse.json({ success: true, message: "Account deleted data successfully" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (err: any) {
        console.error("Admin Delete Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
