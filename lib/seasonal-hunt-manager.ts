import { fetchWithAuth } from './fetchWithAuth';

export interface SeasonalItem {
  id: number;
  user_id: string;
  item_id: number;
  found: boolean;
  found_at?: string | null;
  position: { x: number; y: number };
  created_at: string;
  updated_at: string;
}

export interface SeasonalProgress {
  total: number;
  found: number;
  remaining: number;
}

export interface SeasonalEvent {
  name: string;
  image: string;
  startDate: { month: number; day: number };
  endDate: { month: number; day: number };
  goldReward: number;
  description: string;
}

// Seasonal events configuration
export const SEASONAL_EVENTS: Record<string, SeasonalEvent> = {
  newyear: {
    name: "New Year's Hunt",
    image: "/images/seasonal-hunt/firework.webp",
    startDate: { month: 1, day: 1 },
    endDate: { month: 1, day: 31 },
    goldReward: 100,
    description: "Find hidden fireworks around the app!"
  },
  valentine: {
    name: "Valentine Heart Hunt",
    image: "/images/seasonal-hunt/heart.webp",
    startDate: { month: 2, day: 1 },
    endDate: { month: 2, day: 28 },
    goldReward: 100,
    description: "Find hidden hearts around the app!"
  },
  spring: {
    name: "Spring Clover Hunt",
    image: "/images/seasonal-hunt/clover.webp",
    startDate: { month: 3, day: 1 },
    endDate: { month: 3, day: 19 },
    goldReward: 100,
    description: "Find hidden clovers around the app!"
  },
  easter: {
    name: "Easter Egg Hunt",
    image: "/images/seasonal-hunt/egg.webp",
    startDate: { month: 3, day: 20 },
    endDate: { month: 4, day: 30 },
    goldReward: 100,
    description: "Find hidden eggs around the app!"
  },
  shield_joust: {
    name: "Shield-Maiden's Hunt",
    image: "/images/seasonal-hunt/shield.webp",
    startDate: { month: 5, day: 1 },
    endDate: { month: 5, day: 31 },
    goldReward: 100,
    description: "Find hidden shields around the app!"
  },
  solstice: {
    name: "Solstice Sun Hunt",
    image: "/images/seasonal-hunt/sun.webp",
    startDate: { month: 6, day: 1 },
    endDate: { month: 6, day: 30 },
    goldReward: 100,
    description: "Find hidden sun crests around the app!"
  },
  firefly: {
    name: "Firefly Lantern Hunt",
    image: "/images/seasonal-hunt/firefly.webp",
    startDate: { month: 7, day: 1 },
    endDate: { month: 7, day: 31 },
    goldReward: 100,
    description: "Find hidden fireflies around the app!"
  },
  forge_fire: {
    name: "Forge Ingot Hunt",
    image: "/images/seasonal-hunt/ingot.webp",
    startDate: { month: 8, day: 1 },
    endDate: { month: 8, day: 31 },
    goldReward: 100,
    description: "Find hidden iron ingots around the app!"
  },
  harvest: {
    name: "Harvest Wheat Hunt",
    image: "/images/seasonal-hunt/wheat.webp",
    startDate: { month: 9, day: 1 },
    endDate: { month: 9, day: 30 },
    goldReward: 100,
    description: "Find hidden wheat sheaves around the app!"
  },
  halloween: {
    name: "Halloween Pumpkin Hunt",
    image: "/images/seasonal-hunt/pumpkin.webp",
    startDate: { month: 10, day: 1 },
    endDate: { month: 10, day: 31 },
    goldReward: 120,
    description: "Find hidden pumpkins around the app!"
  },
  remembrance: {
    name: "Heritage Scroll Hunt",
    image: "/images/seasonal-hunt/scroll.webp",
    startDate: { month: 11, day: 1 },
    endDate: { month: 11, day: 30 },
    goldReward: 100,
    description: "Find hidden scrolls around the app!"
  },
  christmas: {
    name: "Christmas Present Hunt",
    image: "/images/seasonal-hunt/present.webp",
    startDate: { month: 12, day: 1 },
    endDate: { month: 12, day: 31 },
    goldReward: 150,
    description: "Find hidden presents around the app!"
  }
};

