"use client"

import { useState, useEffect } from "react"
import { Sword } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content"
import { LoadingScreen } from "@/components/loading-screen"

const LOADING_TIPS = TEXT_CONTENT.loading.tips

export default function Loading() {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    // Randomize start tip
    setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length))

    // Rotate tips every 5 seconds
    const tipInterval = setInterval(() => {
      setTipIndex((prev: number) => (prev + 1) % LOADING_TIPS.length)
    }, 5000)

    return () => clearInterval(tipInterval)
  }, [])

  return (
    <LoadingScreen
      title="Preparing Your Journey..."
      icon={<Sword className="w-12 h-12" />}
      content={
        <div className="space-y-2">
          <p className="text-gray-400 italic">
            &quot;{LOADING_TIPS[tipIndex]}&quot;
          </p>
          <p className="text-xs text-amber-500/50 mt-4 tabular-nums">
            {tipIndex + 1} / {LOADING_TIPS.length}
          </p>
        </div>
      }
    />
  )
}