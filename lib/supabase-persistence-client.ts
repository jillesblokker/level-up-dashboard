// Client-side only Supabase persistence functions
// This version works with existing API endpoints without server-side imports

// Generic function to save data to Supabase with localStorage fallback
export async function saveToSupabaseClient<T>(
  endpoint: string, 
  data: T, 
  localStorageKey: string
): Promise<boolean> {
  try {
    // For client-side, we'll use the existing API endpoints
    // The API endpoints handle their own authentication
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`[Supabase Persistence Client] ✅ Data saved to Supabase successfully: ${endpoint}`);
      // Also save to localStorage as backup
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return true; // Indicates Supabase was used
    } else {
      console.log(`[Supabase Persistence Client] ⚠️ Failed to save to Supabase, falling back to localStorage: ${endpoint}`);
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error saving to Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence Client] Falling back to localStorage: ${localStorageKey}`);
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    return false;
  }
}

// Generic function to load data from Supabase with localStorage fallback
export async function loadFromSupabaseClient<T>(
  endpoint: string, 
  localStorageKey: string,
  defaultValue: T
): Promise<T> {
  try {
    // For client-side, we'll use the existing API endpoints
    // The API endpoints handle their own authentication
    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.stats || result.progress || result.grid) {
        console.log(`[Supabase Persistence Client] ✅ Data loaded from Supabase: ${endpoint}`);
        // Also save to localStorage as backup
        localStorage.setItem(localStorageKey, JSON.stringify(result.stats || result.progress || result.grid));
        return result.stats || result.progress || result.grid;
      }
    }

    console.log(`[Supabase Persistence Client] ⚠️ Failed to load from Supabase, using localStorage: ${endpoint}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error loading from Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence Client] Using localStorage: ${localStorageKey}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}
