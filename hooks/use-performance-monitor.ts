'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface PerformanceEvent {
  type: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private events: PerformanceEvent[] = [];
  private isInitialized = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Set up error tracking
    this.setupErrorTracking();
    
    // Set up navigation timing
    this.setupNavigationTiming();
    
    this.isInitialized = true;
  }

  private setupPerformanceObservers() {
    try {
      // First Contentful Paint
      if ('PerformanceObserver' in window) {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.trackEvent('first_contentful_paint', entry.startTime);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.trackEvent('largest_contentful_paint', entry.startTime);
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackEvent('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.trackEvent('first_input_delay', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      }
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', 0, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_promise_rejection', 0, {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackEvent('resource_loading_error', 0, {
          src: (event.target as HTMLImageElement | HTMLScriptElement)?.src,
          tagName: (event.target as HTMLElement)?.tagName,
        });
      }
    }, true);
  }

  private setupNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        
        // Page load time
        const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
        this.trackEvent('page_load_time', loadTime);

        // Time to interactive
        const tti = navEntry.domInteractive - navEntry.fetchStart;
        this.trackEvent('time_to_interactive', tti);

        // DNS lookup time
        const dnsTime = navEntry.domainLookupEnd - navEntry.domainLookupStart;
        this.trackEvent('dns_lookup_time', dnsTime);

        // Connection time
        const connectTime = navEntry.connectEnd - navEntry.connectStart;
        this.trackEvent('connection_time', connectTime);

        // First byte time
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.trackEvent('time_to_first_byte', ttfb);
      }
    }
  }

  trackEvent(type: string, value: number, metadata?: Record<string, any>) {
    const event: PerformanceEvent = {
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata,
    };

    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Event: ${type}`, { value, metadata });
    }

    // Send to analytics service (if configured)
    this.sendToAnalytics(event);

    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  private sendToAnalytics(event: PerformanceEvent) {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: event.type,
        value: Math.round(event.value),
        custom_parameters: event,
      });
    }

    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // }).catch(console.warn);
  }

  getMetrics(): PerformanceMetrics {
    const events = this.events;
    
    return {
      pageLoadTime: this.getAverageValue('page_load_time'),
      timeToInteractive: this.getAverageValue('time_to_interactive'),
      firstContentfulPaint: this.getAverageValue('first_contentful_paint'),
      largestContentfulPaint: this.getAverageValue('largest_contentful_paint'),
      cumulativeLayoutShift: this.getAverageValue('cumulative_layout_shift'),
      firstInputDelay: this.getAverageValue('first_input_delay'),
    };
  }

  private getAverageValue(type: string): number {
    const typeEvents = this.events.filter(e => e.type === type);
    if (typeEvents.length === 0) return 0;
    
    const sum = typeEvents.reduce((acc, event) => acc + event.value, 0);
    return sum / typeEvents.length;
  }

  getEventsByType(type: string): PerformanceEvent[] {
    return this.events.filter(e => e.type === type);
  }

  clearEvents() {
    this.events = [];
  }

  exportData(): PerformanceEvent[] {
    return [...this.events];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = useRef(PerformanceMonitor.getInstance());
  const metrics = useRef<PerformanceMetrics>(monitor.current.getMetrics());

  const trackCustomEvent = useCallback((type: string, value: number, metadata?: Record<string, any>) => {
    monitor.current.trackEvent(type, value, metadata);
  }, []);

  const getCurrentMetrics = useCallback(() => {
    return monitor.current.getMetrics();
  }, []);

  const clearEvents = useCallback(() => {
    monitor.current.clearEvents();
  }, []);

  const exportData = useCallback(() => {
    return monitor.current.exportData();
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      metrics.current = monitor.current.getMetrics();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics: metrics.current,
    trackCustomEvent,
    getCurrentMetrics,
    clearEvents,
    exportData,
  };
}

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string) {
  const startTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    renderCount.current++;
    
    // Track render performance
    PerformanceMonitor.getInstance().trackEvent('component_render_time', renderTime, {
      component: componentName,
      renderCount: renderCount.current,
    });

    startTime.current = endTime;
  });

  return {
    renderCount: renderCount.current,
  };
}

// Hook for tracking API call performance
export function useApiPerformance() {
  const trackApiCall = useCallback((url: string, method: string, duration: number, status: number) => {
    PerformanceMonitor.getInstance().trackEvent('api_call_duration', duration, {
      url,
      method,
      status,
      success: status >= 200 && status < 300,
    });
  }, []);

  const trackApiError = useCallback((url: string, method: string, error: string, duration?: number) => {
    PerformanceMonitor.getInstance().trackEvent('api_call_error', duration || 0, {
      url,
      method,
      error,
    });
  }, []);

  return {
    trackApiCall,
    trackApiError,
  };
}

export default PerformanceMonitor;
