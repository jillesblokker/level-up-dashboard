"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCityData, type CityLocation } from "@/lib/city-data"

export default function CityPage() {
  const params = useParams()

  if (!params) {
    return (
      <div className="container py-10" role="main" aria-label="city-error-section">
        <Card aria-label="city-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load city information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const cityData = getCityData(cityName)

  if (!cityName || !cityData) {
    return (
      <div className="container py-10" role="main" aria-label="city-not-found-section">
        <div className="mb-6">
          <Link href="/realm">
            <Button variant="outline" size="sm" aria-label="Back to Realm">
              <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Realm
            </Button>
          </Link>
        </div>
        <Card aria-label="city-not-found-card">
          <CardHeader>
            <CardTitle>City Not Found</CardTitle>
            <CardDescription>
              We couldn&apos;t find the city you&apos;re looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The city &quot;{cityName}&quot; does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityData.coverImage})` }}
          aria-label="city-cover-image"
          role="img"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold mb-2 font-serif text-amber-500 drop-shadow-lg">{cityData.name}</h2>
            <p className="text-lg text-gray-300 max-w-2xl text-center">{cityData.description}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/realm">
              <Button 
                variant="outline" 
                className="border-amber-800/20 text-amber-500"
                aria-label="Back to Realm"
              >
                <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Realm
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="city-locations-grid">
          {cityData.locations.map((location: CityLocation) => (
            <Link key={location.id} href={`/city/${params['cityName']}/${location.id}`} aria-label={`Enter ${location.name}`} className="block">
              <Card className="overflow-hidden bg-black border border-amber-800/20 hover:border-amber-500 transition-colors cursor-pointer" aria-label={`${location.name}-card`}>
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${location.image})` }}
                  aria-label={`${location.name}-image`}
                  role="img"
                />
                <CardHeader>
                  <CardTitle className="text-white">{location.name}</CardTitle>
                  <CardDescription className="text-gray-400">{location.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">{location.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
} 