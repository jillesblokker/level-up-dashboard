'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export async function skipAuth() {
  // Set a cookie to indicate logged out mode
  const cookieStore = await cookies()
  cookieStore.set('skip-auth', 'true', {
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
  const cookieStore = await cookies()
  
  // Clear auth cookies
  cookieStore.delete('skip-auth')
  
  // Redirect to sign in page
  redirect('/auth/signin')
}

export async function getAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return { userId };
}

export async function getOptionalAuth() {
  const { userId } = await auth();
  return { userId };
} 