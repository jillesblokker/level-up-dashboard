"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trophy, Crown, Star, Award, Shield, Sparkles, Flame, ArrowRight, Medal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeaderSection } from "@/components/HeaderSection"
import { getCharacterStats } from "@/lib/character-stats-service"
import { useCitizensStore } from "@/stores/citizensStore"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface ArchivedSeason {
  id: string
  seasonName: string
  monthYear: string
  winnerUsername: string
  winnerAvatarUrl?: string
  legacyTitle: string
  paragonBorder: 'gold' | 'amber' | 'violet'
  virtuePoints: number
  topVirtue: string
}

const PARAGON_BORDERS = [
  {
    id: 'gold',
    name: 'Paragon gold',
    title: 'Sovereign of might',
    ringStyle: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-amber-600/20',
    desc: 'Awarded to 1st place house cup season champions.'
  },
  {
    id: 'amber',
    name: 'Astral amber',
    title: 'The unyielding',
    ringStyle: 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] bg-gradient-to-tr from-orange-600/20 via-amber-500/20 to-orange-700/20',
    desc: 'Earned by maintaining a 30+ day daily habit streak.'
  },
  {
    id: 'violet',
    name: 'Sovereign violet',
    title: 'Master of persistency',
    ringStyle: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-indigo-600/20',
    desc: 'Granted to legendary champions reaching prestige level 100.'
  }
]

