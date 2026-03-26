import { LoadingScreen } from "@/components/loading-screen"
import { User } from "lucide-react"

export default function ProfileLoading() {
  return (
    <LoadingScreen
      title="Preparing Your Hall of Records"
      icon={<User className="w-12 h-12" />}
      content={
        <>
          Every adventurer&apos;s deeds are recorded here.<br />
          Your achievements and settings are being retrieved.<br />
          Your legend is taking shape before the world.
        </>
      }
    />
  )
}

