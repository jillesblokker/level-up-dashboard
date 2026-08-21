import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw } from "lucide-react"
import { TarotCard, drawRandomCard, hasDrawnCardToday, getTodaysCard, saveTodaysCard } from "@/lib/tarot-data"
import { cn } from "@/lib/utils"

import { useAudioContext } from "@/components/audio-provider"
import { useHaptics, HapticPatterns } from "@/lib/haptics"

export function TarotCardDisplay() {
    const [activeCard, setActiveCard] = useState<TarotCard | null>(getTodaysCard())
    const [isDrawing, setIsDrawing] = useState(false)
    const [showCard, setShowCard] = useState(!!getTodaysCard())
    const { playSFX } = useAudioContext()
    const { trigger } = useHaptics()

    useEffect(() => {
        const fetchServerTarot = async () => {
            try {
                const res = await fetch('/api/tarot/sync');
                if (!res.ok) return;
                const json = await res.json();
                const dailyFate = json?.dailyFate;
                const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());

                if (dailyFate?.card && (dailyFate.date === todayStr || String(dailyFate.date || '').startsWith(todayStr))) {
                    saveTodaysCard(dailyFate.card);
                    setActiveCard(dailyFate.card);
                    setShowCard(true);
                }
            } catch (_) {}
        };

        if (!activeCard) {
            fetchServerTarot();
        }

        window.addEventListener('character-stats-update', fetchServerTarot);
        return () => window.removeEventListener('character-stats-update', fetchServerTarot);
    }, [activeCard]);

    const handleDrawCard = () => {
        if (hasDrawnCardToday()) return;

        setIsDrawing(true);
        setShowCard(false);
        playSFX('page-turn');
        trigger(HapticPatterns.soft);

        // Animate the draw
        setTimeout(() => {
            const newCard = drawRandomCard();
            saveTodaysCard(newCard);
            setActiveCard(newCard);
            setIsDrawing(false);

            // Flip animation
            setTimeout(() => {
                setShowCard(true);
                playSFX('magic-spell');
                trigger(HapticPatterns.cardFlip);
            }, 100);
        }, 1000);
    };

    const hasDrawn = hasDrawnCardToday();

    const rarityColors = {
        common: 'from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-800/40',
        rare: 'from-blue-950/70 via-zinc-900 to-zinc-950 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        epic: 'from-purple-950/70 via-zinc-900 to-zinc-950 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
    };

    return (
        <Card className="h-full flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-800/40 shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-amber-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Sparkles className="w-5 h-5" />
                        <CardTitle className="text-lg font-bold tracking-wide font-serif">Daily fate</CardTitle>
                    </div>
                    {hasDrawn && (
                        <div className="text-xs text-amber-400/60 font-mono">
                            Card drawn today
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-4">
                {!hasDrawn ? (
                    <div className="text-center space-y-4">
                        <div className="relative w-40 h-56 mx-auto group cursor-pointer" onClick={handleDrawCard}>
                            <div className={cn(
                                "absolute inset-0 rounded-2xl border-2 border-amber-500/40 shadow-2xl overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-amber-400",
                                isDrawing && "animate-pulse scale-105 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                            )}>
                                <Image
                                  src="/images/fortune-cards/Back_card_stats.webp"
                                  alt="Fate Card Back"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-amber-200/80 text-sm italic">
                                The cards await your touch...
                            </p>
                            <Button
                                onClick={handleDrawCard}
                                disabled={isDrawing}
                                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl shadow-lg"
                            >
                                {isDrawing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                                        Drawing fate...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-1.5" />
                                        Draw daily fate card
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : activeCard ? (
                    <div className={cn(
                        "transition-all duration-500 flex flex-col items-center",
                        showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}>
                        {/* The Drawn Card Container */}
                        <div className={cn(
                            "relative w-full rounded-2xl border-2 p-4 md:p-5 bg-gradient-to-br shadow-2xl space-y-3",
                            rarityColors[activeCard.rarity]
                        )}>
                            {/* Rarity Badge */}
                            <div className="absolute top-3 right-3 z-20">
                                <span className={cn(
                                    "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shadow-md tracking-wider",
                                    activeCard.rarity === 'common' && "bg-zinc-800 text-zinc-200 border-zinc-700",
                                    activeCard.rarity === 'rare' && "bg-blue-950 text-blue-300 border-blue-500/50",
                                    activeCard.rarity === 'epic' && "bg-purple-950 text-purple-300 border-purple-500/50"
                                )}>
                                    {activeCard.rarity}
                                </span>
                            </div>

                            {/* Illuminated Tarot Card Artwork */}
                            <div className="relative w-full max-w-[220px] aspect-[3/4] mx-auto rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-xl group">
                                <Image
                                  src={activeCard.image || `/images/tarot/${activeCard.id.replace('the-', '')}.jpg`}
                                  alt={activeCard.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                  unoptimized
                                />
                            </div>

                            {/* Card Content & Lore */}
                            <div className="text-center space-y-2 pt-1">
                                <h3 className="text-xl font-extrabold text-amber-200 font-serif tracking-wide">{activeCard.name}</h3>
                                <p className="text-xs text-zinc-300 italic font-serif leading-relaxed px-2">&ldquo;{activeCard.description}&rdquo;</p>

                                {/* Effect Display */}
                                <div className="mt-3 p-2.5 bg-zinc-950/90 rounded-xl border border-amber-500/30 shadow-inner">
                                    <p className="text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
                                        <span>✨</span>
                                        <span>{activeCard.effect.message}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reminder */}
                        <p className="text-center text-[11px] text-amber-400/60 mt-3 font-mono">
                            This card&apos;s power will last until midnight. Return tomorrow for a new fate.
                        </p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
