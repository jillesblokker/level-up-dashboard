"use client"

import { useState, useEffect } from "react"
import { Shield, Sword } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MemoryCard {
  id: number
  type: "sword" | "shield"
  flipped: boolean
  matched: boolean
}

interface MonsterBattleProps {
  difficulty: "easy" | "medium" | "hard"
  monsterType: string
  onComplete: (success: boolean) => void
}

export function MonsterBattle({ difficulty, monsterType, onComplete }: MonsterBattleProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [playerHealth, setPlayerHealth] = useState<number>(100)
  const [monsterHealth, setMonsterHealth] = useState<number>(100)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [gameResult, setGameResult] = useState<string>("")
  const [isChecking, setIsChecking] = useState<boolean>(false)

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [difficulty])

  const initializeGame = () => {
    // Create cards based on difficulty
    let numPairs = 6 // Default for easy
    if (difficulty === "medium") numPairs = 8
    if (difficulty === "hard") numPairs = 10

    const totalCards = numPairs * 2

    // Create half swords, half shields
    const swordCount = Math.floor(numPairs / 2)
    const shieldCount = numPairs - swordCount

    const cardTypes: ("sword" | "shield")[] = [
      ...Array(swordCount).fill("sword" as const).flatMap(() => ["sword", "sword"] as const),
      ...Array(shieldCount).fill("shield" as const).flatMap(() => ["shield", "shield"] as const)
    ]

    // Shuffle cards
    const shuffledCards = [...cardTypes]
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
    setPlayerHealth(100)
    setMonsterHealth(100)
    setGameOver(false)
    setGameResult("")
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

      // Apply game effects based on card type
      if (firstCard?.type === "sword") {
        // Sword pair damages monster (40 damage)
        setMonsterHealth((prev) => Math.max(0, prev - 40))
      } else if (firstCard?.type === "shield") {
        // Shield pair heals player (20 health)
        setPlayerHealth((prev) => Math.min(100, prev + 20))
      }
    } else {
      // No match, flip cards back
      const newCards = cards.map((card) =>
        card.id === firstId || card.id === secondId ? { ...card, flipped: false } : card,
      )
      setCards(newCards)

      // Monster attacks player when no match is found (15 damage)
      setPlayerHealth((prev) => Math.max(0, prev - 15))
    }

    // Reset flipped cards
    setFlippedCards([])
    setIsChecking(false)

    // Check game end conditions
    setTimeout(() => checkGameEnd(), 300)
  }

  // Check if the game is over
  const checkGameEnd = () => {
    if (monsterHealth <= 0) {
      setGameOver(true)
      setGameResult("You defeated the monster!")
      onComplete(true)
    } else if (playerHealth <= 0) {
      setGameOver(true)
      setGameResult("The monster defeated you!")
      onComplete(false)
    } else if (matchedPairs === cards.length / 2) {
      // All pairs found but neither player nor monster is defeated
      setGameOver(true)
      if (playerHealth > monsterHealth) {
        setGameResult("You defeated the monster!")
        onComplete(true)
      } else if (monsterHealth > playerHealth) {
        setGameResult("The monster defeated you!")
        onComplete(false)
      } else {
        setGameResult("It's a draw!")
        onComplete(true) // Consider a draw as a success
      }
    }
  }

  // Get monster image based on type
  const getMonsterImage = () => {
    switch (monsterType.toLowerCase()) {
      case "goblin":
        return "👺"
      case "wolf":
        return "🐺"
      case "bandit":
        return "🦹‍♂️"
      case "skeleton":
        return "💀"
      case "troll":
        return "👹"
      default:
        return "👾"
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col items-start">
          <span className="text-lg font-bold mb-1">Player:</span>
          <div className="w-full max-w-[200px]">
            <Progress value={playerHealth} className="h-4 [&>div]:bg-green-500 bg-gray-700" />
            <span className="text-sm">{playerHealth}/100</span>
          </div>
        </div>

        <div className="text-4xl animate-pulse">{getMonsterImage()}</div>

        <div className="flex flex-col items-end">
          <span className="text-lg font-bold mb-1">Monster:</span>
          <div className="w-full max-w-[200px]">
            <Progress value={monsterHealth} className="h-4 [&>div]:bg-red-500 bg-gray-700" />
            <span className="text-sm">{monsterHealth}/100</span>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">{gameResult}</h3>
          <Button onClick={initializeGame} className="bg-amber-600 hover:bg-amber-700">
            Play Again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`
              aspect-square cursor-pointer transition-all duration-300 transform
              ${card.flipped || card.matched ? "rotate-y-180" : ""}
              ${gameOver ? "pointer-events-none" : ""}
            `}
          >
            <Card
              className={`
              w-full h-full flex items-center justify-center
              ${card.flipped || card.matched ? "bg-amber-800 text-white" : "bg-gray-700 hover:bg-gray-600"}
              transition-colors duration-300
            `}
            >
              {card.flipped || card.matched ? (
                <div className="flex items-center justify-center h-full w-full">
                  {card.type === "sword" ? (
                    <Sword className="h-10 w-10 text-red-400" />
                  ) : (
                    <Shield className="h-10 w-10 text-blue-400" />
                  )}
                </div>
              ) : (
                <div className="text-3xl text-gray-400">?</div>
              )}
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p>Match sword pairs to attack the monster (40 damage)</p>
        <p>Match shield pairs to heal yourself (20 health)</p>
        <p>Failed matches allow the monster to attack you (15 damage)</p>
      </div>
    </div>
  )
}

