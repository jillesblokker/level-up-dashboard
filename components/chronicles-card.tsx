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
import { Switch } from "@/components/ui/switch"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager"

interface ChroniclesCardProps {
    currentLevel: number
}

export function ChroniclesCard({ currentLevel }: ChroniclesCardProps) {
    // Determine the highest unlocked chapter based on level
    const latestUnlockedChapter = useMemo(() => getCurrentChapter(currentLevel), [currentLevel])

    // State for the currently viewed chapter (default to the latest unlocked)
    const [viewedChapterId, setViewedChapterId] = useState<string>(latestUnlockedChapter.id.toString())
    const [allFillerEpisodes, setAllFillerEpisodes] = useState<any[]>([])
    const [showFiller, setShowFiller] = useState<boolean>(true)

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const setting = await getUserPreference('enable_chronicle_filler')
                if (setting !== null) {
                    setShowFiller(setting as boolean)
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadPreferences()
    }, [])

    const handleToggleFiller = async (checked: boolean) => {
        setShowFiller(checked)
        await setUserPreference('enable_chronicle_filler', checked)
    }

    useEffect(() => {
        const loadFillerEpisodes = async () => {
            try {
                const list = await getUserPreference('chronicle_filler_episodes') as any[] || []
                setAllFillerEpisodes(list)
            } catch (err) {
                console.error(err)
            }
        }
        loadFillerEpisodes()
    }, [viewedChapterId])

    const fillerEpisodes = useMemo(() => {
        return allFillerEpisodes.filter((ep: any) => ep.chapterId.toString() === viewedChapterId)
    }, [allFillerEpisodes, viewedChapterId])

    // Get the current chapter index in CHRONICLES_DATA
    const currentChapterIndex = CHRONICLES_DATA.findIndex(c => c.id.toString() === viewedChapterId)

    // Handlers for pagination
    const canGoPrev = currentChapterIndex > 0
    const handlePrev = () => {
        if (canGoPrev) {
            setViewedChapterId(CHRONICLES_DATA[currentChapterIndex - 1]!.id.toString())
        }
    }

    const nextChapterData = currentChapterIndex < CHRONICLES_DATA.length - 1 ? CHRONICLES_DATA[currentChapterIndex + 1] : null
    const canGoNext = nextChapterData ? currentLevel >= nextChapterData.levelRequirement : false
    const handleNext = () => {
        if (canGoNext && nextChapterData) {
            setViewedChapterId(nextChapterData.id.toString())
        }
    }

    const viewedChapter = CHRONICLES_DATA[currentChapterIndex] || latestUnlockedChapter
    const paragraphs = useMemo(() => {
        return viewedChapter.description.split('\n\n').filter(p => p.trim().length > 0)
    }, [viewedChapter])

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

    return (
        <Card className="bg-[#1a1614] border-amber-800/40 shadow-xl overflow-hidden relative group flex flex-col">
            {/* Background Texture/Effect */}
            <div className="absolute inset-0 bg-amber-950/20 opacity-5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <CardHeader className="pb-2 relative z-10 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-widest uppercase">The Chronicles</span>
                        <span className="text-[10px] text-amber-400/60 font-serif italic hidden sm:inline">• Rebuilding Thrivehaven Story Arc</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400/60 text-xs font-mono">
                        <Map className="w-3 h-3" />
                        <span>Level {currentLevel}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                    <div className="flex-1">
                        <Select value={viewedChapterId} onValueChange={setViewedChapterId}>
                            <SelectTrigger className="w-full bg-zinc-950 border-amber-800/30 text-amber-100 font-serif text-lg h-auto py-2 focus:ring-amber-500/20">
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
                    <div className="flex items-center gap-2 bg-zinc-950/40 border border-amber-800/20 px-3 py-2 rounded-xl h-[42px] shrink-0 self-end sm:self-auto">
                        <Switch 
                            id="show-filler-switch" 
                            checked={showFiller} 
                            onCheckedChange={handleToggleFiller} 
                            className="data-[state=checked]:bg-amber-600"
                        />
                        <label htmlFor="show-filler-switch" className="text-[10px] font-bold text-amber-500/70 cursor-pointer select-none uppercase tracking-wider">
                            Daily Deeds
                        </label>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 flex flex-col pt-2 pb-4">
                <div className="flex flex-col gap-8 pb-4">
                    {/* Top Section: Image */}
                    <div className="w-full max-w-4xl mx-auto aspect-[4/3] flex-shrink-0 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-amber-800/30 bg-zinc-950/50 relative group shadow-lg">
                        <img 
                            src={viewedChapter.image || `/images/chronicles/chronicle_image_${viewedChapter.id}.png`} 
                            alt={viewedChapter.title}
                            className="object-cover w-full h-full absolute inset-0 z-10 transition-opacity duration-300"
                            onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.opacity = '0';
                            }}
                        />
                        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-4 text-center">
                            <BookOpen className="w-8 h-8 text-amber-800/20 mb-2" />
                            <div className="text-amber-500/40 text-xs font-mono uppercase tracking-widest">
                                chronicle_image_{viewedChapter.id}.png
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Text */}
                    <div className="w-full flex flex-col min-w-0 flex-shrink-0">
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-amber-800/20 flex-shrink-0 max-w-4xl mx-auto w-full">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={!canGoPrev}
                                className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 disabled:opacity-30 h-8"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Prev
                            </Button>

                            <span className="text-xs text-amber-500/50 font-mono">
                                Chapter {viewedChapter.id}
                            </span>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNext}
                                disabled={!canGoNext}
                                className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 disabled:opacity-30 h-8"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        {/* Lore Text Area - Weathered Parchment Layout */}
                        <div className="relative bg-gradient-to-br from-[#fdfbf7] via-[#f7f0e3] to-[#ebdcb9] text-[#2c1d11] rounded-2xl p-5 md:p-8 shadow-[inset_0_0_20px_rgba(92,59,20,0.2),0_4px_12px_rgba(0,0,0,0.25)] border-2 border-[#b58b4c]/30 flex flex-col overflow-visible max-w-4xl mx-auto w-full">
                            {/* Burned edge shadow layer */}
                            <div className="absolute inset-0 pointer-events-none border border-amber-950/10 rounded-2xl" />
                            
                            <div className="md:columns-2 md:gap-8 pr-1">
                                {paragraphs.map((p, i) => {
                                    if (i === 0 && p.length > 0) {
                                        const firstChar = p.charAt(0);
                                        const restOfText = p.slice(1);
                                        return (
                                            <p 
                                                className="font-serif leading-relaxed text-base md:text-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-justify" 
                                                style={{ color: '#1c120c', textShadow: 'none' }}
                                                key={i}
                                            >
                                                <span className="float-left text-4xl md:text-5xl font-extrabold font-serif text-[#7c2d12] mr-2.5 mt-0.5 select-none border-2 border-[#7c2d12]/30 rounded-lg px-2 py-0.5 bg-[#fffdfb] shadow-[2px_3px_5px_rgba(0,0,0,0.15)] leading-none uppercase">
                                                    {firstChar}
                                                </span>
                                                {restOfText}
                                            </p>
                                        );
                                    }
                                    return (
                                        <p 
                                            className="font-serif leading-relaxed text-base md:text-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-justify" 
                                            style={{ color: '#1c120c', textShadow: 'none' }}
                                            key={i}
                                        >
                                            {p}
                                        </p>
                                    );
                                })}
                            </div>

                            {showFiller && fillerEpisodes.length > 0 && (
                                <div className="mt-6 border-t border-[#b58b4c]/40 pt-4 space-y-4" style={{ textShadow: 'none' }}>
                                    <h4 
                                        className="font-serif font-black text-xs md:text-sm uppercase tracking-widest text-[#2c1507] flex items-center gap-1.5"
                                        style={{ textShadow: 'none' }}
                                    >
                                        📜 Thrivehaven Records
                                    </h4>
                                    <div className="space-y-4" style={{ textShadow: 'none' }}>
                                        {fillerEpisodes.map((ep: any, index: number) => {
                                            const formatMedievalDate = (dateStr: string) => {
                                                if (!dateStr) return '';
                                                const date = new Date(dateStr);
                                                if (isNaN(date.getTime())) return dateStr;
                                                const day = date.getDate();
                                                const daySuffix = (d: number) => {
                                                    if (d > 3 && d < 21) return 'th';
                                                    switch (d % 10) {
                                                        case 1: return 'st';
                                                        case 2: return 'nd';
                                                        case 3: return 'rd';
                                                        default: return 'th';
                                                    }
                                                };
                                                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                                return `On the ${day}${daySuffix(day)} of ${months[date.getMonth()]} in the year ${date.getFullYear()}`;
                                            };

                                            return (
                                                <div 
                                                    key={ep.id || index} 
                                                    className="space-y-3 bg-[#fffdfb] p-4 md:p-5 rounded-2xl border border-[#b58b4c]/40 shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
                                                    style={{ textShadow: 'none' }}
                                                >
                                                    <div 
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs md:text-sm font-serif border-b border-[#b58b4c]/30 pb-2"
                                                        style={{ textShadow: 'none', opacity: 1 }}
                                                    >
                                                        <span className="uppercase tracking-wide font-black" style={{ color: '#050302', textShadow: 'none', opacity: 1 }}>
                                                            FEAT {index + 1}: <span className="font-extrabold" style={{ color: '#541c08', textShadow: 'none', opacity: 1 }}>{ep.category}</span>
                                                        </span>
                                                        <span className="text-xs font-serif italic font-bold" style={{ color: '#261005', textShadow: 'none', opacity: 1 }}>
                                                            {formatMedievalDate(ep.date)}
                                                        </span>
                                                    </div>

                                                    {/* 2-Column Paragraph Layout */}
                                                    <div 
                                                        className="md:columns-2 md:gap-8 font-serif text-xs md:text-sm leading-relaxed text-justify pt-1"
                                                        style={{ color: '#090503', textShadow: 'none', opacity: 1 }}
                                                    >
                                                        <p style={{ color: '#090503', textShadow: 'none', opacity: 1 }}>{ep.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progression Footer (Only show if viewing latest unlocked chapter and there is a next chapter) */}
                {viewedChapter.id === latestUnlockedChapter.id && nextChapter && (
                    <div className="mt-6 space-y-2 pt-4 border-t border-amber-800/30">
                        <div className="flex items-center justify-between text-xs text-amber-400/70">
                            <span>Next: {nextChapter.title}</span>
                            <span>{levelsRemaining} levels to go</span>
                        </div>
                        <div className="relative h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-amber-900/30">
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
