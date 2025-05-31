import { KingdomClient } from "./kingdom/kingdom-client"
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export default async function HomePage() {
  // Check for guest mode
  const cookieStore = await cookies()
  const skipAuth = cookieStore.get('skip-auth')?.value === 'true'
  const { userId } = await auth()

  // Only redirect to sign in if not guest and not signed in
  if (!userId && !skipAuth) {
    // Only redirect if not guest
    return <div>Redirecting to sign in...</div>
  }

  return <KingdomClient session={userId ? { user: { id: userId } } : null} />
}

