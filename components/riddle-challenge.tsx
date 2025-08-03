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
  // 30 new riddles for more variation
  {
    question: "What has roots as nobody sees, is taller than trees, up, up it goes, and yet never grows?",
    options: ["A mountain", "A river", "A castle", "A tree"],
    answer: "A mountain",
  },
  {
    question: "Voiceless it cries, wingless flutters, toothless bites, mouthless mutters. What is it?",
    options: ["The wind", "A ghost", "A river", "A bell"],
    answer: "The wind",
  },
  {
    question: "It cannot be seen, cannot be felt, cannot be heard, cannot be smelt. It lies behind stars and under hills, and empty holes it fills. What is it?",
    options: ["Darkness", "Water", "Air", "Gold"],
    answer: "Darkness",
  },
  {
    question: "Alive without breath, as cold as death; never thirsty, ever drinking, all in mail never clinking. What is it?",
    options: ["Fish", "Knight", "Wind", "Stone"],
    answer: "Fish",
  },
  {
    question: "This thing all things devours: birds, beasts, trees, flowers; gnaws iron, bites steel; grinds hard stones to meal; slays king, ruins town, and beats high mountain down. What is it?",
    options: ["Time", "Fire", "Water", "Wind"],
    answer: "Time",
  },
  {
    question: "What walks on four legs in the morning, two legs at noon, and three legs in the evening?",
    options: ["A human", "A dog", "A dragon", "A horse"],
    answer: "A human",
  },
  {
    question: "What has one eye but cannot see?",
    options: ["A needle", "A storm", "A bat", "A coin"],
    answer: "A needle",
  },
  {
    question: "What gets wetter as it dries?",
    options: ["A towel", "A river", "A sponge", "A cloud"],
    answer: "A towel",
  },
  {
    question: "What can travel around the world while staying in a corner?",
    options: ["A stamp", "A shadow", "A coin", "A map"],
    answer: "A stamp",
  },
  {
    question: "What has a heart that doesn't beat?",
    options: ["An artichoke", "A stone", "A castle", "A tree"],
    answer: "An artichoke",
  },
  {
    question: "What comes down but never goes up?",
    options: ["Rain", "Sun", "Wind", "Smoke"],
    answer: "Rain",
  },
  {
    question: "What has many keys but can't open a single lock?",
    options: ["A piano", "A chest", "A map", "A door"],
    answer: "A piano",
  },
  {
    question: "What has hands but can't clap?",
    options: ["A clock", "A statue", "A king", "A tree"],
    answer: "A clock",
  },
  {
    question: "What has a neck but no head?",
    options: ["A bottle", "A river", "A knight", "A tree"],
    answer: "A bottle",
  },
  {
    question: "What has an endless supply of letters but starts empty?",
    options: ["A mailbox", "A book", "A scroll", "A chest"],
    answer: "A mailbox",
  },
  {
    question: "What is full of holes but still holds water?",
    options: ["A sponge", "A net", "A bucket", "A boot"],
    answer: "A sponge",
  },
  {
    question: "What is always in front of you but can't be seen?",
    options: ["The future", "The wind", "A ghost", "A shadow"],
    answer: "The future",
  },
  {
    question: "What can you catch but not throw?",
    options: ["A cold", "A ball", "A fish", "A shadow"],
    answer: "A cold",
  },
  {
    question: "What kind of room has no doors or windows?",
    options: ["A mushroom", "A dungeon", "A tomb", "A cave"],
    answer: "A mushroom",
  },
  {
    question: "What has a ring but no finger?",
    options: ["A bell", "A king", "A knight", "A sword"],
    answer: "A bell",
  },
  {
    question: "What is so fragile that saying its name breaks it?",
    options: ["Silence", "Glass", "A promise", "A heart"],
    answer: "Silence",
  },
  {
    question: "What can fill a room but takes up no space?",
    options: ["Light", "Air", "Sound", "A shadow"],
    answer: "Light",
  },
  {
    question: "What has a thumb and four fingers but is not alive?",
    options: ["A glove", "A statue", "A handprint", "A puppet"],
    answer: "A glove",
  },
  {
    question: "What invention lets you look right through a wall?",
    options: ["A window", "A mirror", "A door", "A painting"],
    answer: "A window",
  },
  {
    question: "What can be cracked, made, told, and played?",
    options: ["A joke", "A code", "A whip", "A song"],
    answer: "A joke",
  },
  {
    question: "What has a bed but never sleeps, and runs but never walks?",
    options: ["A river", "A horse", "A clock", "A road"],
    answer: "A river",
  },
  {
    question: "What has teeth but can't bite?",
    options: ["A comb", "A saw", "A dragon", "A wolf"],
    answer: "A comb",
  },
  {
    question: "What has legs but doesn't walk?",
    options: ["A table", "A horse", "A spider", "A chair"],
    answer: "A table",
  },
  {
    question: "What runs all around a castle but never moves?",
    options: ["A wall", "A moat", "A guard", "A road"],
    answer: "A wall",
  },
  {
    question: "What can you hold in your left hand but not in your right?",
    options: ["Your right hand", "A sword", "A shield", "A ring"],
    answer: "Your right hand",
  },
  {
    question: "What has a spine but no bones?",
    options: ["A book", "A fish", "A dragon", "A snake"],
    answer: "A book",
  },
  {
    question: "What is easy to lift but hard to throw?",
    options: ["A feather", "A stone", "A coin", "A sword"],
    answer: "A feather",
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

  // Define currentRiddleData once for the whole component
  const currentRiddleData = riddles[currentRiddle] || null

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
    // Use currentRiddleData from component scope
    const correct = currentRiddleData ? option === currentRiddleData.answer : false
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
            <Badge className="text-amber-300 border-amber-800/20">
              <Award className="mr-1 h-3 w-3" /> {stats.correct} Correct
            </Badge>
            <Badge className="text-amber-300 border-amber-800/20">
              <Coins className="mr-1 h-3 w-3" /> {stats.goldSpent} Gold Spent
            </Badge>
          </div>
        </div>
        <CardDescription>Answer correctly to earn 50 XP. Wrong answers cost 50 gold.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="scroll-decoration p-4 mb-4">
          <p className="text-lg font-medieval mb-4">
            {currentRiddleData ? currentRiddleData.question : ""}
          </p>

          <div className="grid grid-cols-1 gap-2 mt-4">
            {currentRiddleData &&
              currentRiddleData.options.map((option: string, index: number) => {
                let variant: "default" | "destructive" | "outline" = "outline";
                if (selectedOption === option) {
                  variant = isCorrect ? "default" : "destructive";
                } else if (showAnswer && option === currentRiddleData.answer) {
                  variant = "default";
                }

                let extraClass = "";
                if (selectedOption === option && isCorrect) {
                  extraClass = "bg-green-600 hover:bg-green-700";
                } else if (
                  showAnswer &&
                  option === currentRiddleData.answer &&
                  selectedOption !== option
                ) {
                  extraClass = "bg-green-600 hover:bg-green-700";
                }

                return (
                  <Button
                    key={index}
                    variant={variant}
                    className={`justify-start text-left p-4 h-auto ${extraClass} hover-scale btn-click-effect`}
                    onClick={() => handleOptionSelect(option)}
                    disabled={selectedOption !== null}
                  >
                    <span className="mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                    {selectedOption === option && isCorrect && (
                      <Sparkles className={`ml-auto h-5 w-5 ${isAnimating ? "animate-pulse" : ""}`} />
                    )}
                  </Button>
                );
              })}
          </div>

          {showAnswer && (
            <div
              className={`mt-4 p-3 rounded-md ${
                isCorrect
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              }`}
            >
              <p className="font-medieval">
                {isCorrect
                  ? "Well done, wise one! Your answer is correct."
                  : `The correct answer is: ${currentRiddleData ? currentRiddleData.answer : ""}`}
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

