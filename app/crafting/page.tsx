"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { HeaderSection } from "@/components/HeaderSection"
import { AlchemyLab } from "@/components/quests/alchemy-lab"

export default function CraftingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen pb-20 bg-black text-white bg-gradient-to-br from-zinc-950 via-purple-950/10 to-zinc-950">
      <HeaderSection
        title="Alchemy & Crafting Lab"
        subtitle="Brew powerful reagents to boost your daily focus and shield your progress"
        imageSrc="/images/quests-header.webp"
        defaultBgColor="bg-purple-950"
        shouldRevealImage={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/daily-hub")}
          className="text-zinc-400 hover:text-white flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Daily Hub
        </Button>

        <AlchemyLab />
      </div>
    </div>
  )
}
