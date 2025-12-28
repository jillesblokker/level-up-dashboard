
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Diagnosing Leaderboard ---');

    // 1. Check character_stats columns
    console.log('1. Checking character_stats select...');
    const { data: stats, error: statsError } = await supabase
        .from('character_stats')
        .select('user_id, display_name, character_name, experience, gold')
        .limit(1);

    if (statsError) {
        console.error('FAIL: character_stats select error:', statsError.code, statsError.message);
    } else {
        console.log('SUCCESS: character_stats returned', stats?.length, 'rows');
        if (stats.length > 0) console.log('Sample:', stats[0]);
    }

    // 2. Check realm_tiles
    console.log('\n2. Checking realm_tiles...');
    const { count, error: tilesError } = await supabase
        .from('realm_tiles')
        .select('*', { count: 'exact', head: true });

    if (tilesError) {
        console.error('FAIL: realm_tiles count error:', tilesError.message);
    } else {
        console.log('SUCCESS: realm_tiles count:', count);
    }

    // 3. Check if user exists but has no stats
    // (Optional)
}

diagnose();
