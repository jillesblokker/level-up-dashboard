export interface CharacterStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  gold: number;
  titles: {
    equipped: string;
    unlocked: number;
    total: number;
  };
  perks: {
    active: number;
    total: number;
  };
}

export const initialCharacterStats: CharacterStats = {
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  gold: 0,
  titles: {
    equipped: "",
    unlocked: 0,
    total: 0
  },
  perks: {
    active: 0,
    total: 0
  }
}; 