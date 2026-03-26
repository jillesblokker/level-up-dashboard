import { LoadingScreen } from "@/components/loading-screen"
import { Crown } from "lucide-react"

export default function KingdomLoading() {
  return (
    <LoadingScreen
      title="Your Kingdom Awaits"
      icon={<Crown className="w-12 h-12" />}
      content={
        <>
          The stone walls of your castle rise from humble beginnings.<br />
          Manage your subjects and expand your territories.<br />
          Every great kingdom started with a single cornerstone.
        </>
      }
    />
  )
}

