"use client"

import { useState, useEffect, useRef } from "react"
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { toast } from "./ui/use-toast"
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

const INITIAL_PLANKS: Plank[] = [
  // Target plank — slide right to exit (Row 2, Col 1, length 2, horizontal)
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
  // Verified solvable layout — no overlapping cells
  // Grid visualization:
  //   Col0  Col1  Col2  Col3  Col4  Col5
  // R0: [a]   .     .    [b    b]    .
  // R1: [a]  [c    c]     .   [d]    .
  // R2: [a]  [T    T]    [h]  [d]    .   → EXIT
  // R3:  .    .    [e]   [h]   .    [f]
  // R4:  .    .    [e]   [g    g]   [f]
  // R5:  .    .     .     .     .    .
  { id: "a", row: 0, col: 0, length: 3, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "A" },
  { id: "b", row: 0, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "B" },
  { id: "c", row: 1, col: 1, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "C" },
  { id: "d", row: 1, col: 4, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "D" },
  { id: "e", row: 3, col: 2, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "E" },
  { id: "f", row: 3, col: 5, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "F" },
  { id: "g", row: 4, col: 3, length: 2, orientation: "horizontal", isTarget: false, color: "bg-gradient-to-r from-amber-800 to-amber-950 border-amber-700/50", label: "G" },
  { id: "h", row: 2, col: 3, length: 2, orientation: "vertical", isTarget: false, color: "bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700/50", label: "H" }
]

export function PlankPuzzleModal({ isOpen, onClose, onComplete }: PlankPuzzleModalProps) {
  const [planks, setPlanks] = useState<Plank[]>(INITIAL_PLANKS)
  const [selectedId, setSelectedId] = useState<string | null>("target")
  const [moves, setMoves] = useState(0)
  const [hasWon, setHasWon] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{
    plankId: string
    startCol: number
    startRow: number
    startX: number
    startY: number
    orientation: "horizontal" | "vertical"
  } | null>(null)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setPlanks(JSON.parse(JSON.stringify(INITIAL_PLANKS)))
      setSelectedId("target")
      setMoves(0)
      setHasWon(false)
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
        title: "Labyrinth Solved! 🎉",
        description: `You cleared the planks in ${moves + 1} moves! Earned ${gold} Gold and ${xp} XP.`,
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
      <DialogContent className="max-w-md w-full bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-6 shadow-2xl overflow-hidden font-serif">
        <DialogHeader className="text-center border-b border-amber-900/20 pb-3">
          <DialogTitle className="text-3xl font-medieval tracking-wide text-amber-400">
            Plank Labyrinth
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Slide the heavy oak barriers to unlock the path. Escort the Ancient Keystone to the portal arch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 mt-6">
          {/* Stats Bar */}
          <div className="flex justify-between items-center w-full px-4 text-xs font-mono tracking-wider text-amber-500">
            <span>MOVES EXPENDED: <strong className="text-white text-base font-bold ml-1">{moves}</strong></span>
            {hasWon ? (
              <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Trophy className="w-4 h-4 animate-bounce" /> SOLVED</span>
            ) : (
              <span className="text-zinc-500">LABYRINTH ACTIVE</span>
            )}
          </div>

          {/* 6x6 Grid Container */}
          <div
            ref={gridRef}
            className="relative w-80 h-80 bg-zinc-900/70 border-4 border-amber-900/60 rounded-xl overflow-hidden shadow-2xl flex flex-wrap"
          >
            {/* Grid cell lines (cobblestone texture) */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="w-[16.666%] h-[16.666%] border border-zinc-950/40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 to-zinc-950/40"
              />
            ))}

            {/* Exit Gate Arch Indicator (glowing portal) */}
            <div className="absolute right-0 top-[33.33%] w-2.5 h-[16.666%] bg-gradient-to-r from-red-600 to-orange-500 rounded-l-md animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] z-10 border border-red-500/50" />

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
                  <div
                    className={cn(
                      "w-full h-full rounded-md border-2 flex flex-col items-center justify-center font-bold text-center transition-all shadow-inner",
                      plank.isTarget
                        ? "bg-gradient-to-br from-zinc-800 to-zinc-950 border-red-800 text-red-500"
                        : "bg-gradient-to-br from-amber-700 to-amber-900 border-amber-950 text-amber-200",
                      isSelected
                        ? "ring-2 ring-amber-400 scale-[1.03] shadow-amber-500/20 shadow-lg border-amber-400"
                        : "opacity-90 hover:opacity-100"
                    )}
                  >
                    {/* Clean planks — no labels or icons */}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Directional Button Controls */}
          <div className="flex flex-col items-center gap-1.5 mt-1 bg-zinc-900/40 p-3 rounded-2xl border border-amber-900/10">
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

          <div className="text-[10px] text-zinc-400 text-center italic mt-1 font-serif leading-relaxed px-4">
            * Drag tiles using your mouse or touch swipe, or use keyboard arrow keys / W, A, S, D to navigate.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
