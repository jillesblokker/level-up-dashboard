"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCityData, type CityLocation } from "@/lib/city-data"
import { TEXT_CONTENT } from "@/lib/text-content"
import { HeaderSection } from "@/components/HeaderSection"
import { HabitFocusCard } from "@/components/kingdom/habit-focus-card"

import { FortuneTellerModal } from "@/components/fortune-teller-modal"
import { TownRiddleModal } from "@/components/minigames/TownRiddleModal"
import { PlankPuzzleModal } from "@/components/plank-puzzle-modal"

export default function CityPage() {
  const params = useParams()
  const [tarotOpen, setTarotOpen] = useState(false)
  const [riddleOpen, setRiddleOpen] = useState(false)
  const [labyrinthOpen, setLabyrinthOpen] = useState(false)

  if (!params) {
    return (
      <div className="container py-10" role="main" aria-label="city-error-section">
        <h1 className="text-2xl font-bold text-white">City Not Found</h1>
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const cityData = getCityData(cityName)

  if (!cityName || !cityData) {
    return (
      <div className="container py-10 text-center text-white" role="main">
        <h1 className="text-2xl font-bold mb-4">City Not Found</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/20 text-amber-500">
            Return to Realm Map
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={cityData.name}
        subtitle={cityData.description}
        imageSrc={cityData.coverImage}
        shouldRevealImage={true}
        className="mb-8"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/realm">
              <Button
                variant="outline"
                className="border-amber-800/20 text-amber-500"
                aria-label={TEXT_CONTENT.city.back}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {TEXT_CONTENT.city.back}
              </Button>
            </Link>
          </div>
        </div>

        <HabitFocusCard
          locationName={cityName}
          locationType={cityName.toLowerCase().includes('megapolis') ? 'megapolis' : 'city'}
        />

        {(() => {
          const getAveragePriceAdjustment = (): number => {
            const materials = ['material-water', 'material-logs', 'material-stone', 'material-planks', 'material-stone-block', 'material-steel', 'material-crystal'];
            let total = 0;
            materials.forEach(id => {
              const dateStr = new Date().toISOString().split('T')[0];
              const str = dateStr + id;
              let hash = 0;
              for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
              }
              const percent = ((Math.abs(hash) % 31) - 15) / 100;
              total += percent;
            });
            return Math.round((total / materials.length) * 100);
          };

          return (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3" aria-label="city-locations-grid">
              {cityData.locations.map((location: CityLocation) => (
                <Link key={location.id} href={`/city/${params['cityName']}/${location.id}`} aria-label={`Enter ${location.name}`} className="block">
                  <Card className="overflow-hidden bg-black border border-amber-800/20 hover:border-amber-500 transition-colors cursor-pointer" aria-label={`${location.name}-card`}>
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-zinc-900 border-b border-amber-800/20">
                      <Image
                        src={location.image}
                        alt={location.name}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        aria-label={`${location.name}-image`}
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between gap-2">
                        <span>{location.name}</span>
                        {location.id === 'marketplace' && (() => {
                          const avgTrend = getAveragePriceAdjustment();
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              avgTrend > 0 
                                ? 'bg-red-950/40 text-red-400 border-red-900/30' 
                                : avgTrend < 0 
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                                  : 'bg-zinc-950/40 text-zinc-400 border-zinc-900/30'
                            }`}>
                              {avgTrend > 0 ? '📈 +' : avgTrend < 0 ? '📉 ' : '↔️ '}{avgTrend}% Today
                            </span>
                          );
                        })()}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">{location.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-300">{location.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Unique Featured Town Minigame Location Card */}
              {(() => {
                let hash = 0;
                const cName = cityName || 'citadel';
                for (let i = 0; i < cName.length; i++) {
                  hash = (hash << 5) - hash + cName.charCodeAt(i);
                  hash |= 0;
                }
                const mTypeIndex = Math.abs(hash) % 3;
                const assignedType = mTypeIndex === 0 ? 'fortune_teller' : mTypeIndex === 1 ? 'riddle' : 'plank_labyrinth';
                const todayStr = new Date().toDateString();
                const isMinigameDone = typeof window !== 'undefined' && localStorage.getItem(`town_minigame_${cName}_${assignedType}_${todayStr}`) === 'true';

                const minigameCardData = {
                  fortune_teller: {
                    name: "Fortune Teller's Shrine",
                    subtitle: "Mystic Tarot Chamber",
                    description: "Draw a daily fortune card to receive active daily habit blessings and gold offerings.",
                    image: "/images/tiles/fortune-teller-tile.webp",
                    badge: isMinigameDone ? "Completed Today ✓" : "1/1 Available",
                    action: () => setTarotOpen(true)
                  },
                  riddle: {
                    name: "Scholar's Archive",
                    subtitle: "Ancient Wisdom Vault",
                    description: "Solve the daily scholar riddle to unearth lost realm blueprints, XP, and gold.",
                    image: "/images/encounters/riddle-sage.webp",
                    badge: isMinigameDone ? "Completed Today ✓" : "1/1 Available",
                    action: () => setRiddleOpen(true)
                  },
                  plank_labyrinth: {
                    name: "Craftsman's Labyrinth",
                    subtitle: "Wooden Plank Maze",
                    description: "Solve the 6x6 ancient keystone sliding puzzle to retrieve gold and building materials.",
                    image: "/images/tiles/plank-labyrinth-tile.webp",
                    badge: isMinigameDone ? "Completed Today ✓" : "1/1 Available",
                    action: () => setLabyrinthOpen(true)
                  }
                }[assignedType];

                return (
                  <Card 
                    onClick={() => {
                      if (!isMinigameDone) minigameCardData.action();
                    }}
                    className={`overflow-hidden bg-black border transition-colors cursor-pointer group ${
                      isMinigameDone ? 'border-amber-900/20 opacity-75' : 'border-amber-800/40 hover:border-amber-500'
                    }`}
                    aria-label={`${minigameCardData.name}-card`}
                  >
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-zinc-900 border-b border-amber-800/20">
                      <Image
                        src={minigameCardData.image}
                        alt={minigameCardData.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-lg ${
                          isMinigameDone ? 'bg-zinc-950/90 text-zinc-400 border-zinc-700' : 'bg-amber-500/90 text-zinc-950 border-amber-300 font-mono animate-pulse'
                        }`}>
                          {minigameCardData.badge}
                        </span>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between gap-2">
                        <span>{minigameCardData.name}</span>
                      </CardTitle>
                      <CardDescription className="text-zinc-400">{minigameCardData.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-300">{minigameCardData.description}</p>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          );
        })()}
      </main>

      {/* Daily Town Minigame Modals */}
      {tarotOpen && <FortuneTellerModal open={tarotOpen} onOpenChange={setTarotOpen} x={0} y={0} tileId="town-tarot" />}
      {riddleOpen && <TownRiddleModal isOpen={riddleOpen} onClose={() => setRiddleOpen(false)} />}
      {labyrinthOpen && <PlankPuzzleModal isOpen={labyrinthOpen} onClose={() => setLabyrinthOpen(false)} onComplete={() => setLabyrinthOpen(false)} />}
    </div>
  )
}