export interface Battle {
  id: string;
  enemyName: string;
  enemyLevel: number;
  enemyHealth: number;
  playerHealth: number;
  isActive: boolean;
  outcome?: 'win' | 'lose' | 'draw';
  rewards?: {
    gold?: number;
    experience?: number;
    items?: string[];
  };
}

export interface BattleState {
  currentBattle: Battle | null;
  showBattleModal: boolean;
  battlePosition: { x: number; y: number } | null;
}

export interface BattleAction {
  type: 'attack' | 'defend' | 'flee';
  damage?: number;
  healing?: number;
}

export interface BattleOutcome {
  success: boolean;
  message: string;
  rewards?: {
    gold?: number;
    experience?: number;
    items?: string[];
  };
} 