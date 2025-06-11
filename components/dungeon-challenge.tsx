"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sword,
  Shield,
  Skull,
  Key,
  Coins,
  Gem,
  Crown,
  Scroll,
  Beaker,
  BellRingIcon,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface MemoryCard {
  id: number
  type: string
  flipped: boolean
  matched: boolean
}

interface DungeonChallengeProps {
  difficulty: "easy" | "medium" | "hard"
  onComplete: (success: boolean) => void
}

export function DungeonChallenge({ difficulty, onComplete }: DungeonChallengeProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [dungeonLevel, setDungeonLevel] = useState<number>(1)
  const [maxDungeonLevel, setMaxDungeonLevel] = useState<number>(3)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [gameResult, setGameResult] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [timerActive, setTimerActive] = useState<boolean>(false)

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [difficulty, dungeonLevel])

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerActive) {
      // Time's up
      setGameOver(true)
      setGameResult("Time's up! You failed to clear the dungeon.")
      onComplete(false)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [timerActive, timeLeft, onComplete])

  const initializeGame = () => {
    // Set max dungeon level based on difficulty
    const maxLevels = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5
    setMaxDungeonLevel(maxLevels)

    // Set time based on difficulty
    const levelTime = difficulty === "easy" ? 60 : difficulty === "medium" ? 50 : 40
    setTimeLeft(levelTime)

    // Create cards based on difficulty and level
    let numPairs = 4 // Base number of pairs

    // Increase pairs based on difficulty and level
    if (difficulty === "medium") numPairs += 1
    if (difficulty === "hard") numPairs += 2
    numPairs += Math.min(2, dungeonLevel - 1) // Add more pairs for higher levels

    // Available card types
    const cardTypes = ["key", "coins", "gem", "crown", "scroll", "potion", "ring", "sword", "shield"]

    // Select random card types for this level
    const selectedTypes = cardTypes.sort(() => Math.random() - 0.5).slice(0, numPairs)

    // Create pairs
    const cardPairs = selectedTypes.flatMap((type) => [type, type])

    // Shuffle cards
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((type, index) => ({
        id: index,
        type,
        flipped: false,
        matched: false,
      }))

    setCards(shuffledCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setGameOver(false)
    setGameResult("")
    setTimerActive(true)
  }

  // Handle card click
  const handleCardClick = (id: number) => {
    // Prevent clicking if already checking a pair or card is already flipped/matched
    if (
      isChecking ||
      flippedCards.length >= 2 ||
      flippedCards.includes(id) ||
      cards.find((card) => card.id === id)?.matched ||
      gameOver
    ) {
      return
    }

    // Flip the card
    const newCards = cards.map((card) => (card.id === id ? { ...card, flipped: true } : card))
    setCards(newCards)

    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // Check for a match if we have 2 flipped cards
    if (newFlippedCards.length === 2) {
      setIsChecking(true)
      setTimeout(() => checkForMatch(newFlippedCards), 1000)
    }
  }

  // Check if the two flipped cards match
  const checkForMatch = (flippedCardIds: number[]) => {
    const [firstId, secondId] = flippedCardIds
    const firstCard = cards.find((card) => card.id === firstId)
    const secondCard = cards.find((card) => card.id === secondId)

    if (firstCard?.type === secondCard?.type) {
      // Match found
      const newCards = cards.map((card) =>
        card.id === firstId || card.id === secondId ? { ...card, matched: true } : card,
      )
      setCards(newCards)
      setMatchedPairs((prev) => prev + 1)
    } else {
      // No match, flip cards back
      const newCards = cards.map((card) =>
        card.id === firstId || card.id === secondId ? { ...card, flipped: false } : card,
      )
      setCards(newCards)
    }

    // Reset flipped cards
    setFlippedCards([])
    setIsChecking(false)

    // Check level completion
    setTimeout(() => checkLevelCompletion(), 300)
  }

  // Check if the level is complete
  const checkLevelCompletion = () => {
    if (matchedPairs === cards.length / 2) {
      // Level complete
      if (dungeonLevel < maxDungeonLevel) {
        // Move to next level
        setTimerActive(false)
        setTimeout(() => {
          setDungeonLevel((prev) => prev + 1)
        }, 1000)
      } else {
        // Dungeon cleared
        setGameOver(true)
        setGameResult("Congratulations! You cleared the dungeon!")
        setTimerActive(false)
        onComplete(true)
      }
    }
  }

  // Handle fleeing the dungeon
  const handleFlee = () => {
    setGameOver(true)
    setGameResult("You fled the dungeon!")
    setTimerActive(false)
    onComplete(false)
  }

  // Render card icon based on type
  const renderCardIcon = (type: string) => {
    switch (type) {
      case "key":
        return <Key className="h-10 w-10 text-yellow-400" />
      case "coins":
        return <Coins className="h-10 w-10 text-yellow-500" />
      case "gem":
        return <Gem className="h-10 w-10 text-blue-400" />
      case "crown":
        return <Crown className="h-10 w-10 text-amber-500" />
      case "scroll":
        return <Scroll className="h-10 w-10 text-amber-200" />
      case "potion":
        return <Beaker className="h-10 w-10 text-purple-400" />
      case "ring":
        return <BellRingIcon className="h-10 w-10 text-amber-400" />
      case "sword":
        return <Sword className="h-10 w-10 text-red-400" />
      case "shield":
        return <Shield className="h-10 w-10 text-blue-400" />
      default:
        return <Skull className="h-10 w-10 text-gray-400" />
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            Dungeon Level: {dungeonLevel}/{maxDungeonLevel}
          </span>
          <div className="flex-1">
            <Progress
              value={(dungeonLevel / maxDungeonLevel) * 100}
              className="h-2 [&>div]:bg-amber-500 bg-gray-700"
              aria-label="Dungeon level progress"
            />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-lg font-bold">Time Left: {timeLeft}s</span>
          <div className="w-full max-w-[200px]">
            <Progress
              value={(timeLeft / (difficulty === "easy" ? 60 : difficulty === "medium" ? 50 : 40)) * 100}
              className={`h-2 ${timeLeft < 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"} bg-gray-700`}
              aria-label="Time remaining progress"
            />
          </div>
        </div>
      </div>

      {gameOver ? (
        <div 
          className="mb-6 p-4 bg-gray-800 rounded-lg text-center"
          role="alert"
          aria-live="polite"
        >
          <h3 className="text-xl font-bold mb-2">{gameResult}</h3>
          <Button 
            onClick={() => initializeGame()} 
            className="bg-amber-600 hover:bg-amber-700 mr-2"
            aria-label="Try dungeon again"
          >
            Try Again
          </Button>
          <Button
            onClick={() => onComplete(false)}
            variant="outline"
            className="border-amber-800/20 hover:bg-amber-900/20"
            aria-label="Return to map"
          >
            Return to Map
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex justify-between">
          <div>
            <span className="text-sm">
              Pairs Found: {matchedPairs}/{cards.length / 2}
            </span>
          </div>
          <Button 
            onClick={handleFlee} 
            variant="outline" 
            className="border-red-800/20 hover:bg-red-900/20 text-red-400"
            aria-label="Flee from dungeon"
          >
            Flee Dungeon
          </Button>
        </div>
      )}

      <div 
        className="grid grid-cols-3 md:grid-cols-4 gap-4"
        aria-label="Memory card grid"
        role="grid"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`
              aspect-square cursor-pointer transition-all duration-300 transform
              ${card.flipped || card.matched ? "rotate-y-180" : ""}
              ${gameOver ? "pointer-events-none" : ""}
            `}
            role="gridcell"
            aria-label={card.flipped || card.matched ? `${card.type} card` : "Unflipped card"}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCardClick(card.id)
              }
            }}
          >
            <Card
              className={`
              w-full h-full flex items-center justify-center
              ${card.flipped || card.matched ? "bg-amber-800 text-white" : "bg-gray-700 hover:bg-gray-600"}
              transition-colors duration-300
            `}
            >
              {card.flipped || card.matched ? (
                <div className="flex items-center justify-center h-full w-full">{renderCardIcon(card.type)}</div>
              ) : (
                <div className="text-3xl text-gray-400">?</div>
              )}
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p>Find all matching pairs to progress through the dungeon.</p>
        <p>Complete all {maxDungeonLevel} levels to clear the dungeon and claim your reward!</p>
      </div>
    </div>
  )
} 