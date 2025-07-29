// Performance monitoring utility
// Tracks API response times and identifies performance bottlenecks

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface PerformanceStats {
  averageResponseTime: number;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private isEnabled = true;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track API call performance
  async trackApiCall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return apiCall();
    }

    const startTime = performance.now();
    const timestamp = new Date();

    try {
      const response = await apiCall();
      const duration = performance.now() - startTime;

      this.recordMetric({
        endpoint,
        method,
        duration,
        status: 200,
        timestamp,
        success: true,
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      const status = error instanceof Response ? error.status : 500;

      this.recordMetric({
        endpoint,
        method,
        duration,
        status,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  // Record a performance metric
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep metrics array manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests (>2 seconds)
    if (metric.duration > 2000) {
      console.warn('[PerformanceMonitor] Slow API call detected:', {
        endpoint: metric.endpoint,
        method: metric.method,
        duration: `${metric.duration.toFixed(2)}ms`,
        status: metric.status,
      });
    }
  }

  // Get performance statistics
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        successRate: 0,
        errorRate: 0,
        slowestEndpoint: '',
        fastestEndpoint: '',
      };
    }

    const successfulRequests = this.metrics.filter(m => m.success);
    const failedRequests = this.metrics.filter(m => !m.success);

    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    const totalRequests = this.metrics.length;
    const successRate = (successfulRequests.length / totalRequests) * 100;
    const errorRate = (failedRequests.length / totalRequests) * 100;

    // Find slowest and fastest endpoints
    const endpointStats = new Map<string, { total: number; avg: number }>();
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { total: 0, avg: 0 };
      existing.total += metric.duration;
      existing.avg = existing.total / (this.metrics.filter(m => `${m.method} ${m.endpoint}` === key).length);
      endpointStats.set(key, existing);
    });

    let slowestEndpoint = '';
    let fastestEndpoint = '';
    let slowestTime = 0;
    let fastestTime = Infinity;

    endpointStats.forEach((stats, endpoint) => {
      if (stats.avg > slowestTime) {
        slowestTime = stats.avg;
        slowestEndpoint = endpoint;
      }
      if (stats.avg < fastestTime) {
        fastestTime = stats.avg;
        fastestEndpoint = endpoint;
      }
    });

    return {
      averageResponseTime,
      totalRequests,
      successRate,
      errorRate,
      slowestEndpoint,
      fastestEndpoint,
    };
  }

  // Get recent metrics
  getRecentMetrics(count: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  // Get metrics for specific endpoint
  getEndpointMetrics(endpoint: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.endpoint === endpoint);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Check if monitoring is enabled
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper function to wrap API calls with performance tracking
export function withPerformanceTracking<T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return performanceMonitor.trackApiCall(endpoint, method, apiCall);
}