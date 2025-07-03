import { NextResponse } from 'next/server';
import { create_supabase_server_client } from '@/app/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: 'supabase' });
    const supabase = create_supabase_server_client(token || undefined);
    const { data, error } = await supabase.from('test_table').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 