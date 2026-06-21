'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  threshold: { warning: number; critical: number };
  trend: 'up' | 'down' | 'stable';
  change: number;
}

const PerformanceDashboard: React.FC = () => {
  const { metrics, trackCustomEvent, getCurrentMetrics, clearEvents, exportData } = usePerformanceMonitor();
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Performance thresholds (in milliseconds)
  const thresholds = {
    pageLoad: { warning: 3000, critical: 5000 },
    timeToInteractive: { warning: 2000, critical: 4000 },
    firstContentfulPaint: { warning: 1500, critical: 2500 },
    largestContentfulPaint: { warning: 2500, critical: 4000 },
    firstInputDelay: { warning: 100, critical: 300 },
  };

  // Calculate performance metrics with trends
  const getPerformanceMetrics = (): PerformanceMetric[] => {
    const currentMetrics = getCurrentMetrics();
    
    return [
      {
        label: 'Page Load Time',
        value: currentMetrics.pageLoadTime,
        unit: 'ms',
        threshold: thresholds.pageLoad,
        trend: currentMetrics.pageLoadTime < 2000 ? 'down' : currentMetrics.pageLoadTime > 4000 ? 'up' : 'stable',
        change: 0, // Would need historical data for actual change calculation
      },
      {
        label: 'Time to Interactive',
        value: currentMetrics.timeToInteractive,
        unit: 'ms',
        threshold: thresholds.timeToInteractive,
        trend: currentMetrics.timeToInteractive < 1500 ? 'down' : currentMetrics.timeToInteractive > 3000 ? 'up' : 'stable',
        change: 0,
      },
      {
        label: 'First Contentful Paint',
        value: currentMetrics.firstContentfulPaint,
        unit: 'ms',
        threshold: thresholds.firstContentfulPaint,
        trend: currentMetrics.firstContentfulPaint < 1000 ? 'down' : currentMetrics.firstContentfulPaint > 2000 ? 'up' : 'stable',
        change: 0,
      },
      {
        label: 'Largest Contentful Paint',
        value: currentMetrics.largestContentfulPaint,
        unit: 'ms',
        threshold: thresholds.largestContentfulPaint,
        trend: currentMetrics.largestContentfulPaint < 2000 ? 'down' : currentMetrics.largestContentfulPaint > 3500 ? 'up' : 'stable',
        change: 0,
      },
      {
        label: 'First Input Delay',
        value: currentMetrics.firstInputDelay,
        unit: 'ms',
        threshold: thresholds.firstInputDelay,
        trend: currentMetrics.firstInputDelay < 50 ? 'down' : currentMetrics.firstInputDelay > 200 ? 'up' : 'stable',
        change: 0,
      },
    ];
  };

  // Get performance status
  const getPerformanceStatus = (metric: PerformanceMetric): 'good' | 'warning' | 'critical' => {
    if (metric.value <= metric.threshold.warning) return 'good';
    if (metric.value <= metric.threshold.critical) return 'warning';
    return 'critical';
  };

  // Get status color
  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Force re-render by calling getCurrentMetrics
      getCurrentMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, getCurrentMetrics]);

  // Handle manual refresh
  const handleRefresh = () => {
    trackCustomEvent('manual_refresh', Date.now(), { component: 'performance_dashboard' });
    getCurrentMetrics();
  };

  // Handle export
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    trackCustomEvent('data_export', Date.now(), { component: 'performance_dashboard' });
  };

  // Handle clear events
  const handleClearEvents = () => {
    clearEvents();
    trackCustomEvent('events_cleared', Date.now(), { component: 'performance_dashboard' });
  };

  const performanceMetrics = getPerformanceMetrics();
  const overallScore = Math.round(
    performanceMetrics.reduce((acc, metric) => {
      const status = getPerformanceStatus(metric);
      return acc + (status === 'good' ? 100 : status === 'warning' ? 50 : 0);
    }, 0) / performanceMetrics.length
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
          <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
            Score: {overallScore}/100
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleClearEvents}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Overall Performance Score</span>
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Performance Score</span>
              <span className="text-2xl font-bold text-blue-600">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Poor (0-59)</span>
              <span>Fair (60-79)</span>
              <span>Good (80-100)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => {
          const status = getPerformanceStatus(metric);
          const progressValue = Math.min((metric.value / metric.threshold.critical) * 100, 100);
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  {getTrendIcon(metric.trend)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{Math.round(metric.value)}</span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                </div>
                
                <Progress value={progressValue} className="h-2" />
                
                <div className="flex items-center justify-between text-xs">
                  <Badge className={getStatusColor(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <span className="text-gray-500">
                    {metric.threshold.warning}ms / {metric.threshold.critical}ms
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Metrics (Expandable) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Detailed Metrics</span>
              </CardTitle>
              <CardDescription>
                Comprehensive performance data and trends
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Performance Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Performance Trends</h4>
                <div className="space-y-1 text-xs">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{metric.label}</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(metric.trend)}
                        <span className={metric.trend === 'up' ? 'text-red-500' : metric.trend === 'down' ? 'text-green-500' : 'text-gray-500'}>
                          {metric.trend === 'up' ? 'Worsening' : metric.trend === 'down' ? 'Improving' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Threshold Status</h4>
                <div className="space-y-1 text-xs">
                  {performanceMetrics.map((metric, index) => {
                    const status = getPerformanceStatus(metric);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span>{metric.label}</span>
                        <Badge className={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Performance Recommendations</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {performanceMetrics.some(m => getPerformanceStatus(m) === 'critical') && (
                  <div className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Critical performance issues detected. Immediate optimization required.</span>
                  </div>
                )}
                
                {performanceMetrics.some(m => getPerformanceStatus(m) === 'warning') && (
                  <div className="flex items-start space-x-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Performance warnings detected. Consider optimization for better user experience.</span>
                  </div>
                )}
                
                {performanceMetrics.every(m => getPerformanceStatus(m) === 'good') && (
                  <div className="flex items-start space-x-2 p-2 bg-green-50 rounded">
                    <Zap className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Excellent performance! Your application is running optimally.</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Dashboard Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-refresh Interval</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
                disabled={!autoRefresh}
                aria-label="Auto-refresh interval selection"
                title="Select auto-refresh interval"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Performance Tracking</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tracking"
                  checked={true}
                  disabled
                  className="rounded"
                  aria-label="Performance tracking status"
                  title="Performance tracking is always enabled"
                />
                <span className="text-sm text-gray-500">Always enabled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
