import { supabaseServer } from '../lib/supabase/server-client';

async function test() {
    try {
        console.log('Querying achievements...');
        const { data, error } = await supabaseServer
            .from('achievements')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Sample data:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
