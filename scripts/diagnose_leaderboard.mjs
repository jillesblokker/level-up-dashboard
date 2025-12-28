
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
    console.log('--- Diagnosing Leaderboard Queries ---');

    // 1. XP Query (Standard)
    console.log('\n1. Testing XP Query (character_stats)...');
    const { data: xpData, error: xpError } = await supabase
        .from('character_stats')
        .select('user_id, display_name, character_name, experience, gold, level')
        .order('experience', { ascending: false })
        .limit(5);

    if (xpError) {
        console.error('FAIL: XP Query:', xpError);
    } else {
        console.log('SUCCESS: XP Data Rows:', xpData.length);
        if (xpData.length > 0) console.log(JSON.stringify(xpData[0], null, 2));
    }

    // 2. Streaks Query
    console.log('\n2. Testing Streaks Query...');
    const { data: streakData, error: streakError } = await supabase
        .from('streaks')
        .select('*')
        .limit(5);

    if (streakError) {
        console.error('FAIL: Streak Query:', streakError);
    } else {
        console.log('SUCCESS: Streak Data Rows:', streakData.length);
    }

    // 3. Tiles Query
    console.log('\n3. Testing Tiles Query (realm_tiles)...');
    const { data: tilesData, error: tilesError } = await supabase
        .from('realm_tiles')
        .select('user_id')
        .limit(5);

    if (tilesError) {
        console.error('FAIL: Tiles Query:', tilesError);
    } else {
        console.log('SUCCESS: Tiles Data Rows:', tilesData.length);
    }
}

diagnose();
