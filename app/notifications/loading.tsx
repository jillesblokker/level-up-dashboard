import { FullPageLoading } from "@/components/ui/loading-states"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function Loading() {
  return <FullPageLoading message={TEXT_CONTENT.loading.title} />
}