export interface SeasonalHidingSpot {
  itemId: number;
  page: string;
  pageName: string;
  locationName: string;
  clue: string;
  style: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

// Predefined responsive hiding spots across core kingdom pages
export const SEASONAL_ITEM_POSITIONS: SeasonalHidingSpot[] = [
  { 
    itemId: 1, 
    page: '/daily-hub', 
    pageName: 'Daily Hub',
    locationName: 'Morning Focus Header',
    clue: 'Hiding near the Morning Focus 5/10 habit target banner...', 
    style: { top: '140px', right: '16px' }
  },
  { 
    itemId: 2, 
    page: '/quests', 
    pageName: 'Daily Quests',
    locationName: 'Habit Routine Checklist',
    clue: 'Peeking out behind the daily habit routine checklist...', 
    style: { bottom: '110px', left: '16px' }
  },
  { 
    itemId: 3, 
    page: '/kingdom', 
    pageName: 'Kingdom Board',
    locationName: 'Tax Harvest Cover',
    clue: 'Nestled beside the Royal Tax Collection cover header...', 
    style: { top: '85px', right: '24px' }
  },
  { 
    itemId: 4, 
    page: '/realm', 
    pageName: 'Sandbox Realm',
    locationName: '2D Grid Toolbar',
    clue: 'Tucked behind the 2D Sandbox Grid tile toolbar...', 
    style: { bottom: '90px', right: '20px' }
  },
  { 
    itemId: 5, 
    page: '/dungeon', 
    pageName: 'Dungeon Keep',
    locationName: 'Keep Boss Gateway',
    clue: 'Lurking in the shadows of the Dungeon Keep Boss chamber entrance...', 
    style: { top: '120px', left: '20px' }
  },
  { 
    itemId: 6, 
    page: '/airship-harbor', 
    pageName: 'Airship Harbor',
    locationName: 'Ether Engine Harbor',
    clue: 'Floating secretly near the Airship Harbor Ether Fuel engine...', 
    style: { bottom: '100px', left: '24px' }
  },
  { 
    itemId: 7, 
    page: '/market', 
    pageName: 'Bazaar & Market',
    locationName: 'Apotheca Glasshouse Shortcut',
    clue: 'Hiding near the Apotheca Potion Brewing glasshouse shortcut...', 
    style: { top: '160px', right: '18px' }
  },
  { 
    itemId: 8, 
    page: '/chronicle', 
    pageName: 'Chronicle Journal',
    locationName: 'Hall of Champions',
    clue: 'Hidden among the season champions in the Chronicle archives...', 
    style: { bottom: '120px', right: '18px' }
  },
  { 
    itemId: 9, 
    page: '/character', 
    pageName: 'Hero Vault',
    locationName: 'RPG Equipment Paperdoll',
    clue: 'Tucked beside the Hero Equipment Vault Mount paperdoll slot...', 
    style: { top: '210px', left: '16px' }
  },
  { 
    itemId: 10, 
    page: '/settings', 
    pageName: 'Settings Portal',
    locationName: 'Medieval RPG Theme Banner',
    clue: 'Peeking out behind the Medieval RPG filigree theme banner...', 
    style: { bottom: '130px', left: '20px' }
  }
];

class SeasonalHuntManagerClass {
  private static instance: SeasonalHuntManagerClass;
  private items: SeasonalItem[] = [];
  private initialized = false;
  private currentEvent: string | null = null;

  private constructor() {}

  static getInstance(): SeasonalHuntManagerClass {
    if (!SeasonalHuntManagerClass.instance) {
      SeasonalHuntManagerClass.instance = new SeasonalHuntManagerClass();
    }
    return SeasonalHuntManagerClass.instance;
  }

  getCurrentEvent(): string {
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem("active-seasonal-event-override");
      if (override && override !== 'auto' && SEASONAL_EVENTS[override]) {
        return override;
      }
    }

    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const day = now.getDate();

    for (const [eventKey, event] of Object.entries(SEASONAL_EVENTS)) {
      const start = event.startDate;
      const end = event.endDate;

      if (start.month === end.month) {
        // Same month (e.g., Christmas)
        if (month === start.month && day >= start.day && day <= end.day) {
          return eventKey;
        }
      } else {
        // Different months (e.g., Easter, Halloween)
        if ((month === start.month && day >= start.day) || 
            (month === end.month && day <= end.day) ||
            (month > start.month && month < end.month)) {
          return eventKey;
        }
      }
    }

