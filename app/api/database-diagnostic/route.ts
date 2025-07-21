import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

/**
 * Database diagnostic endpoint to check:
 * 1. Supabase connection
 * 2. Available tables
 * 3. Environment variables
 * 4. Schema information
 */
export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL']?.substring(0, 30) + '...',
      serviceKeyPresent: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
      serviceKeyLength: process.env['SUPABASE_SERVICE_ROLE_KEY']?.length || 0,
    };

    // Test 1: Basic connection
    try {
      const { data: testQuery, error: testError } = await supabaseServer
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_schema', 'public')
        .limit(10);
      
      diagnostics.basicConnection = testError ? 'Failed' : 'Success';
      diagnostics.connectionError = testError?.message;
      diagnostics.foundTables = testQuery?.length || 0;
    } catch (err) {
      diagnostics.basicConnection = 'Failed';
      diagnostics.connectionError = (err as Error).message;
    }

    // Test 2: Check for specific tables we need
    const expectedTables = [
      'inventory_items',
      'user_preferences', 
      'character_stats',
      'quest_completion',
      'tile_inventory'
    ];

    diagnostics.tableCheck = {};
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabaseServer
          .from(tableName)
          .select('*')
          .limit(1);
        
        diagnostics.tableCheck[tableName] = {
          exists: !error || error.code !== '42P01', // 42P01 = relation does not exist
          error: error?.code,
          message: error?.message
        };
      } catch (err) {
        diagnostics.tableCheck[tableName] = {
          exists: false,
          error: 'Exception',
          message: (err as Error).message
        };
      }
    }

    // Test 3: Check RPC function
    try {
      await supabaseServer.rpc('public.set_user_context', { user_id: 'test_user_123' });
      diagnostics.rpcFunctionExists = true;
    } catch (err: any) {
      diagnostics.rpcFunctionExists = false;
      diagnostics.rpcError = err.message;
    }

    // Test 4: List all public tables
    try {
      const { data: allTables } = await supabaseServer
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      diagnostics.allPublicTables = allTables?.map(t => t.table_name) || [];
    } catch (err) {
      diagnostics.allTablesError = (err as Error).message;
    }

    return NextResponse.json({
      status: 'Diagnostic completed',
      diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Diagnostic failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 