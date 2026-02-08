/**
 * Centralized Logger Utility
 * 
 * This module provides a structured logging system with log levels that can be
 * configured based on environment. In production, DEBUG and INFO logs are suppressed.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.debug('Detailed debugging info', { context: 'example' })
 *   logger.info('General information')
 *   logger.warn('Warning message')
 *   logger.error('Error occurred', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  minLevel: LogLevel
  enableTimestamps: boolean
  enableColors: boolean
}

// Log level hierarchy (lower number = more verbose)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// Console colors for different log levels
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
}

const RESET_COLOR = '\x1b[0m'

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'
const isServer = typeof window === 'undefined'

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  minLevel: isProduction ? 'warn' : 'debug',
  enableTimestamps: true,
  enableColors: isServer // Colors work better in Node.js terminal
}

class Logger {
  private config: LoggerConfig
  private context: string | undefined

  constructor(config: Partial<LoggerConfig> = {}, context?: string) {
    this.config = { ...defaultConfig, ...config }
    this.context = context
  }

  /**
   * Create a child logger with a specific context
   */
  withContext(context: string): Logger {
    return new Logger(this.config, context)
  }

  /**
   * Check if a log level should be output
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
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message)

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args)
        break
      case 'info':
        console.info(formattedMessage, ...args)
        break
      case 'warn':
        console.warn(formattedMessage, ...args)
        break
      case 'error':
        console.error(formattedMessage, ...args)
        break
    }
  }

  /**
   * Log debug message (suppressed in production)
   */
  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args)
  }

  /**
   * Log info message (suppressed in production)
   */
  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args)
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args)
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args)
  }

  /**
   * Log an error with stack trace
   */
  errorWithStack(message: string, error: Error | unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      this.log('error', `${message}: ${error.message}`, ...args)
      if (error.stack && !isProduction) {
        console.error(error.stack)
      }
    } else {
      this.log('error', message, error, ...args)
    }
  }

  /**
   * Measure and log execution time
   */
  time<T>(label: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }

  /**
   * Measure and log async execution time
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

// Export singleton logger instance
export const logger = new Logger()

// Default export for backwards compatibility
export default logger

// Export Logger class for custom instances
export { Logger }

// Export type for use in other modules
export type { LogLevel, LoggerConfig }

// Convenience exports for common contexts
export const apiLogger = logger.withContext('API')
export const dbLogger = logger.withContext('DB')
export const authLogger = logger.withContext('Auth')
export const uiLogger = logger.withContext('UI')
export const syncLogger = logger.withContext('Sync')

