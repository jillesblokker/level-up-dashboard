import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from './server-client';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { userId, tab = 'challenges', period = 'week' } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const days = getDateRange(period as string);
    if (tab === 'quests') {
      // Aggregate quest completions from quest_completion table
      let fromDate: string | undefined;
      let toDate: string | undefined;
      const now = new Date();
      if (period === 'week') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().slice(0, 10);
        toDate = now.toISOString().slice(0, 10);
      } else if (period === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).toISOString().slice(0, 10);
        toDate = now.toISOString().slice(0, 10);
      } else if (period === 'year') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 7);
        toDate = now.toISOString().slice(0, 7);
      }
      // Fetch completions
      let { data: completions, error } = await supabaseServer
        .from('quest_completion')
        .select('id, completed, date')
        .eq('user_id', userId)
        .eq('completed', true);
      if (error) {
        res.status(500).json({ error: error.message });
        return;
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
      const data = days.map(day => ({ day, value: counts[day] || 0 }));
      res.status(200).json({ data });
      return;
    }
    // For other tabs, return dummy data
    const data = days.map(day => ({ day, value: 0 }));
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
} 