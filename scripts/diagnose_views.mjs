
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

async function diagnoseViews() {
    console.log('--- Diagnosing SQL Views ---');

    // 1. Tiles View
    console.log('\n1. Testing Tiles View (view_leaderboard_tiles)...');
    const { data: tilesView, error: tilesError } = await supabase
        .from('view_leaderboard_tiles')
        .select('*')
        .limit(5);

    if (tilesError) {
        console.error('FAIL: Tiles View Query:', tilesError);
    } else {
        console.log('SUCCESS: Tiles View Rows:', tilesView.length);
        if (tilesView.length > 0) console.log(JSON.stringify(tilesView[0], null, 2));
    }

    // 2. Quests View
    console.log('\n2. Testing Quests View (view_leaderboard_quests_monthly)...');
    const { data: questsView, error: questsError } = await supabase
        .from('view_leaderboard_quests_monthly')
        .select('*')
        .limit(5);

    if (questsError) {
        console.error('FAIL: Quests View Query:', questsError);
    } else {
        console.log('SUCCESS: Quests View Rows:', questsView.length);
    }
}

diagnoseViews();
