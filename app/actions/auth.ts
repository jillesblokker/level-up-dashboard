'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function skipAuth() {
  // Set a cookie to indicate logged out mode
  cookies().set('skip-auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  })
  
  // Redirect to kingdom page instead of home
  redirect('/kingdom')
}

export async function logout() {
  const cookieStore = cookies()
  
  // Clear both types of auth cookies
  cookieStore.delete('skip-auth')
  cookieStore.delete('next-auth.session-token')
  cookieStore.delete('next-auth.state') // Also clear the state cookie
  
  // Redirect to sign in page
  redirect('/auth/signin')
} 