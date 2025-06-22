import { KingdomClient } from "./kingdom-client"
import { auth } from '@clerk/nextjs/server'

export default async function KingdomPage() {
  const { userId } = await auth();
  
  return <KingdomClient userId={userId} />;
} 