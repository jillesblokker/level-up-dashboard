import { useState } from 'react';

// Deprecated: useLocalStorage is no longer used. All persistence is handled by Supabase.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  return [storedValue, setStoredValue] as const;
} 