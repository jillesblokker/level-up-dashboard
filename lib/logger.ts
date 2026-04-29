/* eslint-disable no-console */
/**
 * Production-safe logger utility
 * Suppresses verbose logs in production while keeping high-priority ones
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  minLevel: LogLevel
  enableTimestamps: boolean
  enableColors: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
}

const RESET_COLOR = '\x1b[0m'

const isProduction = process.env.NODE_ENV === 'production'
const isServer = typeof window === 'undefined'

class Logger {
  private config: LoggerConfig
  private context: string | null = null

  constructor(context: string | null = null) {
    this.context = context
    this.config = {
      // Show everything in dev, only warn/error in prod
      minLevel: isProduction ? 'warn' : 'debug',
      enableTimestamps: true,
      enableColors: isServer // Colors only work in terminal/server logs
    }
  }

  /**
   * Set the context for all subsequent logs
   */
  setContext(context: string): void {
    this.context = context
  }

  /**
   * Check if the message should be logged based on current level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Format the log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = []

    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString()
      parts.push(`[${timestamp}]`)
    }

    const levelLabel = level.toUpperCase().padEnd(5)
    if (this.config.enableColors && isServer) {
      parts.push(`${LOG_COLORS[level]}${levelLabel}${RESET_COLOR}`)
    } else {
      parts.push(levelLabel)
    }

    if (this.context) {
      parts.push(`[${this.context}]`)
    }

    parts.push(message)

    return parts.join(' ')
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: any, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return

    const msgString = typeof message === 'string' ? message :
      (message instanceof Error ? message.message : JSON.stringify(message, null, 2))

    const formattedMessage = this.formatMessage(level, msgString)

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(formattedMessage, ...args)
        break
      case 'info':
        // eslint-disable-next-line no-console
        console.info(formattedMessage, ...args)
        break
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(formattedMessage, ...args)
        break
      case 'error':
        // eslint-disable-next-line no-console
        console.error(formattedMessage, ...args)
        break
    }
  }

  debug(message: any, ...args: unknown[]): void {
    this.log('debug', message, ...args)
  }

  info(message: any, ...args: unknown[]): void {
    this.log('info', message, ...args)
  }

  warn(message: any, ...args: unknown[]): void {
    this.log('warn', message, ...args)
  }

  error(message: any, ...args: unknown[]): void {
    this.log('error', message, ...args)
  }

  errorWithStack(message: string, error: unknown, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return

    this.error(message, error, ...args)
    if (error instanceof Error && error.stack) {
      this.debug('Stack Trace:', error.stack)
    }
  }

  time<T>(label: string, fn: () => T): T {
    const start = Date.now()
    try {
      return fn()
    } finally {
      const duration = Date.now() - start
      this.debug(`${label} took ${duration}ms`)
    }
  }

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.debug(`${label} took ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(`${label} failed after ${duration}ms`, error)
      throw error
    }
  }
}

// Breadcrumb system for tracing complex flows
interface Breadcrumb {
  timestamp: number
  context: string
  message: string
  data?: Record<string, unknown>
}

const MAX_BREADCRUMBS = 50
const breadcrumbs: Breadcrumb[] = []

/**
 * Add a breadcrumb to the global trail.
 * Useful for tracing multi-step operations (e.g., tile placement → save → API response).
 */
export function addBreadcrumb(context: string, message: string, data?: Record<string, unknown>): void {
  breadcrumbs.push({ timestamp: Date.now(), context, message, ...(data ? { data } : {}) })
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift()
}

/**
 * Get the current breadcrumb trail (most recent last).
 */
export function getBreadcrumbs(): readonly Breadcrumb[] {
  return breadcrumbs
}

/**
 * Clear the breadcrumb trail.
 */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0
}

/**
 * Log an error with full structured context, including breadcrumb trail.
 * Use this for critical failures that need investigation.
 */
export function logStructuredError(
  logger: Logger,
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorInfo = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { raw: String(error) }

  logger.error(message, {
    error: errorInfo,
    context,
    breadcrumbs: breadcrumbs.slice(-10), // Last 10 breadcrumbs
    timestamp: new Date().toISOString(),
  })
}

// Export a singleton instance
export const logger = new Logger()

// Export specialized instances for each domain
export const apiLogger = new Logger('API')
export const authLogger = new Logger('AUTH')
export const kingdomLogger = new Logger('Kingdom')
export const inventoryLogger = new Logger('Inventory')
export const realmLogger = new Logger('Realm')

// Export class for custom context loggers
export { Logger }

// Default export
export default logger
