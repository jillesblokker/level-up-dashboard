interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  component: string
  action: string
  details: any
  userId?: string
  sessionId: string
  userAgent: string
}

interface GuideFlowStep {
  step: string
  timestamp: string
  duration?: number
  success: boolean
  error?: string
  data?: any
}

class SmartLogger {
  private sessionId: string
  private guideFlowSteps: GuideFlowStep[] = []
  private startTime: number = 0

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      // Try to get user ID from various sources
      const user = (window as any).__NEXT_DATA__?.props?.user
      if (user?.id) return user.id
      
      // Check localStorage for user info
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          return parsed.id
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    return undefined
  }

  private createLogEntry(
    level: LogEntry['level'],
    component: string,
    action: string,
    details: any
  ): LogEntry {
    const userId = this.getUserId()
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      details,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }
    
    // Only add userId if it exists
    if (userId) {
      entry.userId = userId
    }
    
    return entry
  }

  private logToConsole(entry: LogEntry) {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[entry.level]

    const style = {
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      debug: 'color: #8b5cf6'
    }[entry.level]

    console.group(
      `${emoji} [${entry.component}] ${entry.action}`
    )
    console.log(`%cTimestamp: ${entry.timestamp}`, style)
    console.log(`%cSession: ${entry.sessionId}`, style)
    if (entry.userId) console.log(`%cUser: ${entry.userId}`, style)
    console.log(`%cDetails:`, style, entry.details)
    console.groupEnd()
  }

  private logToStorage(entry: LogEntry) {
    try {
      const existingLogs = localStorage.getItem('smart-logs') || '[]'
      const logs = JSON.parse(existingLogs)
      logs.push(entry)
      
      // Keep only last 1000 logs to prevent storage bloat
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000)
      }
      
      localStorage.setItem('smart-logs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to save log to storage:', error)
    }
  }

  info(component: string, action: string, details: any = {}) {
    const entry = this.createLogEntry('info', component, action, details)
    this.logToConsole(entry)
    this.logToStorage(entry)
  }

  warn(component: string, action: string, details: any = {}) {
    const entry = this.createLogEntry('warn', component, action, details)
    this.logToConsole(entry)
    this.logToStorage(entry)
  }

  error(component: string, action: string, details: any = {}) {
    const entry = this.createLogEntry('error', component, action, details)
    this.logToConsole(entry)
    this.logToStorage(entry)
  }

  debug(component: string, action: string, details: any = {}) {
    const entry = this.createLogEntry('debug', component, action, details)
    this.logToConsole(entry)
    this.logToStorage(entry)
  }

  // Guide-specific logging methods
  startGuideFlow() {
    this.guideFlowSteps = []
    this.startTime = Date.now()
    this.info('GuideFlow', 'STARTED', {
      startTime: this.startTime,
      sessionId: this.sessionId
    })
  }

  addGuideStep(step: string, success: boolean, data?: any, error?: string) {
    const stepEntry: GuideFlowStep = {
      step,
      timestamp: new Date().toISOString(),
      success
    }
    
    // Only add optional properties if they exist
    if (data !== undefined) {
      stepEntry.data = data
    }
    
    if (error !== undefined) {
      stepEntry.error = error
    }

    if (this.guideFlowSteps.length > 0) {
      const lastStep = this.guideFlowSteps[this.guideFlowSteps.length - 1]
      const lastTimestamp = new Date(lastStep.timestamp).getTime()
      const currentTimestamp = new Date(stepEntry.timestamp).getTime()
      stepEntry.duration = currentTimestamp - lastTimestamp
    }

    this.guideFlowSteps.push(stepEntry)

    this.info('GuideFlow', step, {
      success,
      duration: stepEntry.duration,
      data,
      error,
      totalSteps: this.guideFlowSteps.length
    })
  }

  endGuideFlow() {
    const totalDuration = Date.now() - this.startTime
    const successCount = this.guideFlowSteps.filter(s => s.success).length
    const errorCount = this.guideFlowSteps.filter(s => !s.success).length

    this.info('GuideFlow', 'COMPLETED', {
      totalDuration,
      totalSteps: this.guideFlowSteps.length,
      successCount,
      errorCount,
      steps: this.guideFlowSteps
    })
  }

  // Get all logs for debugging
  getLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem('smart-logs')
      return logs ? JSON.parse(logs) : []
    } catch {
      return []
    }
  }

  // Get guide flow logs
  getGuideFlowLogs(): GuideFlowStep[] {
    return this.guideFlowSteps
  }

  // Clear logs
  clearLogs() {
    localStorage.removeItem('smart-logs')
    this.guideFlowSteps = []
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      startTime: this.startTime,
      totalDuration: Date.now() - this.startTime,
      guideFlowSteps: this.guideFlowSteps,
      allLogs: this.getLogs()
    }, null, 2)
  }
}

// Create a singleton instance
export const smartLogger = new SmartLogger()

// Export the class for testing
export { SmartLogger } 