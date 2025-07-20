import type { CharacterStats, Perk } from '@/types/character';

// Minimal interfaces for strengths and titles
export interface CharacterStrength {
  id: string;
  user_id: string;
  name: string;
  category: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export interface CharacterTitle {
  id: string;
  user_id: string;
  name: string;
  equipped: boolean;
  unlocked: boolean;
}

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.error('[Character Data] getClerkToken called on server side');
    return null;
  }

  try {
    // Access Clerk from window if available
    const clerk = (window as any).__clerk;
    if (!clerk) {
      console.error('[Character Data] Clerk not available on window');
      return null;
    }

    const session = clerk.session;
    if (!session) {
      console.error('[Character Data] No active Clerk session');
      return null;
    }

    const token = await session.getToken();
    console.log('[Character Data] Got Clerk token:', token ? 'present' : 'null');
    return token;
  } catch (error) {
    console.error('[Character Data] Error getting Clerk token:', error);
    return null;
  }
}

// Character Stats
export async function getCharacterStats(userId: string): Promise<CharacterStats | null> {
  if (!userId) return null;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return null;
    }

    const response = await fetch(`/api/character-data?type=stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to fetch character stats:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data as CharacterStats;
  } catch (error) {
    console.error('[Character Data] Error fetching character stats:', error);
    return null;
  }
}

export async function updateCharacterStats(userId: string, stats: Partial<CharacterStats>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'stats', data: stats }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to update character stats:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-stats-update'));
  } catch (error) {
    console.error('[Character Data] Error updating character stats:', error);
  }
}

// Character Strengths
export async function getCharacterStrengths(userId: string): Promise<CharacterStrength[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return [];
    }

    const response = await fetch(`/api/character-data?type=strengths`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to fetch character strengths:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[Character Data] Error fetching character strengths:', error);
    return [];
  }
}

export async function addCharacterStrength(userId: string, strength: Omit<CharacterStrength, 'id' | 'user_id'>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'strength', data: strength }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to add character strength:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-strengths-update'));
  } catch (error) {
    console.error('[Character Data] Error adding character strength:', error);
  }
}

export async function updateCharacterStrength(userId: string, strengthId: string, updates: Partial<CharacterStrength>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'strength', id: strengthId, data: updates }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to update character strength:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-strengths-update'));
  } catch (error) {
    console.error('[Character Data] Error updating character strength:', error);
  }
}

// Character Titles
export async function getCharacterTitles(userId: string): Promise<CharacterTitle[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return [];
    }

    const response = await fetch(`/api/character-data?type=titles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to fetch character titles:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[Character Data] Error fetching character titles:', error);
    return [];
  }
}

export async function addCharacterTitle(userId: string, title: Omit<CharacterTitle, 'id' | 'user_id'>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'title', data: title }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to add character title:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-titles-update'));
  } catch (error) {
    console.error('[Character Data] Error adding character title:', error);
  }
}

export async function updateCharacterTitle(userId: string, titleId: string, updates: Partial<CharacterTitle>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'title', id: titleId, data: updates }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to update character title:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-titles-update'));
  } catch (error) {
    console.error('[Character Data] Error updating character title:', error);
  }
}

// Character Perks
export async function getCharacterPerks(userId: string): Promise<Perk[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return [];
    }

    const response = await fetch(`/api/character-data?type=perks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to fetch character perks:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[Character Data] Error fetching character perks:', error);
    return [];
  }
}

export async function addCharacterPerk(userId: string, perk: Omit<Perk, 'id' | 'user_id'>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'perk', data: perk }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to add character perk:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-perks-update'));
  } catch (error) {
    console.error('[Character Data] Error adding character perk:', error);
  }
}

export async function updateCharacterPerk(userId: string, perkId: string, updates: Partial<Perk>) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Character Data] No authentication token available');
      return;
    }

    const response = await fetch('/api/character-data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'perk', id: perkId, data: updates }),
    });

    if (!response.ok) {
      console.error('[Character Data] Failed to update character perk:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('character-perks-update'));
  } catch (error) {
    console.error('[Character Data] Error updating character perk:', error);
  }
} 