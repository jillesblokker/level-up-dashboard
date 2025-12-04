const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function migrate() {
    console.log('🚀 Starting social features migration...');

    // Try to find DATABASE_URL
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL or POSTGRES_URL not found in environment variables.');
        console.error('Please ensure .env.local contains your Supabase database connection string.');
        console.error('Format: postgres://postgres:[password]@[project-ref].supabase.co:5432/postgres');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add-social-features.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration SQL...');
        await client.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('   - Created friends table');
        console.log('   - Created notifications table');
        console.log('   - Updated quests table');
        console.log('   - Added RLS policies');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
