'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Navigation, Zap, Package, Compass, Anchor } from 'lucide-react'

interface AirshipHarborModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AirshipHarborModal({ isOpen, onClose }: AirshipHarborModalProps) {
  const [etherFuel, setEtherFuel] = useState(35)
  const [voyageProgress, setVoyageProgress] = useState(65)
  const [activeDestination, setActiveDestination] = useState('Port of Celestial Spire')

  useEffect(() => {
    try {
      const savedFuel = localStorage.getItem('thrivehaven_ether_fuel')
      if (savedFuel) setEtherFuel(parseInt(savedFuel, 10))
    } catch (err) {
      console.error('Error loading ether fuel:', err)
    }
  }, [isOpen])

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
            <h4 className="text-xs font-bold text-zinc-300">Trading Ports & Expeditions</h4>
            <div className="space-y-2">
              {PORTS.map((port, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-100 block">{port.name}</span>
                    <span className="text-[10px] text-zinc-400">{port.cargo}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveDestination(port.name)}
                    className="h-7 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    Set course ({port.distance})
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
