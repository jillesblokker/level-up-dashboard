import { LoadingScreen } from "@/components/loading-screen"
import { MapIcon } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function RealmLoading() {
  return (
    <LoadingScreen
      title={TEXT_CONTENT.realm.loadingStory.title}
      icon={<MapIcon className="w-12 h-12" />}
      content={
        <>
          {TEXT_CONTENT.realm.loadingStory.p1}<br />
          {TEXT_CONTENT.realm.loadingStory.p2}<br />
          {TEXT_CONTENT.realm.loadingStory.p3}
        </>
      }
    />
  )
}
