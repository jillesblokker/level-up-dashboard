import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Use the same pattern as working APIs
    const { userId } = getAuth(request as any);
    console.log('[Kingdom Stats] getAuth result:', { userId });
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
    console.log('[Kingdom Stats] API called');
    
    const userId = await getUserIdFromRequest(request);
    console.log('[Kingdom Stats] User ID:', userId);
    
    if (!userId) {
      console.log('[Kingdom Stats] No user ID, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'challenges';
    const period = searchParams.get('period') || 'week';
    
    console.log('[Kingdom Stats] Tab:', tab, 'Period:', period);

    // TEST: Check table structure first
    console.log('[Kingdom Stats] Testing table structure...');
    const { data: testData, error: testError } = await supabaseServer
      .from('quest_completion')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('[Kingdom Stats] Table structure test failed:', testError);
    } else {
      console.log('[Kingdom Stats] Table structure test successful. Available columns:', testData && testData.length > 0 ? Object.keys(testData[0]) : 'No data');
    }

    const days = getDateRange(period);
    console.log('[Kingdom Stats] Date range generated:', days);

    if (tab === 'quests') {
      console.log('[Kingdom Stats] === QUESTS TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching quests data for user:', userId);
      
      // Aggregate quest completions from quest_completion table
      const { data: completions, error } = await supabaseServer
        .from('quest_completion')
        .select('id, quest_id, completed_at, completed, gold_earned, xp_earned')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (quests):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[Kingdom Stats] Raw quest completions from DB:', completions);
      console.log('[Kingdom Stats] Total quest completions found:', completions?.length || 0);
      
      // Log sample data for debugging
      if (completions && completions.length > 0) {
        console.log('[Kingdom Stats] Sample quest completion:', completions[0]);
        console.log('[Kingdom Stats] Sample completed_at format:', completions[0]?.completed_at);
        console.log('[Kingdom Stats] Sample gold_earned:', completions[0]?.gold_earned);
        console.log('[Kingdom Stats] Sample xp_earned:', completions[0]?.xp_earned);
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
        console.log('[Kingdom Stats] Initialized day counts:', counts);
        
        completions?.forEach((c: any) => {
          if (c.completed_at) {
            const day = c.completed_at.slice(0, 10);
            console.log('[Kingdom Stats] Processing quest completion:', { 
              completed_at: c.completed_at, 
              extracted_day: day, 
              day_exists: counts[day] !== undefined 
            });
            if (counts[day] !== undefined) {
              counts[day]++;
              console.log('[Kingdom Stats] Updated count for day', day, ':', counts[day]);
            } else {
              console.log('[Kingdom Stats] Day', day, 'not in expected range');
            }
          } else {
            console.log('[Kingdom Stats] Quest completion missing completed_at:', c);
          }
        });
      }

      console.log('[Kingdom Stats] Final processed quest counts:', counts);
      console.log('[Kingdom Stats] Date range for period:', period, ':', days);
      console.log('[Kingdom Stats] Days with data:', Object.entries(counts).filter(([day, count]) => count > 0));

      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats] Final quest data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'challenges') {
      console.log('[Kingdom Stats] === CHALLENGES TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching challenges data for user:', userId);
      
      // Aggregate challenge completions from challenge_completion table
      const { data: completions, error } = await supabaseServer
        .from('challenge_completion')
        .select('id, completed, date, challenge_id')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (challenges):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[Kingdom Stats] Raw challenge completions from DB:', completions);
      console.log('[Kingdom Stats] Total challenge completions found:', completions?.length || 0);
      
      // Log sample data for debugging
      if (completions && completions.length > 0) {
        console.log('[Kingdom Stats] Sample challenge completion:', completions[0]);
        console.log('[Kingdom Stats] Sample date format:', completions[0]?.date);
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
        console.log('[Kingdom Stats] Initialized challenge day counts:', counts);
        
        completions?.forEach((c: any) => {
          if (c.date) {
            const day = c.date.slice(0, 10);
            console.log('[Kingdom Stats] Processing challenge completion:', { 
              date: c.date, 
              extracted_day: day, 
              day_exists: counts[day] !== undefined 
            });
            if (counts[day] !== undefined) {
              counts[day]++;
              console.log('[Kingdom Stats] Updated challenge count for day', day, ':', counts[day]);
            } else {
              console.log('[Kingdom Stats] Challenge day', day, 'not in expected range');
            }
          } else {
            console.log('[Kingdom Stats] Challenge completion missing date:', c);
          }
        });
      }

      console.log('[Kingdom Stats] Final processed challenge counts:', counts);
      console.log('[Kingdom Stats] Date range for period:', period, ':', days);
      console.log('[Kingdom Stats] Challenge days with data:', Object.entries(counts).filter(([day, count]) => count > 0));
      
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats] Final challenge data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'milestones') {
      console.log('[Kingdom Stats] === MILESTONES TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching milestones data for user:', userId);
      
      // Aggregate milestone completions from milestone_completion table
      const { data: completions, error } = await supabaseServer
        .from('milestone_completion')
        .select('id, completed, date, milestone_id')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (milestones):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[Kingdom Stats] Raw milestone completions from DB:', completions);
      console.log('[Kingdom Stats] Total milestone completions found:', completions?.length || 0);
      
      // Log sample data for debugging
      if (completions && completions.length > 0) {
        console.log('[Kingdom Stats] Sample milestone completion:', completions[0]);
        console.log('[Kingdom Stats] Sample date format:', completions[0]?.date);
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
        counts['all'] = 0;
        completions?.forEach((c: any) => {
          if (c.date) {
            counts['all'] = (counts['all'] || 0) + 1;
          }
        });
      } else {
        days.forEach(day => { counts[day] = 0; });
        console.log('[Kingdom Stats] Initialized milestone day counts:', counts);
        
        completions?.forEach((c: any) => {
          if (c.date) {
            const day = c.date.slice(0, 10);
            console.log('[Kingdom Stats] Processing milestone completion:', { 
              date: c.date, 
              extracted_day: day, 
              day_exists: counts[day] !== undefined 
            });
            if (counts[day] !== undefined) {
              counts[day]++;
              console.log('[Kingdom Stats] Updated milestone count for day', day, ':', counts[day]);
            } else {
              console.log('[Kingdom Stats] Milestone day', day, 'not in expected range');
            }
          } else {
            console.log('[Kingdom Stats] Milestone completion missing date:', c);
          }
        });
      }
      
      console.log('[Kingdom Stats] Final processed milestone counts:', counts);
      console.log('[Kingdom Stats] Date range for period:', period, ':', days);
      console.log('[Kingdom Stats] Milestone days with data:', Object.entries(counts).filter(([day, count]) => count > 0));
      
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats] Returning milestones data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'gold') {
      console.log('[Kingdom Stats] === GOLD TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching gold data for user:', userId);
      
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

      console.log('[Kingdom Stats] Quest gold data found:', questRes.data?.length || 0);
      console.log('[Kingdom Stats] Challenge gold data found:', challengeRes.data?.length || 0);
      console.log('[Kingdom Stats] Milestone gold data found:', milestoneRes.data?.length || 0);
      
      // Log sample data for debugging
      if (questRes.data && questRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample quest gold:', questRes.data[0]);
      }
      if (challengeRes.data && challengeRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample challenge gold:', challengeRes.data[0]);
      }
      if (milestoneRes.data && milestoneRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample milestone gold:', milestoneRes.data[0]);
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
        console.log('[Kingdom Stats] Initialized gold day sums:', sums);
      }

      // Add quest gold - use gold_earned from quest_completion table
      questRes.data?.forEach((c: any) => {
        if (c.completed_at) {
          const dateKey = period === 'year' ? c.completed_at.slice(0, 7) : 
                         period === 'all' ? 'all' : c.completed_at.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += c.gold_earned || 0;
            console.log('[Kingdom Stats] Added quest gold for', dateKey, ':', c.gold_earned, 'Total:', sums[dateKey]);
          }
        }
      });

      // Add challenge gold
      challengeRes.data?.forEach((c: any) => {
        const reward = challengeRewards.find(r => r.id === c.challenge_id);
        if (c.date && reward) {
          const dateKey = period === 'year' ? c.date.slice(0, 7) : 
                         period === 'all' ? 'all' : c.date.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += reward.gold || 0;
            console.log('[Kingdom Stats] Added challenge gold for', dateKey, ':', reward.gold, 'Total:', sums[dateKey]);
          }
        }
      });

      // Add milestone gold
      milestoneRes.data?.forEach((m: any) => {
        const reward = milestoneRewards.find(r => r.id === m.milestone_id);
        if (m.date && reward) {
          const dateKey = period === 'year' ? m.date.slice(0, 7) : 
                         period === 'all' ? 'all' : m.date.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += reward.gold || 0;
            console.log('[Kingdom Stats] Added milestone gold for', dateKey, ':', reward.gold, 'Total:', sums[dateKey]);
          }
        }
      });
      
      console.log('[Kingdom Stats] Final processed gold sums:', sums);
      console.log('[Kingdom Stats] Gold days with data:', Object.entries(sums).filter(([day, sum]) => sum > 0));
      
      const data = days.map(day => ({ day, value: sums[day] || 0 }));
      console.log('[Kingdom Stats] Returning gold data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'experience') {
      console.log('[Kingdom Stats] === EXPERIENCE TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching experience data for user:', userId);
      
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

      console.log('[Kingdom Stats] Quest XP data found:', questRes.data?.length || 0);
      console.log('[Kingdom Stats] Challenge XP data found:', challengeRes.data?.length || 0);
      console.log('[Kingdom Stats] Milestone XP data found:', milestoneRes.data?.length || 0);
      
      // Log sample data for debugging
      if (questRes.data && questRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample quest XP:', questRes.data[0]);
      }
      if (challengeRes.data && challengeRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample challenge XP:', challengeRes.data[0]);
      }
      if (milestoneRes.data && milestoneRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample milestone XP:', milestoneRes.data[0]);
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
        console.log('[Kingdom Stats] Initialized XP day sums:', sums);
      }

      // Add quest XP - use xp_earned from quest_completion table
      questRes.data?.forEach((c: any) => {
        if (c.completed_at) {
          const dateKey = period === 'year' ? c.completed_at.slice(0, 7) : 
                         period === 'all' ? 'all' : c.completed_at.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += c.xp_earned || 0;
            console.log('[Kingdom Stats] Added quest XP for', dateKey, ':', c.xp_earned, 'Total:', sums[dateKey]);
          }
        }
      });

      // Add challenge XP
      challengeRes.data?.forEach((c: any) => {
        const reward = challengeRewards.find(r => r.id === c.challenge_id);
        if (c.date && reward) {
          const dateKey = period === 'year' ? c.date.slice(0, 7) : 
                         period === 'all' ? 'all' : c.date.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += reward.xp || 0;
            console.log('[Kingdom Stats] Added challenge XP for', dateKey, ':', reward.xp, 'Total:', sums[dateKey]);
          }
        }
      });

      // Add milestone XP
      milestoneRes.data?.forEach((m: any) => {
        const reward = milestoneRewards.find(r => r.id === m.milestone_id);
        if (m.date && reward) {
          const dateKey = period === 'year' ? m.date.slice(0, 7) : 
                         period === 'all' ? 'all' : m.date.slice(0, 10);
          if (sums[dateKey] !== undefined) {
            sums[dateKey] += reward.experience || 0;
            console.log('[Kingdom Stats] Added milestone XP for', dateKey, ':', reward.experience, 'Total:', sums[dateKey]);
          }
        }
      });
      
      console.log('[Kingdom Stats] Final processed XP sums:', sums);
      console.log('[Kingdom Stats] XP days with data:', Object.entries(sums).filter(([day, sum]) => sum > 0));
      
      const data = days.map(day => ({ day, value: sums[day] || 0 }));
      console.log('[Kingdom Stats] Returning experience data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'level') {
      console.log('[Kingdom Stats] === LEVEL TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching level data for user:', userId);
      
      // Calculate level progression over time based on accumulated experience
      const [questRes, challengeRes, milestoneRes] = await Promise.all([
        supabaseServer
          .from('quest_completion')
          .select('xp_earned, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .order('completed_at', { ascending: true }),
        supabaseServer
          .from('challenge_completion')
          .select('challenge_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .order('date', { ascending: true }),
        supabaseServer
          .from('milestone_completion')
          .select('milestone_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .order('date', { ascending: true })
      ]);

      if (questRes.error || challengeRes.error || milestoneRes.error) {
        console.error('[Kingdom Stats] Supabase error (level):', { questRes, challengeRes, milestoneRes });
        return NextResponse.json({ error: 'Failed to fetch level data' }, { status: 500 });
      }

      console.log('[Kingdom Stats] Quest XP data found for level calc:', questRes.data?.length || 0);
      console.log('[Kingdom Stats] Challenge XP data found for level calc:', challengeRes.data?.length || 0);
      console.log('[Kingdom Stats] Milestone XP data found for level calc:', milestoneRes.data?.length || 0);
      
      // Log sample data for debugging
      if (questRes.data && questRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample quest XP for level:', questRes.data[0]);
      }
      if (challengeRes.data && challengeRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample challenge XP for level:', challengeRes.data[0]);
      }
      if (milestoneRes.data && milestoneRes.data.length > 0) {
        console.log('[Kingdom Stats] Sample milestone XP for level:', milestoneRes.data[0]);
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

      // Helper function to calculate level from experience
      const calculateLevelFromExperience = (experience: number): number => {
        if (experience < 100) return 1;
        
        let level = 1;
        let totalExpNeeded = 0;
        
        while (true) {
          const expForLevel = Math.round(100 * Math.pow(1.15, level - 1));
          totalExpNeeded += expForLevel;
          if (experience < totalExpNeeded) {
            return level;
          }
          level++;
        }
      };

      // Build timeline of experience gains and calculate levels
      const experienceTimeline: Array<{ date: string; xp: number }> = [];
      
      // Add quest XP to timeline - use xp_earned from quest_completion table
      questRes.data?.forEach((c: any) => {
        if (c.completed_at) {
          experienceTimeline.push({
            date: c.completed_at.slice(0, 10),
            xp: c.xp_earned || 0
          });
          console.log('[Kingdom Stats] Added quest XP to timeline:', { date: c.completed_at.slice(0, 10), xp: c.xp_earned });
        }
      });

      // Add challenge XP to timeline
      challengeRes.data?.forEach((c: any) => {
        const reward = challengeRewards.find(r => r.id === c.challenge_id);
        if (c.date && reward) {
          experienceTimeline.push({
            date: c.date.slice(0, 10),
            xp: reward.xp || 0
          });
          console.log('[Kingdom Stats] Added challenge XP to timeline:', { date: c.date.slice(0, 10), xp: reward.xp });
        }
      });

      // Add milestone XP to timeline
      milestoneRes.data?.forEach((m: any) => {
        const reward = milestoneRewards.find(r => r.id === m.milestone_id);
        if (m.date && reward) {
          experienceTimeline.push({
            date: m.date.slice(0, 10),
            xp: reward.experience || 0
          });
          console.log('[Kingdom Stats] Added milestone XP to timeline:', { date: m.date.slice(0, 10), xp: reward.experience });
        }
      });

      console.log('[Kingdom Stats] Total experience timeline entries:', experienceTimeline.length);
      console.log('[Kingdom Stats] Experience timeline:', experienceTimeline);

      // Sort timeline by date
      experienceTimeline.sort((a, b) => a.date.localeCompare(b.date));
      console.log('[Kingdom Stats] Sorted experience timeline:', experienceTimeline);

      // Calculate cumulative experience and levels for each day
      let cumulativeExp = 0;
      const levelProgression: Record<string, number> = {};
      
      experienceTimeline.forEach(({ date, xp }) => {
        cumulativeExp += xp;
        const level = calculateLevelFromExperience(cumulativeExp);
        levelProgression[date] = level;
        console.log('[Kingdom Stats] Level progression for', date, ':', { xp, cumulativeExp, level });
      });

      console.log('[Kingdom Stats] Final level progression:', levelProgression);

      // Fill in the requested time period with level data
      let levelData: Record<string, number> = {};
      if (period === 'year') {
        days.forEach(month => { levelData[month] = 0; });
      } else if (period === 'all') {
        levelData['all'] = 0;
      } else {
        days.forEach(day => { levelData[day] = 0; });
      }

      // Find the highest level achieved in each time period
      Object.entries(levelProgression).forEach(([date, level]) => {
        const dateKey = period === 'year' ? date.slice(0, 7) : 
                       period === 'all' ? 'all' : date;
        if (levelData[dateKey] !== undefined) {
          levelData[dateKey] = Math.max(levelData[dateKey], level);
        }
      });

      // For periods without data, carry forward the previous level
      let lastLevel = 1;
      const finalData = days.map(day => {
        const currentLevel = levelData[day];
        if (currentLevel !== undefined && currentLevel > 0) {
          // Only update if the new level is higher (never go down)
          lastLevel = Math.max(lastLevel, currentLevel);
        }
        return { day, value: lastLevel };
      });
      
      console.log('[Kingdom Stats] Returning level data:', finalData);
      return NextResponse.json({ data: finalData });
    }

    // For other tabs, return empty data
    console.log('[Kingdom Stats] Returning empty data for unknown tab');
    const data = days.map(day => ({ day, value: 0 }));
    return NextResponse.json({ data });

  } catch (error) {
    console.error('[Kingdom Stats] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 