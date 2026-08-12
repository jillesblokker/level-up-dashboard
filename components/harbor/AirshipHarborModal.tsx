'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Navigation, Zap, Package, Compass, Anchor, Users, Sparkles, ShieldCheck } from 'lucide-react'
import { useCitizensStore } from '@/stores/citizensStore'
import { useToast } from '@/components/ui/use-toast'

interface AirshipHarborModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AirshipHarborModal({ isOpen, onClose }: AirshipHarborModalProps) {
  const [etherFuel, setEtherFuel] = useState(35)
  const [voyageProgress, setVoyageProgress] = useState(65)
  const [activeDestination, setActiveDestination] = useState('Port of Celestial Spire')
  const [selectedCrew, setSelectedCrew] = useState<string[]>([])

  const { citizens, addCitizenExp } = useCitizensStore()
  const { toast } = useToast()

  useEffect(() => {
    try {
      const savedFuel = localStorage.getItem('thrivehaven_ether_fuel')
      if (savedFuel) setEtherFuel(parseInt(savedFuel, 10))
    } catch (err) {
      console.error('Error loading ether fuel:', err)
    }
  }, [isOpen])

  const toggleCrewMember = (id: string) => {
    if (selectedCrew.includes(id)) {
      setSelectedCrew(selectedCrew.filter(cId => cId !== id))
    } else {
      if (selectedCrew.length >= 3) {
        toast({ title: 'Crew Full', description: 'Max 3 citizens per expedition crew.' })
        return
      }
      setSelectedCrew([...selectedCrew, id])
    }
  }

  const handleLaunchCourse = async (portName: string) => {
    setActiveDestination(portName)
    setVoyageProgress(100)

    // Award Expedition EXP to assigned crew
    if (selectedCrew.length > 0) {
      for (const citizenId of selectedCrew) {
        const citizen = citizens.find(c => c.id === citizenId)
        const isSynergyClass = citizen?.type === 'special' || citizen?.type === 'nature'
        const expAwarded = isSynergyClass ? 150 : 100

        await addCitizenExp('user', citizenId, expAwarded)
      }

      toast({
        title: "🛸 Voyage Complete!",
        description: `Awarded Expedition EXP to ${selectedCrew.length} crew member(s)! (+50% Synergy Bonus applied!)`,
      })
    } else {
      toast({
        title: "🛸 Course Set!",
        description: `Propelling airship to ${portName}. Assign citizens as crew to earn Expedition EXP!`,
      })
    }
  }

