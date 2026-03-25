"use client"

import { useState, useEffect } from "react"
import { Loader2, Sword, Shield, Crown, Scroll } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content"

const LOADING_TIPS = TEXT_CONTENT.loading.tips

export default function Loading() {
  const [tipIndex, setTipIndex] = useState(0)
  const [dots, setDots] = useState("")

  useEffect(() => {
    // Randomize start tip
    setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length))

    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setTipIndex((prev: number) => (prev + 1) % LOADING_TIPS.length)
    }, 3000)

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots((prev: string) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => {
      clearInterval(tipInterval)
      clearInterval(dotsInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Modal-like Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        {/* Simplified Icon */}
        <div className="mb-8">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-amber-500 font-medieval mb-2 tracking-wide">
          {TEXT_CONTENT.loading.title}{dots}
        </h2>

        {/* Divider */}
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-800 to-transparent my-4" />

        {/* Tip Section */}
        <div className="h-16 flex items-center justify-center px-4">
          <p className="text-gray-400 text-sm italic transition-opacity duration-500">
            &quot;{LOADING_TIPS[tipIndex]}&quot;
          </p>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-10 flex gap-6 text-amber-900/30">
        <Shield className="w-6 h-6" />
        <Crown className="w-6 h-6" />
        <Scroll className="w-6 h-6" />
      </div>
    </div>
  )
}