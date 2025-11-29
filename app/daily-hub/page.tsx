import { Suspense } from 'react'
import { DailyHubClient } from './daily-hub-client'
import { auth } from '@clerk/nextjs/server'

export default async function DailyHubPage() {
    const { userId } = await auth()

    return (
        <Suspense fallback={<div className="p-6 text-amber-300">Loading your daily adventure...</div>}>
            <DailyHubClient />
        </Suspense>
    )
}
