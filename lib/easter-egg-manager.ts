import { supabase } from '@/lib/supabase/client';

export interface EasterEgg {
  id: string;
  userId: string;
  eggId: string;
  found: boolean;
  foundAt?: string;
  position: {
    x: number;
    y: number;
    page: string;
  };
}

export interface EasterEggProgress {
  totalEggs: number;
  foundEggs: number;
  remainingEggs: number;
}

// Easter egg positions across different pages
const EASTER_EGG_POSITIONS = [
  // Home/Dashboard
  { eggId: 'egg-1', page: '/', x: 85, y: 15 },
  { eggId: 'egg-2', page: '/', x: 92, y: 45 },
  
  // Quests page
  { eggId: 'egg-3', page: '/quests', x: 78, y: 25 },
  { eggId: 'egg-4', page: '/quests', x: 15, y: 65 },
  
  // Kingdom page
  { eggId: 'egg-5', page: '/kingdom', x: 45, y: 35 },
  { eggId: 'egg-6', page: '/kingdom', x: 85, y: 75 },
  
  // Market page
  { eggId: 'egg-7', page: '/market', x: 25, y: 55 },
  
  // Inventory page
  { eggId: 'egg-8', page: '/inventory', x: 65, y: 25 },
  
  // Profile page
  { eggId: 'egg-9', page: '/profile', x: 35, y: 45 },
  
  // Achievements page
  { eggId: 'egg-10', page: '/achievements', x: 75, y: 65 },
];

export class EasterEggManager {
  private static instance: EasterEggManager;
  private eggs: EasterEgg[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EasterEggManager {
    if (!EasterEggManager.instance) {
      EasterEggManager.instance = new EasterEggManager();
    }
    return EasterEggManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing eggs from Supabase
      const { data, error } = await supabase
        .from('easter_eggs')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('[EasterEggManager] Error loading eggs:', error);
        return;
      }

      this.eggs = data || [];
      
      // If no eggs exist, create them
      if (this.eggs.length === 0) {
        await this.createEggs(userId);
      }

      this.isInitialized = true;
      console.log('[EasterEggManager] Initialized with', this.eggs.length, 'eggs');
    } catch (error) {
      console.error('[EasterEggManager] Error initializing:', error);
    }
  }

  private async createEggs(userId: string): Promise<void> {
    const eggsToCreate = EASTER_EGG_POSITIONS.map(position => ({
      user_id: userId,
      egg_id: position.eggId,
      found: false,
      position: position,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('easter_eggs')
      .insert(eggsToCreate);

    if (error) {
      console.error('[EasterEggManager] Error creating eggs:', error);
      return;
    }

    this.eggs = eggsToCreate.map((egg, index) => ({
      id: `temp-${index}`,
      userId: egg.user_id,
      eggId: egg.egg_id,
      found: egg.found,
      position: egg.position,
    }));

    console.log('[EasterEggManager] Created', this.eggs.length, 'eggs');
  }

  async findEgg(userId: string, eggId: string): Promise<EasterEggProgress | null> {
    try {
      // Update the egg as found
      const { error } = await supabase
        .from('easter_eggs')
        .update({ 
          found: true, 
          found_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('egg_id', eggId);

      if (error) {
        console.error('[EasterEggManager] Error finding egg:', error);
        return null;
      }

      // Update local state
      const eggIndex = this.eggs.findIndex(egg => egg.eggId === eggId);
      if (eggIndex !== -1) {
        this.eggs[eggIndex].found = true;
        this.eggs[eggIndex].foundAt = new Date().toISOString();
      }

      // Return updated progress
      return this.getProgress();
    } catch (error) {
      console.error('[EasterEggManager] Error finding egg:', error);
      return null;
    }
  }

  getEggsForPage(page: string): EasterEgg[] {
    return this.eggs.filter(egg => egg.position.page === page && !egg.found);
  }

  getProgress(): EasterEggProgress {
    const totalEggs = this.eggs.length;
    const foundEggs = this.eggs.filter(egg => egg.found).length;
    const remainingEggs = totalEggs - foundEggs;

    return {
      totalEggs,
      foundEggs,
      remainingEggs,
    };
  }

  async resetEggs(userId: string): Promise<void> {
    try {
      // Delete all eggs for this user
      const { error } = await supabase
        .from('easter_eggs')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[EasterEggManager] Error resetting eggs:', error);
        return;
      }

      // Recreate eggs
      this.eggs = [];
      this.isInitialized = false;
      await this.initialize(userId);

      console.log('[EasterEggManager] Eggs reset successfully');
    } catch (error) {
      console.error('[EasterEggManager] Error resetting eggs:', error);
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