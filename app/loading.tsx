"use client"

import { useState, useEffect } from "react"
import { Sword, Shield, Crown, Scroll } from "lucide-react"
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
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length)
    }, 3000)

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => {
      clearInterval(tipInterval)
      clearInterval(dotsInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black" />

      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative bg-gray-900 border-2 border-amber-500/50 p-6 rounded-2xl shadow-2xl animate-bounce-slow">
            <Sword className="w-12 h-12 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl md:text-3xl font-bold text-amber-500 font-medieval mb-2 tracking-wide">
          {TEXT_CONTENT.loading.title}{dots}
        </h2>

        {/* Divider */}
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-800 to-transparent my-6" />

        {/* Tip Section */}
        <div className="h-16 flex items-center justify-center">
          <p className="text-gray-400 text-sm md:text-base italic animate-fade-in transition-opacity duration-500">
            &quot;{LOADING_TIPS[tipIndex]}&quot;
          </p>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-8 flex gap-4 text-amber-900/40">
        <Shield className="w-8 h-8" />
        <Crown className="w-8 h-8" />
        <Scroll className="w-8 h-8" />
      </div>
    </div>
  )
}