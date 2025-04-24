import { KingdomClient } from "./kingdom-client"
import { auth } from "@/app/lib/auth"

export default async function KingdomPage() {
  // Make auth optional
  const session = await auth()

  return <KingdomClient session={session} />
} 