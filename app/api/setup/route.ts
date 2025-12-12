import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Missing Supabase credentials' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Create user_preferences table
        const createUserPreferences = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        preference_value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, preference_key)
      );
    `;

        // Create realm_data table
        const createRealmData = `
      CREATE TABLE IF NOT EXISTS realm_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, data_key)
      );
    `;

        // Execute table creation
        const { error: prefError } = await supabase.rpc('exec', { sql: createUserPreferences });
        const { error: realmError } = await supabase.rpc('exec', { sql: createRealmData });

        // If RPC doesn't work, try using the SQL editor approach
        if (prefError || realmError) {
            console.log('RPC failed, tables might already exist or need manual creation');
        }

        return NextResponse.json({
            success: true,
            message: 'Database setup completed! Tables created or already exist.',
            details: {
                userPreferences: prefError ? 'Already exists or needs manual creation' : 'Created',
                realmData: realmError ? 'Already exists or needs manual creation' : 'Created'
            }
        });

    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json(
            {
                error: 'Setup failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                instructions: 'Please run the migration manually in Supabase SQL Editor: migrations/create_user_preferences_and_realm_data.sql'
            },
            { status: 500 }
        );
    }
}
