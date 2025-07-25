import { EventEmitter } from 'events';
import { GameState } from '../types/game';

// Event Types
export type EventType = 
  | 'mystery' 
  | 'quest' 
  | 'achievement';

// Base Event Interface
export interface BaseEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: Date;
  location?: {
    x: number;
    y: number;
  };
}

// Achievement Event
export interface AchievementEvent extends BaseEvent {
  type: 'achievement';
  category: 'exploration' | 'combat' | 'collection' | 'social' | 'crafting';
  points: number;
  requirements: {
    type: string;
    count: number;
  }[];
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
    title?: string;
  };
}

// Event Manager Class
export class GameEventsManager extends EventEmitter {
  private static instance: GameEventsManager;
  private events: Map<string, BaseEvent>;
  private activeEvents: Set<string>;

  private constructor() {
    super();
    this.events = new Map();
    this.activeEvents = new Set();
    this.initializeEventListeners();
  }

  public static getInstance(): GameEventsManager {
    if (!GameEventsManager.instance) {
      GameEventsManager.instance = new GameEventsManager();
    }
    return GameEventsManager.instance;
  }

  private initializeEventListeners() {
    // Listen for game state changes
    window.addEventListener('gameStateChange', ((event: CustomEvent<GameState>) => {
      this.checkEventTriggers(event.detail);
    }) as EventListener);
  }

  public addEvent(event: BaseEvent) {
    this.events.set(event.id, event);
    this.emit('eventAdded', event);
  }

  public removeEvent(eventId: string) {
    this.events.delete(eventId);
    this.activeEvents.delete(eventId);
    this.emit('eventRemoved', eventId);
  }

  public getEvent(eventId: string): BaseEvent | undefined {
    return this.events.get(eventId);
  }

  public getActiveEvents(): BaseEvent[] {
    return Array.from(this.activeEvents)
      .map(id => this.events.get(id))
      .filter((event): event is BaseEvent => event !== undefined);
  }

  public triggerEvent(eventId: string) {
    const event = this.events.get(eventId);
    if (event) {
      this.activeEvents.add(eventId);
      this.emit('eventTriggered', event);
    }
  }

  public completeEvent(eventId: string) {
    const event = this.events.get(eventId);
    if (event) {
      this.activeEvents.delete(eventId);
      this.emit('eventCompleted', event);
    }
  }

  private checkEventTriggers(gameState: GameState) {
    // Check if any events should be triggered based on game state
    this.events.forEach((event, id) => {
      if (!this.activeEvents.has(id)) {
        // Add your trigger conditions here
        if (this.shouldTriggerEvent(event, gameState)) {
          this.triggerEvent(id);
        }
      }
    });
  }

  private shouldTriggerEvent(event: BaseEvent, gameState: GameState): boolean {
    // Implement your trigger logic here
    // This is a placeholder implementation
    return false;
  }
}

// Export singleton instance
export const gameEvents = GameEventsManager.getInstance(); 