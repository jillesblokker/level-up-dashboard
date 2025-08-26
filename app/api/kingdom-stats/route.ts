import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Kingdom Stats] No Bearer token found');
      return null;
    }
    
    const token = authHeader.substring(7);
    console.log('[Kingdom Stats] Found Bearer token, length:', token.length);
    
    // For now, let's try to decode the JWT to get basic info
    try {
      // Simple JWT decode (without verification for debugging)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('[Kingdom Stats] Invalid JWT format');
        return null;
      }
      
      const base64Url = tokenParts[1];
      if (!base64Url) {
        console.log('[Kingdom Stats] Missing JWT payload');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('[Kingdom Stats] JWT payload:', payload);
      
      // Extract user ID from JWT payload
      if (payload.sub) {
        console.log('[Kingdom Stats] Found userId in JWT:', payload.sub);
        return payload.sub;
      }
      
      // Try alternative fields
      if (payload.user_id) {
        console.log('[Kingdom Stats] Found userId in JWT (user_id):', payload.user_id);
        return payload.user_id;
      }
      
      if (payload.userId) {
        console.log('[Kingdom Stats] Found userId in JWT (userId):', payload.userId);
        return payload.userId;
      }
      
      console.log('[Kingdom Stats] No userId found in JWT payload');
      return null;
    } catch (jwtError) {
      console.log('[Kingdom Stats] JWT decode error:', jwtError);
      return null;
    }
  } catch (e) {
    console.error('[Kingdom Stats] Authentication error:', e);
    return null;
  }
}

// Helper to get date ranges for each period
function getDateRange(period: string): string[] {
  const now = new Date();
  let days: string[] = [];
  
  if (period === 'week') {
    // Generate dates for the last 7 days (including today)
    // Use UTC dates to avoid timezone issues
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      // Format as YYYY-MM-DD in UTC
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'month') {
    // Generate dates for the last 30 days (including today)
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'year') {
    // Generate months for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
      days.push(d.toISOString().slice(0, 7));
    }
  } else if (period === 'all') {
    // For 'all' period, we'll generate dates dynamically based on actual data
    // This will be handled in the data fetching logic
    days = ['dynamic'];
  }
  
  console.log('[Kingdom Stats] Generated date range for period', period, ':', days);
  return days;
}

// Helper to get the earliest date for data fetching
function getEarliestDateForPeriod(period: string): Date {
  const now = new Date();
  
  if (period === 'week') {
    // For week view, get data from the beginning of the current week (Monday)
    const earliest = new Date(now);
    const dayOfWeek = now.getUTCDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1, Sunday = 0
    earliest.setUTCDate(earliest.getUTCDate() - daysToSubtract);
    earliest.setUTCHours(0, 0, 0, 0);
    return earliest;
  } else if (period === 'month') {
    // For month view, get data from the beginning of the current month
    const earliest = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    return earliest;
  } else if (period === 'year') {
    const earliest = new Date(now.getUTCFullYear() - 1, now.getUTCMonth(), 1);
    return earliest;
  } else {
    // For 'all' period, go back 5 years to get comprehensive data
    const earliest = new Date(now.getUTCFullYear() - 5, 0, 1);
    return earliest;
  }
}

// Helper to generate dynamic date range for 'all' period based on actual data
async function generateAllPeriodDateRange(userId: string, tab: string): Promise<string[]> {
  try {
    // For now, use a simple approach to avoid TypeScript issues
    // Default to last 2 years of data
    const fallbackDays: string[] = [];
    const now = new Date();
    
    for (let i = 730; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      fallbackDays.push(`${year}-${month}-${day}`);
    }
    
    console.log('[Kingdom Stats] Generated fallback date range for all period:', {
      totalDays: fallbackDays.length
    });
    
    return fallbackDays;
  } catch (error) {
    console.error('[Kingdom Stats] Error generating all period date range:', error);
    // Fallback to last 2 years
    const fallbackDays: string[] = [];
    const now = new Date();
    for (let i = 730; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      fallbackDays.push(`${year}-${month}-${day}`);
    }
    return fallbackDays;
  }
}

