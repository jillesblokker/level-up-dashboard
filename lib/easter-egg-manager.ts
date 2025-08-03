export interface EasterEgg {
  id: number;
  user_id: string;
  egg_id: number;
  found: boolean;
  found_at?: string;
  position: { x: number; y: number };
  created_at: string;
  updated_at: string;
}

export interface EasterEggProgress {
  total: number;
  found: number;
  remaining: number;
}

// Predefined egg positions across different pages
export const EASTER_EGG_POSITIONS = [
  { eggId: 1, page: '/', x: 100, y: 200 },
  { eggId: 2, page: '/', x: 300, y: 150 },
  { eggId: 3, page: '/quests', x: 200, y: 100 },
  { eggId: 4, page: '/quests', x: 400, y: 250 },
  { eggId: 5, page: '/kingdom', x: 150, y: 300 },
  { eggId: 6, page: '/kingdom', x: 350, y: 200 },
  { eggId: 7, page: '/realm', x: 250, y: 150 },
  { eggId: 8, page: '/realm', x: 450, y: 100 },
  { eggId: 9, page: '/inventory', x: 200, y: 200 },
  { eggId: 10, page: '/inventory', x: 400, y: 300 }
];

class EasterEggManager {
  private static instance: EasterEggManager;
  private eggs: EasterEgg[] = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): EasterEggManager {
    if (!EasterEggManager.instance) {
      EasterEggManager.instance = new EasterEggManager();
    }
    return EasterEggManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing eggs from API
      const response = await fetch('/api/easter-eggs');
      if (!response.ok) {
        throw new Error(`Failed to load eggs: ${response.statusText}`);
      }

      const data = await response.json();
      this.eggs = data.eggs || [];

      // If no eggs exist, create them
      if (this.eggs.length === 0) {
        await this.createEggs(userId);
      }

      this.initialized = true;
      console.log('[EasterEggManager] Initialized with', this.eggs.length, 'eggs');
    } catch (error) {
      console.error('[EasterEggManager] Error initializing:', error);
      throw error;
    }
  }

  private async createEggs(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/easter-eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });

      if (!response.ok) {
        throw new Error(`Failed to create eggs: ${response.statusText}`);
      }

      const data = await response.json();
      this.eggs = data.eggs || [];
      console.log('[EasterEggManager] Created', this.eggs.length, 'eggs');
    } catch (error) {
      console.error('[EasterEggManager] Error creating eggs:', error);
      throw error;
    }
  }

  async findEgg(userId: string, eggId: number): Promise<EasterEgg | null> {
    try {
      const response = await fetch('/api/easter-eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find', eggId })
      });

      if (!response.ok) {
        throw new Error(`Failed to find egg: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state
      const eggIndex = this.eggs.findIndex(egg => egg.egg_id === eggId);
      if (eggIndex !== -1 && this.eggs[eggIndex]) {
        this.eggs[eggIndex] = data.egg;
      }

      return data.egg;
    } catch (error) {
      console.error('[EasterEggManager] Error finding egg:', error);
      return null;
    }
  }

  getEggsForPage(page: string): EasterEgg[] {
    return this.eggs.filter(egg => {
      const position = EASTER_EGG_POSITIONS.find(pos => pos.eggId === egg.egg_id);
      return position && position.page === page && !egg.found;
    });
  }

  getProgress(): EasterEggProgress {
    const total = this.eggs.length;
    const found = this.eggs.filter(egg => egg.found).length;
    const remaining = total - found;

    return { total, found, remaining };
  }

  async resetEggs(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/easter-eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      if (!response.ok) {
        throw new Error(`Failed to reset eggs: ${response.statusText}`);
      }

      // Re-initialize
      this.eggs = [];
      this.initialized = false;
      await this.initialize(userId);
      
      console.log('[EasterEggManager] Eggs reset successfully');
    } catch (error) {
      console.error('[EasterEggManager] Error resetting eggs:', error);
      throw error;
    }
  }

  isEasterPeriod(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const day = now.getDate();
    
    // Easter period: March 20 - April 30
    return (month === 3 && day >= 20) || (month === 4 && day <= 30);
  }
}

export const EasterEggManager = EasterEggManager.getInstance(); 