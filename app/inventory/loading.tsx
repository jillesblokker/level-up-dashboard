import { LoadingScreen } from "@/components/loading-screen"
import { Backpack } from "lucide-react"

export default function InventoryLoading() {
  return (
    <LoadingScreen
      title="Accessing Your Vault"
      icon={<Backpack className="w-12 h-12" />}
      variant="amber"
      content={
        <>
          Your artifacts and treasures are being gathered from the storehouse.<br />
          Organize your gear and prepare for the road ahead.<br />
          A well-prepared hero is halfway to victory.
        </>
      }
    />
  )
}
