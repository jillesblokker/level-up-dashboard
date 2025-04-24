import { KingdomClient } from "./kingdom/kingdom-client"
import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  // Redirect to /kingdom if authenticated
  if (session) {
    redirect('/kingdom')
  }

  return <KingdomClient session={session} />
}

