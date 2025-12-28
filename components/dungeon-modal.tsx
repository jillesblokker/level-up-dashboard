"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { gainExperience } from "@/lib/experience-manager"
import { useSound, SOUNDS } from "@/lib/sound-manager"

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent aria-label="Dungeon Event Higher or Lower" role="dialog" aria-modal="true">
                <DialogHeader>
                    <DialogTitle>Medieval Dungeon: Higher or Lower?</DialogTitle>
                    <DialogDescription>You descend into a damp, torch-lit dungeon. Echoes bounce from the walls. A voice from the shadows challenges you to a battle of wit and lore.<br />&quot;Is the next number higher or lower?&quot;</DialogDescription>
                </DialogHeader>

                {gameState === 'playing' && questions[currentIndex] ? (
                    <div className="space-y-4">
                        <div className="text-lg font-semibold text-center">{questions[currentIndex].fact}</div>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => handleGuess('higher')}>Higher</Button>
                            <Button onClick={() => handleGuess('lower')}>Lower</Button>
                        </div>
                        <div className="text-sm text-center text-gray-400">Current Score: {score}</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-lg font-semibold text-center">{resultMessage}</div>
                        <Button className="w-full" onClick={onClose}>Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
