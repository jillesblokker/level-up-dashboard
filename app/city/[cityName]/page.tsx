"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCityData, type CityLocation } from "@/lib/city-data"
import { TEXT_CONTENT } from "@/lib/text-content"
import { HeaderSection } from "@/components/HeaderSection"

export default function CityPage() {
  const params = useParams()

  if (!params) {
    // ... (rest of error handling)
    return (
      <div className="container py-10" role="main" aria-label="city-error-section">
        {/* ... */}
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const cityData = getCityData(cityName)

  if (!cityName || !cityData) {
    // ... (rest of not found handling)
    return (
      // ...
      null
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
            </div>
          );
        })()}
      </main>
    </div>
  )
} 