import { KingdomClient } from "./kingdom/kingdom-client"
import { redirect } from "next/navigation"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function HomePage() {
  // Make auth optional
  let session = null
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()
    if (error) throw error
    session = supabaseSession
  } catch (error: any) {
    console.error('Session error on home page:', error)
    // Allow access even if session retrieval fails, unless explicitly skipping auth is false
    if (process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
       redirect("/auth/signin")
    }
  }

  // Redirect to sign in if no session and SKIP_AUTH is not true
  if (!session && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
    redirect("/auth/signin")
  }

  return <KingdomClient session={session} />
}

