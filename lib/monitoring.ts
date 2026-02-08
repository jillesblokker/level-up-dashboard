import logger from './logger';

interface PerformanceMetric {
  operation: string;
  table: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

interface SecurityEvent {
  type: 'auth' | 'data_access' | 'policy_violation';
  action: string;
  userId?: string;
  details: string;
  timestamp: Date;
}

class SupabaseMonitor {
  private static instance: SupabaseMonitor;
  private metrics: PerformanceMetric[] = [];
  private securityEvents: SecurityEvent[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly MAX_EVENTS = 1000;

  private constructor() { }

  static getInstance(): SupabaseMonitor {
    if (!SupabaseMonitor.instance) {
      SupabaseMonitor.instance = new SupabaseMonitor();
    }
    return SupabaseMonitor.instance;
  }

  trackOperation(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log to monitoring system
    logger.info(
      `Operation: ${metric.operation} on ${metric.table} took ${metric.duration}ms`,
      'Performance'
    );

    // Alert on slow operations
    if (metric.duration > 1000) {
      logger.warn(
        `Slow operation detected: ${metric.operation} on ${metric.table} took ${metric.duration}ms`,
        'Performance'
      );
    }
  }

  trackSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event);
    if (this.securityEvents.length > this.MAX_EVENTS) {
      this.securityEvents.shift();
    }

    // Log security events
    logger.info(
      `Security Event: ${event.type} - ${event.action} - ${event.details}`,
      'Security'
    );

    // Alert on policy violations
    if (event.type === 'policy_violation') {
      logger.error(
        `Policy violation detected: ${event.details}`,
        'Security'
      );
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getSecurityEvents(): SecurityEvent[] {
    return this.securityEvents;
  }

  clearMetrics() {
    this.metrics = [];
  }

  clearSecurityEvents() {
    this.securityEvents = [];
  }
}

// Export singleton instance
export const supabaseMonitor = SupabaseMonitor.getInstance();

// Helper function to measure operation duration
export async function measureOperation<T>(
  operation: string,
  table: string,
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    supabaseMonitor.trackOperation({
      operation,
      table,
      duration,
      timestamp: new Date(),
      userId: userId || ''
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    supabaseMonitor.trackOperation({
      operation,
      table,
      duration,
      timestamp: new Date(),
      userId: userId || '',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
} 