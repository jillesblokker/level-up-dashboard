import { fetchWithAuth } from './fetchWithAuth';

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  value: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  if (!userId) return [];
  
  try {
    const response = await fetchWithAuth(`/api/user-preferences?all=true`, {});
    if (!response.ok) throw new Error(`Failed to fetch user preferences: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
}

export async function getUserPreference(userId: string, preferenceKey: string): Promise<string | null> {
  if (!userId || !preferenceKey) return null;
  
  try {
    const response = await fetchWithAuth(`/api/user-preferences?preference_key=${encodeURIComponent(preferenceKey)}`, {});
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch user preference: ${response.status}`);
    }
    const data = await response.json();
    return data?.preference_value ?? data?.value ?? null;
  } catch (error) {
    console.error('Error fetching user preference:', error);
    return null;
  }
}

export async function setUserPreference(userId: string, preferenceKey: string, value: string): Promise<boolean> {
  if (!userId || !preferenceKey) return false;
  
  try {
    const response = await fetchWithAuth('/api/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference_key: preferenceKey, preference_value: value }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Failed to set user preference: ${response.status}${errText ? ` - ${errText}` : ''}`);
    }
    return true;
  } catch (error) {
    console.error('Error setting user preference:', error);
    return false;
  }
}

export async function deleteUserPreference(userId: string, preferenceKey: string): Promise<boolean> {
  if (!userId || !preferenceKey) return false;
  
  try {
    const response = await fetchWithAuth('/api/user-preferences', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference_key: preferenceKey }),
    });
    if (!response.ok) throw new Error(`Failed to delete user preference: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error deleting user preference:', error);
    return false;
  }
}

// Helper functions for common preferences
export async function getKingdomHeaderImage(userId: string): Promise<string | null> {
  return await getUserPreference(userId, 'kingdom-header-image');
}

export async function setKingdomHeaderImage(userId: string, imageUrl: string): Promise<boolean> {
  return await setUserPreference(userId, 'kingdom-header-image', imageUrl);
}

export async function getThemePreference(userId: string): Promise<string | null> {
  return await getUserPreference(userId, 'theme');
}

export async function setThemePreference(userId: string, theme: string): Promise<boolean> {
  return await setUserPreference(userId, 'theme', theme);
} 