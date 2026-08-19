import { logger } from './logger';
import { getUserPreference, setUserPreference } from './user-preferences-manager';

export type RulerTitle = 'King' | 'Queen';

const RULER_TITLE_KEY = 'ruler_title';

/**
 * Gets the user's ruler title preference ('King' or 'Queen').
 * Reads from localStorage first for instant rendering, falling back to Supabase.
 */
export function getRulerTitleSync(): RulerTitle {
  if (typeof window === 'undefined') return 'King';
  try {
    const local = localStorage.getItem(`pref:${RULER_TITLE_KEY}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed === 'Queen' || parsed === 'King') return parsed;
    }
  } catch { /* ignore */ }
  return 'King';
}

/**
 * Async fetch of ruler title preference from Supabase or localStorage.
 */
export async function getRulerTitle(): Promise<RulerTitle> {
  const val = await getUserPreference(RULER_TITLE_KEY);
  if (val === 'Queen' || val === 'King') {
    return val;
  }
  return getRulerTitleSync();
}

/**
 * Sets the user's ruler title preference ('King' or 'Queen').
 * Saves immediately to localStorage and persists to Supabase.
 * Dispatches local event & BroadcastChannel for cross-tab reactivity.
 */
export async function setRulerTitle(title: RulerTitle): Promise<boolean> {
  try {
    localStorage.setItem(`pref:${RULER_TITLE_KEY}`, JSON.stringify(title));
  } catch { /* ignore */ }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ruler-title-updated', { detail: title }));
    try {
      const bc = new BroadcastChannel('thrivehaven_sync');
      bc.postMessage({ type: 'RULER_TITLE_UPDATED', title });
      bc.close();
    } catch { /* ignore */ }
  }

  return await setUserPreference(RULER_TITLE_KEY, title);
}

/**
 * Transform text containing "King" or "Queen" based on the user's preference.
 * E.g., if title is "Queen":
 *  - "King of Thrivehaven" -> "Queen of Thrivehaven"
 *  - "the King" -> "the Queen"
 *  - "King Jilles" -> "Queen Jilles"
 *  - "Kingdom" remains "Kingdom" (not affected)
 */
export function formatRulerTitle(text: string, title?: RulerTitle): string {
  if (!text) return text;
  const currentTitle = title || getRulerTitleSync();

  if (currentTitle === 'Queen') {
    return text
      .replace(/\bKing\b/g, 'Queen')
      .replace(/\bking\b/g, 'queen')
      .replace(/\bKING\b/g, 'QUEEN');
  } else {
    return text
      .replace(/\bQueen\b/g, 'King')
      .replace(/\bqueen\b/g, 'king')
      .replace(/\bQUEEN\b/g, 'KING');
  }
}
