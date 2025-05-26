// Kingdom Events Manager - Centralized event system for tracking game progress

export interface KingdomEventData {
  gold?: number
  experience?: number
  questCount?: number
  timestamp?: Date
  source?: string // Which page/component triggered the event
}

export interface TimeSeriesData {
  timestamp: Date
  hour: number
  day: string
  month: string
  year: number
  gold: number
  experience: number
  quests: number
}

class KingdomEventsManager {
  private static instance: KingdomEventsManager
  
  private constructor() {
    this.initializeEventListeners()
  }

  public static getInstance(): KingdomEventsManager {
    if (!KingdomEventsManager.instance) {
      KingdomEventsManager.instance = new KingdomEventsManager()
    }
    return KingdomEventsManager.instance
  }

  // Emit events for other components to listen to
  public emitGoldGained(amount: number, source: string = 'unknown') {
    console.log(`💰 Gold gained: ${amount} from ${source}`)
    
    const event = new CustomEvent('kingdom:goldGained', {
      detail: { amount, source, timestamp: new Date() }
    })
    window.dispatchEvent(event)
    
    // Also emit legacy event for backward compatibility
    const legacyEvent = new CustomEvent('goldUpdate', {
      detail: { amount }
    })
    window.dispatchEvent(legacyEvent)
    
    // Update persistent data
    this.updateTimeSeriesData({ gold: amount })
  }

  public emitExperienceGained(amount: number, source: string = 'unknown') {
    console.log(`⭐ Experience gained: ${amount} from ${source}`)
    
    const event = new CustomEvent('kingdom:experienceGained', {
      detail: { amount, source, timestamp: new Date() }
    })
    window.dispatchEvent(event)
    
    // Also emit legacy event for backward compatibility
    const legacyEvent = new CustomEvent('expUpdate', {
      detail: { amount }
    })
    window.dispatchEvent(legacyEvent)
    
    // Update persistent data
    this.updateTimeSeriesData({ experience: amount })
  }

  public emitQuestCompleted(questName: string, source: string = 'unknown') {
    console.log(`🎯 Quest completed: ${questName} from ${source}`)
    
    const event = new CustomEvent('kingdom:questCompleted', {
      detail: { questName, source, timestamp: new Date() }
    })
    window.dispatchEvent(event)
    
    // Also emit legacy event for backward compatibility
    const legacyEvent = new CustomEvent('questComplete', {
      detail: { questName }
    })
    window.dispatchEvent(legacyEvent)
    
    // Update persistent data
    this.updateTimeSeriesData({ questCount: 1 })
  }

  // Combined event for quest completion with rewards
  public emitQuestCompletedWithRewards(questName: string, gold: number, experience: number, source: string = 'unknown') {
    console.log(`🏆 Quest completed with rewards: ${questName} (+${gold}g, +${experience}xp) from ${source}`)
    
    // Emit individual events
    this.emitQuestCompleted(questName, source)
    if (gold > 0) this.emitGoldGained(gold, source)
    if (experience > 0) this.emitExperienceGained(experience, source)
  }

