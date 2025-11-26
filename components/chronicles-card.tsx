"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Scroll, BookOpen, Map, Lock } from "lucide-react"
import { getCurrentChapter, getNextChapter } from "@/lib/chronicles-data"
import { cn } from "@/lib/utils"

interface ChroniclesCardProps {
    currentStreak: number
}

export function ChroniclesCard({ currentStreak }: ChroniclesCardProps) {
    const currentChapter = getCurrentChapter(currentStreak)
    const nextChapter = getNextChapter(currentStreak)

    // Calculate progress to next chapter
    let progress = 100
    let daysRemaining = 0

    if (nextChapter) {
        const totalDaysInChapter = nextChapter.dayRequirement - currentChapter.dayRequirement
        const daysCompletedInChapter = currentStreak - currentChapter.dayRequirement
        progress = (daysCompletedInChapter / totalDaysInChapter) * 100
        daysRemaining = nextChapter.dayRequirement - currentStreak
    }

    return (
        <Card className="bg-[#1a1614] border-amber-800/40 shadow-xl overflow-hidden relative group">
            {/* Background Texture/Effect */}
            <div className="absolute inset-0 bg-[url('/images/parchment-texture.png')] opacity-5 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-widest uppercase">The Chronicles</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400/60 text-xs font-mono">
                        <Map className="w-3 h-3" />
                        <span>Day {currentStreak}</span>
                    </div>
                </div>
                <CardTitle className="text-2xl font-serif text-amber-100 mt-2">
                    {currentChapter.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6">
                {/* Lore Text */}
                <div className="relative pl-4 border-l-2 border-amber-800/50">
                    <p className="text-amber-200/80 italic font-serif leading-relaxed">
                        "{currentChapter.description}"
                    </p>
                </div>

                {/* Progression */}
                {nextChapter ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-amber-400/70">
                            <span>Progress to {nextChapter.title}</span>
                            <span>{daysRemaining} days remaining</span>
                        </div>
                        <div className="relative h-2 bg-black/50 rounded-full overflow-hidden border border-amber-900/30">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                        <p className="text-amber-300 font-bold">You have reached the current end of the Chronicles.</p>
                        <p className="text-amber-400/60 text-sm">Your legend is written in the stars.</p>
                    </div>
                )}

                {/* Next Chapter Preview */}
                {nextChapter && (
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                        <div className="p-2 bg-black/40 rounded-full text-gray-500">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Next Chapter</p>
                            <p className="text-sm text-gray-400">{nextChapter.title}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
