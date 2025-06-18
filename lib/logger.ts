// Logger utility for the Level Up Dashboard
// Provides consistent logging across the application with different log levels

import { supabase } from './supabase-client';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  image?: string | undefined;
}

interface StoredLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  image?: string | undefined;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  // Log an informational message
  public info(message: string, source: string = 'Unknown', image?: string): void {
    this.addLog('info', message, source, image);
  }

  // Log a warning message
  public warning(message: string, source: string = 'Unknown', image?: string): void {
    this.addLog('warning', message, source, image);
  }

  // Alias for warning
  public warn(message: string, source: string = 'Unknown', image?: string): void {
    this.warning(message, source, image);
  }

  // Log an error message
  public error(message: string, source: string = 'Unknown', image?: string): void {
    this.addLog('error', message, source, image);
  }

  // Generic log method
  public log(level: 'info' | 'warning' | 'error', message: string, source: string = 'Unknown', image?: string): void {
    switch (level) {
      case 'info':
        this.info(message, source, image);
        break;
      case 'warning':
        this.warning(message, source, image);
        break;
      case 'error':
        this.error(message, source, image);
        break;
      default:
        this.info(message, source, image);
    }
  }

  // Add log entry to memory
  private addLog(level: 'info' | 'warning' | 'error', message: string, source: string, image?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      source,
      ...(image !== undefined ? { image } : {})
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
      // intentionally empty: localStorage failure is non-fatal
    }
  }

  // Get logs from localStorage
  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('app-logs');
      if (stored) {
        const parsed = JSON.parse(stored) as StoredLogEntry[];
        return parsed.map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      // intentionally empty: localStorage failure is non-fatal
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
      // intentionally empty: localStorage failure is non-fatal
    }
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
  details?: Record<string, unknown>
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
      // intentionally empty: error handled elsewhere
    }
  } catch (error) {
    // intentionally empty: error handled elsewhere
  }
} 