"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
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
    const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({})
    const [currentFeatIndex, setCurrentFeatIndex] = useState<number>(0)

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

    const DEFAULT_LORE_RECORDS = useMemo(() => [
        {
            id: 'feat-knowledge-red-tower',
            category: 'Knowledge',
            date: new Date().toISOString(),
            content: "By completing daily study routines, the Red Tower of the Royal Library in Castle Valoreth was rebuilt book by book. Archmage Turtoisy praised your diligence as ancient scrolls of alchemy and spellcraft were safely restored to the upper archives."
        },
        {
            id: 'feat-exploration-iron-peaks',
            category: 'Exploration',
            date: new Date().toISOString(),
            content: "Your relentless habit momentum cleared the mountain path. The ancient stone waypoints along the frost road to Iron Peaks were restored, allowing merchant caravans to travel safely between settlements."
        },
        {
            id: 'feat-might-granite-quarry',
            category: 'Might & Defense',
            date: new Date().toISOString(),
            content: "Heavy granite stones were hauled from the quarries of the Iron Peaks. Rockie and Buldour helped reinforce the main watchtowers of Thrivehaven against shadow beasts."
        },
        {
            id: 'feat-craft-apotheca-glasshouse',
            category: 'Craft & Vitality',
            date: new Date().toISOString(),
            content: "Craftsmen restored the Grand Apotheca glasshouse and the central market square, filling the town with fragrant herbs, fresh bread from the bakery, and gleaming elixirs."
        }
    ], [])

    const displayFeats = useMemo(() => {
        return fillerEpisodes.length > 0 ? fillerEpisodes : DEFAULT_LORE_RECORDS;
    }, [fillerEpisodes, DEFAULT_LORE_RECORDS]);

    const activeFeat = displayFeats[currentFeatIndex % displayFeats.length] || displayFeats[0];

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
                        <span className="text-sm font-bold text-amber-300">The chronicles</span>
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
                        <label htmlFor="show-filler-switch" className="text-[10px] font-semibold text-amber-500/70 cursor-pointer select-none">
                            Daily deeds
                        </label>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 flex flex-col pt-2 pb-4">
                <div className="flex flex-col gap-8 pb-4">
                    {/* Top Section: Image */}
                    <div className="w-full max-w-4xl mx-auto aspect-[4/3] flex-shrink-0 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-amber-800/30 bg-zinc-950/50 relative group shadow-lg">
                        {!imageErrorMap[viewedChapter.id] && (
                            <img 
                                src={viewedChapter.image || `/images/chronicles/chronicle_image_${viewedChapter.id}.png`} 
                                alt={viewedChapter.title}
                                className="object-cover w-full h-full absolute inset-0 z-10 transition-opacity duration-300"
                                onError={() => setImageErrorMap(prev => ({ ...prev, [viewedChapter.id]: true }))}
                            />
                        )}
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
                        <div className="relative bg-gradient-to-br from-[#fdfbf7] via-[#f7f0e3] to-[#ebdcb9] text-[#050302] rounded-2xl p-5 md:p-8 shadow-[inset_0_0_20px_rgba(92,59,20,0.2),0_4px_12px_rgba(0,0,0,0.25)] border-2 border-[#b58b4c]/30 flex flex-col overflow-visible max-w-4xl mx-auto w-full parchment-container">
                            {/* Burned edge shadow layer */}
                            <div className="absolute inset-0 pointer-events-none border border-amber-950/10 rounded-2xl" />
                            
                            <div className="md:columns-2 md:gap-8 pr-1">
                                {paragraphs.map((p, i) => {
                                    if (i === 0 && p.length > 0) {
                                        const firstChar = p.charAt(0);
                                        const restOfText = p.slice(1);
                                        return (
                                            <p 
                                                className="font-serif leading-relaxed text-base md:text-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-justify font-medium" 
                                                style={{ color: '#050302', textShadow: 'none' }}
                                                key={i}
                                            >
                                                <span className="float-left text-4xl md:text-5xl font-extrabold font-serif text-[#4a1002] mr-2.5 mt-0.5 select-none border-2 border-[#4a1002]/40 rounded-lg px-2 py-0.5 bg-[#fffdfb] shadow-[2px_3px_5px_rgba(0,0,0,0.15)] leading-none uppercase">
                                                    {firstChar}
                                                </span>
                                                {restOfText}
                                            </p>
                                        );
                                    }
                                    return (
                                        <p 
                                            className="font-serif leading-relaxed text-base md:text-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-justify font-medium" 
                                            style={{ color: '#050302', textShadow: 'none' }}
                                            key={i}
                                        >
                                            {p}
                                        </p>
                                    );
                                })}
                            </div>

                            {showFiller && (
                                <div className="mt-6 border-t border-[#b58b4c]/40 pt-4 space-y-3" style={{ textShadow: 'none' }}>
                                    <div className="flex items-center justify-between">
                                        <h4 
                                            className="font-serif font-black text-xs md:text-sm uppercase tracking-widest text-[#050302] flex items-center gap-1.5"
                                            style={{ textShadow: 'none' }}
                                        >
                                            📜 Thrivehaven Records
                                        </h4>

                                        {/* Carousel Navigation */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-[#3b0d02]">
                                                FEAT {((currentFeatIndex % displayFeats.length) + 1)} / {displayFeats.length}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentFeatIndex(prev => (prev - 1 + displayFeats.length) % displayFeats.length)}
                                                className="h-7 w-7 rounded-lg border-[#b58b4c]/40 bg-[#fffdfb] hover:bg-[#f5e6c8] text-[#3b0d02]"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentFeatIndex(prev => (prev + 1) % displayFeats.length)}
                                                className="h-7 w-7 rounded-lg border-[#b58b4c]/40 bg-[#fffdfb] hover:bg-[#f5e6c8] text-[#3b0d02]"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Active Carousel Card */}
                                    {activeFeat && (
                                        <div 
                                            className="space-y-3 bg-[#fffdfb] p-4 md:p-5 rounded-2xl border border-[#b58b4c]/40 shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-300"
                                            style={{ textShadow: 'none' }}
                                        >
                                            <div 
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs md:text-sm font-serif border-b border-[#b58b4c]/30 pb-2"
                                                style={{ textShadow: 'none', opacity: 1 }}
                                            >
                                                <span className="uppercase tracking-wide font-black" style={{ color: '#000000', textShadow: 'none', opacity: 1 }}>
                                                    FEAT {((currentFeatIndex % displayFeats.length) + 1)}: <span className="font-extrabold" style={{ color: '#3b0d02', textShadow: 'none', opacity: 1 }}>{activeFeat.category}</span>
                                                </span>
                                                <span className="text-xs font-serif italic font-bold" style={{ color: '#050302', textShadow: 'none', opacity: 1 }}>
                                                    {(() => {
                                                        if (!activeFeat.date) return '';
                                                        const date = new Date(activeFeat.date);
                                                        if (isNaN(date.getTime())) return activeFeat.date;
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
                                                    })()}
                                                </span>
                                            </div>

                                            <div 
                                                className="font-serif text-xs md:text-sm leading-relaxed text-justify pt-1 font-medium"
                                                style={{ color: '#000000', textShadow: 'none', opacity: 1 }}
                                            >
                                                <p style={{ color: '#000000', textShadow: 'none', opacity: 1 }}>{activeFeat.content}</p>
                                            </div>

                                            {/* Dots Indicator */}
                                            <div className="flex items-center justify-center gap-1.5 pt-2">
                                                {displayFeats.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentFeatIndex(idx)}
                                                        className={cn(
                                                            "h-1.5 rounded-full transition-all cursor-pointer",
                                                            (currentFeatIndex % displayFeats.length) === idx
                                                                ? "w-4 bg-[#802409]"
                                                                : "w-1.5 bg-[#b58b4c]/40 hover:bg-[#b58b4c]"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
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

                {/* Hall of Champions Permanent Legacy Gallery */}
                <div className="mt-8 pt-6 border-t border-amber-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                            👑 Hall of Champions (Legacy Champions)
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Season Winners</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { month: 'July 2026', winner: 'Jilles', virtue: 'Knowledge & Might', points: '14,250 pts', title: 'Virtue Champion', avatar: '/images/creatures/Necrion.png', border: 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)]' },
                            { month: 'June 2026', winner: 'Grand Architect', virtue: 'Castle & Craft', points: '12,800 pts', title: 'High Builder', avatar: '/images/creatures/EmberDrake.webp', border: 'border-purple-400 ring-2 ring-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.6)]' }
                        ].map((champion, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-950 via-amber-950/20 to-zinc-950 border border-amber-500/30 flex items-center gap-3 shadow-md hover:border-amber-500/50 transition-all">
                                <div className={`relative w-11 h-11 rounded-full border-2 ${champion.border} shrink-0 overflow-hidden bg-zinc-900 animate-pulse`}>
                                    <Image
                                        src={champion.avatar}
                                        alt={champion.winner}
                                        fill
                                        className="object-contain p-1"
                                        unoptimized
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-amber-100 font-serif truncate">{champion.winner}</span>
                                        <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">{champion.month}</span>
                                    </div>
                                    <p className="text-[10px] text-amber-300/90 italic truncate font-serif">{champion.title} • {champion.virtue}</p>
                                    <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-0.5">⚜️ {champion.points}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
