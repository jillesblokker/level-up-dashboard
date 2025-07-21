import { authenticatedFetch } from './auth-helpers';

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  value: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  if (!userId) return [];
  
  try {
    const response = await authenticatedFetch(`/api/user-preferences?all=true`, {}, 'User Preferences');
    
    if (!response) {
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user preferences: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
}

export async function getUserPreference(userId: string, preferenceKey: string): Promise<string | null> {
  if (!userId || !preferenceKey) return null;
  
  try {
    const response = await authenticatedFetch(`/api/user-preferences?preference_key=${encodeURIComponent(preferenceKey)}`, {}, 'User Preference');
    
    if (!response) {
      return null;
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Preference doesn't exist
      }
      throw new Error(`Failed to fetch user preference: ${response.status}`);
    }
    
    const data = await response.json();
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching user preference:', error);
    return null;
  }
}

export async function setUserPreference(userId: string, preferenceKey: string, value: string): Promise<boolean> {
  if (!userId || !preferenceKey) return false;
  
  try {
    const response = await authenticatedFetch('/api/user-preferences', {
      method: 'POST',
      body: JSON.stringify({ preference_key: preferenceKey, value }),
    }, 'Set User Preference');
    
    if (!response) {
      return false;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to set user preference: ${response.status}`);
    }
    
    console.log('Successfully set user preference:', preferenceKey);
    return true;
  } catch (error) {
    console.error('Error setting user preference:', error);
    return false;
  }
}

export async function deleteUserPreference(userId: string, preferenceKey: string): Promise<boolean> {
  if (!userId || !preferenceKey) return false;
  
  try {
    const response = await authenticatedFetch('/api/user-preferences', {
      method: 'DELETE',
      body: JSON.stringify({ preference_key: preferenceKey }),
    }, 'Delete User Preference');
    
    if (!response) {
      return false;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to delete user preference: ${response.status}`);
    }
    
    console.log('Successfully deleted user preference:', preferenceKey);
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