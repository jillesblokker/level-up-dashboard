"use client";

export type EncounterType = 'meditation' | 'quest_completion' | 'forge' | 'harvest' | 'feed' | 'login';

interface EncounterConfig {
  min: number;
  max: number;
}

const ENCOUNTER_CONFIGS: Record<EncounterType, EncounterConfig> = {
  meditation: { min: 10, max: 25 },
  quest_completion: { min: 15, max: 50 },
  forge: { min: 10, max: 30 },
  harvest: { min: 20, max: 40 },
  feed: { min: 15, max: 25 },
  login: { min: 15, max: 30 },
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function checkAndTriggerEncounter(type: EncounterType) {
  if (typeof window === 'undefined') return;

  try {
    const counterKey = `encounter_cnt_${type}`;
    const targetKey = `encounter_tgt_${type}`;

    let counter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    let target = parseInt(localStorage.getItem(targetKey) || '0', 10);

    const config = ENCOUNTER_CONFIGS[type];
    if (!config) return;

    if (target <= 0) {
      target = getRandomInt(config.min, config.max);
      localStorage.setItem(targetKey, target.toString());
    }

    counter += 1;
    localStorage.setItem(counterKey, counter.toString());

    if (counter >= target) {
      // Trigger event!
      const newTarget = getRandomInt(config.min, config.max);
      localStorage.setItem(counterKey, '0');
      localStorage.setItem(targetKey, newTarget.toString());

      window.dispatchEvent(
        new CustomEvent('trigger-random-encounter', {
          detail: { eventType: type },
        })
      );
    }
  } catch (err) {
    console.warn('[EncounterService] Trigger check failed:', err);
  }
}
