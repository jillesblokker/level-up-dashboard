import { getToken } from '@clerk/nextjs/server';

// Generic function to save data to Supabase with localStorage fallback
export async function saveToSupabase<T>(
  endpoint: string, 
  data: T, 
  localStorageKey: string
): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.log(`[Supabase Persistence] No token available, saving to localStorage: ${localStorageKey}`);
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return false; // Indicates localStorage was used
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`[Supabase Persistence] ✅ Data saved to Supabase successfully: ${endpoint}`);
      return true; // Indicates Supabase was used
    } else {
      console.log(`[Supabase Persistence] ⚠️ Failed to save to Supabase, falling back to localStorage: ${endpoint}`);
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error(`[Supabase Persistence] Error saving to Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence] Falling back to localStorage: ${localStorageKey}`);
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    return false;
  }
}

// Generic function to load data from Supabase with localStorage fallback
export async function loadFromSupabase<T>(
  endpoint: string, 
  localStorageKey: string,
  defaultValue: T
): Promise<T> {
  try {
    const token = await getToken();
    if (!token) {
      console.log(`[Supabase Persistence] No token available, loading from localStorage: ${localStorageKey}`);
      const stored = localStorage.getItem(localStorageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.stats || result.progress || result.grid) {
        console.log(`[Supabase Persistence] ✅ Data loaded from Supabase: ${endpoint}`);
        return result.stats || result.progress || result.grid;
      }
    }

    console.log(`[Supabase Persistence] ⚠️ Failed to load from Supabase, using localStorage: ${endpoint}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`[Supabase Persistence] Error loading from Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence] Using localStorage: ${localStorageKey}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}
