import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250805000000_create_missing_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ error: 'Migration file not found' }, { status: 500 });
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('[Migration API] Error applying migration:', error);
      return NextResponse.json({ error: 'Failed to apply migration', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Migration applied successfully' });
  } catch (error) {
    console.error('[Migration API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 