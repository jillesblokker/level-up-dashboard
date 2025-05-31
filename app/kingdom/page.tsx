import { KingdomClient } from "./kingdom-client"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export default async function KingdomPage() {
  const { userId } = await auth();
  console.log('[KingdomPage] userId:', userId);

  // Make auth optional
  let session = null
  try {
    const cookieStore = await cookies(); // Await cookies() as required
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: async (name: string, value: string, options: any) => {
            try {
              await cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove: async (name: string, options: any) => {
            try {
              await cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
    // Use getUser for secure user info (optional, not passed to client)
    await supabase.auth.getUser();
    // Still get the session if needed
    const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    session = supabaseSession;
  } catch (error) {
    console.error("Auth error:", error)
  }
  return <KingdomClient session={session} />
} 