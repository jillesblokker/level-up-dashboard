import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const state = Math.random().toString(36).substring(7)
  
  // Set the state cookie
  cookieStore.set('github-oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 900 // 15 minutes
  })

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_ID || '',
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
    scope: 'read:user user:email',
    state,
    response_type: 'code'
  })

  return redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
} 