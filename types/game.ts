export interface Position {
  x: number;
  y: number;
}

export type GameMode = 'build' | 'move';

export type GameState = {
  grid?: Tile[][]
  inventory: Record<string, number>
  selectedTile: string | null
  character?: Character
  quests?: Quest[]
  [key: string]: unknown
}

export type Tile = {
  type: string
  x: number
  y: number
  properties?: Record<string, unknown>
}

export type InventoryItem = {
  id: string
  name: string
  type: string
  quantity: number
  properties?: Record<string, unknown>
}

export type Character = {
  id: string
  name: string
  level: number
  experience: number
  position: {
    x: number
    y: number
  }
  stats: {
    health: number
    mana: number
    stamina: number
    [key: string]: number
  }
}

export type Quest = {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  progress: number
  requirements: Record<string, number>
  rewards: Record<string, number>
}

export type BaseEvent = {
  id: string
  type: string
  trigger: {
    type: string
    conditions: Record<string, unknown>
  }
  actions: Array<{
    type: string
    parameters: Record<string, unknown>
  }>
}

export type GameEvent = BaseEvent & {
  timestamp: string
  status: 'pending' | 'triggered' | 'completed'
  metadata?: Record<string, unknown>
}

export type QuestStats = {
  questId: string
  userId: string
  progress: number
  status: 'active' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  metadata?: Record<string, unknown>
}

export type ActivityLog = {
  id: string
  userId: string
  type: string
  timestamp: string
  details: Record<string, unknown>
}

export type Achievement = {
  id: string
  userId: string
  type: string
  unlockedAt: string
  progress: number
  metadata?: Record<string, unknown>
}

export type Stats = {
  id: string
  userId: string
  type: string
  value: number
  timestamp: string
  metadata?: Record<string, unknown>
}

export type CategoryData = {
  achievements: Achievement[]
  activityLog: ActivityLog[]
  stats: Stats[]
}

export type SupabaseError = {
  code: string
  message: string
  details?: string
  hint?: string
}

export type SupabaseRealtimePayload<T = unknown> = {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  errors: null | SupabaseError[]
} 