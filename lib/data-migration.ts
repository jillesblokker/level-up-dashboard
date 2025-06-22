'use client'

export interface MigrationStatus {
  isRunning: boolean
  progress: number
  total: number
  current: string
  error?: string
}

export class DataMigration {
  private static instance: DataMigration
  private status: MigrationStatus = {
    isRunning: false,
    progress: 0,
    total: 0,
    current: ''
  }

  static getInstance(): DataMigration {
    if (!DataMigration.instance) {
      DataMigration.instance = new DataMigration()
    }
    return DataMigration.instance
  }

  getStatus(): MigrationStatus {
    return { ...this.status }
  }

  async migrateAllData(): Promise<void> {
    if (this.status.isRunning) {
      throw new Error('Migration already in progress')
    }

    this.status = {
      isRunning: true,
      progress: 0,
      total: 5,
      current: 'Starting migration...'
    }

    try {
      // Step 1: Character Stats
      this.status.current = 'Migrating character stats...'
      this.status.progress = 1
      await this.migrateCharacterStats()

      // Step 2: Inventory
      this.status.current = 'Migrating inventory...'
      this.status.progress = 2
      await this.migrateInventory()

      // Step 3: Quest Data
      this.status.current = 'Migrating quest data...'
      this.status.progress = 3
      await this.migrateQuestData()

      // Step 4: Daily Quests
      this.status.current = 'Migrating daily quests...'
      this.status.progress = 4
      await this.migrateDailyQuests()

      // Step 5: Game Settings
      this.status.current = 'Migrating game settings...'
      this.status.progress = 5
      await this.migrateGameSettings()

      this.status.current = 'Migration completed successfully!'
      console.log('Data migration completed successfully')
    } catch (error) {
      this.status.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('Data migration failed:', error)
      throw error
    } finally {
      this.status.isRunning = false
    }
  }

  private async migrateCharacterStats(): Promise<void> {
    const stats = localStorage.getItem('character-stats')
    if (stats) {
      try {
        const parsedStats = JSON.parse(stats)
        // Migration is now handled by individual components using the new API endpoints
        console.log('Character stats migration handled by components')
      } catch (error) {
        console.warn('Failed to migrate character stats:', error)
      }
    }
  }

  private async migrateInventory(): Promise<void> {
    const inventory = localStorage.getItem('character-inventory')
    const kingdomInventory = localStorage.getItem('kingdom-inventory')
    const equippedItems = localStorage.getItem('kingdom-equipped-items')

    if (inventory || kingdomInventory || equippedItems) {
      try {
        // Migration is now handled by individual components using the new API endpoints
        console.log('Inventory migration handled by components')
      } catch (error) {
        console.warn('Failed to migrate inventory:', error)
      }
    }
  }

  private async migrateQuestData(): Promise<void> {
    const checkedQuests = localStorage.getItem('checked-quests')
    const questStats = localStorage.getItem('quest-stats')

    if (checkedQuests || questStats) {
      try {
        // Migration is now handled by individual components using the new API endpoints
        console.log('Quest data migration handled by components')
      } catch (error) {
        console.warn('Failed to migrate quest data:', error)
      }
    }
  }

  private async migrateDailyQuests(): Promise<void> {
    const dailyQuests = localStorage.getItem('daily-quests')
    const lastReset = localStorage.getItem('last-quest-reset')

    if (dailyQuests || lastReset) {
      try {
        // Migration is now handled by individual components using the new API endpoints
        console.log('Daily quests migration handled by components')
      } catch (error) {
        console.warn('Failed to migrate daily quests:', error)
      }
    }
  }

  private async migrateGameSettings(): Promise<void> {
    // Migrate various game settings
    const settings = [
      'levelup-gold-balance',
      'levelup-experience-balance',
      'levelup-level',
      'levelup-experience-to-next-level',
      'levelup-titles',
      'levelup-perks',
      'levelup-strengths',
      'levelup-achievements',
      'levelup-notifications',
      'levelup-app-logs',
      'levelup-kingdom-time-series',
      'levelup-tile-inventory',
      'levelup-discoveries',
      'levelup-quest-stats',
      'levelup-image-descriptions',
      'levelup-game-settings',
      'levelup-purchased-items',
      'levelup-notable-locations',
      'levelup-milestones',
      'levelup-checked-milestones',
      'levelup-checked-quests',
      'levelup-tile-counts',
      'levelup-tilemap',
      'levelup-user-preferences',
      'levelup-realm-visits',
      'levelup-dungeon-sessions',
      'levelup-character-positions',
      'levelup-gold-transactions',
      'levelup-experience-transactions',
      'levelup-user-sessions',
      'levelup-realm-grid-data'
    ]

    const hasSettings = settings.some(key => localStorage.getItem(key) !== null)
    
    if (hasSettings) {
      try {
        // Migration is now handled by individual components using the new API endpoints
        console.log('Game settings migration handled by components')
      } catch (error) {
        console.warn('Failed to migrate game settings:', error)
      }
    }
  }

  // Utility to check if migration is needed
  static needsMigration(): boolean {
    if (typeof window === 'undefined') return false
    
    const keys = [
      'character-stats',
      'character-inventory',
      'kingdom-inventory',
      'checked-quests',
      'daily-quests',
      'levelup-gold-balance',
      'levelup-experience-balance'
    ]
    
    return keys.some(key => localStorage.getItem(key) !== null)
  }

  // Utility to get migration summary
  static getMigrationSummary(): { totalItems: number; items: string[] } {
    if (typeof window === 'undefined') return { totalItems: 0, items: [] }
    
    const keys = [
      'character-stats',
      'character-inventory',
      'kingdom-inventory',
      'checked-quests',
      'daily-quests',
      'levelup-gold-balance',
      'levelup-experience-balance'
    ]
    
    const items = keys.filter(key => localStorage.getItem(key) !== null)
    
    return {
      totalItems: items.length,
      items
    }
  }
} 