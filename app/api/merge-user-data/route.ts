import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recordsToMerge } = body;

    if (!recordsToMerge || !Array.isArray(recordsToMerge)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Use secure authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      let challengeUpdates = 0;
      let challengeDuplicates = 0;
      let milestoneUpdates = 0;
      let milestoneDuplicates = 0;
      let questUpdates = 0;
      let questDuplicates = 0;

      // Process challenge records
      const challengeRecords = recordsToMerge.filter(record => record.type === 'challenge');
      if (challengeRecords.length > 0) {
        for (const record of challengeRecords) {
          try {
            // Use upsert to handle duplicates gracefully
            const { error: upsertError } = await supabase
              .from('challenge_completion')
              .upsert({
                user_id: userId,
                challenge_id: record.challenge_id,
                completed: record.completed,
                date: record.date,
                category: record.category,
                original_completion_date: record.original_completion_date
              }, {
                onConflict: 'user_id,challenge_id'
              });
            
            if (upsertError) {
              if (upsertError.code === '23505') {
                // Duplicate key - this challenge already exists for the user
                challengeDuplicates++;
              } else {
                throw upsertError;
              }
            } else {
              challengeUpdates++;
            }
          } catch (err) {
            throw err;
          }
        }
        
        // Now delete the original records from other users
        if (challengeUpdates > 0) {
          const { error: deleteError } = await supabase
            .from('challenge_completion')
            .delete()
            .neq('user_id', userId);
          
          if (deleteError) {
            throw deleteError;
          }
        }
      }

      // Process milestone records
      const milestoneRecords = recordsToMerge.filter(record => record.type === 'milestone');
      if (milestoneRecords.length > 0) {
        for (const record of milestoneRecords) {
          try {
            const { error: upsertError } = await supabase
              .from('milestone_completion')
              .upsert({
                user_id: userId,
                milestone_id: record.milestone_id,
                completed: record.completed,
                date: record.date,
                category: record.category,
                original_completion_date: record.original_completion_date
              }, {
                onConflict: 'user_id,milestone_id'
              });
            
            if (upsertError) {
              if (upsertError.code === '23505') {
                milestoneDuplicates++;
              } else {
                throw upsertError;
              }
            } else {
              milestoneUpdates++;
            }
          } catch (err) {
            throw err;
          }
        }
        
        if (milestoneUpdates > 0) {
          const { error: deleteError } = await supabase
            .from('milestone_completion')
            .delete()
            .neq('user_id', userId);
          
          if (deleteError) {
            throw deleteError;
          }
        }
      }

      // Process quest records
      const questRecords = recordsToMerge.filter(record => record.type === 'quest');
      if (questRecords.length > 0) {
        for (const record of questRecords) {
          try {
            const { error: upsertError } = await supabase
              .from('quest_completion')
              .upsert({
                user_id: userId,
                quest_id: record.quest_id,
                completed: record.completed,
                completed_at: record.completed_at,
                xp_earned: record.xp_earned,
                gold_earned: record.gold_earned,
                original_completion_date: record.original_completion_date
              }, {
                onConflict: 'user_id,quest_id'
              });
            
            if (upsertError) {
              if (upsertError.code === '23505') {
                questDuplicates++;
              } else {
                throw upsertError;
              }
            } else {
              questUpdates++;
            }
          } catch (err) {
            throw err;
          }
        }
        
        if (questUpdates > 0) {
          const { error: deleteError } = await supabase
            .from('quest_completion')
            .delete()
            .neq('user_id', userId);
          
          if (deleteError) {
            throw deleteError;
          }
        }
      }

      return {
        success: true,
        summary: {
          challenges: {
            updated: challengeUpdates,
            duplicates: challengeDuplicates
          },
          milestones: {
            updated: milestoneUpdates,
            duplicates: milestoneDuplicates
          },
          quests: {
            updated: questUpdates,
            duplicates: questDuplicates
          }
        }
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('[Merge User Data] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}