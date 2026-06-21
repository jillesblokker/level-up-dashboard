import { Suspense } from "react"
import { KingdomClient } from "./kingdom-client"
import { auth } from '@clerk/nextjs/server'
import KingdomLoading from "./loading" export default async function KingdomPage() { const { userId } = await auth(); return ( <Suspense fallback={<KingdomLoading />}> <KingdomClient /> </Suspense> )
} 