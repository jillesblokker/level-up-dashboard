import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = cookies()
  const storedState = cookieStore.get('github-oauth-state')?.value

  console.log('[Auth Debug] Callback received:', {
    code: code?.substring(0, 10) + '...',
    state,
    storedState,
    cookies: cookieStore.getAll().map(c => c.name)
  })

  if (!code || !state) {
    console.error('[Auth Error] Missing code or state')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=missing_params`)
  }

  if (state !== storedState) {
    console.error('[Auth Error] State mismatch', { state, storedState })
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=state_mismatch`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('[Auth Error] Failed to get access token:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=token_error`)
    }

    // Get user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      }
    })

    const userData = await userResponse.json()
    
    if (!userData.id) {
      console.error('[Auth Error] Failed to get user data:', userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=user_error`)
    }

    // Set session cookie
    const session = {
      user: {
        id: userData.id.toString(),
        name: userData.name || userData.login,
        email: userData.email,
        image: userData.avatar_url
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    cookieStore.set('next-auth.session-token', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    // Clear the state cookie
    cookieStore.delete('github-oauth-state')

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}`)
  } catch (error) {
    console.error('[Auth Error] Callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=callback_error`)
  }
} 