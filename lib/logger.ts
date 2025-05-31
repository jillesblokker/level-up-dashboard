// Logger utility for the Level Up Dashboard
// Provides consistent logging across the application with different log levels

import { supabase } from './supabase-client';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  // Log an informational message
  public info(message: string, source: string = 'Unknown'): void {
    this.addLog('info', message, source);
    console.log(`[INFO] [${source}] ${message}`);
  }

  // Log a warning message
  public warning(message: string, source: string = 'Unknown'): void {
    this.addLog('warning', message, source);
    console.warn(`[WARNING] [${source}] ${message}`);
  }

  // Alias for warning
  public warn(message: string, source: string = 'Unknown'): void {
    this.warning(message, source);
  }

  // Log an error message
  public error(message: string, source: string = 'Unknown'): void {
    this.addLog('error', message, source);
    console.error(`[ERROR] [${source}] ${message}`);
  }

  // Generic log method
  public log(level: 'info' | 'warning' | 'error', message: string, source: string = 'Unknown'): void {
    switch (level) {
      case 'info':
        this.info(message, source);
        break;
      case 'warning':
        this.warning(message, source);
        break;
      case 'error':
        this.error(message, source);
        break;
      default:
        this.info(message, source);
    }
  }

  // Add log entry to memory
  private addLog(level: 'info' | 'warning' | 'error', message: string, source: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      source
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also persist to localStorage for the log center
    this.persistToStorage(logEntry);
  }

  // Persist logs to localStorage for the log center
  private persistToStorage(logEntry: LogEntry): void {
    try {
      const existingLogs = this.getStoredLogs();
      existingLogs.push(logEntry);

      // Keep only last 500 logs in localStorage
      const logsToStore = existingLogs.slice(-500);
      
      localStorage.setItem('app-logs', JSON.stringify(logsToStore));
    } catch (error) {
      // If localStorage fails, continue without storing
      console.warn('Failed to persist log to localStorage:', error);
    }
  }

  // Get logs from localStorage
  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('app-logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
    return [];
  }

  // Get all logs (memory + storage)
  public getAllLogs(): LogEntry[] {
    const storedLogs = this.getStoredLogs();
    const allLogs = [...storedLogs, ...this.logs];
    
    // Remove duplicates and sort by timestamp
    const uniqueLogs = allLogs.filter((log, index, self) => 
      index === self.findIndex(l => 
        l.timestamp.getTime() === log.timestamp.getTime() && 
        l.message === log.message && 
        l.source === log.source
      )
    );

    return uniqueLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get logs by level
  public getLogsByLevel(level: 'info' | 'warning' | 'error'): LogEntry[] {
    return this.getAllLogs().filter(log => log.level === level);
  }

  // Get logs by source
  public getLogsBySource(source: string): LogEntry[] {
    return this.getAllLogs().filter(log => log.source === source);
  }

  // Clear all logs
  public clear(): void {
    this.logs = [];
    try {
      localStorage.removeItem('app-logs');
    } catch (error) {
      console.warn('Failed to clear logs from localStorage:', error);
    }
    console.log('Logger cleared');
  }

  // Get recent logs (last N entries)
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.getAllLogs().slice(0, count);
  }

  // Export logs as JSON
  public exportLogs(): string {
    return JSON.stringify(this.getAllLogs(), null, 2);
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export logger instance as default
export default logger;

export async function logQuestAction(
  userId: string,
  action: string,
  questId: string,
  details?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('QuestLogs')
      .insert({
        userId,
        action,
        questId,
        details: details || {},
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging quest action:', error);
    }
  } catch (error) {
    console.error('Error in logQuestAction:', error);
  }
} 