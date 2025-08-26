import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Kingdom Stats V2] No Bearer token found');
      return null;
    }
    
    const token = authHeader.substring(7);
    console.log('[Kingdom Stats V2] Found Bearer token, length:', token.length);
    
    // For now, let's try to decode the JWT to get basic info
    try {
      // Simple JWT decode (without verification for debugging)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('[Kingdom Stats V2] Invalid JWT format');
        return null;
      }
      
      const base64Url = tokenParts[1];
      if (!base64Url) {
        console.log('[Kingdom Stats V2] Missing JWT payload');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('[Kingdom Stats V2] JWT payload:', payload);
      
      // Extract user ID from JWT payload
      if (payload.sub) {
        console.log('[Kingdom Stats V2] Found userId in JWT:', payload.sub);
        return payload.sub;
      }
      
      // Try alternative fields
      if (payload.user_id) {
        console.log('[Kingdom Stats V2] Found userId in JWT (user_id):', payload.user_id);
        return payload.user_id;
      }
      
      if (payload.userId) {
        console.log('[Kingdom Stats V2] Found userId in JWT (userId):', payload.userId);
        return payload.userId;
      }
      
      console.log('[Kingdom Stats V2] No userId found in JWT payload');
      return null;
    } catch (jwtError) {
      console.log('[Kingdom Stats V2] JWT decode error:', jwtError);
      return null;
    }
  } catch (e) {
    console.error('[Kingdom Stats V2] Authentication error:', e);
    return null;
  }
}

// Helper to get date ranges for each period
function getDateRange(period: string): string[] {
  const now = new Date();
  let days: string[] = [];
  
  if (period === 'week') {
    // Generate dates for the last 7 days (including today)
    // Use local dates to match user's timezone
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Format as YYYY-MM-DD in local timezone
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'month') {
    // Generate dates for the last 30 days (including today)
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'year') {
    // Generate months for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      days.push(`${year}-${month}`);
    }
  } else if (period === 'all') {
    // For all time, we'll generate a range based on actual data
    days = ['all'];
  }
  
  return days;
}

// Helper to get the earliest date we need to fetch data for
function getEarliestDateForPeriod(period: string): Date {
  const now = new Date();
  
  if (period === 'week') {
    const earliest = new Date();
    earliest.setDate(earliest.getDate() - 6);
    return earliest;
  } else if (period === 'month') {
    const earliest = new Date();
    earliest.setDate(earliest.getDate() - 29);
    return earliest;
  } else if (period === 'year') {
    const earliest = new Date();
    earliest.setMonth(earliest.getMonth() - 11);
    return earliest;
  } else if (period === 'all') {
    // For all time, go back a reasonable amount
    const earliest = new Date();
    earliest.setFullYear(earliest.getFullYear() - 2);
    return earliest;
  }
  
  return now;
}

// Helper to normalize dates to local timezone
function normalizeDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to generate all period date range for cumulative data
function generateAllPeriodDateRange(period: string): string[] {
  if (period === 'all') {
    return ['all'];
  }
  return getDateRange(period);
}

export async function GET(request: NextRequest) {
  try {
    // NUCLEAR DEBUGGING - This will definitely show up
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING START 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - V2 ROUTE CALLED 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - TIMESTAMP:', new Date().toISOString());
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - DEPLOYMENT ID: NUCLEAR-V2-ROUTE-2025-08-26-20-30');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - IF YOU SEE THIS, V2 ROUTE IS WORKING 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING END 🚨🚨🚨');
    
    // NUCLEAR CACHE BUSTING - Force fresh responses with unique timestamp
    const uniqueId = `NUCLEAR-V2-ROUTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚨🚨🚨 NUCLEAR UNIQUE ID:', uniqueId);
    
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.log('[Kingdom Stats V2] No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Kingdom Stats V2] User ID:', userId);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'quests';
    const period = searchParams.get('period') || 'week';
    
    console.log('[Kingdom Stats V2] Tab:', tab, 'Period:', period);
    
    // Generate date range for the requested period
    const days = generateAllPeriodDateRange(period);
    console.log('[Kingdom Stats V2] Generated days:', days);
    
    if (tab === 'quests') {
      console.log('[Kingdom Stats V2] === QUESTS TAB DEBUG ===');
      console.log('[Kingdom Stats V2] Fetching quest data for user:', userId);
      
      // Get the earliest date we need to fetch data for
      const earliestDate = getEarliestDateForPeriod(period);
      console.log('[Kingdom Stats V2] Fetching quests from date:', earliestDate.toISOString());
      
      // Aggregate quest completions from quest_completion table
      const { data: completions, error } = await supabase
        .from('quest_completion')
        .select('id, completed, completed_at, original_completion_date')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', earliestDate.toISOString());
        
      if (error) {
        console.error('[Kingdom Stats V2] Supabase error (quests):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[Kingdom Stats V2] Raw quest completions from DB:', completions);
      console.log('[Kingdom Stats V2] Total quest completions found:', completions?.length || 0);
      
      // Log sample data for debugging
      if (completions && completions.length > 0) {
        console.log('[Kingdom Stats V2] Sample quest completion:', completions[0]);
        console.log('[Kingdom Stats V2] Sample completed_at format:', completions[0]?.completed_at);
        console.log('[Kingdom Stats V2] Sample original_completion_date format:', completions[0]?.original_completion_date);
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
              console.log('[Kingdom Stats V2] Added quest to month', month, ':', counts[month]);
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
          
          console.log('[Kingdom Stats V2] All time daily timeline data (quests):', timelineData);
          return NextResponse.json({ data: timelineData });
        }
      } else {
        // For week/month view, aggregate by day and maintain cumulative view
        let cumulativeCount = 0;
        
        // First, get all completions up to each day
        const sortedCompletions = completions
          ?.filter((c: any) => c.completed_at)
          .sort((a: any, b: any) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()) || [];
        
        console.log('[Kingdom Stats V2] Sorted completions for cumulative counting:', sortedCompletions);
        
        // For each day, count completions up to that day
        days.forEach(day => {
          const dayDate = new Date(day);
          
          // Count completions that happened on or before this day
          const completionsUpToDay = sortedCompletions.filter((c: any) => {
            const completionDate = new Date(c.completed_at);
            return completionDate <= dayDate;
          });
          
          cumulativeCount = completionsUpToDay.length;
          counts[day] = cumulativeCount;
          
          console.log('[Kingdom Stats V2] Day', day, 'cumulative count:', cumulativeCount, 'completions up to this day');
        });
      }

      // Convert to array format for the chart
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      console.log('[Kingdom Stats V2] Final quest data:', data);
      
      const response = NextResponse.json({ data });
      
      // NUCLEAR CACHE BUSTING - Force fresh responses
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Nuclear-Debug', uniqueId);
      response.headers.set('X-Nuclear-Timestamp', Date.now().toString());
      response.headers.set('X-Nuclear-Route', 'V2-ROUTE-NUCLEAR-DEBUG');
      
      return response;
    }

    // For other tabs, return empty data for now
    console.log('[Kingdom Stats V2] Returning empty data for tab:', tab);
    const data = days.map(day => ({ day, value: 0 }));
    const response = NextResponse.json({ data });
    
    // NUCLEAR CACHE BUSTING - Force fresh responses
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Nuclear-Debug', uniqueId);
    response.headers.set('X-Nuclear-Timestamp', Date.now().toString());
    response.headers.set('X-Nuclear-Route', 'V2-ROUTE-NUCLEAR-DEBUG');
    
    return response;

  } catch (error) {
    console.error('[Kingdom Stats V2] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
