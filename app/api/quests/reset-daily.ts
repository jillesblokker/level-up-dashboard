import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '../../../pages/api/server-client';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const userId = await getAuth(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Reset all quests for the user
    const { error: questError } = await supabaseServer
      .from('quest_completion')
      .update({ completed: false })
      .eq('user_id', userId);
    // Reset all challenges for the user
    const { error: challengeError } = await supabaseServer
      .from('challenge_completion')
      .update({ completed: false })
      .eq('user_id', userId);
    if (questError || challengeError) {
      res.status(500).json({ error: 'Failed to reset quests or challenges', questError, challengeError });
      return;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error });
  }
} 