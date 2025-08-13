import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, balanceAfter, transactionType, source, metadata } = body;

    if (!amount || !balanceAfter || !transactionType || !source) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, balanceAfter, transactionType, source' 
      }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('gold_transactions')
        .insert({
          user_id: userId,
          transaction_type: transactionType,
          amount,
          balance_after: balanceAfter,
          source,
          description: `${transactionType === 'gain' ? '+' : '-'}${amount} gold from ${source}`,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('[Gold Transactions API] Insert error:', error);
        throw error;
      }

      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Gold Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('gold_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[Gold Transactions API] Select error:', error);
        throw error;
      }

      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Gold Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 