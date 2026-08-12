import { logger } from "@/lib/logger";
import { NextResponse, NextRequest } from 'next/server';
import { authenticatedSupabaseQuery, authenticatedFriendQuery } from '@/lib/supabase/jwt-verification';

// Helper to get date ranges for each period
function getDateRange(period: string, baseDate?: string): string[] {
  const now = baseDate ? new Date(baseDate) : new Date();
  let days: string[] = [];

  if (period === 'week') {
    // Generate dates for 7 days ending on the base date (not centered)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      // Format as YYYY-MM-DD in local timezone
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'month') {
    // Generate dates for 30 days ending on the base date (not centered)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }
  } else if (period === 'year') {
    // Generate months for 12 months ending on the base date (not centered)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      days.push(`${year}-${month}`);
    }
  } else if (period === 'all') {
    // For all time, we'll generate a reasonable range
    // Start from 1 year ago to avoid overwhelming data
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);

    const currentDate = new Date(now);
    while (startDate <= currentDate) {
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
      startDate.setDate(startDate.getDate() + 1);
    }
  }

  return days;
}

// Helper to get the earliest date we need to fetch data for
function getEarliestDateForPeriod(period: string, baseDate?: string): Date {
  const now = baseDate ? new Date(baseDate) : new Date();

  if (period === 'week') {
    const earliest = new Date(now);
    earliest.setDate(now.getDate() - 6); // 7 days ending today
    return earliest;
  } else if (period === 'month') {
    const earliest = new Date(now);
    earliest.setDate(now.getDate() - 29); // 30 days ending today
    return earliest;
  } else if (period === 'year') {
    const earliest = new Date(now);
    earliest.setMonth(now.getMonth() - 11); // 12 months ending today
    return earliest;
  } else if (period === 'all') {
    const earliest = new Date(now);
    earliest.setFullYear(now.getFullYear() - 1);
    return earliest;
  }

  // Default to 1 year ago
  const earliest = new Date(now);
  earliest.setFullYear(now.getFullYear() - 1);
  return earliest;
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'quests';
    const period = searchParams.get('period') || 'week';
    const date = searchParams.get('date'); // Optional date parameter for navigation
    const visitUserId = searchParams.get('userId');

    // Use secure authentication with friendship check if visiting
    const result = await (visitUserId
      ? authenticatedFriendQuery(request, visitUserId, async (supabase, userId) => {
        // Inner logic for fetching stats
        return await fetchStatsForUser(supabase, userId, tab, period, date);
      })
      : authenticatedSupabaseQuery(request, async (supabase, userId) => {
        // Inner logic for fetching stats
        return await fetchStatsForUser(supabase, userId, tab, period, date);
      })
    );

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
    logger.error('[Kingdom Stats V2] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Internal helper to fetch stats for a user (either self or friend)
async function fetchStatsForUser(supabase: any, userId: string, tab: string, period: string, date: string | null) {
  // Get date range and earliest date for database query
  const days = getDateRange(period, date || undefined);
  const earliestDate = getEarliestDateForPeriod(period, date || undefined);

  // Handle quests tab
  if (tab === 'quests') {
    // ... rest of the quest logic ...
    const { data: completions, error } = await supabase
      .from('quest_completion')
      .select(`
            id, 
            quest_id, 
            completed_at, 
            completed
          `)
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', earliestDate.toISOString());

    if (error) {
      logger.error('[Kingdom Stats] Quest query error:', error);
      throw error;
    }

    // Since we removed the join to avoid errors if FK is missing,
    // we fetch quests separately to map categories
    const { data: questsMap } = await supabase
      .from('quests')
      .select('id, category');

    const categories: Record<string, string> = {};
    questsMap?.forEach((q: any) => {
      categories[q.id] = q.category || 'general';
    });

    // Aggregate by day and category - show daily completions with category breakdown
    let counts: Record<string, number> = {};
    let categoryData: Record<string, Record<string, number>> = {};
    days.forEach(day => {
      counts[day] = 0;
      categoryData[day] = {};
    });

    if (period === 'year') {
      // For year view, aggregate by month
      completions?.forEach((c: any) => {
        // Prioritize completed_at over original_completion_date for current data
        const completionDate = c.completed_at || c.original_completion_date;
        if (completionDate) {
          const month = completionDate.slice(0, 7);
          const category = categories[c.quest_id] || 'unknown';
          if (counts[month] !== undefined) {
            counts[month]++;
            categoryData[month] = categoryData[month] || {};
            categoryData[month][category] = (categoryData[month][category] || 0) + 1;
          }
        }
      });
    } else if (period === 'all') {
      if (completions && completions.length > 0) {
        const dailyData: Record<string, number> = {};
        const dailyCategoryData: Record<string, Record<string, number>> = {};
        completions.forEach((c: any) => {
          // Prioritize completed_at over original_completion_date for current data
          const completionDate = c.completed_at || c.original_completion_date;
          if (completionDate) {
            const date = new Date(completionDate);
            const dayKey = date.toISOString().slice(0, 10);
            const category = categories[c.quest_id] || 'unknown';

            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
              dailyCategoryData[dayKey] = {};
            }
            dailyData[dayKey]++;
            dailyCategoryData[dayKey]![category] = (dailyCategoryData[dayKey]![category] || 0) + 1;
          }
        });

        const sortedDays = Object.keys(dailyData).sort();
        const timelineData: Array<{ day: string, value: number, categories: Record<string, number> }> = [];

        sortedDays.forEach(day => {
          timelineData.push({
            day: day,
            value: dailyData[day] || 0,
            categories: dailyCategoryData[day] || {}
          });
        });

        return { data: timelineData };
      } else {
        // Return empty data if no completions found
        const data = days.map(day => ({ day, value: 0, categories: {} }));
        return { data };
      }
    } else {
      // For week/month view, show daily completions with category breakdown
      days.forEach(day => {
        // Count completions that happened ON this specific day
        const completionsOnDay = completions?.filter((c: any) => {
          // Prioritize completed_at over original_completion_date for current data
          const completionDate = c.completed_at || c.original_completion_date;
          if (!completionDate) return false;
          const d = new Date(completionDate);
          const completionDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return completionDay === day;
        }) || [];

        counts[day] = completionsOnDay.length;

        // Group by category for this day
        completionsOnDay.forEach((c: any) => {
          const category = categories[c.quest_id] || 'unknown';
          categoryData[day]![category] = (categoryData[day]![category] || 0) + 1;
        });
      });
    }

    const data = days.map(day => ({
      day,
      value: counts[day] || 0,
      categories: categoryData[day] || {}
    }));
    return { data };
  }

  // Handle challenges tab
  if (tab === 'challenges') {
    const { data: completions, error } = await supabase
      .from('challenge_completion')
      .select('id, challenge_id, date, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', earliestDate.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    // Aggregate by day - show daily completions (not cumulative)
    let counts: Record<string, number> = {};
    days.forEach(day => { counts[day] = 0; });

    if (period === 'year') {
      // For year view, aggregate by month
      completions?.forEach((c: any) => {
        if (c.date) {
          // Convert ISO timestamp to date string (YYYY-MM-DD)
          const dateStr = new Date(c.date).toISOString().slice(0, 10);
          const month = dateStr.slice(0, 7);
          if (counts[month] !== undefined) {
            counts[month]++;
          }
        }
      });
    } else if (period === 'all') {
      if (completions && completions.length > 0) {
        const dailyData: Record<string, number> = {};
        completions.forEach((c: any) => {
          if (c.date) {
            // Convert ISO timestamp to date string (YYYY-MM-DD)
            const dayKey = new Date(c.date).toISOString().slice(0, 10);

            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
            }
            dailyData[dayKey]++;
          }
        });

        const sortedDays = Object.keys(dailyData).sort();
        const timelineData: Array<{ day: string, value: number }> = [];

        sortedDays.forEach(day => {
          timelineData.push({
            day: day,
            value: dailyData[day] || 0
          });
        });

        return { data: timelineData };
      } else {
        // Return empty data if no completions found
        const data = days.map(day => ({ day, value: 0 }));
        return { data };
      }
    } else {
      // For week/month view, show daily completions
      days.forEach(day => {
        // Count completions that happened ON this specific day
        const completionsOnDay = completions?.filter((c: any) => {
          if (!c.date) return false;
          // Convert ISO timestamp to date string (YYYY-MM-DD) for comparison
          const d = new Date(c.date);
          const completionDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return completionDay === day;
        }) || [];

        counts[day] = completionsOnDay.length;
      });
    }

    const data = days.map(day => ({ day, value: counts[day] || 0 }));
    return { data };
  }

  // Handle milestones tab
  if (tab === 'milestones') {
    const { data: completions, error } = await supabase
      .from('milestone_completion')
      .select('id, milestone_id, date, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', earliestDate.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    // Aggregate by day - show daily completions (not cumulative)
    let counts: Record<string, number> = {};
    days.forEach(day => { counts[day] = 0; });

    if (period === 'year') {
      // For year view, aggregate by month
      completions?.forEach((c: any) => {
        if (c.date) {
          // Convert ISO timestamp to date string (YYYY-MM-DD)
          const dateStr = new Date(c.date).toISOString().slice(0, 10);
          const month = dateStr.slice(0, 7);
          if (counts[month] !== undefined) {
            counts[month]++;
          }
        }
      });
    } else if (period === 'all') {
      if (completions && completions.length > 0) {
        const dailyData: Record<string, number> = {};
        completions.forEach((c: any) => {
          if (c.date) {
            // Convert ISO timestamp to date string (YYYY-MM-DD)
            const dayKey = new Date(c.date).toISOString().slice(0, 10);

            if (!dailyData[dayKey]) {
              dailyData[dayKey] = 0;
            }
            dailyData[dayKey]++;
          }
        });

        const sortedDays = Object.keys(dailyData).sort();
        const timelineData: Array<{ day: string, value: number }> = [];

        sortedDays.forEach(day => {
          timelineData.push({
            day: day,
            value: dailyData[day] || 0
          });
        });

        return { data: timelineData };
      } else {
        // Return empty data if no completions found
        const data = days.map(day => ({ day, value: 0 }));
        return { data };
      }
    } else {
      // For week/month view, show daily completions
      days.forEach(day => {
        // Count completions that happened ON this specific day
        const completionsOnDay = completions?.filter((c: any) => {
          if (!c.date) return false;
          // Convert ISO timestamp to date string (YYYY-MM-DD)
          const d = new Date(c.date);
          const completionDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return completionDay === day;
        }) || [];

        counts[day] = completionsOnDay.length;
      });
    }

    const data = days.map(day => ({ day, value: counts[day] || 0 }));
    return { data };
  }

  // Handle gold gained tab
  if (tab === 'gold-gained') {
    const { data: transactions } = await supabase
      .from('gold_transactions')
      .select('id, amount, created_at, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', earliestDate.toISOString())
      .gt('amount', 0); // Only positive amounts (gains)

    const { data: questCompletions } = await supabase
      .from('quest_completion')
      .select('gold_earned, completed_at, created_at')
      .eq('user_id', userId)
      .gte('completed_at', earliestDate.toISOString());

    let counts: Record<string, number> = {};
    days.forEach(day => { counts[day] = 0; });

    transactions?.forEach((t: any) => {
      if (t.created_at) {
        const d = new Date(t.created_at);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (counts[dayKey] !== undefined) {
          counts[dayKey] += t.amount || 0;
        }
      }
    });

    questCompletions?.forEach((c: any) => {
      const completionDate = c.completed_at || c.created_at;
      if (completionDate) {
        const d = new Date(completionDate);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (counts[dayKey] !== undefined) {
          counts[dayKey] += c.gold_earned || 25;
        }
      }
    });

    const data = days.map(day => ({ day, value: counts[day] || 0 }));
    return { data };
  }

  // Handle gold spent tab
  if (tab === 'gold-spent') {
    const { data: transactions } = await supabase
      .from('gold_transactions')
      .select('id, amount, created_at, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', earliestDate.toISOString())
      .lt('amount', 0); // Only negative amounts (spending)

    let counts: Record<string, number> = {};
    days.forEach(day => { counts[day] = 0; });

    transactions?.forEach((t: any) => {
      if (t.created_at) {
        const d = new Date(t.created_at);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (counts[dayKey] !== undefined) {
          counts[dayKey] += Math.abs(t.amount || 0);
        }
      }
    });

    const data = days.map(day => ({ day, value: counts[day] || 0 }));
    return { data };
  }

  // Handle experience tab
  if (tab === 'experience') {
    const { data: transactions } = await supabase
      .from('experience_transactions')
      .select('id, amount, created_at, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', earliestDate.toISOString());

    const { data: questCompletions } = await supabase
      .from('quest_completion')
      .select('xp_earned, completed_at, created_at')
      .eq('user_id', userId)
      .gte('completed_at', earliestDate.toISOString());

    let counts: Record<string, number> = {};
    days.forEach(day => { counts[day] = 0; });

    transactions?.forEach((t: any) => {
      if (t.created_at) {
        const d = new Date(t.created_at);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (counts[dayKey] !== undefined) {
          counts[dayKey] += t.amount || 0;
        }
      }
    });

    questCompletions?.forEach((c: any) => {
      const completionDate = c.completed_at || c.created_at;
      if (completionDate) {
        const d = new Date(completionDate);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (counts[dayKey] !== undefined) {
          counts[dayKey] += c.xp_earned || 50;
        }
      }
    });

    const data = days.map(day => ({ day, value: counts[day] || 0 }));
    return { data };
  }

  // Handle level tab
  if (tab === 'level') {
    const { data: statsData } = await supabase
      .from('character_stats')
      .select('level')
      .eq('user_id', userId)
      .maybeSingle();

    const currentLevel = statsData?.level || 1;
    const data = days.map((day, idx) => ({
      day,
      value: Math.max(1, currentLevel - Math.floor((days.length - 1 - idx) / 3))
    }));
    return { data };
  }

  // For any other tabs, return empty data
  const data = days.map(day => ({ day, value: 0 }));
  return { data };
}