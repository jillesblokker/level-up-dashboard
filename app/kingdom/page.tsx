import { KingdomClient } from "./kingdom-client"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

type CookieOptions = {
  path?: string;
  expires?: Date | string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
};

export default async function KingdomPage() {
  let session = null;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
      {
        cookies: {
          getAll: async () => {
            // Read all cookies and return in the expected format
            return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
          },
        },
      }
    );
    await supabase.auth.getUser();
    const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    session = supabaseSession;
  } catch (error) {
    console.error("Auth error:", error);
  }
  return <KingdomClient session={session} />;
} 