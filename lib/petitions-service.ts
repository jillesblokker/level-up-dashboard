import { getUserPreference, setUserPreference } from './user-preferences-manager';

export type HappinessTier = 'revolting' | 'restless' | 'loyal' | 'serving';

export interface CitizenHappinessState {
  score: number; // 0 to 100
  lastUpdated: string;
}

export interface Petition {
  id: string;
  title: string;
  requesterRole: string;
  requesterAvatar: string;
  description: string;
  optionA: {
    label: string;
    description: string;
    happinessImpact: number;
    goldImpact: number;
    requiredItem?: string;
  };
  optionB: {
    label: string;
    description: string;
    happinessImpact: number;
    goldImpact: number;
  };
  completed?: boolean;
}

export function getHappinessTier(score: number): { tier: HappinessTier; title: string; color: string; taxMultiplier: number; description: string } {
  if (score >= 85) {
    return {
      tier: 'serving',
      title: 'Serving High Crown',
      color: 'text-amber-400 border-amber-400 bg-amber-950/40',
      taxMultiplier: 1.30,
      description: 'Citizens are overjoyed! Property tax & harvest yield boosted by +30%!'
    };
  }
  if (score >= 50) {
    return {
      tier: 'loyal',
      title: 'Loyal Subjects',
      color: 'text-emerald-400 border-emerald-400 bg-emerald-950/40',
      taxMultiplier: 1.15,
      description: 'Kingdom is thriving peacefully. Harvest yields boosted by +15%.'
    };
  }
  if (score >= 25) {
    return {
      tier: 'restless',
      title: 'Restless Populace',
      color: 'text-orange-400 border-orange-400 bg-orange-950/40',
      taxMultiplier: 1.0,
      description: 'Citizens are dissatisfied. Standard property harvest yield.'
    };
  }
  return {
    tier: 'revolting',
    title: 'Revolting Peasants',
    color: 'text-red-500 border-red-500 bg-red-950/40',
    taxMultiplier: 0.50,
    description: '⚠️ Peasants are rioting! Property harvests and tax reduced by -50%!'
  };
}

export function getCitizenHappiness(): CitizenHappinessState {
  try {
    const local = localStorage.getItem('pref:citizen-happiness-state');
    if (local) return JSON.parse(local);
  } catch {}
  return { score: 75, lastUpdated: new Date().toISOString() };
}

export function updateCitizenHappiness(delta: number): CitizenHappinessState {
  const current = getCitizenHappiness();
  const newScore = Math.max(0, Math.min(100, current.score + delta));
  const updated = {
    score: newScore,
    lastUpdated: new Date().toISOString()
  };
  try { localStorage.setItem('pref:citizen-happiness-state', JSON.stringify(updated)); } catch {}
  setUserPreference('citizen-happiness-state', updated);
  return updated;
}

export function getActivePetitions(): Petition[] {
  try {
    const local = localStorage.getItem('pref:active-petitions-list');
    if (local) return JSON.parse(local);
  } catch {}

  const defaults: Petition[] = [
    {
      id: 'pet-1',
      title: "Farmer's Guild Shearing Dispute",
      requesterRole: 'Chief Shepherd Old Oak',
      requesterAvatar: '🌾',
      description: 'The sheep pastures need active care today! The farmers petition for royal attention.',
      optionA: {
        label: 'Grant Royal Pasture Feed',
        description: 'Spend 200 Gold on premium grain fodder for the herds.',
        happinessImpact: 15,
        goldImpact: -200
      },
      optionB: {
        label: 'Tax the Wool Surplus',
        description: 'Seize extra wool taxes for the kingdom treasury.',
        happinessImpact: -15,
        goldImpact: 350
      }
    },
    {
      id: 'pet-2',
      title: "Blacksmith's Armory Shortage",
      requesterRole: 'Master Smith Ironbeard',
      requesterAvatar: '🔨',
      description: 'The city watch has broken swords. Master Smith requests steel blades from the armory inventory.',
      optionA: {
        label: 'Supply Armory Swords',
        description: 'Provide weapons and forge supplies (+20 Loyalty, +100 XP).',
        happinessImpact: 20,
        goldImpact: -100
      },
      optionB: {
        label: 'Order Guard Training Shortage',
        description: 'Tell guards to fight with wooden bludgeons.',
        happinessImpact: -20,
        goldImpact: 150
      }
    },
    {
      id: 'pet-3',
      title: "Merchant Caravan Tariff Decree",
      requesterRole: 'High Trader Valerius',
      requesterAvatar: '⚖️',
      description: 'Caravans seek reduced road tolls through the mountain pass.',
      optionA: {
        label: 'Lower Caravan Tolls',
        description: 'Delight merchants and citizens with cheaper goods (+15 Loyalty).',
        happinessImpact: 15,
        goldImpact: -150
      },
      optionB: {
        label: 'Raise High Crown Tariff',
        description: 'Collect heavy road tolls for the treasury (+400 Gold).',
        happinessImpact: -15,
        goldImpact: 400
      }
    }
  ];

  setUserPreference('active-petitions-list', defaults);
  return defaults;
}

export function resolvePetition(petitionId: string, choice: 'A' | 'B'): { happiness: CitizenHappinessState; goldChange: number } {
  const petitions = getActivePetitions();
  const target = petitions.find(p => p.id === petitionId);
  if (!target) return { happiness: getCitizenHappiness(), goldChange: 0 };

  const opt = choice === 'A' ? target.optionA : target.optionB;
  const newHappiness = updateCitizenHappiness(opt.happinessImpact);

  const updatedPetitions = petitions.map(p => p.id === petitionId ? { ...p, completed: true } : p);
  setUserPreference('active-petitions-list', updatedPetitions);

  return { happiness: newHappiness, goldChange: opt.goldImpact };
}
