import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Merge User Data] No Bearer token found');
      return null;
    }
    
    const token = authHeader.substring(7);
    console.log('[Merge User Data] Found Bearer token, length:', token.length);
    
    // Simple JWT decode (without verification for debugging)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('[Merge User Data] Invalid JWT format');
        return null;
      }
      
      const base64Url = tokenParts[1];
      if (!base64Url) {
        console.log('[Merge User Data] Missing JWT payload');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('[Merge User Data] JWT payload:', payload);
      
      // Extract user ID from JWT payload
      if (payload.sub) {
        console.log('[Merge User Data] Found userId in JWT:', payload.sub);
        return payload.sub;
      }
      
      // Try alternative fields
      if (payload.user_id) {
        console.log('[Merge User Data] Found userId in JWT (user_id):', payload.user_id);
        return payload.user_id;
      }
      
      if (payload.userId) {
        console.log('[Merge User Data] Found userId in JWT (userId):', payload.userId);
        return payload.userId;
      }
      
      console.log('[Merge User Data] No userId found in JWT payload');
      return null;
    } catch (jwtError) {
      console.log('[Merge User Data] JWT decode error:', jwtError);
      return null;
    }
  } catch (e) {
    console.error('[Merge User Data] Authentication error:', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated user ID
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.log('[Merge User Data] Authentication failed - no valid userId');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    console.log('[Merge User Data] Starting merge for user:', userId);
    
    // First, let's see what we're working with
    const { data: challengeData, error: challengeError } = await supabase
      .from('challenge_completion')
      .select('*');
    
    if (challengeError) {
      console.error('[Merge User Data] Error fetching challenge data:', challengeError);
      throw challengeError;
    }
    
    const { data: milestoneData, error: milestoneError } = await supabase
      .from('milestone_completion')
      .select('*');
    
    if (milestoneError) {
      console.error('[Merge User Data] Error fetching milestone data:', milestoneError);
      throw milestoneError;
    }
    
    console.log('[Merge User Data] Current challenge records:', challengeData?.length || 0);
    console.log('[Merge User Data] Current milestone records:', milestoneData?.length || 0);
    
    // Show different user IDs
    const challengeUserIds = [...new Set(challengeData?.map(c => c.user_id) || [])];
    const milestoneUserIds = [...new Set(milestoneData?.map(m => m.user_id) || [])];
    
    console.log('[Merge User Data] Challenge user IDs:', challengeUserIds);
    console.log('[Merge User Data] Milestone user IDs:', milestoneUserIds);
    
    // Handle challenge completion records - use upsert to avoid duplicates
    let challengeUpdates = 0;
    let challengeDuplicates = 0;
    
    if (challengeUserIds.length > 1 || (challengeUserIds.length === 1 && challengeUserIds[0] !== userId)) {
      // Get records that need to be merged (from other users)
      const recordsToMerge = challengeData?.filter(c => c.user_id !== userId) || [];
      console.log('[Merge User Data] Found', recordsToMerge.length, 'challenge records to merge');
      
      for (const record of recordsToMerge) {
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
              console.log('[Merge User Data] Skipping duplicate challenge:', record.challenge_id);
            } else {
              console.error('[Merge User Data] Error upserting challenge:', upsertError);
              throw upsertError;
            }
          } else {
            challengeUpdates++;
          }
        } catch (err) {
          console.error('[Merge User Data] Error processing challenge record:', err);
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
          console.error('[Merge User Data] Error deleting old challenge records:', deleteError);
          throw deleteError;
        }
      }
      
      console.log('[Merge User Data] Updated', challengeUpdates, 'challenge records, skipped', challengeDuplicates, 'duplicates');
    }
    
    // Handle milestone completion records - use upsert to avoid duplicates
    let milestoneUpdates = 0;
    let milestoneDuplicates = 0;
    
    if (milestoneUserIds.length > 1 || (milestoneUserIds.length === 1 && milestoneUserIds[0] !== userId)) {
      // Get records that need to be merged (from other users)
      const recordsToMerge = milestoneData?.filter(m => m.user_id !== userId) || [];
      console.log('[Merge User Data] Found', recordsToMerge.length, 'milestone records to merge');
      
      for (const record of recordsToMerge) {
        try {
          // Use upsert to handle duplicates gracefully
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
              // Duplicate key - this milestone already exists for the user
              milestoneDuplicates++;
              console.log('[Merge User Data] Skipping duplicate milestone:', record.milestone_id);
            } else {
              console.error('[Merge User Data] Error upserting milestone:', upsertError);
              throw upsertError;
            }
          } else {
            milestoneUpdates++;
          }
        } catch (err) {
          console.error('[Merge User Data] Error processing milestone record:', err);
          throw err;
        }
      }
      
      // Now delete the original records from other users
      if (milestoneUpdates > 0) {
        const { error: deleteError } = await supabase
          .from('milestone_completion')
          .delete()
          .neq('user_id', userId);
        
        if (deleteError) {
          console.error('[Merge User Data] Error deleting old milestone records:', deleteError);
          throw deleteError;
        }
      }
      
      console.log('[Merge User Data] Updated', milestoneUpdates, 'milestone records, skipped', milestoneDuplicates, 'duplicates');
    }
    
    // Verify the final state
    const { data: finalChallengeData, error: finalChallengeError } = await supabase
      .from('challenge_completion')
      .select('*');
    
    if (finalChallengeError) {
      console.error('[Merge User Data] Error fetching final challenge data:', finalChallengeError);
      throw finalChallengeError;
    }
    
    const { data: finalMilestoneData, error: finalMilestoneError } = await supabase
      .from('milestone_completion')
      .select('*');
    
    if (finalMilestoneError) {
      console.error('[Merge User Data] Error fetching final milestone data:', finalMilestoneError);
      throw finalMilestoneError;
    }
    
    const finalChallengeUserIds = [...new Set(finalChallengeData?.map(c => c.user_id) || [])];
    const finalMilestoneUserIds = [...new Set(finalMilestoneData?.map(m => m.user_id) || [])];
    
    console.log('[Merge User Data] Final challenge user IDs:', finalChallengeUserIds);
    console.log('[Merge User Data] Final milestone user IDs:', finalMilestoneUserIds);
    
    const result = {
      success: true,
      message: 'User data merged successfully',
      updates: {
        challenges: challengeUpdates,
        milestones: milestoneUpdates
      },
      duplicates: {
        challenges: challengeDuplicates,
        milestones: milestoneDuplicates
      },
      finalState: {
        challenges: {
          totalRecords: finalChallengeData?.length || 0,
          uniqueUsers: finalChallengeUserIds.length,
          userIds: finalChallengeUserIds
        },
        milestones: {
          totalRecords: finalMilestoneData?.length || 0,
          uniqueUsers: finalMilestoneUserIds.length,
          userIds: finalMilestoneUserIds
        }
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Merge User Data] Error:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
