import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/clerk-sdk-node';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function GET(req: NextRequest) {
  // 1. Get the JWT from the Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'No auth header' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');

  // 2. Verify the Clerk JWT
  try {
    await verifyToken(token, {}); // Pass empty options object
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 3. Query Supabase with service role key
  const { data, error } = await supabase.from('test_table').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 200 });
} 