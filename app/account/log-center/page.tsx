"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Trash2, Download, RefreshCw, Filter, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  category: string
  message: string
  details?: any
  userId?: string
}

interface LogStats {
  total: number
  info: number
  warning: number
  error: number
  success: number
}

export default function LogCenterPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    success: 0
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Load logs from localStorage and API
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true)
      try {
        // Load from localStorage
        const localLogs: LogEntry[] = []
        const keys = Object.keys(localStorage)
        
        keys.forEach(key => {
          if (key.startsWith('log_') || key.startsWith('achievement_') || key.startsWith('error_')) {
            try {
              const value = localStorage.getItem(key)
              if (value) {
                const logData = JSON.parse(value)
                localLogs.push({
                  id: key,
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  category: 'local-storage',
                  message: `Local storage entry: ${key}`,
                  details: logData
                })
              }
            } catch (e) {
              localLogs.push({
                id: key,
                timestamp: new Date().toISOString(),
                level: 'error',
                category: 'local-storage',
                message: `Failed to parse localStorage entry: ${key}`,
                details: { error: e }
              })
            }
          }
        })

        // Load from API if available
        try {
          const response = await fetch('/api/app-logs')
          if (response.ok) {
            const apiLogs = await response.json()
            localLogs.push(...apiLogs)
          }
        } catch (e) {
          localLogs.push({
            id: 'api-error',
            timestamp: new Date().toISOString(),
            level: 'error',
            category: 'api',
            message: 'Failed to load logs from API',
            details: { error: e }
          })
        }

        setLogs(localLogs)
        calculateStats(localLogs)
      } catch (error) {
        console.error('Error loading logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogs()
  }, [])

  // Calculate statistics
  const calculateStats = (logEntries: LogEntry[]) => {
    const newStats: LogStats = {
      total: logEntries.length,
      info: logEntries.filter(log => log.level === 'info').length,
      warning: logEntries.filter(log => log.level === 'warning').length,
      error: logEntries.filter(log => log.level === 'error').length,
      success: logEntries.filter(log => log.level === 'success').length
    }
    setStats(newStats)
  }

  // Filter logs based on selected filters
  useEffect(() => {
    let filtered = logs

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel)
    }

    setFilteredLogs(filtered)
  }, [logs, selectedCategory, selectedLevel])

  // Get unique categories
  const categories = ['all', ...new Set(logs.map(log => log.category))]

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  // Get level badge color
  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'info':
        return 'secondary'
      case 'warning':
        return 'destructive'
      case 'error':
        return 'destructive'
      case 'success':
        return 'default'
      default:
        return 'secondary'
    }
  }

  // Clear all logs
  const clearLogs = () => {
    setLogs([])
    setFilteredLogs([])
    calculateStats([])
  }

  // Export logs
  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `logs-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Refresh logs
  const refreshLogs = () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-6" aria-label="log-center-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Log Center</h1>
          <p className="text-gray-400 mt-2">Monitor application logs and debug information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshLogs} aria-label="refresh-logs-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs} aria-label="export-logs-button">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={clearLogs} aria-label="clear-logs-button">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.error}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded bg-gray-800 text-white"
                aria-label="category-filter"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-1 border rounded bg-gray-800 text-white"
                aria-label="level-filter"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No logs found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[600px] w-full" aria-label="logs-scroll-area">
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{log.category}</Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-white">{log.message}</p>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 