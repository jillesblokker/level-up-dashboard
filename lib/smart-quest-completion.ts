/**
 * Smart Quest Completion System
 * 
 * This system prevents 'completed: false' from being stored in the database
 * and ensures only meaningful completion data is persisted.
 */

export interface SmartCompletionResult {
  success: boolean;
  action: 'completed' | 'uncompleted' | 'no_action';
  message: string;
  record?: any;
  deletedRecord?: any;
}

/**
 * Smart quest completion function that prevents storing completed: false
 */
export async function smartQuestCompletion(
  questId: string, 
  completed: boolean,
  options?: {
    xpReward?: number;
    goldReward?: number;
    token?: string;
  }
): Promise<SmartCompletionResult> {
  try {
    // If not completed, don't even make an API call - just return success
    if (!completed) {
      return {
        success: true,
        action: 'no_action',
        message: 'Quest not completed - no record to store (smart behavior)'
      };
    }

    // Only proceed if quest is actually completed
    const token = options?.token || await getClerkToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/quests/smart-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        questId,
        completed: true, // Always send true - the smart system handles the rest
        xpReward: options?.xpReward ?? 50,
        goldReward: options?.goldReward ?? 25
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process quest completion');
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    console.error('[Smart Quest Completion] Error:', error);
    return {
      success: false,
      action: 'no_action',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get quest completion status using the clean view
 */
export async function getQuestCompletionStatus(
  questId: string,
  token?: string
): Promise<{ completed: boolean; completion: any | null }> {
  try {
    const authToken = token || await getClerkToken();
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`/api/quests/smart-completion?questId=${questId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch quest completion status');
    }

    const result = await response.json();
    return {
      completed: result.completed,
      completion: result.completion
    };

  } catch (error) {
    console.error('[Smart Quest Completion] Error fetching status:', error);
    return {
      completed: false,
      completion: null
    };
  }
}

/**
 * Get all quest completions for a user using the clean view
 */
export async function getAllQuestCompletions(
  token?: string
): Promise<{ completions: any[]; count: number }> {
  try {
    const authToken = token || await getClerkToken();
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/quests/smart-completion', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch quest completions');
    }

    const result = await response.json();
    return {
      completions: result.completions || [],
      count: result.count || 0
    };

  } catch (error) {
    console.error('[Smart Quest Completion] Error fetching completions:', error);
    return {
      completions: [],
      count: 0
    };
  }
}

/**
 * Batch process multiple quest completions intelligently
 */
export async function batchQuestCompletions(
  quests: Array<{ questId: string; completed: boolean; xpReward?: number; goldReward?: number }>,
  token?: string
): Promise<SmartCompletionResult[]> {
  try {
    const authToken = token || await getClerkToken();
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    // Filter out non-completed quests (smart behavior)
    const completedQuests = quests.filter(q => q.completed);
    
    if (completedQuests.length === 0) {
      return [{
        success: true,
        action: 'no_action',
        message: 'No quests to complete - smart filtering applied'
      }];
    }

    // Process completed quests in parallel
    const results = await Promise.all(
      completedQuests.map(quest => {
        const options: { xpReward?: number; goldReward?: number; token: string } = {
          token: authToken
        };
        
        // Only add xpReward if it's defined
        if (quest.xpReward !== undefined) {
          options.xpReward = quest.xpReward;
        }
        
        // Only add goldReward if it's defined
        if (quest.goldReward !== undefined) {
          options.goldReward = quest.goldReward;
        }
        
        return smartQuestCompletion(quest.questId, true, options);
      })
    );

    return results;

  } catch (error) {
    console.error('[Smart Quest Completion] Batch processing error:', error);
    return [{
      success: false,
      action: 'no_action',
      message: error instanceof Error ? error.message : 'Batch processing failed'
    }];
  }
}

// Helper function to get Clerk token (you'll need to implement this based on your auth setup)
async function getClerkToken(): Promise<string | null> {
  // This should be implemented based on your Clerk setup
  // For now, return null to indicate no token
  return null;
}
