import { LoadingScreen } from "@/components/loading-screen"
import { Trophy } from "lucide-react"

export default function LoadingAchievements() {
  return (
    <LoadingScreen
      title="Retrieving Your Chronicles"
      icon={<Trophy className="w-12 h-12" />}
      variant="amber"
      content={
        <>
          Your deeds of valor are etched in history.<br />
          Gathering your achievements and legendary milestones.<br />
          The realm remembers those who strive for greatness.
        </>
      }
    />
  )
}