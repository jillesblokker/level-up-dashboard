'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, Wifi, Database, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { clientEnv } from '@/lib/client-env'

interface HealthStatus {
  online: boolean
  supabase: boolean
  localStorage: boolean
  clerk: boolean
  lastCheck: Date
}

export function HealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    online: false,
    supabase: false,
    localStorage: false,
    clerk: false,
    lastCheck: new Date()
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = async () => {
    setIsChecking(true)
    
    try {
      // Check online status
      const online = navigator.onLine
      
      // Check localStorage
      const localStorageAvailable = (() => {
        try {
          localStorage.setItem('health-check', 'test')
          localStorage.removeItem('health-check')
          return true
        } catch {
          return false
        }
      })()
      
      // Check Supabase
      const supabase = (() => {
        try {
          const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL
          const key = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
          return !!(url && key)
        } catch {
          return false
        }
      })()
      
      // Check Clerk
      const clerk = (() => {
        try {
          return typeof window !== 'undefined' && 'Clerk' in window
        } catch {
          return false
        }
      })()
      
      setStatus({
        online,
        supabase,
        localStorage: localStorageAvailable,
        clerk,
        lastCheck: new Date()
      })
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    
    // Check when online status changes
    const handleOnline = () => checkHealth()
    const handleOffline = () => checkHealth()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const allHealthy = status.online && status.supabase && status.localStorage && status.clerk
  const hasIssues = !allHealthy

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Last checked: {status.lastCheck.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status</span>
          <Badge variant={allHealthy ? "default" : "destructive"}>
            {allHealthy ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Issues Detected
              </>
            )}
          </Badge>
        </div>

        {/* Individual Checks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Internet Connection</span>
            </div>
            <Badge variant={status.online ? "default" : "destructive"}>
              {status.online ? "Online" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Supabase</span>
            </div>
            <Badge variant={status.supabase ? "default" : "destructive"}>
              {status.supabase ? "Available" : "Unavailable"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Local Storage</span>
            </div>
            <Badge variant={status.localStorage ? "default" : "destructive"}>
              {status.localStorage ? "Available" : "Unavailable"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Authentication</span>
            </div>
            <Badge variant={status.clerk ? "default" : "destructive"}>
              {status.clerk ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>

        {/* Issues Alert */}
        {hasIssues && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some system components are unavailable. The app will continue to work with reduced functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Check Button */}
        <Button 
          onClick={checkHealth} 
          disabled={isChecking}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check Health'}
        </Button>
      </CardContent>
    </Card>
  )
} 