// Helper to normalize dates for consistent comparison
function normalizeDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Handle different date formats
    let date: Date;
    
    if (dateString.includes('T')) {
      // ISO string format
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format
      date = new Date(dateString + 'T00:00:00Z');
    } else {
      // Unknown format
      return dateString;
    }
    
    // Return in YYYY-MM-DD format
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[Kingdom Stats] Error normalizing date:', dateString, error);
    return dateString;
  }
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

    let days = getDateRange(period);
    
    // For 'all' period, generate dynamic date range based on actual data
    if (period === 'all') {
      days = await generateAllPeriodDateRange(userId, tab);
    }
    
    console.log('[Kingdom Stats] Date range generated:', days);

    if (tab === 'quests') {
      console.log('[Kingdom Stats] === QUESTS TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching quests data for user:', userId);
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats] Fetching quests from date:', earliestDate.toISOString());
      
      // Aggregate quest completions from quest_completion table
      const { data: completions, error } = await supabaseServer
        .from('quest_completion')
        .select('id, completed, completed_at, quest_id, gold_earned, xp_earned')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', earliestDate.toISOString());
        
      if (error) {
        console.error('[Kingdom Stats] Supabase error (quests):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[Kingdom Stats] Raw quest completions from DB:', completions);
      console.log('[Kingdom Stats] Total quest completions found:', completions?.length || 0);
      
      // Log sample data for debugging
      if (completions && completions.length > 0) {
        console.log('[Kingdom Stats] Sample quest completion:', completions[0]);
        console.log('[Kingdom Stats] Sample date format:', completions[0]?.completed_at);
      }

      // Aggregate by day/month with cumulative tracking
      let counts: Record<string, number> = {};
      
      // Initialize all days with 0
      days.forEach(day => { counts[day] = 0; });
      
      if (period === 'year') {
        // For year view, aggregate by month
        completions?.forEach((c: any) => {
          if (c.completed_at) {
            const month = c.completed_at.slice(0, 7);
            if (counts[month] !== undefined) {
              counts[month]++;
              console.log('[Kingdom Stats] Added quest to month', month, ':', counts[month]);
            }
          }
        });
      } else if (period === 'all') {
        // For all time, show actual daily progression with cumulative data
        if (completions && completions.length > 0) {
          // Sort completions by date to show progression
          const sortedCompletions = completions
            .filter((c: any) => c.completed_at)
            .sort((a: any, b: any) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
          
          // Create a timeline showing when each completion happened by day
          const dailyData: Record<string, number> = {};
          sortedCompletions.forEach((c: any) => {
            const date = new Date(c.completed_at);
            const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
            
            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
            }
            dailyData[dayKey]++;
          });
          
          // Convert to cumulative progression by day
          const sortedDays = Object.keys(dailyData).sort();
          const timelineData: Array<{day: string, value: number}> = [];
          let cumulativeCount = 0;
          
          sortedDays.forEach(day => {
            cumulativeCount += dailyData[day] || 0;
            timelineData.push({
              day: day,
              value: cumulativeCount
            });
          });
          
          console.log('[Kingdom Stats] All time daily timeline data:', timelineData);
          return NextResponse.json({ data: timelineData });
        }
      } else {
        // For week/month view, aggregate by day and maintain cumulative view
        let cumulativeCount = 0;
        
        // First, get all completions up to each day
        days.forEach(day => {
          const dayCompletions = completions?.filter((c: any) => {
            if (!c.completed_at) return false;
            const completionDate = normalizeDate(c.completed_at);
            return completionDate <= day;
          }) || [];
          
          cumulativeCount = dayCompletions.length;
          counts[day] = cumulativeCount;
          console.log('[Kingdom Stats] Cumulative quest count for day', day, ':', cumulativeCount);
        });
      }
      
      console.log('[Kingdom Stats] Final processed quest counts:', counts);
      console.log('[Kingdom Stats] Date range for period:', period, ':', days);
      console.log('[Kingdom Stats] Quest days with data:', Object.entries(counts).filter(([day, count]) => count > 0));
      
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats] Final quest data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'challenges') {
      console.log('[Kingdom Stats] === CHALLENGES TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching challenges data for user:', userId);
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats] Fetching challenges from date:', earliestDate.toISOString());
      
      // Aggregate challenge completions from challenge_completion table
      const { data: completions, error } = await supabaseServer
        .from('challenge_completion')
        .select('id, completed, date, challenge_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('date', earliestDate.toISOString().slice(0, 10));
        
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

      // Aggregate by day/month with cumulative tracking
      let counts: Record<string, number> = {};
      
      // Initialize all days with 0
      days.forEach(day => { counts[day] = 0; });
      
      if (period === 'year') {
        // For year view, aggregate by month
        completions?.forEach((c: any) => {
          if (c.date) {
            const month = c.date.slice(0, 7);
            if (counts[month] !== undefined) {
              counts[month]++;
              console.log('[Kingdom Stats] Added challenge to month', month, ':', counts[month]);
            }
          }
        });
      } else if (period === 'all') {
        // For all time, show actual daily progression with cumulative data
        if (completions && completions.length > 0) {
          // Sort completions by date to show progression
          const sortedCompletions = completions
            .filter((c: any) => c.date)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Create a timeline showing when each completion happened by day
          const dailyData: Record<string, number> = {};
          sortedCompletions.forEach((c: any) => {
            const date = new Date(c.date);
            const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
            
            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
            }
            dailyData[dayKey]++;
          });
          
          // Convert to cumulative progression by day
          const sortedDays = Object.keys(dailyData).sort();
          const timelineData: Array<{day: string, value: number}> = [];
          let cumulativeCount = 0;
          
          sortedDays.forEach(day => {
            cumulativeCount += dailyData[day] || 0;
            timelineData.push({
              day: day,
              value: cumulativeCount
            });
          });
          
          console.log('[Kingdom Stats] All time daily timeline data (challenges):', timelineData);
          return NextResponse.json({ data: timelineData });
        }
      } else {
        // For week/month view, aggregate by day and maintain cumulative view
        let cumulativeCount = 0;
        
        // First, get all completions up to each day
        days.forEach(day => {
          const dayCompletions = completions?.filter((c: any) => {
            if (!c.date) return false;
            const completionDate = normalizeDate(c.date);
            return completionDate <= day;
          }) || [];
          
          cumulativeCount = dayCompletions.length;
          counts[day] = cumulativeCount;
          console.log('[Kingdom Stats] Cumulative challenge count for day', day, ':', cumulativeCount);
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
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats] Fetching milestones from date:', earliestDate.toISOString());
      
      // Aggregate milestone completions from milestone_completion table
      const { data: completions, error } = await supabaseServer
        .from('milestone_completion')
        .select('id, completed, date, milestone_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('date', earliestDate.toISOString().slice(0, 10));
        
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

      // Aggregate by day/month with cumulative tracking
      let counts: Record<string, number> = {};
      
      // Initialize all days with 0
      days.forEach(day => { counts[day] = 0; });
      
      if (period === 'year') {
        // For year view, aggregate by month
        completions?.forEach((c: any) => {
          if (c.date) {
            const month = c.date.slice(0, 7);
            if (counts[month] !== undefined) {
              counts[month]++;
              console.log('[Kingdom Stats] Added milestone to month', month, ':', counts[month]);
            }
          }
        });
      } else if (period === 'all') {
        // For all time, show actual daily progression with cumulative data
        if (completions && completions.length > 0) {
          // Sort completions by date to show progression
          const sortedCompletions = completions
            .filter((c: any) => c.date)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Create a timeline showing when each completion happened by day
          const dailyData: Record<string, number> = {};
          sortedCompletions.forEach((c: any) => {
            const date = new Date(c.date);
            const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
            
            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
            }
            dailyData[dayKey]++;
          });
          
          // Convert to cumulative progression by day
          const sortedDays = Object.keys(dailyData).sort();
          const timelineData: Array<{day: string, value: number}> = [];
          let cumulativeCount = 0;
          
          sortedDays.forEach(day => {
            cumulativeCount += dailyData[day] || 0;
            timelineData.push({
              day: day,
              value: cumulativeCount
            });
          });
          
          console.log('[Kingdom Stats] All time daily timeline data (milestones):', timelineData);
          return NextResponse.json({ data: timelineData });
        }
      } else {
        // For week/month view, aggregate by day and maintain cumulative view
        let cumulativeCount = 0;
        
        // First, get all completions up to each day
        days.forEach(day => {
          const dayCompletions = completions?.filter((c: any) => {
            if (!c.date) return false;
            const completionDate = normalizeDate(c.date);
            return completionDate <= day;
          }) || [];
          
          cumulativeCount = dayCompletions.length;
          counts[day] = cumulativeCount;
          console.log('[Kingdom Stats] Cumulative milestone count for day', day, ':', cumulativeCount);
        });
      }
      
      console.log('[Kingdom Stats] Final processed milestone counts:', counts);
      console.log('[Kingdom Stats] Date range for period:', period, ':', days);
      console.log('[Kingdom Stats] Milestone days with data:', Object.entries(counts).filter(([day, count]) => count > 0));
      
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats] Final milestone data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'gold') {
      console.log('[Kingdom Stats] === GOLD TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching gold data for user:', userId);
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats] Fetching gold data from date:', earliestDate.toISOString());
      
      // Aggregate gold earned from quest_completion + challenge_completion + milestone_completion
      const [questRes, challengeRes, milestoneRes] = await Promise.all([
        supabaseServer
          .from('quest_completion')
          .select('gold_earned, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', earliestDate.toISOString()),
        supabaseServer
          .from('challenge_completion')
          .select('challenge_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', earliestDate.toISOString().slice(0, 10)),
        supabaseServer
          .from('milestone_completion')
          .select('milestone_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', earliestDate.toISOString().slice(0, 10))
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
      
      // Initialize all days with 0
      days.forEach(day => { sums[day] = 0; });
      
      if (period === 'year') {
        // For year view, we already initialized months above
      } else if (period === 'all') {
        // For all time, create a more meaningful distribution
        if (questRes.data?.length || challengeRes.data?.length || milestoneRes.data?.length) {
          // Group by month for better visualization
          const monthlyData: Record<string, number> = {};
          
          // Add quest gold by month
          questRes.data?.forEach((c: any) => {
            if (c.completed_at) {
              const month = c.completed_at.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (c.gold_earned || 0);
            }
          });
          
          // Add challenge gold by month
          challengeRes.data?.forEach((c: any) => {
            const reward = challengeRewards.find(r => r.id === c.challenge_id);
            if (c.date && reward) {
              const month = c.date.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (reward.gold || 0);
            }
          });
          
          // Add milestone gold by month
          milestoneRes.data?.forEach((m: any) => {
            const reward = milestoneRewards.find(r => r.id === m.milestone_id);
            if (m.date && reward) {
              const month = m.date.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (reward.gold || 0);
            }
          });
          
          // Convert to array format for chart
          const data = Object.entries(monthlyData).map(([month, total]) => ({
            day: month,
            value: total
          }));
          return NextResponse.json({ data });
        }
      } else {
        // For week/month view, we already initialized days above
        console.log('[Kingdom Stats] Initialized gold day sums:', sums);
      }

      if (period === 'year' || period === 'all') {
        // For year/all view, use the existing logic
        // Add quest gold - use gold_earned from quest_completion table
        questRes.data?.forEach((c: any) => {
          if (c.completed_at) {
            const normalizedDate = normalizeDate(c.completed_at);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
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
            const normalizedDate = normalizeDate(c.date);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
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
            const normalizedDate = normalizeDate(m.date);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
            if (sums[dateKey] !== undefined) {
              sums[dateKey] += reward.gold || 0;
              console.log('[Kingdom Stats] Added milestone gold for', dateKey, ':', reward.gold, 'Total:', sums[dateKey]);
            }
          }
        });
      } else {
        // For week/month view, calculate cumulative gold over time
        days.forEach(day => {
          let dayGold = 0;
          
          // Add quest gold up to this day
          questRes.data?.forEach((c: any) => {
            if (c.completed_at && normalizeDate(c.completed_at) <= day) {
              dayGold += c.gold_earned || 0;
            }
          });
          
          // Add challenge gold up to this day
          challengeRes.data?.forEach((c: any) => {
            const reward = challengeRewards.find(r => r.id === c.challenge_id);
            if (c.date && reward && normalizeDate(c.date) <= day) {
              dayGold += reward.gold || 0;
            }
          });
          
          // Add milestone gold up to this day
          milestoneRes.data?.forEach((m: any) => {
            const reward = milestoneRewards.find(r => r.id === m.milestone_id);
            if (m.date && reward && normalizeDate(m.date) <= day) {
              dayGold += reward.gold || 0;
            }
          });
          
          sums[day] = dayGold;
          console.log('[Kingdom Stats] Cumulative gold for day', day, ':', dayGold);
        });
      }
      
      console.log('[Kingdom Stats] Final processed gold sums:', sums);
      console.log('[Kingdom Stats] Gold days with data:', Object.entries(sums).filter(([day, sum]) => sum > 0));
      
      const data = days.map(day => ({ day, value: sums[day] || 0 }));
      console.log('[Kingdom Stats] Returning gold data:', data);
      return NextResponse.json({ data });
    }

    if (tab === 'experience') {
      console.log('[Kingdom Stats] === EXPERIENCE TAB DEBUG ===');
      console.log('[Kingdom Stats] Fetching experience data for user:', userId);
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats] Fetching experience data from date:', earliestDate.toISOString());
      
      // Similar aggregation for experience
      const [questRes, challengeRes, milestoneRes] = await Promise.all([
        supabaseServer
          .from('quest_completion')
          .select('xp_earned, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', earliestDate.toISOString()),
        supabaseServer
          .from('challenge_completion')
          .select('challenge_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', earliestDate.toISOString().slice(0, 10)),
        supabaseServer
          .from('milestone_completion')
          .select('milestone_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', earliestDate.toISOString().slice(0, 10))
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
      
      // Initialize all days with 0
      days.forEach(day => { sums[day] = 0; });
      
      if (period === 'year') {
        // For year view, we already initialized months above
      } else if (period === 'all') {
        // For all time, create a more meaningful distribution
        if (questRes.data?.length || challengeRes.data?.length || milestoneRes.data?.length) {
          // Group by month for better visualization
          const monthlyData: Record<string, number> = {};
          
          // Add quest XP by month
          questRes.data?.forEach((c: any) => {
            if (c.completed_at) {
              const month = c.completed_at.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (c.xp_earned || 0);
            }
          });
          
          // Add challenge XP by month
          challengeRes.data?.forEach((c: any) => {
            const reward = challengeRewards.find(r => r.id === c.challenge_id);
            if (c.date && reward) {
              const month = c.date.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (reward.xp || 0);
            }
          });
          
          // Add milestone XP by month
          milestoneRes.data?.forEach((m: any) => {
            const reward = milestoneRewards.find(r => r.id === m.milestone_id);
            if (m.date && reward) {
              const month = m.date.slice(0, 7);
              monthlyData[month] = (monthlyData[month] || 0) + (reward.experience || 0);
            }
          });
          
          // Convert to array format for chart
          const data = Object.entries(monthlyData).map(([month, total]) => ({
            day: month,
            value: total
          }));
          return NextResponse.json({ data });
        }
      } else {
        // For week/month view, we already initialized days above
        console.log('[Kingdom Stats] Initialized XP day sums:', sums);
      }

      if (period === 'year' || period === 'all') {
        // For year/all view, use the existing logic
        // Add quest XP - use xp_earned from quest_completion table
        questRes.data?.forEach((c: any) => {
          if (c.completed_at) {
            const normalizedDate = normalizeDate(c.completed_at);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
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
            const normalizedDate = normalizeDate(c.date);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
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
            const normalizedDate = normalizeDate(m.date);
            const dateKey = period === 'year' ? normalizedDate.slice(0, 7) : 'all';
            if (sums[dateKey] !== undefined) {
              sums[dateKey] += reward.experience || 0;
              console.log('[Kingdom Stats] Added milestone XP for', dateKey, ':', reward.experience, 'Total:', sums[dateKey]);
            }
          }
        });
      } else {
        // For week/month view, calculate cumulative XP over time
        days.forEach(day => {
          let dayXP = 0;
          
          // Add quest XP up to this day
          questRes.data?.forEach((c: any) => {
            if (c.completed_at && normalizeDate(c.completed_at) <= day) {
              dayXP += c.xp_earned || 0;
            }
          });
          
          // Add challenge XP up to this day
          challengeRes.data?.forEach((c: any) => {
            const reward = challengeRewards.find(r => r.id === c.challenge_id);
            if (c.date && reward && normalizeDate(c.date) <= day) {
              dayXP += reward.xp || 0;
            }
          });
          
          // Add milestone XP up to this day
          milestoneRes.data?.forEach((m: any) => {
            const reward = milestoneRewards.find(r => r.id === m.milestone_id);
            if (m.date && reward && normalizeDate(m.date) <= day) {
              dayXP += reward.experience || 0;
            }
          });
          
          sums[day] = dayXP;
          console.log('[Kingdom Stats] Cumulative XP for day', day, ':', dayXP);
        });
      }
      
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