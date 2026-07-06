"use client"

import { useState, useEffect } from "react"
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { toast } from "./ui/use-toast"

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

const INITIAL_PLANKS: Plank[] = [
  // Red/Black Target plank (Row 2, starts at Col 1, length 2, horizontal)
  { id: "target", row: 2, col: 1, length: 2, orientation: "horizontal", isTarget: true, color: "bg-zinc-950 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]", label: "Black Plank" },
  
  // Solvable configuration
  { id: "a", row: 0, col: 0, length: 3, orientation: "vertical", isTarget: false, color: "bg-amber-800 border-amber-900", label: "Vertical A" },
  { id: "b", row: 0, col: 1, length: 3, orientation: "horizontal", isTarget: false, color: "bg-amber-700 border-amber-950", label: "Horizontal B" },
  { id: "c", row: 1, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-amber-850 border-amber-950", label: "Vertical C" },
  { id: "d", row: 0, col: 4, length: 3, orientation: "vertical", isTarget: false, color: "bg-amber-800 border-amber-950", label: "Vertical D" },
  { id: "e", row: 3, col: 0, length: 2, orientation: "horizontal", isTarget: false, color: "bg-amber-700 border-amber-955", label: "Horizontal E" },
  { id: "f", row: 3, col: 2, length: 3, orientation: "vertical", isTarget: false, color: "bg-amber-850 border-amber-900", label: "Vertical F" },
  { id: "g", row: 5, col: 1, length: 4, orientation: "horizontal", isTarget: false, color: "bg-amber-600 border-amber-955", label: "Horizontal G (Long)" },
  { id: "h", row: 3, col: 5, length: 2, orientation: "vertical", isTarget: false, color: "bg-amber-800 border-amber-900", label: "Vertical H" },
]

export function PlankPuzzleModal({ isOpen, onClose, onComplete }: PlankPuzzleModalProps) {
  const [planks, setPlanks] = useState<Plank[]>(INITIAL_PLANKS)
  const [selectedId, setSelectedId] = useState<string | null>("target")
  const [moves, setMoves] = useState(0)
  const [hasWon, setHasWon] = useState(false)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setPlanks(JSON.parse(JSON.stringify(INITIAL_PLANKS)))
      setSelectedId("target")
      setMoves(0)
      setHasWon(false)
    }
  }, [isOpen])

  // Key listener for movement
  useEffect(() => {
    if (!isOpen || hasWon || !selectedId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault()
        moveSelected("up")
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault()
        moveSelected("down")
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault()
        moveSelected("left")
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault()
        moveSelected("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, hasWon, selectedId, planks])

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

  const moveSelected = (direction: "up" | "down" | "left" | "right") => {
    if (!selectedId || hasWon) return

    const activePlank = planks.find((p) => p.id === selectedId)
    if (!activePlank) return

    // Verify orientation matches movement direction
    if (activePlank.orientation === "horizontal" && (direction === "up" || direction === "down")) return
    if (activePlank.orientation === "vertical" && (direction === "left" || direction === "right")) return

    const grid = getOccupationGrid(planks, selectedId)
    let nextRow = activePlank.row
    let nextCol = activePlank.col

    if (direction === "up") nextRow -= 1
    if (direction === "down") nextRow += 1
    if (direction === "left") nextCol -= 1
    if (direction === "right") nextCol += 1

    // Win condition check (target exits right)
    if (activePlank.isTarget && direction === "right" && nextCol + activePlank.length > 6) {
      setHasWon(true)
      setMoves((m) => m + 1)
      
      // Award rewards
      const gold = 500
      const xp = 200
      
      toast({
        title: "Labyrinth Solved! 🎉",
        description: `You cleared the planks in ${moves + 1} moves! Earned ${gold} Gold and ${xp} XP.`,
      })
      
      setTimeout(() => {
        onComplete(true, gold, xp)
        onClose()
      }, 2500)
      return
    }

    // Bounds checking
    if (nextRow < 0 || nextCol < 0) return
    if (activePlank.orientation === "horizontal" && nextCol + activePlank.length > 6) return
    if (activePlank.orientation === "vertical" && nextRow + activePlank.length > 6) return

    // Collision checking
    let hasCollision = false
    for (let i = 0; i < activePlank.length; i++) {
      if (activePlank.orientation === "horizontal") {
        if (grid[nextRow]![nextCol + i]) hasCollision = true
      } else {
        if (grid[nextRow + i]![nextCol]) hasCollision = true
      }
    }

    if (hasCollision) return

    // Update state
    setPlanks((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, row: nextRow, col: nextCol } : p))
    )
    setMoves((m) => m + 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-full bg-zinc-900 border-amber-900/40 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold font-medieval text-amber-400">
            Plank Labyrinth
          </DialogTitle>
          <p className="text-xs text-zinc-400">
            Slide the planks to clear the path. Move the Black Plank to the right exit!
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 mt-4">
          {/* Stats Bar */}
          <div className="flex justify-between w-full px-4 text-sm font-mono text-amber-200">
            <span>Moves: <strong className="text-white text-lg">{moves}</strong></span>
            {hasWon && <span className="text-green-400 font-bold flex items-center gap-1"><Trophy className="w-4 h-4" /> Solved!</span>}
          </div>

          {/* 6x6 Grid Container */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-zinc-950 border-4 border-amber-955 rounded-xl overflow-hidden shadow-inner flex flex-wrap">
            {/* Grid cell lines */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="w-[16.666%] h-[16.666%] border border-zinc-900/40 flex items-center justify-center text-[10px] text-zinc-800 font-mono select-none"
              >
              </div>
            ))}

            {/* Exit Gate Indicator */}
            <div className="absolute right-0 top-[33.33%] w-2 h-[16.666%] bg-red-600 rounded-l-md animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]" />

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
                  onClick={() => setSelectedId(plank.id)}
                  className={`absolute p-1 transition-all duration-150 cursor-pointer select-none`}
                >
                  <div
                    className={`w-full h-full rounded-md border-2 flex items-center justify-center font-bold text-[10px] sm:text-xs text-center transition-all ${plank.color} ${
                      isSelected
                        ? "ring-2 ring-amber-400 scale-[1.02] z-10 font-black shadow-lg"
                        : "opacity-80 hover:opacity-100 shadow"
                    }`}
                  >
                    <span className={plank.isTarget ? "text-red-500 font-bold" : "text-amber-100 font-medium"}>
                      {plank.isTarget ? "★" : plank.length}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Directional Controls */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <Button
              size="icon"
              variant="outline"
              disabled={hasWon || !selectedId}
              onClick={() => moveSelected("up")}
              className="bg-zinc-800 hover:bg-zinc-700 border-amber-900/20 text-white rounded-lg h-10 w-10"
              aria-label="Move Selected Plank Up"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
            <div className="flex gap-10">
              <Button
                size="icon"
                variant="outline"
                disabled={hasWon || !selectedId}
                onClick={() => moveSelected("left")}
                className="bg-zinc-800 hover:bg-zinc-700 border-amber-900/20 text-white rounded-lg h-10 w-10"
                aria-label="Move Selected Plank Left"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={hasWon || !selectedId}
                onClick={() => moveSelected("right")}
                className="bg-zinc-800 hover:bg-zinc-700 border-amber-900/20 text-white rounded-lg h-10 w-10"
                aria-label="Move Selected Plank Right"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="outline"
              disabled={hasWon || !selectedId}
              onClick={() => moveSelected("down")}
              className="bg-zinc-800 hover:bg-zinc-700 border-amber-900/20 text-white rounded-lg h-10 w-10"
              aria-label="Move Selected Plank Down"
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </div>

          <div className="text-[10px] text-zinc-400 text-center font-mono mt-1">
            Tip: Use keyboard arrow keys or W/A/S/D to slide the selected plank.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