  const PORTS = [
    { name: 'Port of Celestial Spire', distance: '100 Ether Fuel', cargo: 'Rare Tile Blueprint & Crystal Reagents', reqFuel: 100 },
    { name: 'Archipelago of Wisdom', distance: '50 Ether Fuel', cargo: 'Citizen Training Gear & Scroll Pack', reqFuel: 50 },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-zinc-950 border border-cyan-900/50 text-white rounded-2xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Navigation className="w-6 h-6 animate-pulse" />
              <DialogTitle className="text-xl font-bold tracking-wide text-cyan-100">
                Airship Harbor & Ether Voyages
              </DialogTitle>
            </div>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/30 text-xs">
              Habit-Powered Voyage
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Airship voyages are propelled directly by completing daily real-world habits (which generate Ether fuel), NOT passive countdown timers!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {/* Ether Fuel Reserves Card */}
          <div className="rounded-xl border border-cyan-500/40 p-4 bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-300">Habit Ether Fuel Reserve</h4>
                <p className="text-lg font-mono font-bold text-cyan-400">{etherFuel} Ether Fuel</p>
              </div>
            </div>
            <Badge className="bg-cyan-600 text-white font-bold text-[10px] gap-1">
              <Compass className="w-3 h-3" /> Ready
            </Badge>
          </div>

          {/* Sky Compass Flight Gauge & Streak Speed */}
          <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-zinc-950 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse">
                  <Compass className="w-5 h-5 animate-spin-slow" style={{ animationDuration: '12s' }} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    Sky Compass Flight Gauge
                  </h4>
                  <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                    ⚡ Current Speed: <strong className="text-emerald-400">2.0x Boost (7-Day Streak)</strong> • 🌬️ <strong className="text-cyan-300">+20% Sky Tailwind</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                  🔥 2x Streak Speed
                </Badge>
                <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold">
                  🌬️ Tailwind Active
                </Badge>
              </div>
            </div>

            {/* Cargo Crates Real-time Slots */}
            <div className="space-y-1.5 pt-1 border-t border-cyan-900/40">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block font-serif">
                📦 Voyage Cargo Crates Loaded:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => toast({ title: "📦 Blueprint Crate Unboxed!", description: "Unlocked Kingdom Blueprint: Floating Island & Crystal Cascades!" })}
                  className="cursor-pointer bg-zinc-900/90 border border-amber-500/50 p-2 rounded-xl text-center space-y-0.5 shadow-md hover:border-amber-400 hover:scale-105 transition-all"
                >
                  <div className="text-amber-400 text-sm animate-bounce">📜</div>
                  <span className="text-[9px] font-bold text-amber-200 block truncate">Blueprint Crate</span>
                  <span className="text-[8px] text-emerald-400 font-mono font-bold block">Tap to Unbox ✨</span>
                </div>
                <div
                  onClick={() => toast({ title: "🧪 Reagents Crate Unboxed!", description: "Retrieved +5x Botanical Crystal Essences!" })}
                  className="cursor-pointer bg-zinc-900/90 border border-cyan-500/50 p-2 rounded-xl text-center space-y-0.5 shadow-md hover:border-cyan-400 hover:scale-105 transition-all"
                >
                  <div className="text-cyan-400 text-sm animate-bounce">🧪</div>
                  <span className="text-[9px] font-bold text-cyan-200 block truncate">Reagents Crate</span>
                  <span className="text-[8px] text-emerald-400 font-mono font-bold block">Tap to Unbox ✨</span>
                </div>
                <div
                  onClick={() => toast({ title: "⚔️ Citizen Gear Crate Unboxed!", description: "Retrieved Mythic Vanguard Shield & Arcane Tome!" })}
                  className="cursor-pointer bg-zinc-900/90 border border-purple-500/50 p-2 rounded-xl text-center space-y-0.5 shadow-md hover:border-purple-400 hover:scale-105 transition-all"
                >
                  <div className="text-purple-400 text-sm animate-bounce">⚔️</div>
                  <span className="text-[9px] font-bold text-purple-200 block truncate">Citizen Gear</span>
                  <span className="text-[8px] text-emerald-400 font-mono font-bold block">Tap to Unbox ✨</span>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Crew Assignment Selector (Horizontal Touch Snap Carousel) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5 font-serif">
                <Users className="w-4 h-4 text-cyan-400" /> Expedition Crew ({selectedCrew.length}/3)
              </span>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-300 bg-cyan-950/40 font-mono font-bold">
                  ⚡ 2x Speed Active
                </Badge>
                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300 bg-amber-950/40 font-mono font-bold">
                  Scout Synergy +25%
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Assign trained citizens as crew to grant them Expedition EXP on voyage completion!
            </p>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pt-1.5 pb-2 custom-scrollbar mobile-scroll-hide w-full">
              {citizens.slice(0, 8).map(c => {
                const isSelected = selectedCrew.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCrewMember(c.id)}
                    className={`snap-start shrink-0 min-w-[105px] p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200 ring-2 ring-cyan-400/50 shadow-md scale-[1.02]'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] block truncate text-zinc-100">{c.name}</span>
                    <span className="text-[9px] text-cyan-400 font-mono capitalize block">
                      Lv.{c.level || 1} {c.type === 'special' || c.type === 'nature' ? '⚡ Synergy' : ''}
                    </span>
                    {isSelected ? (
                      <span className="text-[9px] text-emerald-400 font-bold block mt-1 bg-emerald-950/80 rounded py-0.5 border border-emerald-500/30">
                        Assigned ✓
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-500 block mt-1">Tap to add</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category Synergy & Streak Speed Perks */}
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-zinc-950 to-cyan-950/30 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-cyan-300">
              <span className="flex items-center gap-1">⚡ Ether Engine Synergies</span>
              <span className="text-[10px] text-amber-400 font-mono">7+ Streak = 2x Speed 🚀</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-300">
              <div className="bg-zinc-950/80 p-1.5 rounded border border-white/5">
                🧠 <strong>Knowledge:</strong> +15% Speed
              </div>
              <div className="bg-zinc-950/80 p-1.5 rounded border border-white/5">
                ⚔️ <strong>Might:</strong> +20% Cargo Size
              </div>
            </div>
          </div>

          {/* Active Voyage Status */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-cyan-400" /> Active Destination: {activeDestination}
              </span>
              <span className="font-mono text-xs text-cyan-400 font-semibold">{voyageProgress}% Complete</span>
            </div>

            <Progress value={voyageProgress} className="h-2.5 bg-zinc-800" />

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-amber-400" /> Expected Cargo: Rare Tile Blueprints
              </span>
              <span>Complete today&apos;s habits to propel +10%</span>
            </div>
          </div>

          {/* Dest Ports */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Trading Ports & Expeditions</h4>
            <div className="space-y-2">
              {PORTS.map((port, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex items-center justify-between text-xs gap-3">
                  <div>
                    <span className="font-bold text-zinc-100 block">{port.name}</span>
                    <span className="text-[10px] text-zinc-400 block">{port.cargo}</span>
                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                      🎁 Guaranteed Loot: 1x Legendary Blueprint + 15x Essences
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLaunchCourse(port.name)}
                    className="h-8 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white gap-1 shrink-0 px-3 rounded-lg"
                  >
                    <Sparkles className="w-3 h-3" /> Set course ({port.distance})
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-900">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
