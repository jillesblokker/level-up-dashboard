"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trophy, Crown, Star, Award, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCharacterStats } from "@/lib/character-stats-service"
import { useCitizensStore } from "@/stores/citizensStore"
import { cn } from "@/lib/utils"

export default function ArchiveOfTriumphsPage() {
  const [stats, setStats] = useState<any>(null)
  const citizens = useCitizensStore(state => state.citizens)
  // Ensure we mount gameStore correctly, skipping hydration mismatch
  const [activePartnerId, setActivePartnerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setStats(getCharacterStats())
    // We can safely grab it from game store directly on mount/client-side
    const { useGameStore } = require('@/stores/game-store');
    setActivePartnerId(useGameStore.getState().activePartnerId);
    
    // Subscribe to changes
    const unsub = useGameStore.subscribe(
      (state: any) => state.activePartnerId,
      (id: string | undefined) => setActivePartnerId(id)
    );
    return () => unsub();
  }, [])

  // Find citizens that have a history of being a partner (affection > 0) OR are the current partner
  const partnerCitizens = citizens.filter(c => c.affection > 0 || c.id === activePartnerId)
  
  // Get top 3 highest affection (current partner may be at the bottom if affection is 0, but will be included if <= 3 total)
  // Let's ensure activePartnerId is prioritized if they are currently set as partner!
  const topCitizens = [...partnerCitizens]
    .sort((a, b) => {
      if (a.id === activePartnerId) return -1;
      if (b.id === activePartnerId) return 1;
      return b.affection - a.affection;
    })
    .slice(0, 3)

  if (!stats) return null

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50">
      {/* Header */}
      <div className="relative border-b border-amber-900/30 bg-zinc-950 shadow-xl z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10 pointer-events-none" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/kingdom">
              <Button variant="ghost" className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 h-10 w-10 p-0 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif text-amber-500 font-bold tracking-tight drop-shadow-md flex items-center gap-2">
                <Trophy className="w-6 h-6" /> Archive of Triumphs
              </h1>
              <p className="text-amber-200/60 font-serif text-sm mt-1 max-w-2xl">
                A grand museum celebrating your most heroic deeds and loyal companions. Your legacy is etched in stone here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 md:p-10 space-y-12">
        {/* Gallery 1: The Champions (Top Citizens) */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-serif text-amber-200 tracking-wide">Hall of Champions</h2>
          </div>
          
          {topCitizens.length === 0 ? (
            <p className="text-zinc-500 italic">Your hall stands empty. Befriend citizens in your journey to see your most loyal partners here.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topCitizens.map((citizen, idx) => (
                <div key={citizen.id} className="relative group">
                  {/* Pedestal / Statue effect */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-zinc-800 rounded-[100%] blur-sm opacity-50 pointer-events-none" />
                  
                  <Card className={cn(
                    "bg-gradient-to-b from-zinc-800 to-zinc-950 border-amber-900/40 transform transition-all duration-500 overflow-hidden relative",
                    idx === 0 ? "scale-105 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]" : "hover:scale-105 hover:border-amber-700/50"
                  )}>
                    <div className="absolute inset-0 bg-[url('/images/ui/stone-texture.png')] opacity-10 mix-blend-overlay" />
                    
                    <CardContent className="p-6 flex flex-col items-center text-center relative z-10">
                      {idx === 0 && <Crown className="absolute top-4 left-4 w-6 h-6 text-amber-400 drop-shadow-md" />}
                      
                      {/* Bond Level in Upper Right */}
                      <div className="absolute top-4 right-4 bg-zinc-950/80 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3", i < Math.floor((citizen.affection || 0) / 20) ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
                        ))}
                      </div>

                      <div className="w-32 h-32 mb-6 relative">
                        {/* Simulate a stone statue filter */}
                        <div className="w-full h-full bg-zinc-700/50 rounded-full animate-pulse absolute inset-0 -z-10 blur-xl" />
                        <img 
                          src={citizen.isMythic ? `/images/Mythics/${citizen.filename}?v=2` : `/images/creatures/${citizen.filename}`} 
                          alt={citizen.name} 
                          className="w-full h-full object-contain filter contrast-125 sepia-[0.3]" 
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <h3 className="text-xl font-bold font-serif text-amber-100">{citizen.name}</h3>
                        <Badge variant="outline" className="bg-amber-950/80 border-amber-500/40 text-amber-400 font-mono text-xs px-2 py-0.5">
                          Lvl {citizen.level || 1}
                        </Badge>
                      </div>
                      <p className="text-amber-500/80 text-sm font-semibold uppercase tracking-wider">{citizen.type} • Lvl {citizen.level || 1}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gallery 2: Records & Plaques */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-serif text-amber-200 tracking-wide">Plaques of Legend</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Highest Level Reached</p>
                <div className="text-4xl font-serif text-amber-400 font-bold">{stats.level}</div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Experience</p>
                <div className="text-3xl font-mono text-amber-400 font-bold">{stats.experience.toLocaleString()}</div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Titles Unlocked</p>
                <div className="text-3xl font-mono text-amber-400 font-bold">
                  {(() => {
                    const { TITLES } = require('@/lib/title-manager');
                    const unlocked = TITLES.filter((t: any) => stats.level >= t.level).length;
                    return `${unlocked} / ${TITLES.length}`;
                  })()}
                </div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Active Perks</p>
                <div className="text-3xl font-mono text-amber-400 font-bold">{stats.perks?.active || 0}</div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
