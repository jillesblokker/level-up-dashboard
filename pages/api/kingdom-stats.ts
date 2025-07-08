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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
    // TODO: Replace with real aggregation logic from Supabase for each tab
    // For now, return dummy data (all zeros)
    const data = days.map(day => ({ day, value: 0 }));
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
} 