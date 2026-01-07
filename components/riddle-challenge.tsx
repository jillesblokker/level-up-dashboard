"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Sparkles, Award, Coins, Brain, Heart, Star, CheckCircle2, XCircle } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content"
import Image from "next/image"
import { cn } from "@/lib/utils"

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
    question: "I'm light as a feather, yet the strongest hero cannot hold me for much more than a minute. What am I?",
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

  // Get a random riddle on mount
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
    const correct = currentRiddleData ? option === currentRiddleData.answer : false
    setIsCorrect(correct)

    if (correct) {
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
        title: TEXT_CONTENT.riddleChallenge.success.title,
        description: TEXT_CONTENT.riddleChallenge.success.description.replace('{xpAmount}', xpAmount.toString()),
      })
    } else {
      const goldAmount = 50

      if (gold >= goldAmount) {
        setStats((prev) => ({
          ...prev,
          incorrect: prev.incorrect + 1,
          goldSpent: prev.goldSpent + goldAmount,
        }))

        if (onSpendGold) onSpendGold(goldAmount)

        toast({
          title: TEXT_CONTENT.riddleChallenge.failure.title,
          description: TEXT_CONTENT.riddleChallenge.failure.description.replace('{goldAmount}', goldAmount.toString()),
          variant: "destructive",
        })
      } else {
        toast({
          title: TEXT_CONTENT.riddleChallenge.insufficientGold.title,
          description: TEXT_CONTENT.riddleChallenge.insufficientGold.description,
          variant: "destructive",
        })
      }
    }

    setTimeout(() => {
      setShowAnswer(true)
    }, 800)
  }

  const handleNextRiddle = () => {
    const randomIndex = Math.floor(Math.random() * riddles.length)
    setCurrentRiddle(randomIndex)
    setSelectedOption(null)
    setIsCorrect(null)
    setShowAnswer(false)
  }

  return (
    <Card className="relative bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none" />

      <CardHeader className="bg-zinc-900/50 border-b border-white/5 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-serif text-white uppercase tracking-tight">
                {TEXT_CONTENT.riddleChallenge.ui.title}
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs font-medium">
                {TEXT_CONTENT.riddleChallenge.ui.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-amber-400 font-bold px-3 py-1 gap-1.5 h-8">
              <Star className="h-3 w-3 fill-amber-400" /> {stats.correct}
            </Badge>
            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-400 font-bold px-3 py-1 gap-1.5 h-8">
              <Coins className="h-3 w-3" /> {stats.goldSpent}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-4 px-8 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* Sage Portrait Container */}
        <div className="relative shrink-0 mt-2">
          {/* Animated Rings */}
          <div className="absolute inset-0 rounded-full blur-2xl bg-purple-500/20 animate-pulse scale-110" />
          <div className="absolute -inset-3 border border-dashed border-purple-500/30 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />

          <div className="relative w-36 h-36 rounded-full border-2 border-purple-500/40 p-1 bg-zinc-900 shadow-2xl">
            <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10">
              <Image
                src="/images/riddle-sage.png"
                alt="Celestial Sage"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* Decorative Floating Icon */}
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-zinc-900 border border-purple-500/50 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 mb-8 relative">
            <div className="absolute top-0 left-6 -translate-y-1/2 px-3 py-0.5 bg-purple-600 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
              The Question
            </div>
            <p className="text-xl font-serif text-white leading-relaxed italic">
              &quot;{currentRiddleData ? currentRiddleData.question : ""}&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRiddleData &&
              currentRiddleData.options.map((option: string, index: number) => {
                const isSelected = selectedOption === option;
                const isCorrectAnswer = option === currentRiddleData.answer;

                let buttonStyle = "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700";

                if (showAnswer) {
                  if (isCorrectAnswer) {
                    buttonStyle = "bg-green-500/20 border-green-500/50 text-green-400";
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonStyle = "bg-red-500/20 border-red-500/50 text-red-400";
                  } else {
                    buttonStyle = "bg-zinc-900/50 border-zinc-800/50 text-zinc-500 opacity-50";
                  }
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={selectedOption !== null}
                    className={cn(
                      "group relative h-14 justify-start px-6 rounded-xl border-2 transition-all duration-300 font-medium overflow-hidden",
                      buttonStyle
                    )}
                  >
                    <span className="relative z-10 flex items-center w-full">
                      <span className="mr-3 text-xs font-bold opacity-50 bg-white/5 w-6 h-6 flex items-center justify-center rounded-md">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                      {showAnswer && isCorrectAnswer && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-green-400" />
                      )}
                      {showAnswer && isSelected && !isCorrectAnswer && (
                        <XCircle className="ml-auto h-5 w-5 text-red-400" />
                      )}
                    </span>
                  </Button>
                );
              })}
          </div>

          {showAnswer && (
            <div className={cn(
              "mt-8 p-4 rounded-xl border animate-in slide-in-from-top-2 flex items-center gap-4",
              isCorrect ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isCorrect ? "bg-green-500/20" : "bg-amber-500/20"
              )}>
                {isCorrect ? <Award className="w-6 h-6 text-green-400" /> : <Star className="w-6 h-6 text-amber-400" />}
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {isCorrect
                  ? TEXT_CONTENT.riddleChallenge.ui.correctOverlay
                  : TEXT_CONTENT.riddleChallenge.ui.incorrectOverlay.replace('{answer}', currentRiddleData ? currentRiddleData.answer : "")}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-900/30 border-t border-white/5 p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Total Earnings</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> {stats.xpEarned} XP
              </span>
            </div>
          </div>
        </div>

        {showAnswer && (
          <Button
            onClick={handleNextRiddle}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-purple-950/20 animate-in zoom-in-95 duration-300"
          >
            Next Riddle
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
