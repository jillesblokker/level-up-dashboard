export interface SeasonalItem {
  id: number;
  user_id: string;
  item_id: number;
  found: boolean;
  found_at?: string;
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
    image: "/images/firework.webp",
    startDate: { month: 1, day: 1 },
    endDate: { month: 1, day: 31 },
    goldReward: 100,
    description: "Find hidden fireworks around the app!"
  },
  valentine: {
    name: "Valentine Heart Hunt",
    image: "/images/heart.webp",
    startDate: { month: 2, day: 1 },
    endDate: { month: 2, day: 28 },
    goldReward: 100,
    description: "Find hidden hearts around the app!"
  },
  spring: {
    name: "Spring Clover Hunt",
    image: "/images/clover.webp",
    startDate: { month: 3, day: 1 },
    endDate: { month: 3, day: 19 },
    goldReward: 100,
    description: "Find hidden clovers around the app!"
  },
  easter: {
    name: "Easter Egg Hunt",
    image: "/images/egg.webp",
    startDate: { month: 3, day: 20 },
    endDate: { month: 4, day: 30 },
    goldReward: 100,
    description: "Find hidden eggs around the app!"
  },
  shield_joust: {
    name: "Shield-Maiden's Hunt",
    image: "/images/shield.webp",
    startDate: { month: 5, day: 1 },
    endDate: { month: 5, day: 31 },
    goldReward: 100,
    description: "Find hidden shields around the app!"
  },
  solstice: {
    name: "Solstice Sun Hunt",
    image: "/images/sun.webp",
    startDate: { month: 6, day: 1 },
    endDate: { month: 6, day: 30 },
    goldReward: 100,
    description: "Find hidden sun crests around the app!"
  },
  firefly: {
    name: "Firefly Lantern Hunt",
    image: "/images/firefly.webp",
    startDate: { month: 7, day: 1 },
    endDate: { month: 7, day: 31 },
    goldReward: 100,
    description: "Find hidden fireflies around the app!"
  },
  forge_fire: {
    name: "Forge Ingot Hunt",
    image: "/images/ingot.webp",
    startDate: { month: 8, day: 1 },
    endDate: { month: 8, day: 31 },
    goldReward: 100,
    description: "Find hidden iron ingots around the app!"
  },
  harvest: {
    name: "Harvest Wheat Hunt",
    image: "/images/wheat.webp",
    startDate: { month: 9, day: 1 },
    endDate: { month: 9, day: 30 },
    goldReward: 100,
    description: "Find hidden wheat sheaves around the app!"
  },
  halloween: {
    name: "Halloween Pumpkin Hunt",
    image: "/images/pumpkin.webp",
    startDate: { month: 10, day: 1 },
    endDate: { month: 10, day: 31 },
    goldReward: 120,
    description: "Find hidden pumpkins around the app!"
  },
  remembrance: {
    name: "Heritage Scroll Hunt",
    image: "/images/scroll.webp",
    startDate: { month: 11, day: 1 },
    endDate: { month: 11, day: 30 },
    goldReward: 100,
    description: "Find hidden scrolls around the app!"
  },
  christmas: {
    name: "Christmas Present Hunt",
    image: "/images/present.webp",
    startDate: { month: 12, day: 1 },
    endDate: { month: 12, day: 31 },
    goldReward: 150,
    description: "Find hidden presents around the app!"
  }
};

// Predefined item positions across different pages
export const SEASONAL_ITEM_POSITIONS = [
  { itemId: 1, page: '/', x: 100, y: 200 },
  { itemId: 2, page: '/', x: 300, y: 150 },
  { itemId: 3, page: '/quests', x: 200, y: 100 },
  { itemId: 4, page: '/quests', x: 400, y: 250 },
  { itemId: 5, page: '/kingdom', x: 150, y: 300 },
  { itemId: 6, page: '/kingdom', x: 350, y: 200 },
  { itemId: 7, page: '/realm', x: 250, y: 150 },
  { itemId: 8, page: '/realm', x: 450, y: 100 },
  { itemId: 9, page: '/inventory', x: 200, y: 200 },
  { itemId: 10, page: '/inventory', x: 400, y: 300 }
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

  getCurrentEvent(): string | null {
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

    return null;
  }

  getCurrentEventConfig(): SeasonalEvent | null {
    const eventKey = this.getCurrentEvent();
    return eventKey ? SEASONAL_EVENTS[eventKey] || null : null;
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
      const response = await fetch('/api/seasonal-hunt');
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
      const response = await fetch('/api/seasonal-hunt', {
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
      const response = await fetch('/api/seasonal-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find', itemId })
      });

      if (!response.ok) {
        throw new Error(`Failed to find item: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state
      const itemIndex = this.items.findIndex(item => item.item_id === itemId);
      if (itemIndex !== -1 && this.items[itemIndex]) {
        this.items[itemIndex] = data.item;
      }

      return data.item;
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
      const response = await fetch('/api/seasonal-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      if (!response.ok) {
        throw new Error(`Failed to reset items: ${response.statusText}`);
      }

      // Re-initialize
      this.items = [];
      this.initialized = false;
      await this.initialize(userId);
    } catch (error) {
      throw error;
    }
  }

  isActiveEvent(): boolean {
    return this.getCurrentEvent() !== null;
  }
}

export const SeasonalHuntManager = SeasonalHuntManagerClass.getInstance(); 