import dynamic from "next/dynamic"
import { Suspense } from "react"
const KingdomClient = dynamic(() => import('./kingdom-client').then(m => m.KingdomClient), { ssr: false })
import { auth } from '@clerk/nextjs/server'

export default async function KingdomPage() {
  const { userId } = await auth();
  return (
    <Suspense fallback={<div className="p-6 text-amber-300">Loading your kingdom…</div>}>
      <KingdomClient userId={userId} />
    </Suspense>
  )
} 