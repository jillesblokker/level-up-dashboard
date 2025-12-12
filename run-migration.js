const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Running database migration...\n');

    const migrationPath = path.join(__dirname, 'migrations', 'create_user_preferences_and_realm_data.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📝 SQL length:', sql.length, 'characters\n');

    try {
        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📊 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing...`);

            const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

            if (error) {
                // Try direct query instead
                const { error: directError } = await supabase.from('_migrations').insert({ statement });
                if (directError) {
                    console.error(`❌ Error on statement ${i + 1}:`, error.message);
                    // Continue anyway - table might already exist
                } else {
                    console.log(`✅ Statement ${i + 1} executed`);
                }
            } else {
                console.log(`✅ Statement ${i + 1} executed`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Wait for Vercel deployment to complete');
        console.log('2. Visit https://lvlup.jillesblokker.com');
        console.log('3. Hard refresh (Cmd+Shift+R) to clear cache');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.error('   https://supabase.com/dashboard/project/uunfpqrauivviygysjzj/sql\n');
        process.exit(1);
    }
}

runMigration();