export default function ArchiveOfTriumphsPage() {
  const [stats, setStats] = useState<any>(null)
  const [archivedSeasons, setArchivedSeasons] = useState<ArchivedSeason[]>([])
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true)
  const citizens = useCitizensStore(state => state.citizens)
  const [activePartnerId, setActivePartnerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setStats(getCharacterStats())
    
    // Safely grab partner from game store
    try {
      const { useGameStore } = require('@/stores/game-store');
      setActivePartnerId(useGameStore.getState().activePartnerId);
      
      const unsub = useGameStore.subscribe(
        (state: any) => state.activePartnerId,
        (id: string | undefined) => setActivePartnerId(id)
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    } catch {
      return () => {};
    }
  }, [])

  useEffect(() => {
    const fetchArchivedSeasons = async () => {
      try {
        const res = await fetchWithAuth('/api/house-cup/recap')
        if (res.ok) {
          const data = await res.json()
          setArchivedSeasons(data.seasons || [])
        }
      } catch {
        // Fallback to empty array
      } finally {
        setIsLoadingSeasons(false)
      }
    }

    fetchArchivedSeasons()
  }, [])

  // Find citizens that have a history of being a partner (affection > 0) OR are the current partner
  const partnerCitizens = citizens.filter(c => c.affection > 0 || c.id === activePartnerId)
  
  const topCitizens = [...partnerCitizens]
    .sort((a, b) => {
      if (a.id === activePartnerId) return -1;
      if (b.id === activePartnerId) return 1;
      return b.affection - a.affection;
    })
    .slice(0, 3)

  if (!stats) return null

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 pb-20">
      {/* Header Section with Custom Artwork Cover */}
      <HeaderSection
        title="Archive of triumphs"
        subtitle="A unified sanctuary celebrating your house cup season champions, paragon honors, and heroic companion legacies."
        imageSrc="/images/headers/archive-header.webp"
        defaultBgColor="bg-amber-950"
        shouldRevealImage={true}
      />

      <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-12">
        {/* SECTION 1: House Cup Hall of Champions & Season Legacy */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-amber-900/30 pb-3">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-serif text-amber-200 tracking-wide">House cup hall of champions</h2>
            </div>
            <Link href="/social">
              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs font-semibold">
                Live standings <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {archivedSeasons.length === 0 ? (
            /* Clever Narrative Empty State */
            <Card className="bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-950 border-amber-500/30 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Crown className="w-64 h-64 text-amber-400" />
              </div>
              <CardContent className="p-8 md:p-12 flex flex-col items-center text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-10 h-10 text-amber-400" />
                  </div>
                  <Badge className="absolute -bottom-2 -right-2 bg-amber-600 text-zinc-950 font-bold border-amber-300 text-[10px] px-2 py-0.5">
                    Season 1 active
                  </Badge>
                </div>

                <h3 className="text-2xl font-serif font-bold text-amber-200 mb-3">
                  The grand hourglass awaits its first champion
                </h3>
                
                <p className="text-amber-200/70 text-sm max-w-xl leading-relaxed mb-6">
                  The house cup season is actively underway! Complete your daily habit sweet-spot (<span className="text-amber-300 font-semibold">5/10 habits per day</span>) to fuel the 7 virtue hourglasses (<span className="italic">might, knowledge, honor, castle, craft, vitality, wellness</span>). When the monthly cycle closes, the season winner will be immortalized here with a paragon avatar border and eternal legacy title.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/social">
                    <Button className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 h-11 shadow-lg border-t border-white/20 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-200" />
                      View house cup standings
                    </Button>
                  </Link>
                  <Link href="/quests">
                    <Button variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-950/40 font-semibold rounded-xl px-5 h-11">
                      Complete today&apos;s habits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Archived Champions Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {archivedSeasons.map((season) => (
                <Card key={season.id} className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-amber-500/40 relative overflow-hidden shadow-xl">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 mb-4 font-mono text-xs">
                      {season.monthYear} • {season.seasonName}
                    </Badge>

                    {/* Paragon Avatar Border Ring */}
                    <div className="relative mb-4">
                      <div className={cn(
                        "w-24 h-24 rounded-full border-4 flex items-center justify-center p-1",
                        season.paragonBorder === 'gold' && "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]",
                        season.paragonBorder === 'amber' && "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]",
                        season.paragonBorder === 'violet' && "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                      )}>
                        <img 
                          src={season.winnerAvatarUrl || '/images/character/hero-placeholder.png'} 
                          alt={season.winnerUsername}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <Crown className="absolute -top-2 -right-1 w-6 h-6 text-amber-400 drop-shadow" />
                    </div>

                    <h3 className="text-lg font-bold font-serif text-amber-100">{season.winnerUsername}</h3>
                    <Badge variant="outline" className="bg-amber-950/80 border-amber-500/40 text-amber-300 font-semibold text-xs mt-1">
                      {season.legacyTitle}
                    </Badge>

                    <div className="mt-4 pt-3 border-t border-amber-900/30 w-full text-xs text-amber-200/70 flex justify-between">
                      <span>Virtue energy: <strong className="text-amber-300">{season.virtuePoints} pts</strong></span>
                      <span>Top: <strong className="text-amber-300 uppercase">{season.topVirtue}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: Paragon Avatar Borders & Legacy Titles Showcase */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-3">
            <Medal className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-serif text-amber-200 tracking-wide">Paragon borders and legacy titles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PARAGON_BORDERS.map((item) => (
              <Card key={item.id} className="bg-zinc-900/80 border-amber-900/30 hover:border-amber-500/40 transition-all p-5">
                <CardContent className="p-0 flex items-start gap-4">
                  <div className={cn("w-14 h-14 rounded-full border-2 shrink-0 flex items-center justify-center font-bold text-lg text-amber-300 font-serif", item.ringStyle)}>
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-amber-100 text-sm">{item.name}</h4>
                    </div>
                    <Badge variant="outline" className="bg-amber-950/60 border-amber-500/30 text-amber-400 text-[10px] my-1 font-mono">
                      Title: {item.title}
                    </Badge>
                    <p className="text-xs text-zinc-400 mt-1">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 3: Companion Pedestals */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-serif text-amber-200 tracking-wide">Loyal companion pedestals</h2>
          </div>
          
          {topCitizens.length === 0 ? (
            <Card className="bg-zinc-900/60 border-amber-900/20 p-6 text-center">
              <p className="text-zinc-400 text-sm italic">Your companion pedestals stand empty. Train citizens in your kingdom journey to see your most loyal partners here.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topCitizens.map((citizen, idx) => (
                <div key={citizen.id} className="relative group">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-zinc-800 rounded-[100%] blur-sm opacity-50 pointer-events-none" />
                  
                  <Card className={cn(
                    "bg-gradient-to-b from-zinc-800 to-zinc-950 border-amber-900/40 transform transition-all duration-500 overflow-hidden relative",
                    idx === 0 ? "scale-105 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]" : "hover:scale-105 hover:border-amber-700/50"
                  )}>
                    <CardContent className="p-6 flex flex-col items-center text-center relative z-10">
                      {idx === 0 && <Crown className="absolute top-4 left-4 w-6 h-6 text-amber-400 drop-shadow-md" />}
                      
                      <div className="absolute top-4 right-4 bg-zinc-950/80 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3", i < Math.floor((citizen.affection || 0) / 20) ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
                        ))}
                      </div>

                      <div className="w-32 h-32 mb-6 relative">
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
                      <p className="text-amber-500/80 text-sm font-semibold uppercase tracking-wider">{citizen.type} • Affection {citizen.affection || 0}%</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: Plaques of Legend */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-serif text-amber-200 tracking-wide">Plaques of legend</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Highest level reached</p>
                <div className="text-4xl font-serif text-amber-400 font-bold">{stats.level}</div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total experience</p>
                <div className="text-3xl font-mono text-amber-400 font-bold">{stats.experience?.toLocaleString() || 0}</div>
                <div className="mt-4 h-1 w-12 bg-amber-600/50" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-amber-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-24 h-24 text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Titles unlocked</p>
                <div className="text-3xl font-mono text-amber-400 font-bold">
                  {(() => {
                    try {
                      const { TITLES } = require('@/lib/title-manager');
                      const unlocked = TITLES.filter((t: any) => stats.level >= t.level).length;
                      return `${unlocked} / ${TITLES.length}`;
                    } catch {
                      return '1 / 10';
                    }
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
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Active perks</p>
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
