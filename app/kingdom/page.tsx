import { KingdomClient } from "./kingdom-client"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function KingdomPage() {
  // Make auth optional
  let session = null
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
    const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()
    if (error) throw error
    session = supabaseSession
  } catch (error) {
    console.error("Auth error:", error)
  }
  return <KingdomClient session={session} />
} 