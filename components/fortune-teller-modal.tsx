"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats } from "@/lib/character-stats-service"

interface FortuneTellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  x: number
  y: number
  tileId: string
  onComplete?: () => void
}

type CardType = 'king' | 'joker' | 'ace' | null

const CARDS: { id: CardType; name: string; task: string; quote: string; image: string; reward: string }[] = [
  {
    id: 'king',
    name: 'The King',
    task: 'Do 10 push ups',
    quote: '"A true king sometimes needs to lead by example and makes his hands dirty."',
    image: '/images/fortune-cards/fortune_card_king.webp',
    reward: '1 Random Material'
  },
  {
    id: 'joker',
    name: 'The Joker',
    task: 'Clean up at least 1 item',
    quote: '"Even a trickster must occasionally clean up their own mess."',
    image: '/images/fortune-cards/fortune_card_joker.webp',
    reward: '1 Mythic Scratch Card'
  },
  {
    id: 'ace',
    name: 'The Ace',
    task: 'Take a moment to rest',
    quote: '"Rest is also important. It is the quiet foundation of all greatness."',
    image: '/images/fortune-cards/fortune_card_ace.webp',
    reward: '5 Gems'
  }
]

export function FortuneTellerModal({ open, onOpenChange, x, y, tileId, onComplete }: FortuneTellerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType>(null)
  const [shuffledCards, setShuffledCards] = useState<typeof CARDS>([])
  
  // Shuffle cards on open
  useEffect(() => {
    if (open) {
      setSelectedCard(null)
      setShuffledCards([...CARDS].sort(() => Math.random() - 0.5))
    }
  }, [open])

  const handleCardClick = (card: typeof CARDS[0]) => {
    if (selectedCard) return
    setSelectedCard(card.id)
  }

  const handleCompleteTask = async () => {
    if (!selectedCard) return
    setIsProcessing(true)

    try {
      const response = await fetch('/api/kingdom/fortune-teller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, tileId, cardChoice: selectedCard })
      })

      if (!response.ok) {
        throw new Error('Failed to claim fortune')
      }

      const data = await response.json()
      
      toast({
        title: "Fortune Claimed!",
        description: `You received: ${data.rewardMessage}`,
      })

      // Refresh stats
      await fetchFreshCharacterStats()
      
      if (onComplete) {
        onComplete()
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "The spirits are silent. Try again later.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedData = CARDS.find(c => c.id === selectedCard)

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-emerald-900/50 bg-slate-950/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medieval text-emerald-400 text-center">
            The Fortune Teller
          </DialogTitle>
          <DialogDescription className="text-center text-emerald-200/70">
            {!selectedCard ? "Pick a card to reveal your destiny..." : "Your fate is sealed."}
          </DialogDescription>
        </DialogHeader>

        {!selectedCard ? (
          <div className="grid grid-cols-3 gap-4 py-8">
            {shuffledCards.map((card, idx) => (
              <div 
                key={idx}
                onClick={() => handleCardClick(card)}
                className="relative aspect-[2/3] rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300 border-2 border-emerald-900/50 bg-slate-900 hover:border-emerald-500 overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                <div className="absolute inset-0 bg-[url('/images/kingdom-tiles/fortune_teller.webp')] bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 bg-emerald-950/60 mix-blend-overlay" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-emerald-500/50 text-4xl font-medieval">?</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 space-y-6 animate-in fade-in zoom-in duration-500">
            {selectedData && (
              <>
                <div className="relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.4)] border-2 border-emerald-500/50">
                  <Image
                    src={selectedData.image}
                    alt={selectedData.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-emerald-300">{selectedData.name}</h3>
                  <p className="text-sm italic text-emerald-100/70">{selectedData.quote}</p>
                </div>

                <div className="bg-slate-900/50 border border-emerald-900/50 rounded-lg p-4 w-full text-center space-y-2">
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Your Task</p>
                  <p className="text-lg text-white font-medium">{selectedData.task}</p>
                  <p className="text-sm text-emerald-400 pt-2">Reward: {selectedData.reward}</p>
                </div>

                <Button 
                  onClick={handleCompleteTask} 
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Channeling...</>
                  ) : (
                    "I Have Completed This Task"
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
