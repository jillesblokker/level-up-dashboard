"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@clerk/nextjs'

export default function TestV2Route() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { getToken } = useAuth()

  const testV2Route = async () => {
    setIsLoading(true)
    try {
      console.log('[Test V2 Route] 🚀 Testing V2 route...')
      
      const timestamp = Date.now()
      const apiUrl = `/api/kingdom-stats-v2?tab=quests&period=week&_t=${timestamp}`
      console.log('[Test V2 Route] 🔗 API URL:', apiUrl)
      
      // Get authentication token
      const token = await getToken()
      console.log('[Test V2 Route] 🔑 Token retrieved, length:', token?.length || 0)
      
      if (!token) {
        throw new Error('No authentication token available')
      }
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('[Test V2 Route] 📡 Response status:', res.status)
      console.log('[Test V2 Route] 📡 Response headers:', Object.fromEntries(res.headers.entries()))
      console.log('[Test V2 Route] 📡 Response URL:', res.url)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log('[Test V2 Route] ✅ API response:', data)
      
      setTestResult({
        success: true,
        status: res.status,
        data: data,
        headers: Object.fromEntries(res.headers.entries()),
        url: res.url
      })
    } catch (error) {
      console.error('[Test V2 Route] ❌ Error:', error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test V2 Route - /api/kingdom-stats-v2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testV2Route} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test V2 Route (with Auth)'}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="font-bold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Make sure you are logged in to the app</li>
              <li>Click &quot;Test V2 Route (with Auth)&quot; button above</li>
              <li>Check browser console for detailed logs</li>
              <li>Check Vercel logs for nuclear debugging output</li>
              <li>If you see nuclear debugging logs, the V2 route is working!</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Expected Result:</h3>
            <p className="text-yellow-700">
              You should see nuclear debugging logs in Vercel console like:
            </p>
            <pre className="bg-yellow-100 p-2 rounded text-sm mt-2">
{`🚨🚨🚨 NUCLEAR DEBUGGING START 🚨🚨🚨
🚨🚨🚨 NUCLEAR DEBUGGING - V2 ROUTE CALLED 🚨🚨🚨
🚨🚨🚨 NUCLEAR DEBUGGING - TIMESTAMP: [current timestamp]
🚨🚨🚨 NUCLEAR DEBUGGING - DEPLOYMENT ID: NUCLEAR-V2-ROUTE-2025-08-26-20-30
🚨🚨🚨 NUCLEAR DEBUGGING - IF YOU SEE THIS, V2 ROUTE IS WORKING 🚨🚨🚨`}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">Current Status:</h3>
            <p className="text-green-700">
              ✅ V2 Route is accessible and responding<br/>
              ✅ Route is executing (nuclear debugging should appear)<br/>
              ❌ Authentication issue preventing data access<br/>
              🔧 Fixed: Now using proper Clerk authentication
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
