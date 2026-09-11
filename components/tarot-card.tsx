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

    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (hasDrawnCardToday() || activeCard) {
            setIsFlipped(true);
        }
    }, [activeCard]);

    const handleDrawCard = () => {
        if (hasDrawnCardToday() || isDrawing) return;

        setIsDrawing(true);
        playSFX('page-turn');
        trigger(HapticPatterns.soft);

        setTimeout(() => {
            const newCard = drawRandomCard();
            saveTodaysCard(newCard);
            setActiveCard(newCard);
            setIsDrawing(false);
            setIsFlipped(true);
            setShowCard(true);
            playSFX('magic-spell');
            trigger(HapticPatterns.cardFlip);
        }, 850);
    };

    const hasDrawn = hasDrawnCardToday();

    const rarityColors = {
        common: 'from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-800/40',
        rare: 'from-blue-950/70 via-zinc-900 to-zinc-950 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        epic: 'from-purple-950/70 via-zinc-900 to-zinc-950 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
    };

    return (
        <div className="h-full flex flex-col rounded-2xl bg-[#0d0b08] border-2 border-[#42311f] shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden relative group">
            {/* Antique medieval corner rivets & inner gold hairline border */}
            <div className="absolute inset-1.5 rounded-xl border border-[#2b2014]/70 pointer-events-none z-10" />
            <div className="absolute top-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
            <div className="absolute top-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
            <div className="absolute bottom-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
            <div className="absolute bottom-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>

            {/* Header with Cross Fleurée and Gold Serif */}
            <div className="px-5 py-3.5 border-b border-[#2d2115] bg-gradient-to-r from-[#140e09] via-[#1a130c] to-[#140e09] flex items-center justify-between z-20">
                <div className="flex items-center gap-2.5">
                    <span className="text-amber-500 font-serif text-base select-none">✢</span>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        Daily fate
                    </h2>
                </div>
                {hasDrawn ? (
                    <div className="text-xs font-serif text-amber-300/80 tracking-wide font-medium">
                        Card drawn today
                    </div>
                ) : (
                    <div className="text-xs font-serif text-amber-400/70 tracking-wide font-medium">
                        Card
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4 p-4 sm:p-5 z-20">
                <div className="flex-1 flex flex-col items-center justify-between py-2 space-y-4">
                    {/* 3D Flippable Tarot Card */}
                    <div 
                        className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-[3/4] mx-auto [perspective:1200px] group cursor-pointer"
                        onClick={!isFlipped ? handleDrawCard : undefined}
                    >
                        <div className={cn(
                            "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
                            isFlipped && "[transform:rotateY(180deg)]",
                            isDrawing && "animate-pulse scale-105"
                        )}>
                            {/* Front Face: Celestial Fate Card Back */}
                            <div className={cn(
                                "absolute inset-0 rounded-2xl border-2 border-amber-500/40 shadow-2xl overflow-hidden [backface-visibility:hidden] transition-all duration-500 group-hover:scale-[1.02] group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]",
                                isDrawing && "shadow-[0_0_35px_rgba(245,158,11,0.7)]"
                            )}>
                                <Image
                                  src="/images/tarot/card_back.webp"
                                  alt="Fate Card Back"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                            </div>

                            {/* Back Face: Revealed Tarot Card Art & Rarity Badge */}
                            <div className={cn(
                                "absolute inset-0 rounded-2xl border-2 border-amber-500/50 shadow-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br",
                                activeCard ? rarityColors[activeCard.rarity] : 'from-amber-950/60 to-zinc-950'
                            )}>
                                {activeCard && (
                                    <>
                                        <Image
                                          src={activeCard.image || `/images/tarot/${activeCard.id.replace('the-', '')}.jpg`}
                                          alt={activeCard.name}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className={cn(
                                                "text-[10px] font-bold capitalize px-2.5 py-0.5 rounded-full border shadow-md font-mono",
                                                activeCard.rarity === 'common' && "bg-zinc-800 text-zinc-200 border-zinc-700",
                                                activeCard.rarity === 'rare' && "bg-blue-950 text-blue-300 border-blue-500/50",
                                                activeCard.rarity === 'epic' && "bg-purple-950 text-purple-300 border-purple-500/50"
                                            )}>
                                                {activeCard.rarity}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info / Button / Lore Area */}
                    {!isFlipped ? (
                        <div className="w-full space-y-2 max-w-[300px] mx-auto text-center">
                            <p className="text-amber-200/80 text-sm italic font-serif">
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
                    ) : activeCard ? (
                        <div className="w-full max-w-[300px] mx-auto text-center space-y-2 pt-1 animate-in fade-in duration-700">
                            <h3 className="text-xl font-extrabold text-amber-200 font-serif tracking-wide">{activeCard.name}</h3>
                            <p className="text-xs text-zinc-300 italic font-serif leading-relaxed px-2">&ldquo;{activeCard.description}&rdquo;</p>

                            <div className="mt-2.5 p-2.5 bg-zinc-950/90 rounded-xl border border-amber-500/30 shadow-inner">
                                <p className="text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
                                    <span>✨</span>
                                    <span>{activeCard.effect.message}</span>
                                </p>
                            </div>

                            <p className="text-center text-[10px] text-amber-400/60 mt-2 font-mono">
                                This card&apos;s power will last until midnight. Return tomorrow for a new fate.
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
