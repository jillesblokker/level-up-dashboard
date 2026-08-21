import { getUserPreference, setUserPreference } from './user-preferences-manager';

export type AppTheme = 'classic' | 'medieval' | 'oldskool';

/**
 * Applies the selected theme ('classic' | 'medieval' | 'oldskool') to the DOM root element
 * and persists the preference.
 */
export async function setAppTheme(theme: AppTheme): Promise<void> {
  if (typeof document !== 'undefined') {
    if (theme === 'oldskool') {
      document.documentElement.setAttribute('data-theme', 'oldskool');
      document.body.setAttribute('data-theme', 'oldskool');
      document.body.classList.add('theme-oldskool');
      document.body.classList.remove('theme-medieval');
    } else if (theme === 'medieval') {
      document.documentElement.setAttribute('data-theme', 'medieval');
      document.body.setAttribute('data-theme', 'medieval');
      document.body.classList.add('theme-medieval');
      document.body.classList.remove('theme-oldskool');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      document.body.classList.remove('theme-medieval', 'theme-oldskool');
    }
    
    try {
      localStorage.setItem('app-theme', theme);
    } catch {
      // Ignore quota/SSR errors
    }
  }

  // Persist background preference across devices
  await setUserPreference('app-theme', theme);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: { theme } }));
  }
}

/**
 * Retrieves the current app theme ('classic', 'medieval', or 'oldskool'). Defaults to 'oldskool'.
 */
export function getAppThemeSync(): AppTheme {
  if (typeof window === 'undefined') return 'oldskool';
  try {
    const saved = localStorage.getItem('app-theme') || localStorage.getItem('pref:app-theme');
    if (saved) {
      const clean = saved.replace(/"/g, '');
      if (clean === 'classic' || clean === 'medieval' || clean === 'oldskool') return clean as AppTheme;
    }
  } catch {
    // Ignore
  }
  return 'oldskool';
}

/**
 * Initializes the app theme on client mount (defaulting to oldskool).
 */
export function initAppTheme(): void {
  if (typeof document === 'undefined') return;
  const current = getAppThemeSync();
  if (current === 'medieval') {
    document.documentElement.setAttribute('data-theme', 'medieval');
    document.body.setAttribute('data-theme', 'medieval');
    document.body.classList.add('theme-medieval');
    document.body.classList.remove('theme-oldskool');
  } else if (current === 'classic') {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    document.body.classList.remove('theme-medieval', 'theme-oldskool');
  } else {
    // Default theme: 'oldskool'
    document.documentElement.setAttribute('data-theme', 'oldskool');
    document.body.setAttribute('data-theme', 'oldskool');
    document.body.classList.add('theme-oldskool');
    document.body.classList.remove('theme-medieval');
  }
}
