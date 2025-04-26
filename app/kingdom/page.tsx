import { KingdomClient } from "./kingdom-client"
import { auth } from "../../auth"

export default async function KingdomPage() {
  // Make auth optional
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Auth error:", error)
  }
  return <KingdomClient session={session} />
} 