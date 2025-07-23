import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  try {
    console.log('Monster spawn test endpoint called');
    
    const { userId } = await auth();
    console.log('User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test 1: Check if table exists
    console.log('Testing if monster_spawns table exists...');
    const { data: tableCheck, error: tableError } = await supabaseServer
      .from('monster_spawns')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('Table check error:', tableError);
      return NextResponse.json({ 
        error: 'Table check failed', 
        details: tableError.message,
        code: tableError.code 
      }, { status: 500 });
    }

    console.log('Table check successful:', tableCheck);

    // Test 2: Check user's existing spawns
    console.log('Checking existing spawns for user...');
    const { data: existingSpawns, error: spawnsError } = await supabaseServer
      .from('monster_spawns')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (spawnsError) {
      console.error('Spawns check error:', spawnsError);
      return NextResponse.json({ 
        error: 'Spawns check failed', 
        details: spawnsError.message,
        code: spawnsError.code 
      }, { status: 500 });
    }

    console.log('Existing spawns:', existingSpawns);

    // Test 3: Test insert with dummy data
    console.log('Testing insert with dummy data...');
    const testData = {
      user_id: userId,
      x: 999,
      y: 999,
      monster_type: 'test_dragon',
      spawned_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseServer
      .from('monster_spawns')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('Insert test error:', insertError);
      return NextResponse.json({ 
        error: 'Insert test failed', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 });
    }

    console.log('Insert test successful:', insertData);

    // Clean up test data
    if (insertData && insertData.length > 0) {
      console.log('Cleaning up test data...');
      const { error: deleteError } = await supabaseServer
        .from('monster_spawns')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('Cleanup error:', deleteError);
      } else {
        console.log('Test data cleaned up successfully');
      }
    }

    return NextResponse.json({ 
      success: true, 
      tableExists: true,
      existingSpawns: existingSpawns?.length || 0,
      insertTest: 'passed'
    });

  } catch (error) {
    console.error('Unexpected error in monster spawn test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 