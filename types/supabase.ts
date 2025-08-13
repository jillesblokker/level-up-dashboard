export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      character_stats: {
        Row: {
          id: string
          user_id: string
          gold: number
          experience: number
          level: number
          health: number
          max_health: number
          character_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gold?: number
          experience?: number
          level?: number
          health?: number
          max_health?: number
          character_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gold?: number
          experience?: number
          level?: number
          health?: number
          max_health?: number
          character_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          user_id: string
          item_id: string
          name: string
          description: string | null
          type: string
          category: string | null
          quantity: number
          emoji: string | null
          image: string | null
          stats: any
          equipped: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          name: string
          description?: string | null
          type: string
          category?: string | null
          quantity?: number
          emoji?: string | null
          image?: string | null
          stats?: any
          equipped?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          name?: string
          description?: string | null
          type?: string
          category?: string | null
          quantity?: number
          emoji?: string | null
          image?: string | null
          stats?: any
          equipped?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tile_inventory: {
        Row: {
          id: string
          user_id: string
          tile_id: string
          tile_type: string
          quantity: number
          cost: number
          connections: any
          rotation: number
          last_updated: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tile_id: string
          tile_type: string
          quantity?: number
          cost?: number
          connections?: any
          rotation?: number
          last_updated?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tile_id?: string
          tile_type?: string
          quantity?: number
          cost?: number
          connections?: any
          rotation?: number
          last_updated?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      kingdom_grid: {
        Row: {
          id: string
          user_id: string
          grid: any
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          grid?: any
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          grid?: any
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      property_timers: {
        Row: {
          id: string
          user_id: string
          tile_id: string
          x: number
          y: number
          tile_type: string
          end_time: string
          is_ready: boolean
          placed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tile_id: string
          x: number
          y: number
          tile_type: string
          end_time: string
          is_ready?: boolean
          placed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tile_id?: string
          x?: number
          y?: number
          tile_type?: string
          end_time?: string
          is_ready?: boolean
          placed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      gold_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          amount: number
          balance_after: number
          source: string
          description: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          balance_after: number
          source: string
          description?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          balance_after?: number
          source?: string
          description?: string | null
          metadata?: any
          created_at?: string
        }
      }
      experience_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          amount: number
          total_after: number
          source: string
          description: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          total_after: number
          source: string
          description?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          total_after?: number
          source?: string
          description?: string | null
          metadata?: any
          created_at?: string
        }
      }
      discoveries: {
        Row: {
          id: string
          user_id: string
          discovery_id: string
          discovery_name: string
          description: string | null
          discovered_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discovery_id: string
          discovery_name: string
          description?: string | null
          discovered_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discovery_id?: string
          discovery_name?: string
          description?: string | null
          discovered_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      quest_stats: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          quest_name: string
          category: string
          completed: boolean
          completed_at: string | null
          progress: number
          max_progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          quest_name: string
          category: string
          completed?: boolean
          completed_at?: string | null
          progress?: number
          max_progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quest_id?: string
          quest_name?: string
          category?: string
          completed?: boolean
          completed_at?: string | null
          progress?: number
          max_progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          achievement_name: string
          description: string | null
          unlocked_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          achievement_name: string
          description?: string | null
          unlocked_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          achievement_name?: string
          description?: string | null
          unlocked_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      app_logs: {
        Row: {
          id: string
          user_id: string
          level: string
          message: string
          category: string | null
          metadata: any
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          level: string
          message: string
          category?: string | null
          metadata?: any
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: string
          message?: string
          category?: string | null
          metadata?: any
          timestamp?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          setting_key: string
          setting_value: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          setting_key: string
          setting_value: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          setting_key?: string
          setting_value?: any
          created_at?: string
          updated_at?: string
        }
      }
      quest_completion: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          xp_earned: number
          gold_earned: number
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          xp_earned?: number
          gold_earned?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quest_id?: string
          xp_earned?: number
          gold_earned?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      challenge_completion: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          completed: boolean
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      milestone_completion: {
        Row: {
          id: string
          user_id: string
          milestone_id: string
          completed: boolean
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          milestone_id: string
          completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          milestone_id?: string
          completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          name: string
          description: string | null
          xp: number
          gold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          xp?: number
          gold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          xp?: number
          gold?: number
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          name: string
          description: string | null
          experience: number
          gold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          experience?: number
          gold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          experience?: number
          gold?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type SupabaseRealtimePayload<T = unknown> = {
  commit_timestamp: string
  errors: any[] | null
  schema: string
  table: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  eventType: string
} 