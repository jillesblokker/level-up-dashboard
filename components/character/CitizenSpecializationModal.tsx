'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Wand2, FlaskConical, Target, Check, Sparkles } from 'lucide-react'

export type CitizenClass = 'Tank' | 'Mage' | 'Alchemist' | 'Scout'

interface CitizenSpecializationModalProps {
  isOpen: boolean
  onClose: () => void
  citizenName: string
  currentClass?: CitizenClass
  onSpecialize: (chosenClass: CitizenClass) => void
}

const CLASSES: {
  id: CitizenClass
  name: string
  category: string
  icon: React.ReactNode
  color: string
  bg: string
  description: string
  ability: string
}[] = [
  {
    id: 'Tank',
    name: 'Vanguard Tank',
    category: 'Might',
    icon: <Shield className="w-6 h-6 text-amber-400" />,
    color: 'text-amber-400 border-amber-500/40',
    bg: 'from-amber-950/60 to-zinc-900',
    description: 'Empowered by Might habits. High armor and taunts dungeon foes.',
    ability: 'Shield Wall: Absorbs 40% incoming damage for 2 turns.'
  },
  {
    id: 'Mage',
    name: 'Arcane Mage',
    category: 'Knowledge',
    icon: <Wand2 className="w-6 h-6 text-cyan-400" />,
    color: 'text-cyan-400 border-cyan-500/40',
    bg: 'from-cyan-950/60 to-zinc-900',
    description: 'Empowered by Knowledge habits. Casts powerful spell bursts.',
    ability: 'Fireball Nova: Deals 250% elemental spell damage.'
  },
  {
    id: 'Alchemist',
    name: 'Botanical Alchemist',
    category: 'Vitality & Wellness',
    icon: <FlaskConical className="w-6 h-6 text-emerald-400" />,
    color: 'text-emerald-400 border-emerald-500/40',
    bg: 'from-emerald-950/60 to-zinc-900',
    description: 'Empowered by Vitality & Wellness habits. Heals dungeon party.',
    ability: 'Healing Decoction: Restores 35% team HP.'
  },
  {
    id: 'Scout',
    name: 'Shadow Scout',
    category: 'Honor & Craft',
    icon: <Target className="w-6 h-6 text-purple-400" />,
    color: 'text-purple-400 border-purple-500/40',
    bg: 'from-purple-950/60 to-zinc-900',
    description: 'Empowered by Honor & Craft habits. High critical strikes.',
    ability: 'Precise Strike: 50% chance for 3x critical damage.'
  }
]

export function CitizenSpecializationModal({
  isOpen,
  onClose,
  citizenName,
  currentClass,
  onSpecialize
}: CitizenSpecializationModalProps) {
  const [selectedClass, setSelectedClass] = useState<CitizenClass | null>(currentClass || null)

  const handleConfirm = () => {
    if (selectedClass) {
      onSpecialize(selectedClass)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <DialogTitle className="text-xl font-bold tracking-wide">
              Specialize citizen: {citizenName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Assign a combat class. Completing real-world habit categories grants instant combat bonuses in the Dungeon Keep!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {CLASSES.map(cls => {
            const isSelected = selectedClass === cls.id
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`cursor-pointer border rounded-xl p-3.5 transition-all bg-gradient-to-b ${cls.bg} ${
                  isSelected ? `${cls.color} ring-2 ring-amber-400/80 shadow-lg scale-[1.02]` : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {cls.icon}
                    <span className="font-bold text-sm text-zinc-100">{cls.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>

                <Badge variant="outline" className="text-[10px] bg-zinc-900/80 text-zinc-300 mb-2">
                  Habits: {cls.category}
                </Badge>

                <p className="text-[11px] text-zinc-400 mb-2 leading-tight">{cls.description}</p>

                <div className="bg-zinc-950/80 rounded-lg p-2 border border-zinc-800/80">
                  <span className="text-[10px] font-semibold text-amber-400 block">Signature move:</span>
                  <span className="text-[10px] text-zinc-300">{cls.ability}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button
            disabled={!selectedClass}
            onClick={handleConfirm}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs px-5 rounded-lg shadow-md"
          >
            Confirm specialization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
