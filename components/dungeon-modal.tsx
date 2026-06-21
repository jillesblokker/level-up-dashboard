"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { gainExperience } from "@/lib/experience-manager"
import { useSound, SOUNDS } from "@/lib/sound-manager"
import { Skull, Flame, ChevronUp, ChevronDown, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface DungeonQuestion {
    fact: string;
    number: number;
}

interface DungeonModalProps {
    isOpen: boolean
    onClose: () => void
    questions: DungeonQuestion[]
    onComplete?: (score: number) => void
}

export function DungeonModal({ isOpen, onClose, questions, onComplete }: DungeonModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [gameState, setGameState] = useState<'playing' | 'completed'>('playing')
    const [resultMessage, setResultMessage] = useState('')
    const { playSound } = useSound();

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0)
            setScore(0)
            setGameState('playing')
            setResultMessage('')
            playSound(SOUNDS.DUNGEON_CHALLENGE);
        }
    }, [isOpen, playSound])

    const handleGuess = (guess: 'higher' | 'lower') => {
        playSound(SOUNDS.BUTTON_CLICK);
        const currentQ = questions[currentIndex];
        if (!currentQ) return;
        const nextIndex = currentIndex + 1;

        // Check if this was the last question
        if (nextIndex >= questions.length) {
            finishGame(score);
            return;
        }

        const nextQ = questions[nextIndex];
        if (!nextQ) {
            finishGame(score);
            return;
        }
        const isHigher = nextQ.number > currentQ.number;
        const isCorrect = (guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher);

        const newScore = score + (isCorrect ? 1 : 0);
        setScore(newScore);
        setCurrentIndex(nextIndex);

        if (isCorrect) {
            playSound(SOUNDS.SUCCESS);
        }

        if (nextIndex >= questions.length - 1) { // If we just answered the last comparison
            finishGame(newScore);
        }
    }

    const finishGame = (finalScore: number) => {
        setGameState('completed');
        const xpEarned = finalScore * 5;
        setResultMessage(`You scored ${finalScore} out of ${questions.length - 1}! (+${xpEarned} XP)`);
        gainExperience(xpEarned, 'dungeon-event');

        if (finalScore >= (questions.length - 1)) {
            playSound(SOUNDS.LEVEL_UP);
        }

        if (onComplete) onComplete(finalScore);
    }

    const progress = questions.length > 1 ? (currentIndex / (questions.length - 1)) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="bg-gradient-to-b from-purple-950/95 via-zinc-950 to-zinc-950 border-purple-800/30 shadow-2xl shadow-purple-500/10 overflow-hidden max-w-md max-h-[90vh] p-0 flex flex-col"
                aria-label="Dungeon Event Higher or Lower"
                role="dialog"
                aria-modal="true"
            >
                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {/* Background Effects */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-4 w-8 h-32 bg-gradient-to-b from-orange-500/20 to-transparent blur-xl animate-pulse" />
                        <div className="absolute top-0 right-4 w-8 h-32 bg-gradient-to-b from-orange-500/20 to-transparent blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                    </div>

                    <DialogHeader className="relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                            <DialogTitle className="text-2xl font-serif text-purple-200">The Dungeon Challenge</DialogTitle>
                            <Flame className="w-5 h-5 text-orange-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <DialogDescription className="text-purple-300/70 text-sm italic text-center">
                            You descend into a damp, torch-lit dungeon. A voice from the shadows challenges you...
                            <br />
                            <span className="text-purple-200 font-medium">&quot;Is the next number higher or lower?&quot;</span>
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress Bar */}
                    <div className="relative z-10 w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden border border-purple-800/20 my-4">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {gameState === 'playing' && questions[currentIndex] ? (
                        <div className="relative z-10 space-y-6 py-4">
                            {/* Current Fact Card */}
                            <div className="bg-zinc-900/80 border border-purple-700/30 rounded-lg p-6 text-center shadow-inner">
                                <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                                    {questions[currentIndex].fact}
                                </p>
                            </div>

                            {/* Choice Buttons */}
                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={() => handleGuess('higher')}
                                    className="flex-1 h-20 bg-gradient-to-b from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 border border-emerald-600/30 text-emerald-100 font-serif text-xl gap-2 shadow-lg shadow-emerald-900/30 rounded-xl"
                                >
                                    <ChevronUp className="w-8 h-8" />
                                    Higher
                                </Button>
                                <Button
                                    onClick={() => handleGuess('lower')}
                                    className="flex-1 h-20 bg-gradient-to-b from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 border border-red-600/30 text-red-100 font-serif text-xl gap-2 shadow-lg shadow-red-900/30 rounded-xl"
                                >
                                    <ChevronDown className="w-8 h-8" />
                                    Lower
                                </Button>
                            </div>

                            {/* Score Display */}
                            <div className="flex items-center justify-center gap-2 text-purple-300/70">
                                <Skull className="w-4 h-4" />
                                <span className="text-sm font-medium">Current Score: {score}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 space-y-6 py-8 text-center">
                            <div className={cn(
                                "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
                                score >= (questions.length - 1)
                                    ? "bg-amber-500/20 border-2 border-amber-400/50"
                                    : "bg-purple-500/20 border-2 border-purple-400/50"
                            )}>
                                <Trophy className={cn(
                                    "w-10 h-10",
                                    score >= (questions.length - 1) ? "text-amber-400" : "text-purple-400"
                                )} />
                            </div>
                            <div>
                                <h3 className={cn(
                                    "text-2xl font-serif mb-2",
                                    score >= (questions.length - 1) ? "text-amber-300" : "text-purple-200"
                                )}>
                                    {score >= (questions.length - 1) ? "Perfect Victory!" : "Challenge Complete"}
                                </h3>
                                <p className="text-zinc-300">{resultMessage}</p>
                            </div>
                            <Button
                                className="w-full h-12 bg-purple-700 hover:bg-purple-600 text-white font-serif rounded-xl shadow-lg shadow-purple-900/40"
                                onClick={onClose}
                            >
                                Leave the Dungeon
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

