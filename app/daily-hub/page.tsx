import { Suspense } from 'react'
import { DailyHubClient } from './daily-hub-client'
import { auth } from '@clerk/nextjs/server'

export default async function DailyHubPage() {
    const { userId } = await auth()

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-amber-500 animate-pulse">Loading...</div>
            </div>
        }>
            <DailyHubClient />
        </Suspense>
    )
}
