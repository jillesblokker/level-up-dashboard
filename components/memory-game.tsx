"use client"

import { useState, useEffect } from "react"
import { Shield, Sword } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface MemoryCard {
  id: number
  type: "sword" | "shield"
  flipped: boolean
  matched: boolean
}

export function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [playerHealth, setPlayerHealth] = useState<number>(3)
  const [monsterHealth, setMonsterHealth] = useState<number>(5)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [gameResult, setGameResult] = useState<string>("")
  const [isChecking, setIsChecking] = useState<boolean>(false)

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
    // Create 12 cards (6 pairs)
    const cardTypes: ("sword" | "shield")[] = [
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "shield",
      "shield",
      "shield",
      "shield",
      "shield",
      "shield",
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
    setPlayerHealth(3)
    setMonsterHealth(5)
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
        // Sword pair damages monster
        setMonsterHealth((prev) => Math.max(0, prev - 1))
      } else if (firstCard?.type === "shield") {
        // Shield pair heals player
        setPlayerHealth((prev) => prev + 1)
      }
    } else {
      // No match, flip cards back
      const newCards = cards.map((card) =>
        card.id === firstId || card.id === secondId ? { ...card, flipped: false } : card,
      )
      setCards(newCards)

      // Monster attacks player when no match is found
      setPlayerHealth((prev) => Math.max(0, prev - 1))
    }

    // Reset flipped cards
    setFlippedCards([])
    setIsChecking(false)

    // Check game end conditions
    checkGameEnd()
  }

  // Check if the game is over
  const checkGameEnd = () => {
    if (monsterHealth <= 0) {
      setGameOver(true)
      setGameResult("You defeated the monster!")
    } else if (playerHealth <= 0) {
      setGameOver(true)
      setGameResult("The monster defeated you!")
    } else if (matchedPairs === 6) {
      // All pairs found but neither player nor monster is defeated
      setGameOver(true)
      setGameResult("It's a draw!")
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <span className="text-lg font-bold mr-2">Player:</span>
          <div className="flex">
            {[...Array(playerHealth)].map((_, i) => (
              <div key={i} className="w-6 h-6 text-red-500 mr-1">
                ❤️
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-lg font-bold mr-2">Monster:</span>
          <div className="flex">
            {[...Array(monsterHealth)].map((_, i) => (
              <div key={i} className="w-6 h-6 text-red-500 mr-1">
                ❤️
              </div>
            ))}
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
    </div>
  )
}

