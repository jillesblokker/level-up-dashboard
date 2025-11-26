"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw } from "lucide-react"
import { TarotCard, drawRandomCard, hasDrawnCardToday, getTodaysCard, saveTodaysCard } from "@/lib/tarot-data"
import { cn } from "@/lib/utils"

export function TarotCardDisplay() {
    const [activeCard, setActiveCard] = useState<TarotCard | null>(getTodaysCard())
    const [isDrawing, setIsDrawing] = useState(false)
    const [showCard, setShowCard] = useState(!!getTodaysCard())

    const handleDrawCard = () => {
        if (hasDrawnCardToday()) return;

        setIsDrawing(true);
        setShowCard(false);

        // Animate the draw
        setTimeout(() => {
            const newCard = drawRandomCard();
            saveTodaysCard(newCard);
            setActiveCard(newCard);
            setIsDrawing(false);

            // Flip animation
            setTimeout(() => {
                setShowCard(true);
            }, 100);
        }, 1000);
    };

    const hasDrawn = hasDrawnCardToday();

    const rarityColors = {
        common: 'from-gray-700 to-gray-900 border-gray-600',
        rare: 'from-blue-700 to-blue-900 border-blue-500',
        epic: 'from-purple-700 to-purple-900 border-purple-500'
    };

    return (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-amber-800/40 shadow-xl overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Sparkles className="w-5 h-5" />
                        <CardTitle className="text-lg font-bold tracking-wide">Daily Fate</CardTitle>
                    </div>
                    {hasDrawn && (
                        <div className="text-xs text-amber-400/60 font-mono">
                            Card drawn today
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!hasDrawn ? (
                    <div className="text-center space-y-4">
                        <div className="relative w-32 h-48 mx-auto">
                            <div className={cn(
                                "absolute inset-0 rounded-lg border-2 bg-gradient-to-br from-amber-900/20 to-amber-950/40 border-amber-700/50",
                                "flex items-center justify-center transition-transform duration-500",
                                isDrawing && "animate-pulse scale-105"
                            )}>
                                <div className="text-6xl">🃏</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-amber-200/80 text-sm italic">
                                The cards await your touch...
                            </p>
                            <Button
                                onClick={handleDrawCard}
                                disabled={isDrawing}
                                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold"
                            >
                                {isDrawing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Drawing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Draw Your Daily Card
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : activeCard ? (
                    <div className={cn(
                        "transition-all duration-500",
                        showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}>
                        {/* The Drawn Card */}
                        <div className={cn(
                            "relative w-full rounded-lg border-2 p-6 bg-gradient-to-br",
                            rarityColors[activeCard.rarity]
                        )}>
                            {/* Rarity Badge */}
                            <div className="absolute top-2 right-2">
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                                    activeCard.rarity === 'common' && "bg-gray-600 text-gray-100",
                                    activeCard.rarity === 'rare' && "bg-blue-600 text-blue-100",
                                    activeCard.rarity === 'epic' && "bg-purple-600 text-purple-100"
                                )}>
                                    {activeCard.rarity}
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="text-center space-y-4">
                                <div className="text-7xl mb-2">{activeCard.symbol}</div>
                                <h3 className="text-2xl font-bold text-white font-serif">{activeCard.name}</h3>
                                <p className="text-sm text-white/70 italic">&ldquo;{activeCard.description}&rdquo;</p>

                                {/* Effect Display */}
                                <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/10">
                                    <p className="text-amber-300 font-bold text-sm">
                                        ✨ {activeCard.effect.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reminder */}
                        <p className="text-center text-xs text-amber-400/60 mt-4">
                            This card&apos;s power will last until midnight. Return tomorrow for a new fate.
                        </p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
