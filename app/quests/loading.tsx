import { LoadingScreen } from "@/components/loading-screen"
import { Compass } from "lucide-react"

export default function TasksLoading() {
  return (
    <LoadingScreen
      title="Seeking Your Quests"
      icon={<Compass className="w-12 h-12" />}
      content={
        <>
          In the town square, the Quest Board hums with activity.<br />
          Brave tasks await those who dare to accept them.<br />
          Every completed quest brings you closer to legend.
        </>
      }
    />
  )
}

