export interface ActivePerk {
  perk_name: string;
  effect: string;
  expires_at: string;
}

/**
 * Loads active perks from Supabase with localStorage fallback
 */
export async function loadActivePerks(): Promise<ActivePerk[]> {
  try {
    // Try to load from Supabase first
    const response = await fetch('/api/active-perks', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        console.log('[Active Perks Manager] Loaded from Supabase:', data.data);
        return data.data;
      }
    }
  } catch (error) {
    console.warn('[Active Perks Manager] Failed to load from Supabase:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('active-potion-perks');
    if (stored) {
      const perks = JSON.parse(stored);
      const activePerks: ActivePerk[] = Object.entries(perks).map(([name, perk]: [string, any]) => ({
        perk_name: name,
        effect: perk.effect,
        expires_at: perk.expiresAt
      }));
      console.log('[Active Perks Manager] Loaded from localStorage:', activePerks);
      return activePerks;
    }
  } catch (error) {
    console.warn('[Active Perks Manager] Failed to load from localStorage:', error);
  }

  return [];
}

/**
 * Saves active perks to both Supabase and localStorage
 */
export async function saveActivePerks(perks: ActivePerk[]): Promise<{ success: boolean; error?: string }> {
  let supabaseSuccess = false;
  let localStorageSuccess = false;

  // Save to Supabase
  try {
    // Save each perk individually
    for (const perk of perks) {
      const response = await fetch('/api/active-perks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(perk),
      });

      if (!response.ok) {
        console.warn('[Active Perks Manager] Failed to save perk to Supabase:', perk.perk_name);
        break;
      }
    }
    supabaseSuccess = true;
    console.log('[Active Perks Manager] Saved to Supabase:', perks);
  } catch (error) {
    console.warn('[Active Perks Manager] Supabase save error:', error);
  }

  // Save to localStorage as backup
  try {
    const perksObject: Record<string, any> = {};
    perks.forEach(perk => {
      perksObject[perk.perk_name] = {
        effect: perk.effect,
        expiresAt: perk.expires_at
      };
    });
    
    localStorage.setItem('active-potion-perks', JSON.stringify(perksObject));
    localStorageSuccess = true;
    console.log('[Active Perks Manager] Saved to localStorage:', perksObject);
  } catch (error) {
    console.warn('[Active Perks Manager] localStorage save error:', error);
  }

  const result: { success: boolean; error?: string } = {
    success: supabaseSuccess || localStorageSuccess
  };
  
  if (!supabaseSuccess && !localStorageSuccess) {
    result.error = 'Failed to save active perks';
  }
  
  return result;
}

/**
 * Adds a new active perk
 */
export async function addActivePerk(perk: ActivePerk): Promise<{ success: boolean; error?: string }> {
  const currentPerks = await loadActivePerks();
  const updatedPerks = [...currentPerks, perk];
  return await saveActivePerks(updatedPerks);
}

/**
 * Removes an active perk
 */
export async function removeActivePerk(perkName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/active-perks?perk_name=${encodeURIComponent(perkName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // Also remove from localStorage
      try {
        const stored = localStorage.getItem('active-potion-perks');
        if (stored) {
          const perks = JSON.parse(stored);
          delete perks[perkName];
          localStorage.setItem('active-potion-perks', JSON.stringify(perks));
        }
      } catch (error) {
        console.warn('[Active Perks Manager] Error updating localStorage:', error);
      }

      return { success: true };
    } else {
      return { success: false, error: 'Failed to remove perk' };
    }
  } catch (error) {
    console.warn('[Active Perks Manager] Error removing perk:', error);
    return { success: false, error: 'Error removing perk' };
  }
}

/**
 * Gets active perks synchronously (for immediate use)
 */
export function getActivePerks(): ActivePerk[] {
  try {
    const stored = localStorage.getItem('active-potion-perks');
    if (stored) {
      const perks = JSON.parse(stored);
      return Object.entries(perks).map(([name, perk]: [string, any]) => ({
        perk_name: name,
        effect: perk.effect,
        expires_at: perk.expiresAt
      }));
    }
  } catch (error) {
    console.warn('[Active Perks Manager] Error getting perks:', error);
  }

  return [];
}

/**
 * Sets active perks synchronously (for immediate use)
 */
export function setActivePerks(perks: ActivePerk[]): void {
  try {
    const perksObject: Record<string, any> = {};
    perks.forEach(perk => {
      perksObject[perk.perk_name] = {
        effect: perk.effect,
        expiresAt: perk.expires_at
      };
    });
    
    localStorage.setItem('active-potion-perks', JSON.stringify(perksObject));
    console.log('[Active Perks Manager] Set perks:', perks);
  } catch (error) {
    console.warn('[Active Perks Manager] Error setting perks:', error);
  }
}

/**
 * Cleans up expired perks
 */
export async function cleanupExpiredPerks(): Promise<void> {
  const currentPerks = await loadActivePerks();
  const now = new Date();
  const activePerks = currentPerks.filter(perk => new Date(perk.expires_at) > now);
  
  if (activePerks.length !== currentPerks.length) {
    await saveActivePerks(activePerks);
    console.log('[Active Perks Manager] Cleaned up expired perks');
  }
} 