"use client"

import { useState, useEffect } from "react"
import { Dices } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getCharacterStats, addToCharacterStat } from "@/lib/character-stats-service"
import { formatGold, cn } from "@/lib/utils"

export function TavernDiceGame() {
  const [playerLevel, setPlayerLevel] = useState(1)
  const [goldBalance, setGoldBalance] = useState(0)

  // Tavern Dice Game State
  const [diceBetType, setDiceBetType] = useState<'under' | 'exact' | 'over'>('over')
  const [diceBetAmount, setDiceBetAmount] = useState<number>(1000)
  const [isRolling, setIsRolling] = useState(false)
  const [dice1, setDice1] = useState(1)
  const [dice2, setDice2] = useState(6)
  const [rollsToday, setRollsToday] = useState(0)
  const [diceResultMsg, setDiceResultMsg] = useState<string | null>(null)
  const [diceWinStatus, setDiceWinStatus] = useState<'win' | 'lose' | null>(null)

  const loadStats = async () => {
    try {
      const stats = await getCharacterStats()
      if (stats) {
        setPlayerLevel(stats.level || 1)
        setGoldBalance(stats.gold || 0)
      }
    } catch (e) {
      console.error('Error loading stats for dice game:', e)
    }
  }

  useEffect(() => {
    loadStats()
    const todayStr = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem(`tavern_dice_rolls_${todayStr}`)
    if (stored) {
      setRollsToday(parseInt(stored, 10) || 0)
    }

    const handleStatsUpdate = () => loadStats()
    window.addEventListener('character-stats-update', handleStatsUpdate)
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
  }, [])

  const rollDiceGame = async () => {
    if (rollsToday >= 5) {
      toast({
        title: "Barkeep's Rule",
        description: "You've reached your daily limit of 5 rolls max!",
        variant: "destructive",
      })
      return
    }

    if (goldBalance < diceBetAmount) {
      toast({
        title: "Insufficient Gold",
        description: `You need at least ${formatGold(diceBetAmount)} Gold to place this bet.`,
        variant: "destructive",
      })
      return
    }

    setIsRolling(true)
    setDiceResultMsg(null)
    setDiceWinStatus(null)

    try {
      // Deduct bet amount
      await addToCharacterStat('gold', -diceBetAmount, 'tavern-dice-bet')
      setGoldBalance(prev => prev - diceBetAmount)

      // Rolling animation interval
      let count = 0
      const interval = setInterval(() => {
        setDice1(Math.floor(Math.random() * 6) + 1)
        setDice2(Math.floor(Math.random() * 6) + 1)
        count++
        if (count > 8) {
          clearInterval(interval)
          const finalD1 = Math.floor(Math.random() * 6) + 1
          const finalD2 = Math.floor(Math.random() * 6) + 1
          setDice1(finalD1)
          setDice2(finalD2)
          setIsRolling(false)

          const total = finalD1 + finalD2
          let payout = 0

          if (diceBetType === 'under' && total < 7) {
            payout = diceBetAmount * 2
          } else if (diceBetType === 'over' && total > 7) {
            payout = diceBetAmount * 2
          } else if (diceBetType === 'exact' && total === 7) {
            payout = diceBetAmount * 4
          }

          const newRolls = rollsToday + 1
          setRollsToday(newRolls)
          const todayStr = new Date().toISOString().split('T')[0]
          localStorage.setItem(`tavern_dice_rolls_${todayStr}`, String(newRolls))

          if (payout > 0) {
            setDiceWinStatus('win')
            setDiceResultMsg(`You rolled a total of ${total} (${finalD1} + ${finalD2}). You won ${formatGold(payout)} Gold! 🎉`)
            addToCharacterStat('gold', payout, 'tavern-dice-payout')
            setGoldBalance(prev => prev + payout)
          } else {
            setDiceWinStatus('lose')
            setDiceResultMsg(`You rolled a total of ${total} (${finalD1} + ${finalD2}). Better luck next time! 😭`)
          }
        }
      }, 100)
    } catch (e) {
      setIsRolling(false)
      toast({
        title: "Transaction Error",
        description: "Failed to place bet. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="border border-amber-900/30 bg-gradient-to-br from-amber-950/20 via-zinc-950 to-zinc-900/80 rounded-3xl relative overflow-hidden shadow-2xl max-w-2xl mx-auto w-full">
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />

      <CardHeader className="text-center pt-8 px-4 sm:px-6">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            <Dices className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-serif text-amber-400 font-bold">The Green Dragon Tavern</CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto font-serif">
          Step up to the counter, traveler! Wager your gold on a roll of the bones. 
          Get closer to fortune or lose it to the barkeep.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-8 pb-8">
        {/* Daily rolls tracking & purse HUD */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900 gap-2">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Barkeep&apos;s Rule</span>
            <span className="text-xs text-zinc-300 font-medium">Daily Limit: 5 rolls max</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "font-mono text-xs sm:text-sm px-3 py-1 border-2",
              rollsToday >= 5 ? "border-red-500/30 text-red-400 bg-red-950/20" : "border-amber-500/30 text-amber-400 bg-amber-500/5"
            )}>
              {rollsToday} / 5 Played Today
            </Badge>
          </div>
        </div>

        {rollsToday >= 5 ? (
          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 text-center text-red-400 text-xs italic">
            {"\"The Barkeep wipes the glass and nods, 'That's enough excitement for you today, friend. Come back tomorrow!'\""}
          </div>
        ) : (
          <>
            {/* Betting Target */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex justify-center">1. Choose Your Prediction</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(['under', 'exact', 'over'] as const).map((type) => {
                  const label = type === 'under' ? 'Under 7' : type === 'exact' ? 'Exactly 7' : 'Over 7';
                  const multiplier = type === 'exact' ? '4x Payout' : '2x Payout';
                  const selected = diceBetType === type;
                  return (
                    <button
                      key={type}
                      disabled={isRolling}
                      onClick={() => { setDiceBetType(type); setDiceResultMsg(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer min-h-[54px]",
                        selected
                          ? "border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      <span className="text-xs sm:text-sm font-serif font-bold">{label}</span>
                      <span className="text-[9px] sm:text-[10px] font-mono opacity-80 mt-0.5">{multiplier}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Betting Amount */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex justify-center">2. Set Your Wager (Gold)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[1000, 10000, 50000, 100000].map((amount) => {
                  const selected = diceBetAmount === amount;
                  const displayLabel = amount === 1000 ? "1.000" : amount === 10000 ? "10.000" : amount === 50000 ? "50.000" : "100.000";
                  const requiredLevel = amount === 10000 ? 10 : amount === 50000 ? 20 : amount === 100000 ? 30 : 1;
                  const isLocked = playerLevel < requiredLevel;
                  return (
                    <button
                      key={amount}
                      disabled={isRolling || isLocked}
                      onClick={() => { setDiceBetAmount(amount); setDiceResultMsg(null); }}
                      className={cn(
                        "relative px-3 sm:px-4 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer w-full",
                        selected
                          ? "border-amber-500 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-[1.02]"
                          : isLocked
                          ? "border-zinc-900 bg-zinc-950/10 text-zinc-600 cursor-not-allowed opacity-50"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                      title={isLocked ? `Unlocks at Level ${requiredLevel}` : ''}
                    >
                      <span className="text-xs font-bold font-mono">{displayLabel}</span>
                      {isLocked ? (
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-extrabold -mt-0.5">Lvl {requiredLevel} 🔒</span>
                      ) : (
                        <span className="text-[9px] uppercase tracking-wider text-amber-600 font-extrabold -mt-0.5">Gold</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dice Display Area */}
            <div 
              className="flex flex-col items-center justify-center py-8 rounded-2xl border border-amber-900/40 shadow-inner relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: "url('/images/backgrounds/tavern-wood-bg.png')" }}
            >
              <div className="absolute inset-0 bg-black/45 pointer-events-none" />

              <div className="relative z-10 flex gap-6 justify-center items-center">
                {/* Die 1 */}
                <div className={cn(
                  "w-16 h-16 bg-zinc-900 border-2 border-amber-900/50 rounded-2xl flex items-center justify-center text-3xl font-bold font-serif text-amber-200 shadow-lg shadow-black/80",
                  isRolling && "animate-bounce"
                )}>
                  {dice1}
                </div>
                {/* Die 2 */}
                <div className={cn(
                  "w-16 h-16 bg-zinc-900 border-2 border-amber-900/50 rounded-2xl flex items-center justify-center text-3xl font-bold font-serif text-amber-200 shadow-lg shadow-black/80",
                  isRolling && "animate-bounce"
                )} style={{ animationDelay: '0.15s' }}>
                  {dice2}
                </div>
              </div>

              {!isRolling && diceResultMsg && (
                <div className="relative z-10 mt-4 font-serif text-xs sm:text-sm text-zinc-100 bg-black/40 px-3 py-1 rounded-full border border-zinc-800/40">
                  Total Rolled: <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">{dice1 + dice2}</span>
                </div>
              )}
            </div>

            {/* Result Announcement */}
            {diceResultMsg && (
              <div className={cn(
                "p-4 rounded-xl border text-center text-xs font-serif leading-relaxed",
                diceWinStatus === 'win'
                  ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
                  : "bg-red-950/20 border-red-500/20 text-red-400"
              )}>
                {diceResultMsg}
              </div>
            )}

            {/* Roll Button */}
            <Button
              onClick={rollDiceGame}
              disabled={isRolling || goldBalance < diceBetAmount}
              className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-serif font-bold text-base rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isRolling ? "Rolling the Bones..." : "Roll the Bones 🎲"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
