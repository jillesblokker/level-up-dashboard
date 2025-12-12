"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SetupPage() {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const runSetup = async () => {
        setStatus('running')
        setMessage('Creating database tables...')

        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message || 'Setup completed successfully!')
            } else {
                setStatus('error')
                setMessage(data.error || 'Setup failed')
            }
        } catch (error) {
            setStatus('error')
            setMessage('Failed to run setup: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Database Setup</CardTitle>
                    <CardDescription>
                        This will create the required database tables for user preferences and realm data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold">Tables to be created:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>user_preferences - Store user settings</li>
                            <li>realm_data - Store map/realm state</li>
                        </ul>
                    </div>

                    {status !== 'idle' && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${status === 'success' ? 'bg-green-500/10 text-green-500' :
                                status === 'error' ? 'bg-red-500/10 text-red-500' :
                                    'bg-blue-500/10 text-blue-500'
                            }`}>
                            {status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
                            {status === 'success' && <CheckCircle className="h-5 w-5" />}
                            {status === 'error' && <XCircle className="h-5 w-5" />}
                            <p>{message}</p>
                        </div>
                    )}

                    <Button
                        onClick={runSetup}
                        disabled={status === 'running' || status === 'success'}
                        className="w-full"
                    >
                        {status === 'running' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {status === 'success' ? 'Setup Complete' : 'Run Setup'}
                    </Button>

                    {status === 'success' && (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Setup completed! You can now use the application.
                            </p>
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                Go to Home
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