  // Update time series data for different time periods
  private updateTimeSeriesData(data: { gold?: number; experience?: number; questCount?: number }) {
    const now = new Date()
    const timeKey = this.getTimeKey(now)
    
    // Get existing data
    const existingData = this.getTimeSeriesData()
    
    // Update data for current time bucket
    const currentData = existingData.find(item => this.getTimeKey(item.timestamp) === timeKey)
    
    if (currentData) {
      // Update existing entry
      currentData.gold += data.gold || 0
      currentData.experience += data.experience || 0
      currentData.quests += data.questCount || 0
    } else {
      // Create new entry
      const newEntry: TimeSeriesData = {
        timestamp: now,
        hour: now.getHours(),
        day: now.toLocaleDateString('en-US', { weekday: 'short' }),
        month: now.toLocaleDateString('en-US', { month: 'short' }),
        year: now.getFullYear(),
        gold: data.gold || 0,
        experience: data.experience || 0,
        quests: data.questCount || 0
      }
      existingData.push(newEntry)
    }
    
    // Keep only last 365 days of data
    const cutoffDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))
    const filteredData = existingData.filter(item => item.timestamp > cutoffDate)
    
    // Save to localStorage
    localStorage.setItem('kingdom-time-series-data', JSON.stringify(filteredData))
  }

  // Get aggregated data for different time periods
  public getAggregatedData(period: 'today' | 'weekly' | 'yearly') {
    const data = this.getTimeSeriesData()
    const now = new Date()
    
    switch (period) {
      case 'today':
        return this.aggregateByHour(data, now)
      case 'weekly':
        return this.aggregateByDay(data, now)
      case 'yearly':
        return this.aggregateByMonth(data, now)
      default:
        return []
    }
  }

  private getTimeSeriesData(): TimeSeriesData[] {
    try {
      const saved = localStorage.getItem('kingdom-time-series-data')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert timestamp strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.error('Error loading time series data:', error)
    }
    return []
  }

  private getTimeKey(date: Date): string {
    // Create a unique key for each hour to group data
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
  }

  private aggregateByHour(data: TimeSeriesData[], currentDate: Date) {
    const hours = ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM', '11PM']
    const hourMap = new Map()
    
    // Initialize with zeros
    hours.forEach(hour => {
      hourMap.set(hour, { day: hour, gold: 0, experience: 0, quests: 0 })
    })
    
    // Aggregate today's data
    const today = currentDate.toDateString()
    const todayData = data.filter(item => item.timestamp.toDateString() === today)
    
    todayData.forEach(item => {
      const hour = item.hour
      let hourLabel = ''
      
      // Map hours to display labels
      if (hour >= 9 && hour < 11) hourLabel = '9AM'
      else if (hour >= 11 && hour < 13) hourLabel = '11AM'
      else if (hour >= 13 && hour < 15) hourLabel = '1PM'
      else if (hour >= 15 && hour < 17) hourLabel = '3PM'
      else if (hour >= 17 && hour < 19) hourLabel = '5PM'
      else if (hour >= 19 && hour < 21) hourLabel = '7PM'
      else if (hour >= 21 && hour < 23) hourLabel = '9PM'
      else if (hour >= 23 || hour < 9) hourLabel = '11PM'
      
      if (hourLabel && hourMap.has(hourLabel)) {
        const existing = hourMap.get(hourLabel)
        existing.gold += item.gold
        existing.experience += item.experience
        existing.quests += item.quests
      }
    })
    
    return Array.from(hourMap.values())
  }

  private aggregateByDay(data: TimeSeriesData[], currentDate: Date) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayMap = new Map()
    
    // Initialize with zeros
    days.forEach(day => {
      dayMap.set(day, { day, gold: 0, experience: 0, quests: 0 })
    })
    
    // Get last 7 days
    const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000))
    const weekData = data.filter(item => item.timestamp > sevenDaysAgo)
    
    weekData.forEach(item => {
      const dayName = item.day
      if (dayMap.has(dayName)) {
        const existing = dayMap.get(dayName)
        existing.gold += item.gold
        existing.experience += item.experience
        existing.quests += item.quests
      }
    })
    
    return Array.from(dayMap.values())
  }

  private aggregateByMonth(data: TimeSeriesData[], currentDate: Date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthMap = new Map()
    
    // Initialize with zeros
    months.forEach(month => {
      monthMap.set(month, { day: month, gold: 0, experience: 0, quests: 0 })
    })
    
    // Get this year's data
    const thisYear = currentDate.getFullYear()
    const yearData = data.filter(item => item.year === thisYear)
    
    yearData.forEach(item => {
      const monthName = item.month
      if (monthMap.has(monthName)) {
        const existing = monthMap.get(monthName)
        existing.gold += item.gold
        existing.experience += item.experience
        existing.quests += item.quests
      }
    })
    
    return Array.from(monthMap.values())
  }

  private initializeEventListeners() {
    // Optional: Add any global event listeners here if needed
    console.log('Kingdom Events Manager initialized')
  }
}

// Export singleton instance
export const kingdomEvents = KingdomEventsManager.getInstance()

// Convenience functions for easy use across the app
export const emitGoldGained = (amount: number, source?: string) => 
  kingdomEvents.emitGoldGained(amount, source)

export const emitExperienceGained = (amount: number, source?: string) => 
  kingdomEvents.emitExperienceGained(amount, source)

export const emitQuestCompleted = (questName: string, source?: string) => 
  kingdomEvents.emitQuestCompleted(questName, source)

export const emitQuestCompletedWithRewards = (questName: string, gold: number, experience: number, source?: string) => 
  kingdomEvents.emitQuestCompletedWithRewards(questName, gold, experience, source)

export const getAggregatedKingdomData = (period: 'today' | 'weekly' | 'yearly') => 
  kingdomEvents.getAggregatedData(period)

// Test function for debugging - can be called from browser console
export const testKingdomEvents = () => {
  console.log('🧪 Testing Kingdom Events System...')
  
  // Test gold gained
  emitGoldGained(50, 'test-system')
  
  // Test experience gained  
  emitExperienceGained(100, 'test-system')
  
  // Test quest completion with rewards
  emitQuestCompletedWithRewards('Test Quest', 25, 75, 'test-system')
  
  // Show current data
  console.log('📊 Current aggregated data:')
  console.log('Today:', kingdomEvents.getAggregatedData('today'))
  console.log('Weekly:', kingdomEvents.getAggregatedData('weekly'))
  console.log('Yearly:', kingdomEvents.getAggregatedData('yearly'))
  
  return 'Test completed! Check the Kingdom page to see if stats updated.'
}

// Make test function available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testKingdomEvents = testKingdomEvents
} 