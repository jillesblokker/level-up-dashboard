import { FullPageLoading } from "@/components/ui/loading-states"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function LoadingAchievements() {
  return <FullPageLoading message={TEXT_CONTENT.loading.title} />
}