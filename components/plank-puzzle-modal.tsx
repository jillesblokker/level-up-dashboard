"use client"

import { useState, useEffect, useRef } from "react"
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { toast } from "./ui/use-toast"
import { ToastAction } from "./ui/toast"
import { getCharacterStats, addToCharacterStat } from "@/lib/character-stats-service"
import { cn } from "@/lib/utils"

interface Plank {
  id: string
  row: number
  col: number
  length: number
  orientation: "horizontal" | "vertical"
  isTarget: boolean
  color: string
  label: string
}

interface PlankPuzzleModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (success: boolean, goldEarned: number, xpEarned: number) => void
}

const PUZZLE_VARIATIONS: Plank[][] = [
  // Variation 1 (Par: 4)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "blocking", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "bot", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "right", row: 1, col: 5, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" }
  ],
  // Variation 2 (Par: 5)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "blocking", row: 0, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "bot", row: 2, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "horiz", row: 5, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "side", row: 1, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" }
  ],
  // Variation 3 (Par: 4)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 4, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" }
  ],
  // Variation 4 (Par: 5)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 3, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 4, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" }
  ],
  // Variation 5 (Par: 5)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 1, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 4, col: 1, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 3, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" }
  ],
  // Variation 6 (Par: 4)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 4, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 1, col: 4, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" }
  ],
  // Variation 7 (Novice - Par: 4)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 4, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 0, col: 1, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" }
  ],
  // Variation 8 (Apprentice - Par: 7)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 5, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 0, col: 0, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 4, col: 1, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" }
  ],
  // Variation 9 (Apprentice - Par: 8)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 1, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 4, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" }
  ],
  // Variation 10 (Challenger - Par: 11)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 2, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 1, col: 5, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 4, col: 0, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 5, col: 2, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "F" }
  ],
  // Variation 11 (Challenger - Solvable Par: 6)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 1, col: 4, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 3, col: 2, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 4, col: 0, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "F" },
    { id: "block7", row: 4, col: 1, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "G" },
    { id: "block8", row: 4, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "H" }
  ],
  // Variation 12 (Veteran - Par: 14)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 5, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 3, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 3, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 4, col: 0, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "F" }
  ],
  // Variation 13 (Veteran - Par: 15)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 2, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 1, col: 5, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 3, col: 0, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "F" },
    { id: "block7", row: 4, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "G" }
  ],
  // Variation 14 (Master - Par: 16)
  [
    {
      id: "target",
      row: 2,
      col: 1,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 0, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 1, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 1, col: 4, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 3, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 4, col: 1, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "F" },
    { id: "block7", row: 5, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "G" }
  ],
  // Variation 15 (Master - Par: 18)
  [
    {
      id: "target",
      row: 2,
      col: 0,
      length: 2,
      orientation: "horizontal",
      isTarget: true,
      color: "bg-zinc-950 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400",
      label: "Ancient Keystone"
    },
    { id: "block1", row: 0, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
    { id: "block2", row: 0, col: 3, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
    { id: "block3", row: 1, col: 0, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
    { id: "block4", row: 2, col: 2, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
    { id: "block5", row: 2, col: 4, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
    { id: "block6", row: 3, col: 0, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "F" },
    { id: "block7", row: 4, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "G" },
    { id: "block8", row: 5, col: 0, length: 3, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "H" }
  ]
]

const PAR_SCORES = [4, 5, 4, 5, 5, 4, 4, 7, 8, 11, 12, 14, 15, 16, 18]
const PUZZLE_DIFFICULTIES = [
  "Novice", "Novice", "Novice", "Novice", "Novice", "Novice", "Novice",
  "Apprentice", "Apprentice", "Challenger", "Challenger", "Veteran", "Veteran", "Master", "Master"
]

export function PlankPuzzleModal({ isOpen, onClose, onComplete }: PlankPuzzleModalProps) {
  const [planks, setPlanks] = useState<Plank[]>(PUZZLE_VARIATIONS[0]!)
  const [selectedId, setSelectedId] = useState<string | null>("target")
  const [moves, setMoves] = useState(0)
  const [activeVariationIndex, setActiveVariationIndex] = useState<number>(0)
  const [hasWon, setHasWon] = useState(false)
  const [showDpad, setShowDpad] = useState(false)
  const isInitializedRef = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{
    plankId: string
    startCol: number
    startRow: number
    startX: number
    startY: number
    orientation: "horizontal" | "vertical"
  } | null>(null)

  // Reset when opening & check 1/day daily limit
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true
      const today = new Date().toISOString().split('T')[0];
      const storage = localStorage.getItem('labyrinth_daily_limit');
      let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
      if (data.date !== today) data = { date: today, count: 0 };

      if (data.count >= 1) {
        const stats = getCharacterStats();
        const currentFocus = stats.focus_points || 0;
        const FOCUS_COST = 5;

        if (currentFocus >= FOCUS_COST) {
          toast({
            title: "Labyrinth already used (1/1) 🧩",
            description: `Locked until midnight. Spend ${FOCUS_COST} focus points to reset and play again?`,
            action: (
              <ToastAction
                altText={`Reset (${FOCUS_COST} FP)`}
                onClick={async () => {
                  await addToCharacterStat('focus_points', -FOCUS_COST, 'unlock-plank-labyrinth');
                  localStorage.removeItem('labyrinth_daily_limit');
                  try {
                    const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
                    await fetchWithAuth('/api/property-timers', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tileId: 'plank-labyrinth', isReady: true, endTime: new Date(Date.now() - 1000).toISOString() })
                    });
                  } catch {}
                  window.dispatchEvent(new Event('character-stats-update'));
                  window.dispatchEvent(new CustomEvent('minigame-reset', { detail: { type: 'plank-labyrinth' } }));
                  window.dispatchEvent(new CustomEvent('open-plank-labyrinth'));
                  toast({
                    title: "Labyrinth unlocked! 🧠",
                    description: `Spent ${FOCUS_COST} focus points! The plank labyrinth has been reset.`
                  });
                }}
              >
                Reset ({FOCUS_COST} FP)
              </ToastAction>
            )
          });
        } else {
          toast({
            title: "Labyrinth locked (1/1) 🧩",
            description: `The labyrinth is locked until midnight. Earn ${FOCUS_COST - currentFocus} more focus points (you have ${currentFocus}) to unlock immediately!`,
            variant: "destructive",
            action: (
              <ToastAction altText="View focus" onClick={() => window.location.href = '/character'}>
                View focus
              </ToastAction>
            )
          });
        }
        onClose();
        return;
      }

      const randomIndex = Math.floor(Math.random() * PUZZLE_VARIATIONS.length);
      setActiveVariationIndex(randomIndex);
      const selectedVariation = PUZZLE_VARIATIONS[randomIndex]!;
      setPlanks(JSON.parse(JSON.stringify(selectedVariation)));
      setSelectedId("target");
      setMoves(0);
      setHasWon(false);
    } else if (!isOpen) {
      isInitializedRef.current = false
    }
  }, [isOpen])

  // Single capture-phase handler: blocks ALL shortcuts and handles game movement
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      // Let Escape close the dialog natively
      if (e.key === "Escape") return

      // Block ALL keys from reaching global shortcuts (achievements, kingdom, etc.)
      e.stopPropagation()
      e.preventDefault()

      // Handle game movement keys directly
      if (hasWon || !selectedId) return
      const key = e.key.toLowerCase()
      if (key === "arrowup" || key === "w") moveSelected("up")
      else if (key === "arrowdown" || key === "s") moveSelected("down")
      else if (key === "arrowleft" || key === "a") moveSelected("left")
      else if (key === "arrowright" || key === "d") moveSelected("right")
    }

    window.addEventListener("keydown", handleKeyDownCapture, true)
    return () => window.removeEventListener("keydown", handleKeyDownCapture, true)
  }, [isOpen, hasWon, selectedId, planks, moves])

  // Helper to build 6x6 occupation grid
  const getOccupationGrid = (currentPlanks: Plank[], skipId?: string) => {
    const grid = Array.from({ length: 6 }, () => Array(6).fill(false))
    currentPlanks.forEach((plank) => {
      if (plank.id === skipId) return
      for (let i = 0; i < plank.length; i++) {
        if (plank.orientation === "horizontal") {
          grid[plank.row]![plank.col + i] = true
        } else {
          grid[plank.row + i]![plank.col] = true
        }
      }
    })
    return grid
  }

  // Pointer drag triggers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, plank: Plank) => {
    if (hasWon) return
    e.preventDefault()
    setSelectedId(plank.id)
    
    const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY
    
    dragStartRef.current = {
      plankId: plank.id,
      startCol: plank.col,
      startRow: plank.row,
      startX: clientX,
      startY: clientY,
      orientation: plank.orientation
    }
  }

  // Handle dragging
  useEffect(() => {
    if (!isOpen || hasWon) return

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !gridRef.current) return
      
      const { plankId, startCol, startRow, startX, startY, orientation } = dragStartRef.current
      const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY

      const gridRect = gridRef.current.getBoundingClientRect()
      const cellSize = gridRect.width / 6

      if (orientation === "horizontal") {
        const deltaX = clientX - startX
        const cellDelta = Math.round(deltaX / cellSize)
        if (cellDelta !== 0) {
          const step = cellDelta > 0 ? 1 : -1
          const steps = Math.abs(cellDelta)
          let currentMoves = 0
          
          setPlanks(prev => {
            let tempPlanks = JSON.parse(JSON.stringify(prev)) as Plank[]
            let currentPlank = tempPlanks.find(p => p.id === plankId)!
            
            for (let i = 0; i < steps; i++) {
              const nextCol = currentPlank.col + step
              
              // Win condition
              if (currentPlank.isTarget && step === 1 && nextCol + currentPlank.length > 6) {
                setHasWon(true)
                setMoves(m => m + 1)
                
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('labyrinth_daily_limit', JSON.stringify({ date: today, count: 1 }));

                const gold = 500
                const xp = 200
                toast({
                  title: "Labyrinth solved! 🎉",
                  description: `You cleared the planks in ${moves + 1} moves! Earned ${gold} gold, ${xp} XP, and 3x crafting blocks.`,
                })
                setTimeout(() => {
                  onComplete(true, gold, xp)
                  onClose()
                }, 2500)
                break
              }

              // Bounds checking
              if (nextCol < 0 || nextCol + currentPlank.length > 6) break
              
              // Collision checking
              const collisionGrid = getOccupationGrid(tempPlanks, plankId)
              let hasCollision = false
              for (let c = 0; c < currentPlank.length; c++) {
                if (collisionGrid[currentPlank.row]![nextCol + c]) {
                  hasCollision = true
                  break
                }
              }
              
              if (hasCollision) break
              currentPlank.col = nextCol
              currentMoves++
            }
            
            if (currentMoves > 0) {
              setMoves(m => m + currentMoves)
              dragStartRef.current = {
                ...dragStartRef.current!,
                startX: clientX,
                startCol: currentPlank.col
              }
            }
            return tempPlanks
          })
        }
      } else {
        const deltaY = clientY - startY
        const cellDelta = Math.round(deltaY / cellSize)
        if (cellDelta !== 0) {
          const step = cellDelta > 0 ? 1 : -1
          const steps = Math.abs(cellDelta)
          let currentMoves = 0
          
          setPlanks(prev => {
            let tempPlanks = JSON.parse(JSON.stringify(prev)) as Plank[]
            let currentPlank = tempPlanks.find(p => p.id === plankId)!
            
            for (let i = 0; i < steps; i++) {
              const nextRow = currentPlank.row + step
              
              if (nextRow < 0 || nextRow + currentPlank.length > 6) break
              
              const collisionGrid = getOccupationGrid(tempPlanks, plankId)
              let hasCollision = false
              for (let r = 0; r < currentPlank.length; r++) {
                if (collisionGrid[nextRow + r]![currentPlank.col]) {
                  hasCollision = true
                  break
                }
              }
              
              if (hasCollision) break
              currentPlank.row = nextRow
              currentMoves++
            }
            
            if (currentMoves > 0) {
              setMoves(m => m + currentMoves)
              dragStartRef.current = {
                ...dragStartRef.current!,
                startY: clientY,
                startRow: currentPlank.row
              }
            }
            return tempPlanks
          })
        }
      }
    }

    const handlePointerUp = () => {
      dragStartRef.current = null
    }

    window.addEventListener("mousemove", handlePointerMove)
    window.addEventListener("mouseup", handlePointerUp)
    window.addEventListener("touchmove", handlePointerMove, { passive: false })
    window.addEventListener("touchend", handlePointerUp)

    return () => {
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("mouseup", handlePointerUp)
      window.removeEventListener("touchmove", handlePointerMove)
      window.removeEventListener("touchend", handlePointerUp)
    }
  }, [isOpen, hasWon, planks, moves])

  const moveSelected = (direction: "up" | "down" | "left" | "right") => {
    if (!selectedId || hasWon) return

    const activePlank = planks.find((p) => p.id === selectedId)
    if (!activePlank) return

    if (activePlank.orientation === "horizontal" && (direction === "up" || direction === "down")) return
    if (activePlank.orientation === "vertical" && (direction === "left" || direction === "right")) return

    const grid = getOccupationGrid(planks, selectedId)
    let nextRow = activePlank.row
    let nextCol = activePlank.col

    if (direction === "up") nextRow -= 1
    if (direction === "down") nextRow += 1
    if (direction === "left") nextCol -= 1
    if (direction === "right") nextCol += 1

    if (activePlank.isTarget && direction === "right" && nextCol + activePlank.length > 6) {
      setHasWon(true)
      setMoves((m) => m + 1)
      
      const gold = 500
      const xp = 200
      
      toast({
        title: "Labyrinth solved! 🎉",
        description: `You cleared the planks in ${moves + 1} moves! Earned ${gold} gold, ${xp} XP, and 3x crafting blocks.`,
      })
      
      setTimeout(() => {
        onComplete(true, gold, xp)
        onClose()
      }, 2500)
      return
    }

    if (nextRow < 0 || nextCol < 0) return
    if (activePlank.orientation === "horizontal" && nextCol + activePlank.length > 6) return
    if (activePlank.orientation === "vertical" && nextRow + activePlank.length > 6) return

    let hasCollision = false
    for (let i = 0; i < activePlank.length; i++) {
      if (activePlank.orientation === "horizontal") {
        if (grid[nextRow]![nextCol + i]) hasCollision = true
      } else {
        if (grid[nextRow + i]![nextCol]) hasCollision = true
      }
    }

    if (hasCollision) return

    setPlanks((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, row: nextRow, col: nextCol } : p))
    )
    setMoves((m) => m + 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg w-full bg-zinc-950/95 border border-amber-900/40 text-white rounded-2xl p-3 sm:p-5 shadow-2xl overflow-y-auto max-h-[88vh] font-serif pb-safe">
        <DialogHeader className="text-center border-b border-amber-900/20 pb-2.5 px-8 sm:px-10">
          <DialogTitle className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-amber-400 break-words">
            Plank Labyrinth
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Slide the heavy oak barriers to clear the water channel. Guide your ship to the open sea.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2.5 sm:gap-3.5 mt-2">
          {/* Stats Bar (Streamlined, no master badge, Title Cased) */}
          <div className="flex justify-between items-center w-full px-1 text-xs font-mono text-amber-400/90 font-medium">
            <div className="flex items-center gap-2">
              <span>Variation: <strong className="text-white font-bold">{activeVariationIndex + 1}/{PUZZLE_VARIATIONS.length}</strong></span>
              <span className="text-zinc-600 hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline text-zinc-400">Target: <strong className="text-white font-bold">{PAR_SCORES[activeVariationIndex]} moves</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <span>Moves: <strong className="text-white text-sm font-bold">{moves}</strong></span>
              {hasWon ? (
                <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Trophy className="w-3.5 h-3.5 animate-bounce" /> Solved</span>
              ) : (
                <span className="text-zinc-500 text-[11px]">Active</span>
              )}
            </div>
          </div>

          {/* Responsive 6x6 Grid Container with Water Channel Tiles */}
          <div
            ref={gridRef}
            className="relative w-full max-w-[min(82vw,380px)] sm:max-w-[420px] aspect-square mx-auto bg-[#1a3a4b] border-4 border-[#3d240f] rounded-2xl overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.8),0_10px_25px_rgba(0,0,0,0.6)] flex flex-wrap"
          >
            {/* 6x6 Kingdom Water Tiles */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="w-[16.666%] h-[16.666%] border border-sky-950/40 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url('/images/tiles/water-tile.webp')`,
                }}
              >
                {/* Subtle calm water ambient tint */}
                <div className="absolute inset-0 bg-sky-950/20 pointer-events-none" />
              </div>
            ))}

            {/* Exit Gate Arch Indicator (glowing harbor beacon) */}
            <div className="absolute right-0 top-[33.33%] w-2.5 h-[16.666%] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-l-md animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.9)] z-10 border border-amber-300/60" />

            {/* Render Planks */}
            {planks.map((plank) => {
              const cellSizePercent = 100 / 6
              const style = {
                top: `${plank.row * cellSizePercent}%`,
                left: `${plank.col * cellSizePercent}%`,
                width: plank.orientation === "horizontal" ? `${plank.length * cellSizePercent}%` : `${cellSizePercent}%`,
                height: plank.orientation === "vertical" ? `${plank.length * cellSizePercent}%` : `${cellSizePercent}%`,
              }

              const isSelected = selectedId === plank.id

              return (
                <div
                  key={plank.id}
                  style={style}
                  onMouseDown={(e) => handleDragStart(e, plank)}
                  onTouchStart={(e) => handleDragStart(e, plank)}
                  className={cn(
                    "absolute p-1 select-none z-10 touch-none",
                    isSelected ? "z-20 cursor-grabbing" : "cursor-grab"
                  )}
                >
                  {plank.isTarget ? (
                    <div
                      className={cn(
                        "w-full h-full relative transition-transform duration-100 flex items-center justify-center select-none",
                        isSelected
                          ? "scale-[1.04] z-30 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.85)] drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]"
                          : "filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:scale-[1.01]"
                      )}
                    >
                      {/* Subtle water wake underneath the vessel */}
                      <div className="absolute inset-x-2 bottom-1 top-2 rounded-full bg-cyan-400/20 blur-xs pointer-events-none" />
                      <img
                        src="/images/tiles/pirate-ship-horizontal.webp"
                        alt="Flagship vessel"
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "relative w-full h-full rounded-md border-2 border-[#3d240f] overflow-hidden transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.6),0_3px_6px_rgba(0,0,0,0.4)]",
                        isSelected
                          ? "ring-2 ring-amber-400 scale-[1.03] shadow-[0_4px_18px_rgba(245,158,11,0.45)] border-amber-400 brightness-110 z-20"
                          : "opacity-95 hover:opacity-100 hover:brightness-105"
                      )}
                    >
                      {/* Smart Oriented Tavern Wood Background */}
                      <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                        {plank.orientation === "horizontal" ? (
                          /* Horizontal plank: wood grain naturally runs along the horizontal length */
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url('/images/backgrounds/tavern-wood-bg.webp')`,
                              filter: "contrast(1.08) saturate(1.15)",
                            }}
                          />
                        ) : (
                          /* Vertical plank: rotated 90deg so wood grain runs vertically along the plank */
                          <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350%] h-[350%] bg-cover bg-center rotate-90"
                            style={{
                              backgroundImage: `url('/images/backgrounds/tavern-wood-bg.webp')`,
                              filter: "contrast(1.08) saturate(1.15)",
                            }}
                          />
                        )}
                        {/* Rich amber carpentry stain wash */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/25 via-amber-950/10 to-black/40 pointer-events-none" />

                        {/* Subtle central wood grain groove line */}
                        <div
                          className={cn(
                            "absolute bg-black/30 pointer-events-none",
                            plank.orientation === "horizontal"
                              ? "left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] shadow-[0_1px_0_rgba(255,255,255,0.08)]"
                              : "top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] shadow-[1px_0_0_rgba(255,255,255,0.08)]"
                          )}
                        />
                      </div>

                      {/* Authentic Carpentry Brass / Iron Studs at Plank Ends */}
                      {plank.orientation === "horizontal" ? (
                        <>
                          {/* Left studs */}
                          <div className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          <div className="absolute left-1 bottom-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          {/* Right studs */}
                          <div className="absolute right-1 top-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          <div className="absolute right-1 bottom-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                        </>
                      ) : (
                        <>
                          {/* Top studs */}
                          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          {/* Bottom studs */}
                          <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                          <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-950 shadow-xs border border-amber-950/80 pointer-events-none" />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* D-Pad Toggle Button & Directional Button Controls */}
          <div className="w-full flex flex-col items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDpad(!showDpad)}
              className="text-[11px] font-mono border-amber-900/40 text-amber-400 hover:bg-amber-950/40 h-8 px-3 rounded-lg"
            >
              {showDpad ? "⌨️ Hide Arrow Keys" : "⌨️ Show Arrow Keys"}
            </Button>

            {showDpad && (
              <div className="flex flex-col items-center gap-1.5 bg-zinc-900/40 p-3 rounded-2xl border border-amber-900/10 animate-in fade-in duration-200">
                <Button
                  size="icon"
                  disabled={hasWon || !selectedId}
                  onClick={() => moveSelected("up")}
                  className="bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-amber-900/30 text-white rounded-lg h-9 w-9 shadow active:scale-95 transition-all"
                  aria-label="Move Selected Plank Up"
                >
                  <ArrowUp className="w-4 h-4 text-amber-400" />
                </Button>
                <div className="flex gap-8">
                  <Button
                    size="icon"
                    disabled={hasWon || !selectedId}
                    onClick={() => moveSelected("left")}
                    className="bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-amber-900/30 text-white rounded-lg h-9 w-9 shadow active:scale-95 transition-all"
                    aria-label="Move Selected Plank Left"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                  </Button>
                  <Button
                    size="icon"
                    disabled={hasWon || !selectedId}
                    onClick={() => moveSelected("right")}
                    className="bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-amber-900/30 text-white rounded-lg h-9 w-9 shadow active:scale-95 transition-all"
                    aria-label="Move Selected Plank Right"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  disabled={hasWon || !selectedId}
                  onClick={() => moveSelected("down")}
                  className="bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-amber-900/30 text-white rounded-lg h-9 w-9 shadow active:scale-95 transition-all"
                  aria-label="Move Selected Plank Down"
                >
                  <ArrowDown className="w-4 h-4 text-amber-400" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
