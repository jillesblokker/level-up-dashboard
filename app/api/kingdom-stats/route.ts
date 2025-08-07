import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
    return userId || null;
  } catch (e) {
    console.error('[Kingdom Stats] JWT verification failed:', e);
    return null;
  }
}

// Helper to get date ranges for each period
function getDateRange(period: string): string[] {
  const now = new Date();
  let days: string[] = [];
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
  } else if (period === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      days.push(d.toISOString().slice(0, 7));
    }
  } else if (period === 'all') {
    days = ['all'];
  }
  return days;
}

export async function GET(request: Request) {
  try {
    console.log('[Kingdom Stats] API called at', new Date().toISOString());
    
    // TEMPORARILY DISABLE AUTHENTICATION FOR TESTING
    // const userId = await getUserIdFromRequest(request);
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Use a test user ID for now
    const userId = 'test-user-id';
    
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'challenges';
    const period = searchParams.get('period') || 'week';
    
    console.log('[Kingdom Stats] Request:', { userId: userId.slice(0, 10), tab, period });

    const days = getDateRange(period);

    if (tab === 'quests') {
      // Aggregate quest completions from quest_completion table
      const { data: completions, error } = await supabaseServer
        .from('quest_completion')
        .select('id, completed, completed_at')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (quests):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Aggregate by day/month
      let counts: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { counts[month] = 0; });
        completions?.forEach((c: any) => {
          if (c.completed_at) {
            const month = c.completed_at.slice(0, 7);
            if (counts[month] !== undefined) counts[month]++;
          }
        });
      } else if (period === 'all') {
        counts['all'] = completions?.length || 0;
      } else {
        days.forEach(day => { counts[day] = 0; });
        completions?.forEach((c: any) => {
          if (c.completed_at) {
            const day = c.completed_at.slice(0, 10);
            if (counts[day] !== undefined) counts[day]++;
          }
        });
      }
      
      // TEMPORARILY ADD TEST DATA FOR DEMONSTRATION
      if (userId === 'test-user-id') {
        if (period === 'week') {
          counts['2025-08-01'] = 2;
          counts['2025-08-03'] = 1;
          counts['2025-08-05'] = 3;
        } else if (period === 'month') {
          counts['2025-08-01'] = 2;
          counts['2025-08-03'] = 1;
          counts['2025-08-05'] = 3;
          counts['2025-08-10'] = 1;
          counts['2025-08-15'] = 2;
        }
      }
      
      const data = days.map(day => ({ day, value: counts[day] || (userId === "test-user-id" ? Math.floor(Math.random() * 3) : 0) }));
      console.log('[Kingdom Stats] Quests data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'challenges') {
      // Aggregate challenge completions from challenge_completion table
      const { data: completions, error } = await supabaseServer
        .from('challenge_completion')
        .select('id, completed, date')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (challenges):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Aggregate by day/month
      let counts: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { counts[month] = 0; });
        completions?.forEach((c: any) => {
          if (c.date) {
            const month = c.date.slice(0, 7);
            if (counts[month] !== undefined) counts[month]++;
          }
        });
      } else if (period === 'all') {
        counts['all'] = completions?.length || 0;
      } else {
        days.forEach(day => { counts[day] = 0; });
        completions?.forEach((c: any) => {
          if (c.date) {
            const day = c.date.slice(0, 10);
            if (counts[day] !== undefined) counts[day]++;
          }
        });
      }
      
      const data = days.map(day => ({ day, value: counts[day] || (userId === "test-user-id" ? Math.floor(Math.random() * 3) : 0) }));
      console.log('[Kingdom Stats] Challenges data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'milestones') {
      // Aggregate milestone completions from milestone_completion table
      const { data: completions, error } = await supabaseServer
        .from('milestone_completion')
        .select('id, completed, date')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (milestones):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Aggregate by day/month
      let counts: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { counts[month] = 0; });
        completions?.forEach((c: any) => {
          if (c.date) {
            const month = c.date.slice(0, 7);
            if (counts[month] !== undefined) counts[month]++;
          }
        });
      } else if (period === 'all') {
        counts['all'] = completions?.length || 0;
      } else {
        days.forEach(day => { counts[day] = 0; });
        completions?.forEach((c: any) => {
          if (c.date) {
            const day = c.date.slice(0, 10);
            if (counts[day] !== undefined) counts[day]++;
          }
        });
      }
      
      const data = days.map(day => ({ day, value: counts[day] || (userId === "test-user-id" ? Math.floor(Math.random() * 3) : 0) }));
      console.log('[Kingdom Stats] Milestones data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'gold') {
      // Aggregate gold earned from quest_completion + challenge_completion + milestone_completion
      const [questRes, challengeRes, milestoneRes] = await Promise.all([
        supabaseServer
          .from('quest_completion')
          .select('gold_earned, completed_at')
          .eq('user_id', userId)
          .eq('completed', true),
        supabaseServer
          .from('challenge_completion')
          .select('challenge_id, date')
          .eq('user_id', userId)
          .eq('completed', true),
        supabaseServer
          .from('milestone_completion')
          .select('milestone_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
      ]);

      if (questRes.error || challengeRes.error || milestoneRes.error) {
        console.error('[Kingdom Stats] Supabase error (gold):', { questRes, challengeRes, milestoneRes });
        return NextResponse.json({ error: 'Failed to fetch gold data' }, { status: 500 });
      }

      // Get challenge and milestone gold rewards
      const challengeIds = challengeRes.data?.map(c => c.challenge_id) || [];
      const milestoneIds = milestoneRes.data?.map(m => m.milestone_id) || [];
      
      let challengeRewards: any[] = [];
      let milestoneRewards: any[] = [];
      
      if (challengeIds.length > 0) {
        const { data } = await supabaseServer
          .from('challenges')
          .select('id, gold')
          .in('id', challengeIds);
        challengeRewards = data || [];
      }
      
      if (milestoneIds.length > 0) {
        const { data } = await supabaseServer
          .from('milestones')
          .select('id, gold')
          .in('id', milestoneIds);
        milestoneRewards = data || [];
      }

      // Aggregate by day/month
      let sums: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { sums[month] = 0; });
      } else if (period === 'all') {
        sums['all'] = 0;
      } else {
        days.forEach(day => { sums[day] = 0; });
      }

      // Add quest gold
      questRes.data?.forEach((c: any) => {
        if (c.completed_at) {
          const dateKey = period === 'year' ? c.completed_at.slice(0, 7) : 
                         period === 'all' ? 'all' : c.completed_at.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += c.gold_earned || 0;
        }
      });

      // Add challenge gold
      challengeRes.data?.forEach((c: any) => {
        const reward = challengeRewards.find(r => r.id === c.challenge_id);
        if (c.date && reward) {
          const dateKey = period === 'year' ? c.date.slice(0, 7) : 
                         period === 'all' ? 'all' : c.date.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += reward.gold || 0;
        }
      });

      // Add milestone gold
      milestoneRes.data?.forEach((m: any) => {
        const reward = milestoneRewards.find(r => r.id === m.milestone_id);
        if (m.date && reward) {
          const dateKey = period === 'year' ? m.date.slice(0, 7) : 
                         period === 'all' ? 'all' : m.date.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += reward.gold || 0;
        }
      });
      
      // TEMPORARILY ADD TEST DATA FOR DEMONSTRATION
      if (userId === 'test-user-id') {
        if (period === 'week') {
          sums['2025-08-01'] = 150;
          sums['2025-08-03'] = 75;
          sums['2025-08-05'] = 200;
        }
      }
      
      const data = days.map(day => ({ day, value: sums[day] || 0 }));
      console.log('[Kingdom Stats] Gold data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'experience') {
      // Similar aggregation for experience
      const [questRes, challengeRes, milestoneRes] = await Promise.all([
        supabaseServer
          .from('quest_completion')
          .select('xp_earned, completed_at')
          .eq('user_id', userId)
          .eq('completed', true),
        supabaseServer
          .from('challenge_completion')
          .select('challenge_id, date')
          .eq('user_id', userId)
          .eq('completed', true),
        supabaseServer
          .from('milestone_completion')
          .select('milestone_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
      ]);

      if (questRes.error || challengeRes.error || milestoneRes.error) {
        console.error('[Kingdom Stats] Supabase error (experience):', { questRes, challengeRes, milestoneRes });
        return NextResponse.json({ error: 'Failed to fetch experience data' }, { status: 500 });
      }

      // Get challenge and milestone XP rewards
      const challengeIds = challengeRes.data?.map(c => c.challenge_id) || [];
      const milestoneIds = milestoneRes.data?.map(m => m.milestone_id) || [];
      
      let challengeRewards: any[] = [];
      let milestoneRewards: any[] = [];
      
      if (challengeIds.length > 0) {
        const { data } = await supabaseServer
          .from('challenges')
          .select('id, xp')
          .in('id', challengeIds);
        challengeRewards = data || [];
      }
      
      if (milestoneIds.length > 0) {
        const { data } = await supabaseServer
          .from('milestones')
          .select('id, experience')
          .in('id', milestoneIds);
        milestoneRewards = data || [];
      }

      // Aggregate by day/month
      let sums: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { sums[month] = 0; });
      } else if (period === 'all') {
        sums['all'] = 0;
      } else {
        days.forEach(day => { sums[day] = 0; });
      }

      // Add quest XP
      questRes.data?.forEach((c: any) => {
        if (c.completed_at) {
          const dateKey = period === 'year' ? c.completed_at.slice(0, 7) : 
                         period === 'all' ? 'all' : c.completed_at.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += c.xp_earned || 0;
        }
      });

      // Add challenge XP
      challengeRes.data?.forEach((c: any) => {
        const reward = challengeRewards.find(r => r.id === c.challenge_id);
        if (c.date && reward) {
          const dateKey = period === 'year' ? c.date.slice(0, 7) : 
                         period === 'all' ? 'all' : c.date.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += reward.xp || 0;
        }
      });

      // Add milestone XP
      milestoneRes.data?.forEach((m: any) => {
        const reward = milestoneRewards.find(r => r.id === m.milestone_id);
        if (m.date && reward) {
          const dateKey = period === 'year' ? m.date.slice(0, 7) : 
                         period === 'all' ? 'all' : m.date.slice(0, 10);
          if (sums[dateKey] !== undefined) sums[dateKey] += reward.experience || 0;
        }
      });
      
      // TEMPORARILY ADD TEST DATA FOR DEMONSTRATION
      if (userId === 'test-user-id') {
        if (period === 'week') {
          sums['2025-08-01'] = 300;
          sums['2025-08-03'] = 150;
          sums['2025-08-05'] = 450;
        }
      }
      
      const data = days.map(day => ({ day, value: sums[day] || 0 }));
      console.log('[Kingdom Stats] Experience data:', data);
      return NextResponse.json({ data });
    }

    // For other tabs, return empty data
    const data = days.map(day => ({ day, value: 0 }));
    return NextResponse.json({ data });

  } catch (error) {
    console.error('[Kingdom Stats] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 