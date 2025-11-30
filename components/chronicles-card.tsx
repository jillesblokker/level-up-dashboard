"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Scroll, BookOpen, Map, Lock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { CHRONICLES_DATA, getCurrentChapter, getNextChapter } from "@/lib/chronicles-data"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ChroniclesCardProps {
    currentLevel: number
}

export function ChroniclesCard({ currentLevel }: ChroniclesCardProps) {
    // Determine the highest unlocked chapter based on level
    const latestUnlockedChapter = useMemo(() => getCurrentChapter(currentLevel), [currentLevel])

    // State for the currently viewed chapter (default to the latest unlocked)
    const [viewedChapterId, setViewedChapterId] = useState<string>(latestUnlockedChapter.id.toString())

    // State for text pagination
    const [paragraphIndex, setParagraphIndex] = useState(0)

    // Get the chapter data for the viewed chapter
    const viewedChapter = CHRONICLES_DATA.find(c => c.id.toString() === viewedChapterId) || latestUnlockedChapter

    // Split description into paragraphs
    const paragraphs = useMemo(() => {
        return viewedChapter.description.split('\n\n').filter(p => p.trim().length > 0)
    }, [viewedChapter])

    // Reset pagination when chapter changes
    useEffect(() => {
        setParagraphIndex(0)
    }, [viewedChapterId])

    // Calculate progress to next chapter (for the progress bar)
    const nextChapter = getNextChapter(currentLevel)
    let progress = 100
    let levelsRemaining = 0

    if (nextChapter) {
        const currentChapterData = getCurrentChapter(currentLevel)
        const totalLevelsInChapter = nextChapter.levelRequirement - currentChapterData.levelRequirement
        const levelsCompletedInChapter = currentLevel - currentChapterData.levelRequirement
        progress = (levelsCompletedInChapter / totalLevelsInChapter) * 100
        levelsRemaining = nextChapter.levelRequirement - currentLevel
    }

    // Handlers for pagination
    const handleNext = () => {
        if (paragraphIndex < paragraphs.length - 1) {
            setParagraphIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (paragraphIndex > 0) {
            setParagraphIndex(prev => prev - 1)
        }
    }

    return (
        <Card className="bg-[#1a1614] border-amber-800/40 shadow-xl overflow-hidden relative group h-[450px] md:h-[500px] flex flex-col">
            {/* Background Texture/Effect */}
            <div className="absolute inset-0 bg-[url('/images/parchment-texture.png')] opacity-5 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <CardHeader className="pb-2 relative z-10 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-widest uppercase">The Chronicles</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400/60 text-xs font-mono">
                        <Map className="w-3 h-3" />
                        <span>Level {currentLevel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={viewedChapterId} onValueChange={setViewedChapterId}>
                        <SelectTrigger className="w-full bg-black/20 border-amber-800/30 text-amber-100 font-serif text-lg h-auto py-2 focus:ring-amber-500/20">
                            <SelectValue placeholder="Select Chapter" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1614] border-amber-800 text-amber-100 max-h-[300px]">
                            {CHRONICLES_DATA.map((chapter) => {
                                const isLocked = currentLevel < chapter.levelRequirement
                                return (
                                    <SelectItem
                                        key={chapter.id}
                                        value={chapter.id.toString()}
                                        disabled={isLocked}
                                        className={cn(isLocked && "opacity-50 cursor-not-allowed")}
                                    >
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span>Chapter {chapter.id}: {chapter.title}</span>
                                            {isLocked && <Lock className="w-3 h-3 ml-2" />}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 flex-1 flex flex-col pt-2 pb-4 min-h-0">
                {/* Pagination Controls - Moved to top for better mobile accessibility */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-800/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={paragraphIndex === 0}
                        className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 disabled:opacity-30 h-8"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                    </Button>

                    <span className="text-xs text-amber-500/50 font-mono">
                        {paragraphIndex + 1} / {paragraphs.length}
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        disabled={paragraphIndex === paragraphs.length - 1}
                        className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 disabled:opacity-30 h-8"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                {/* Lore Text Area */}
                <div className="flex-1 relative pl-4 border-l-2 border-amber-800/50 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent">
                        <p className="text-amber-200/90 font-serif leading-relaxed text-lg animate-in fade-in slide-in-from-right-4 duration-300 key={paragraphIndex}">
                            {paragraphs[paragraphIndex]}
                        </p>
                    </div>
                </div>

                {/* Progression Footer (Only show if viewing latest unlocked chapter and there is a next chapter) */}
                {viewedChapter.id === latestUnlockedChapter.id && nextChapter && (
                    <div className="mt-6 space-y-2 pt-4 border-t border-amber-800/30">
                        <div className="flex items-center justify-between text-xs text-amber-400/70">
                            <span>Next: {nextChapter.title}</span>
                            <span>{levelsRemaining} levels to go</span>
                        </div>
                        <div className="relative h-1.5 bg-black/50 rounded-full overflow-hidden border border-amber-900/30">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Completed Message */}
                {viewedChapter.id === latestUnlockedChapter.id && !nextChapter && (
                    <div className="mt-6 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-center">
                        <p className="text-amber-300 text-xs font-bold">Chronicles Complete</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
