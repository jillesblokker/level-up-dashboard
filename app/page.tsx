import { KingdomClient } from "./kingdom/kingdom-client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  // Redirect to sign in if no session
  if (!session) {
    redirect("/auth/signin")
  }

  return <KingdomClient session={session} />
}

