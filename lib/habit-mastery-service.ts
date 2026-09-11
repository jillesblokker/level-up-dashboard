/**
 * habit-mastery-service.ts
 * Manages habit graduation at 66+ day streaks into permanent BotW Zora-style Stone Monuments.
 */

import { addToCharacterStat } from './character-stats-service';

export interface MasteredHabit {
  id: string;
  title: string;
  category: string;
  streak: number;
  masteredDate: string; // ISO string
  formattedDate: string; // e.g. "12-09-2026"
  dayName: string; // e.g. "Saturday"
  inscription: string;
}

const STORAGE_KEY = 'thrivehaven_mastered_habits';

export function getMasteredHabits(): MasteredHabit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function graduateHabit(habit: {
  id: string;
  title: string;
  category?: string;
  streak?: number;
}): Promise<MasteredHabit> {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;

  const cleanTitle = habit.title.trim();
  const streakDays = Math.max(habit.streak || 66, 66);
  const inscription = `On ${dayName} (${formattedDate}) you mastered the habit of ${cleanTitle}. It seems you got it into your system. Well done and keep it up.`;

  const mastered: MasteredHabit = {
    id: habit.id,
    title: cleanTitle,
    category: habit.category || 'vitality',
    streak: streakDays,
    masteredDate: now.toISOString(),
    formattedDate,
    dayName,
    inscription
  };

  if (typeof window !== 'undefined') {
    // 1. Save to mastered habits
    const existing = getMasteredHabits();
    const filtered = existing.filter(h => h.id !== habit.id);
    filtered.unshift(mastered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // 2. Grant 1x 'monument' tile to realm inventory
    try {
      const curInv = JSON.parse(localStorage.getItem('tileInventory') || '{}');
      const curMonument = curInv['monument'] || {
        id: 'monument',
        type: 'monument',
        name: 'Zora stone monument',
        quantity: 0,
        cost: 0,
        connections: []
      };
      curMonument.quantity = (curMonument.quantity || 0) + 1;
      curInv['monument'] = curMonument;
      localStorage.setItem('tileInventory', JSON.stringify(curInv));
      window.dispatchEvent(new Event('inventory-updated'));
    } catch {}

    // 3. Mark habit as graduated in local habit list so it archives cleanly
    try {
      const graduatedIds = JSON.parse(localStorage.getItem('thrivehaven_graduated_habit_ids') || '[]');
      if (!graduatedIds.includes(habit.id)) {
        graduatedIds.push(habit.id);
        localStorage.setItem('thrivehaven_graduated_habit_ids', JSON.stringify(graduatedIds));
      }
    } catch {}

    // 4. Award gold and prestige XP
    await addToCharacterStat('gold', 1000, 'habit-mastery-graduation');
    await addToCharacterStat('experience', 500, 'habit-mastery-graduation');
    window.dispatchEvent(new Event('character-stats-update'));
    window.dispatchEvent(new Event('mastered-habits-updated'));
  }

  return mastered;
}

export function isHabitGraduated(habitId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ids: string[] = JSON.parse(localStorage.getItem('thrivehaven_graduated_habit_ids') || '[]');
    return ids.includes(habitId);
  } catch {
    return false;
  }
}
