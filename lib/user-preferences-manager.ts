export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  value: string;
}

// Helper to get Clerk token
async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).Clerk) {
    try {
      return await (window as any).Clerk.session?.getToken() || '';
    } catch (error) {
      console.error('Error getting Clerk token:', error);
      return '';
    }
  }
  return '';
}

export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/user-preferences?all=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
}

export async function getUserPreference(userId: string, key: string): Promise<UserPreference | null> {
  if (!userId) return null;
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/user-preferences?preference_key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch preference: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preference:', error);
    return null;
  }
}

export async function setUserPreference(userId: string, key: string, value: string) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    const response = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preference_key: key,
        preference_value: value,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set preference: ${response.status}`);
    }
    
    window.dispatchEvent(new Event('user-preferences-update'));
  } catch (error) {
    console.error('Error setting user preference:', error);
  }
}

export async function removeUserPreference(userId: string, key: string) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/user-preferences?preference_key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove preference: ${response.status}`);
    }
    
    window.dispatchEvent(new Event('user-preferences-update'));
  } catch (error) {
    console.error('Error removing user preference:', error);
  }
} 