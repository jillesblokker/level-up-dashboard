import { auth } from '@clerk/nextjs/server'
import { KingdomClient } from './kingdom/kingdom-client'
import { cookies } from 'next/headers'

export default async function HomePage() {
  // Check for guest mode
  const cookieStore = await cookies()
  const skipAuth = cookieStore.get('skip-auth')?.value === 'true'
  const { userId } = await auth()

  // Only redirect to sign in if not guest and not signed in
  if (!skipAuth && !userId) {
    return null
  }

  return <KingdomClient session={userId ? { 
    user: { 
      id: userId,
      app_metadata: {},
      user_metadata: {},
      aud: '',
      created_at: '0'
    },
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer'
  } : null} />
}

