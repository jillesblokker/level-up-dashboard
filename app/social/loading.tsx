import { LoadingScreen } from "@/components/loading-screen"
import { Users } from "lucide-react"

export default function SocialLoading() {
  return (
    <LoadingScreen
      title="Entering the Tavern"
      icon={<Users className="w-12 h-12" />}
      content={
        <>
          The Tavern buzzes with the laughter of allies and adventurers.<br />
          Forge bonds, share quests, and rise together.<br />
          No legend was written alone.
        </>
      }
    />
  )
}
