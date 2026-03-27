import { LoadingScreen } from "@/components/loading-screen"
import { Shield } from "lucide-react"

export default function CharacterLoading() {
  return (
    <LoadingScreen
      title="Unveiling Your Hero's Legacy"
      icon={<Shield className="w-12 h-12" />}
      variant="amber"
      content={
        <>
          Polishing the plate armor and sharpening the blade.<br />
          Your titles and heroic feats are being inscribed.<br />
          The path of the legend begins with the warrior&apos;s heart.
        </>
      }
    />
  )
}
