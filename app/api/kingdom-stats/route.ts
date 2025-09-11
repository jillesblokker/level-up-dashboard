import { NextResponse, NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'quests';
    const period = searchParams.get('period') || 'week';

    // Use secure authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Get date range for the requested period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Handle quests tab
      if (tab === 'quests') {
        const { data: completions, error } = await supabase
          .from('quest_completion')
          .select('id, quest_id, completed_at, completed')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', startDate.toISOString());
          
        if (error) {
          throw error;
        }

        // Group by day
        const dailyData: Record<string, number> = {};
        completions?.forEach((completion: any) => {
          if (completion.completed_at) {
            const day = completion.completed_at.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + 1;
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Handle challenges tab
      if (tab === 'challenges') {
        const { data: completions, error } = await supabase
          .from('challenge_completion')
          .select('id, challenge_id, date, completed')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', startDate.toISOString());
          
        if (error) {
          throw error;
        }

        // Group by day
        const dailyData: Record<string, number> = {};
        completions?.forEach((completion: any) => {
          if (completion.date) {
            const day = completion.date.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + 1;
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Handle milestones tab
      if (tab === 'milestones') {
        const { data: completions, error } = await supabase
          .from('milestone_completion')
          .select('id, milestone_id, date, completed')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', startDate.toISOString());
          
        if (error) {
          throw error;
        }

        // Group by day
        const dailyData: Record<string, number> = {};
        completions?.forEach((completion: any) => {
          if (completion.date) {
            const day = completion.date.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + 1;
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Handle gold gained tab
      if (tab === 'gold-gained') {
        const { data: transactions, error } = await supabase
          .from('gold_transactions')
          .select('id, amount, created_at, transaction_type')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .gt('amount', 0);
          
        if (error) {
          throw error;
        }

        // Group by day
        const dailyData: Record<string, number> = {};
        transactions?.forEach((transaction: any) => {
          if (transaction.created_at) {
            const day = transaction.created_at.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + (transaction.amount || 0);
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Handle gold spent tab
      if (tab === 'gold-spent') {
        const { data: transactions, error } = await supabase
          .from('gold_transactions')
          .select('id, amount, created_at, transaction_type')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lt('amount', 0);
          
        if (error) {
          throw error;
        }

        // Group by day (convert negative to positive for display)
        const dailyData: Record<string, number> = {};
        transactions?.forEach((transaction: any) => {
          if (transaction.created_at) {
            const day = transaction.created_at.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + Math.abs(transaction.amount || 0);
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Handle experience tab
      if (tab === 'experience') {
        const { data: transactions, error } = await supabase
          .from('experience_transactions')
          .select('id, amount, created_at, transaction_type')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString());
          
        if (error) {
          throw error;
        }

        // Group by day
        const dailyData: Record<string, number> = {};
        transactions?.forEach((transaction: any) => {
          if (transaction.created_at) {
            const day = transaction.created_at.split('T')[0];
            dailyData[day] = (dailyData[day] || 0) + (transaction.amount || 0);
          }
        });

        const data = Object.entries(dailyData).map(([day, value]) => ({ day, value }));
        return { data };
      }

      // Default: return empty data
      return { data: [] };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json(result.data);
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('[Kingdom Stats] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
