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
          created_at: string
          updated_at: string
          grid: number[][]
          user_id: string
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          grid: number[][]
          user_id: string
          version: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          grid?: number[][]
          user_id?: string
          version?: number
        }
      }
      // Add other tables as needed
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