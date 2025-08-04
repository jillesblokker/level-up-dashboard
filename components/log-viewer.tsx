"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { smartLogger } from '@/lib/smart-logger'
import { Download, Trash2, Search, Filter, Clock, User, Activity } from 'lucide-react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  component: string
  action: string
  details: any
  userId?: string
  sessionId: string
  userAgent: string
}

interface GuideFlowStep {
  step: string
  timestamp: string
  duration?: number
  success: boolean
  error?: string
  data?: any
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [guideFlowLogs, setGuideFlowLogs] = useState<GuideFlowStep[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [componentFilter, setComponentFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load logs on mount and refresh periodically
  useEffect(() => {
    const loadLogs = () => {
      const allLogs = smartLogger.getLogs()
      const guideLogs = smartLogger.getGuideFlowLogs()
      setLogs(allLogs)
      setGuideFlowLogs(guideLogs)
    }

    loadLogs()

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
    
    // Return undefined when autoRefresh is false
    return undefined
  }, [autoRefresh])

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // Apply component filter
    if (componentFilter !== 'all') {
      filtered = filtered.filter(log => log.component === componentFilter)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, levelFilter, componentFilter])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500'
      case 'warn': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'debug': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      case 'debug': return '🔍'
      default: return '📝'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const exportLogs = () => {
    const dataStr = smartLogger.exportLogs()
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    smartLogger.clearLogs()
    setLogs([])
    setGuideFlowLogs([])
    setFilteredLogs([])
  }

  const getUniqueComponents = () => {
    const components = [...new Set(logs.map(log => log.component))]
    return components.sort()
  }

  const getUniqueLevels = () => {
    const levels = [...new Set(logs.map(log => log.level))]
    return levels.sort()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Smart Logs</h2>
          <p className="text-gray-400">Real-time logging and debugging information</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
                <p className="text-sm text-gray-400">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{guideFlowLogs.length}</p>
                <p className="text-sm text-gray-400">Guide Steps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(log => log.userId).length}
                </p>
                <p className="text-sm text-gray-400">User Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
                <p className="text-sm text-gray-400">Filtered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All levels</SelectItem>
                  {getUniqueLevels().map(level => (
                    <SelectItem key={level} value={level}>
                      {getLevelIcon(level)} {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Component</label>
              <Select value={componentFilter} onValueChange={setComponentFilter}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="All components" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All components</SelectItem>
                  {getUniqueComponents().map(component => (
                    <SelectItem key={component} value={component}>
                      {component}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-300">
              Auto-refresh logs
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96" aria-label="logs-scroll-area">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No logs found matching your filters
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={`${log.timestamp}-${index}`}
                    className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getLevelColor(log.level)}>
                          {getLevelIcon(log.level)} {log.level}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{log.component}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-amber-400">{log.action}</span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {formatTimestamp(log.timestamp)}
                          </p>
                          {log.userId && (
                            <p className="text-xs text-gray-500 mt-1">
                              User: {log.userId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.sessionId.slice(-8)}
                      </div>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                          View details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Guide Flow Steps */}
      {guideFlowLogs.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-800/20 to-amber-700/20 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-white">Guide Flow Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64" aria-label="guide-flow-scroll-area">
              <div className="space-y-2">
                {guideFlowLogs.map((step, index) => (
                  <div
                    key={`${step.timestamp}-${index}`}
                    className={`p-3 rounded-lg border ${
                      step.success 
                        ? 'bg-green-800/20 border-green-500/30' 
                        : 'bg-red-800/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          step.success ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="font-medium text-white">{step.step}</span>
                        {step.duration && (
                          <Badge variant="outline" className="text-xs">
                            {step.duration}ms
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    </div>
                    {step.error && (
                      <p className="text-sm text-red-400 mt-1">{step.error}</p>
                    )}
                    {step.data && Object.keys(step.data).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
                          View data
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 