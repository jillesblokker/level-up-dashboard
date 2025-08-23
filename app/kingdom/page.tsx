import { Suspense } from "react"
import { KingdomClient } from "./kingdom-client"
import { auth } from '@clerk/nextjs/server'

export default async function KingdomPage() {
  const { userId } = await auth();
  return (
    <Suspense fallback={<div className="p-6 text-amber-300">Loading your kingdom…</div>}>
      <KingdomClient />
    </Suspense>
  )
} 