    // Default to current month's event mapping if outside specific holiday dates
    const monthToEventKey: Record<number, string> = {
      1: 'newyear',
      2: 'valentine',
      3: 'spring',
      4: 'easter',
      5: 'shield_joust',
      6: 'solstice',
      7: 'firefly',
      8: 'forge_fire',
      9: 'harvest',
      10: 'halloween',
      11: 'remembrance',
      12: 'christmas'
    };
    return monthToEventKey[month] || 'forge_fire';
  }

  getCurrentEventConfig(): SeasonalEvent {
    const eventKey = this.getCurrentEvent();
    const fallback = Object.values(SEASONAL_EVENTS)[0] as SeasonalEvent;
    return (SEASONAL_EVENTS[eventKey] || fallback) as SeasonalEvent;
  }

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      const currentEvent = this.getCurrentEvent();
      if (!currentEvent) {
        this.initialized = true;
        return; // No active event
      }

      // Load existing items from API
      const response = await fetchWithAuth('/api/seasonal-hunt');
      if (!response.ok) {
        throw new Error(`Failed to load items: ${response.statusText}`);
      }

      const data = await response.json();
      this.items = data.items || [];

      // If no items exist, create them
      if (this.items.length === 0) {
        await this.createItems(userId, currentEvent);
      }

      this.currentEvent = currentEvent;
      this.initialized = true;
    } catch (error) {
      throw error;
    }
  }

  private async createItems(userId: string, eventKey: string): Promise<void> {
    try {
      const response = await fetchWithAuth('/api/seasonal-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize', eventKey })
      });

      if (!response.ok) {
        throw new Error(`Failed to create items: ${response.statusText}`);
      }

      const data = await response.json();
      this.items = data.items || [];
    } catch (error) {
      throw error;
    }
  }

  async findItem(userId: string, itemId: number): Promise<SeasonalItem | null> {
    try {
      const response = await fetchWithAuth('/api/seasonal-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find', itemId })
      });

      if (!response.ok) {
        throw new Error(`Failed to find item: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedItem = data.item || (Array.isArray(data.items) ? data.items.find((i: any) => i.item_id === itemId) : data.items);
      
      // Update local state
      const itemIndex = this.items.findIndex(item => item.item_id === itemId);
      if (itemIndex !== -1 && this.items[itemIndex]) {
        this.items[itemIndex] = updatedItem || { ...this.items[itemIndex]!, found: true, found_at: new Date().toISOString() };
      } else if (updatedItem) {
        this.items.push(updatedItem);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'));
      }

      return updatedItem || this.items[itemIndex] || null;
    } catch (error) {
      return null;
    }
  }

  getItemsForPage(page: string): SeasonalItem[] {
    return this.items.filter(item => {
      const position = SEASONAL_ITEM_POSITIONS.find(pos => pos.itemId === item.item_id);
      return position && position.page === page && !item.found;
    });
  }

  getProgress(): SeasonalProgress {
    const total = this.items.length;
    const found = this.items.filter(item => item.found).length;
    const remaining = total - found;

    return { total, found, remaining };
  }

  async resetItems(userId: string): Promise<void> {
    try {
      const response = await fetchWithAuth('/api/seasonal-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      if (!response.ok) {
        throw new Error(`Failed to reset items: ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        this.items = data.items;
      } else if (Array.isArray(data.item) && data.item.length > 0) {
        this.items = data.item;
      } else {
        this.items = this.items.map(item => {
          const { found_at, ...rest } = item;
          return { ...rest, found: false };
        });
      }
      
      this.initialized = true;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'));
      }
    } catch (error) {
      // Fallback local reset
      this.items = this.items.map(item => {
        const { found_at, ...rest } = item;
        return { ...rest, found: false };
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'));
      }
      throw error;
    }
  }

  isActiveEvent(): boolean {
    return this.getCurrentEvent() !== null;
  }
}

export const SeasonalHuntManager = SeasonalHuntManagerClass.getInstance(); 