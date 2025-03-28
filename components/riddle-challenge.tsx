"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Sparkles, Award, Coins, Brain } from "lucide-react"

// Medieval-themed riddles with answers
const riddles = [
  {
    question:
      "I'm the beginning of eternity, the end of time and space, the beginning of every end, and the end of every place. What am I?",
    options: ["Death", "The letter E", "Infinity", "God"],
    answer: "The letter E",
  },
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    options: ["Echo", "Ghost", "Thought", "Shadow"],
    answer: "Echo",
  },
  {
    question: "The more you take, the more you leave behind. What am I?",
    options: ["Footsteps", "Memories", "Time", "Breath"],
    answer: "Footsteps",
  },
  {
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    options: ["A dream", "A map", "A painting", "A story"],
    answer: "A map",
  },
  {
    question: "What has keys but no locks, space but no room, and you can enter but not go in?",
    options: ["A keyboard", "A dream", "A puzzle", "A book"],
    answer: "A keyboard",
  },
  {
    question:
      "I am taken from a mine, and shut up in a wooden case, from which I am never released, and yet I am used by almost every person. What am I?",
    options: ["Gold", "Diamond", "Pencil lead", "Coal"],
    answer: "Pencil lead",
  },
  {
    question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    options: ["The letter M", "Time", "Death", "Breath"],
    answer: "The letter M",
  },
  {
    question: "I'm light as a feather, yet the strongest man cannot hold me for much more than a minute. What am I?",
    options: ["Breath", "Thought", "Time", "Hope"],
    answer: "Breath",
  },
  {
    question: "I'm tall when I'm young, and I'm short when I'm old. What am I?",
    options: ["A mountain", "A candle", "A tree", "A shadow"],
    answer: "A candle",
  },
  {
    question: "What has a head, a tail, is brown, and has no legs?",
    options: ["A penny", "A snake", "A worm", "A fish"],
    answer: "A penny",
  },
  {
    question: "Forward I am heavy, but backward I am not. What am I?",
    options: ["The word 'ton'", "A burden", "A promise", "A secret"],
    answer: "The word 'ton'",
  },
  {
    question: "What belongs to you, but others use it more than you do?",
    options: ["Your name", "Your shadow", "Your time", "Your heart"],
    answer: "Your name",
  },
]

interface RiddleChallengeProps {
  onEarnXp?: (amount: number) => void
  onSpendGold?: (amount: number) => void
  gold?: number
}

export function RiddleChallenge({ onEarnXp, onSpendGold, gold = 1000 }: RiddleChallengeProps) {
  const [currentRiddle, setCurrentRiddle] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    goldSpent: 0,
    xpEarned: 0,
  })
  const [showAnswer, setShowAnswer] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { toast } = useToast()

  // Get a random riddle
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * riddles.length)
    setCurrentRiddle(randomIndex)
    setSelectedOption(null)
    setIsCorrect(null)
    setShowAnswer(false)
  }, [])

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return // Prevent multiple selections

    setSelectedOption(option)
    const correct = option === riddles[currentRiddle].answer
    setIsCorrect(correct)

    if (correct) {
      // Award XP for correct answer
      const xpAmount = 50
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        xpEarned: prev.xpEarned + xpAmount,
      }))

      if (onEarnXp) onEarnXp(xpAmount)

      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)

      toast({
        title: "Correct!",
        description: `You've earned ${xpAmount} XP for your wisdom!`,
        variant: "default",
      })
    } else {
      // Deduct gold for incorrect answer
      const goldAmount = 50

      if (gold >= goldAmount) {
        setStats((prev) => ({
          ...prev,
          incorrect: prev.incorrect + 1,
          goldSpent: prev.goldSpent + goldAmount,
        }))

        if (onSpendGold) onSpendGold(goldAmount)

        toast({
          title: "Incorrect!",
          description: `You've lost ${goldAmount} gold coins. Try again!`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Not enough gold!",
          description: "You need at least 50 gold to attempt this riddle.",
          variant: "destructive",
        })
      }
    }

    // Show the correct answer after a delay
    setTimeout(() => {
      setShowAnswer(true)
    }, 1000)
  }

  const handleNextRiddle = () => {
    const randomIndex = Math.floor(Math.random() * riddles.length)
    setCurrentRiddle(randomIndex)
    setSelectedOption(null)
    setIsCorrect(null)
    setShowAnswer(false)
  }

  return (
    <Card className="medieval-card w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-amber-800/10 border-b border-amber-800/20">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medieval flex items-center">
            <Brain className="mr-2 h-5 w-5" /> Riddle Challenge
          </CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Award className="mr-1 h-3 w-3" /> {stats.correct} Correct
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              <Coins className="mr-1 h-3 w-3" /> {stats.goldSpent} Gold Spent
            </Badge>
          </div>
        </div>
        <CardDescription>Answer correctly to earn 50 XP. Wrong answers cost 50 gold.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="scroll-decoration p-4 mb-4">
          <p className="text-lg font-medieval mb-4">{riddles[currentRiddle].question}</p>

          <div className="grid grid-cols-1 gap-2 mt-4">
            {riddles[currentRiddle].options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedOption === option
                    ? isCorrect
                      ? "default"
                      : "destructive"
                    : showAnswer && option === riddles[currentRiddle].answer
                      ? "default"
                      : "outline"
                }
                className={`justify-start text-left p-4 h-auto ${
                  selectedOption === option && isCorrect ? "bg-green-600 hover:bg-green-700" : ""
                } ${
                  showAnswer && option === riddles[currentRiddle].answer && selectedOption !== option
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                } hover-scale btn-click-effect`}
                onClick={() => handleOptionSelect(option)}
                disabled={selectedOption !== null}
              >
                <span className="mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                {selectedOption === option && isCorrect && (
                  <Sparkles className={`ml-auto h-5 w-5 ${isAnimating ? "animate-pulse" : ""}`} />
                )}
              </Button>
            ))}
          </div>

          {showAnswer && (
            <div
              className={`mt-4 p-3 rounded-md ${isCorrect ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}
            >
              <p className="font-medieval">
                {isCorrect
                  ? "Well done, wise one! Your answer is correct."
                  : `The correct answer is: ${riddles[currentRiddle].answer}`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-amber-800/20 pt-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medieval">XP Earned: {stats.xpEarned}</span>
        </div>
        {showAnswer && (
          <Button onClick={handleNextRiddle} className="btn-primary-gradient hover-float btn-click-effect">
            Next Riddle
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

