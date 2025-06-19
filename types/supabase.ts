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
      realm_grids: {
        Row: {
          id: string
          user_id: string
          grid: number[][]
          version: number
          is_public: boolean
          character_position: Json
          discovered_tiles: Json
          current_dungeon: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          grid: number[][]
          version?: number
          is_public?: boolean
          character_position?: Json
          discovered_tiles?: Json
          current_dungeon?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          grid?: number[][]
          version?: number
          is_public?: boolean
          character_position?: Json
          discovered_tiles?: Json
          current_dungeon?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      quest_completions: {
        Row: {
          id: string
          user_id: string
          category: string
          quest_name: string
          completed: boolean
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          quest_name: string
          completed?: boolean
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          quest_name?: string
          completed?: boolean
          date?: string
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
          stats: Json | null
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
          stats?: Json | null
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
          stats?: Json | null
          equipped?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      character_perks: {
        Row: {
          id: string
          user_id: string
          perk_name: string
          perk_type: string
          description: string | null
          effect_value: number | null
          expires_at: string | null
          is_active: boolean
          equipped: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          perk_name: string
          perk_type: string
          description?: string | null
          effect_value?: number | null
          expires_at?: string | null
          is_active?: boolean
          equipped?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          perk_name?: string
          perk_type?: string
          description?: string | null
          effect_value?: number | null
          expires_at?: string | null
          is_active?: boolean
          equipped?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      character_titles: {
        Row: {
          id: string
          user_id: string
          title_name: string
          description: string | null
          unlocked_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title_name: string
          description?: string | null
          unlocked_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title_name?: string
          description?: string | null
          unlocked_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      character_strengths: {
        Row: {
          id: string
          user_id: string
          strength_name: string
          strength_type: string
          value: number
          max_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strength_name: string
          strength_type: string
          value?: number
          max_value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strength_name?: string
          strength_type?: string
          value?: number
          max_value?: number
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
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          level: string
          message: string
          category?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: string
          message?: string
          category?: string | null
          metadata?: Json | null
          timestamp?: string
        }
      }
      kingdom_time_series: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Json
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data: Json
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: Json
          timestamp?: string
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
          connections: Json
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
          connections?: Json
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
          connections?: Json
          rotation?: number
          last_updated?: string
          version?: number
          created_at?: string
          updated_at?: string
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
      image_descriptions: {
        Row: {
          id: string
          user_id: string
          image_path: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_path: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_path?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_settings: {
        Row: {
          id: string
          user_id: string
          setting_key: string
          setting_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          setting_key: string
          setting_value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          setting_key?: string
          setting_value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      purchased_items: {
        Row: {
          id: string
          user_id: string
          item_id: string
          location_id: string
          purchased_at: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          location_id: string
          purchased_at?: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          location_id?: string
          purchased_at?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      notable_locations: {
        Row: {
          id: string
          user_id: string
          location_id: string
          location_name: string
          description: string | null
          image: string | null
          discovered_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          location_name: string
          description?: string | null
          image?: string | null
          discovered_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          location_name?: string
          description?: string | null
          image?: string | null
          discovered_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          milestone_id: string
          name: string
          description: string | null
          category: string
          target: number
          progress: number
          experience: number
          gold: number
          icon: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          milestone_id: string
          name: string
          description?: string | null
          category: string
          target?: number
          progress?: number
          experience?: number
          gold?: number
          icon?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          milestone_id?: string
          name?: string
          description?: string | null
          category?: string
          target?: number
          progress?: number
          experience?: number
          gold?: number
          icon?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checked_milestones: {
        Row: {
          id: string
          user_id: string
          milestone_id: string
          checked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          milestone_id: string
          checked_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          milestone_id?: string
          checked_at?: string
          created_at?: string
        }
      }
      checked_quests: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          checked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          checked_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quest_id?: string
          checked_at?: string
          created_at?: string
        }
      }
      tile_counts: {
        Row: {
          id: string
          user_id: string
          tile_type: string
          count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tile_type: string
          count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tile_type?: string
          count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tilemap: {
        Row: {
          id: string
          user_id: string
          map_data: Json
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          map_data: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          map_data?: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preference_key: string
          preference_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_key: string
          preference_value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_key?: string
          preference_value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      realm_visits: {
        Row: {
          id: string
          user_id: string
          visit_type: string
          visited_at: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visit_type: string
          visited_at?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visit_type?: string
          visited_at?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      dungeon_sessions: {
        Row: {
          id: string
          user_id: string
          dungeon_type: string
          position: Json
          started_at: string
          completed_at: string | null
          rewards: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dungeon_type: string
          position: Json
          started_at?: string
          completed_at?: string | null
          rewards?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dungeon_type?: string
          position?: Json
          started_at?: string
          completed_at?: string | null
          rewards?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      character_positions: {
        Row: {
          id: string
          user_id: string
          position_x: number
          position_y: number
          last_moved_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          position_x?: number
          position_y?: number
          last_moved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          position_x?: number
          position_y?: number
          last_moved_at?: string
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
          source: string | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          balance_after: number
          source?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          balance_after?: number
          source?: string | null
          description?: string | null
          metadata?: Json | null
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
          source: string | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          total_after: number
          source?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          total_after?: number
          source?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_key: string
          session_value: Json
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_key: string
          session_value: Json
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_key?: string
          session_value?: Json
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      realm_grid_data: {
        Row: {
          id: string
          user_id: string
          grid_data: Json
          version: number
          is_current: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          grid_data: Json
          version?: number
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          grid_data?: Json
          version?: number
          is_current?: boolean
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
  }
} 