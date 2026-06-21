"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Trash2, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { questCache } from '@/lib/cache-manager'
import { toast } from '@/components/ui/use-toast'

export function CacheManagement() {
  const [cacheStats, setCacheStats] = useState(questCache.getStats())
  const [isClearing, setIsClearing] = useState(false)

  const refreshStats = () => {
    setCacheStats(questCache.getStats())
  }

  const clear = async () => {
    setIsClearing(true)
    try {
      questCache.clear()
      setCacheStats(questCache.getStats())
      toast({
        title: "Cache Cleared",
        description: "All quest cache data has been cleared successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Cache Clear Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const validateCache = () => {
    const isValid = questCache.hasValidCache()
    if (isValid) {
      toast({
        title: "Cache Valid",
        description: "Your quest cache is valid and up-to-date.",
        variant: "default",
      })
    } else {
      toast({
        title: "Cache Invalid",
        description: "Your quest cache is invalid or expired and will be refreshed.",
        variant: "destructive",
      })
    }
    refreshStats()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Quest Cache Management
        </CardTitle>
        <CardDescription>
          Manage your quest data cache to prevent stale data issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Cache Status:</span>
            <span className={`flex items-center gap-1 ${
              cacheStats.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {cacheStats.isValid ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Valid
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Invalid/Expired
                </>
              )}
            </span>
          </div>
          
          {cacheStats.hasCache && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Cache Age:</span>
                <span>{cacheStats.cacheAge || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quests Cached:</span>
                <span>{cacheStats.questsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Cache Date:</span>
                <span>{cacheStats.date || 'Unknown'}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={validateCache}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Info className="w-4 h-4 mr-1" />
            Validate
          </Button>
          
          <Button
            onClick={refreshStats}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        <Button
          onClick={clear}
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={isClearing}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {isClearing ? 'Clearing...' : 'Clear Cache'}
        </Button>

        {/* Info Alert */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Clearing the cache will force a fresh data fetch from the server. 
            This can help resolve quest completion issues caused by stale cached data.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
