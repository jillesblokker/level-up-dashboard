"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Activity, Cpu, HardDrive, Database, Network, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface PerformanceMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  network: {
    requests: number
    errors: number
    successRate: number
  }
  storage: {
    used: number
    total: number
    percentage: number
  }
  performance: {
    loadTime: number
    renderTime: number
    fps: number
  }
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { usage: 0, cores: 0 },
    network: { requests: 0, errors: 0, successRate: 100 },
    storage: { used: 0, total: 0, percentage: 0 },
    performance: { loadTime: 0, renderTime: 0, fps: 60 }
  })
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Simulate performance monitoring
  useEffect(() => {
    const updateMetrics = () => {
      // Simulate memory usage (50-90%)
      const memoryUsage = Math.random() * 40 + 50
      const totalMemory = 8192 // 8GB
      const usedMemory = (memoryUsage / 100) * totalMemory

      // Simulate CPU usage (10-80%)
      const cpuUsage = Math.random() * 70 + 10

      // Simulate network metrics
      const requests = Math.floor(Math.random() * 100) + 50
      const errors = Math.floor(Math.random() * 10)
      const successRate = ((requests - errors) / requests) * 100

      // Simulate storage usage (20-85%)
      const storageUsage = Math.random() * 65 + 20
      const totalStorage = 1000000 // 1TB in MB
      const usedStorage = (storageUsage / 100) * totalStorage

      // Simulate performance metrics
      const loadTime = Math.random() * 2000 + 500 // 500-2500ms
      const renderTime = Math.random() * 100 + 10 // 10-110ms
      const fps = Math.random() * 30 + 30 // 30-60 FPS

      setMetrics({
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: memoryUsage
        },
        cpu: {
          usage: cpuUsage,
          cores: navigator.hardwareConcurrency || 4
        },
        network: {
          requests,
          errors,
          successRate
        },
        storage: {
          used: usedStorage,
          total: totalStorage,
          percentage: storageUsage
        },
        performance: {
          loadTime,
          renderTime,
          fps
        }
      })

      // Check for alerts
      checkForAlerts({
        memory: memoryUsage,
        cpu: cpuUsage,
        network: { requests, errors, successRate },
        storage: storageUsage,
        performance: { loadTime, renderTime, fps }
      })

      setLastUpdate(new Date())
    }

    if (isMonitoring) {
      updateMetrics()
      const interval = setInterval(updateMetrics, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
    
    return undefined
  }, [isMonitoring])

  const checkForAlerts = (currentMetrics: any) => {
    const newAlerts: PerformanceAlert[] = []

    // Memory alerts
    if (currentMetrics.memory > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        message: `High memory usage: ${currentMetrics.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // CPU alerts
    if (currentMetrics.cpu > 90) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'error',
        message: `Critical CPU usage: ${currentMetrics.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Network alerts
    if (currentMetrics.network.successRate < 95) {
      newAlerts.push({
        id: `network-${Date.now()}`,
        type: 'warning',
        message: `Low network success rate: ${currentMetrics.network.successRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Performance alerts
    if (currentMetrics.performance.loadTime > 2000) {
      newAlerts.push({
        id: `performance-${Date.now()}`,
        type: 'warning',
        message: `Slow load time: ${currentMetrics.performance.loadTime.toFixed(0)}ms`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts])
    }
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const getStatusColor = (value: number, thresholds: { warning: number; error: number }) => {
    if (value >= thresholds.error) return 'text-red-500'
    if (value >= thresholds.warning) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = (value: number, thresholds: { warning: number; error: number }) => {
    if (value >= thresholds.error) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (value >= thresholds.warning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6" aria-label="monitoring-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Performance Monitoring</h1>
          <p className="text-gray-400 mt-2">Real-time system performance metrics and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isMonitoring ? "destructive" : "default"}
            onClick={toggleMonitoring}
            aria-label="toggle-monitoring-button"
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
          <Button variant="outline" onClick={clearAlerts} aria-label="clear-alerts-button">
            Clear Alerts
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="w-4 h-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics.memory.percentage.toFixed(1)}%
              </div>
              {getStatusIcon(metrics.memory.percentage, { warning: 75, error: 90 })}
            </div>
            <Progress 
              value={metrics.memory.percentage} 
              className="mt-2"
              aria-label="memory-usage-progress"
            />
            <p className="text-xs text-gray-400 mt-1">
              {(metrics.memory.used / 1024).toFixed(1)}GB / {(metrics.memory.total / 1024).toFixed(1)}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="w-4 h-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics.cpu.usage.toFixed(1)}%
              </div>
              {getStatusIcon(metrics.cpu.usage, { warning: 80, error: 95 })}
            </div>
            <Progress 
              value={metrics.cpu.usage} 
              className="mt-2"
              aria-label="cpu-usage-progress"
            />
            <p className="text-xs text-gray-400 mt-1">
              {metrics.cpu.cores} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Network className="w-4 h-4" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics.network.successRate.toFixed(1)}%
              </div>
              {getStatusIcon(100 - metrics.network.successRate, { warning: 5, error: 10 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {metrics.network.requests} requests, {metrics.network.errors} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="w-4 h-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics.performance.fps.toFixed(0)} FPS
              </div>
              {getStatusIcon(60 - metrics.performance.fps, { warning: 15, error: 30 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Load: {metrics.performance.loadTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>Local storage and cache utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Used Space</span>
                  <span>{(metrics.storage.used / 1024 / 1024).toFixed(1)}GB</span>
                </div>
                <Progress 
                  value={metrics.storage.percentage} 
                  className="h-2"
                  aria-label="storage-usage-progress"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {(metrics.storage.total / 1024 / 1024).toFixed(1)}GB total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Application performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Load Time</span>
                <span className={getStatusColor(metrics.performance.loadTime, { warning: 1500, error: 3000 })}>
                  {metrics.performance.loadTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Render Time</span>
                <span className={getStatusColor(metrics.performance.renderTime, { warning: 50, error: 100 })}>
                  {metrics.performance.renderTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frame Rate</span>
                <span className={getStatusColor(60 - metrics.performance.fps, { warning: 15, error: 30 })}>
                  {metrics.performance.fps.toFixed(0)} FPS
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Alerts</CardTitle>
          <CardDescription>
            Active alerts and performance warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No active alerts. System performance is optimal.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {alerts.filter(alert => !alert.resolved).map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>{alert.message}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      aria-label={`resolve-alert-${alert.id}`}
                    >
                      Resolve
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-400">
        Last updated: {lastUpdate.toLocaleTimeString()}
        {isMonitoring && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Monitoring active</span>
          </div>
        )}
      </div>
    </div>
  )
} 