'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building, ShoppingBag, Swords, Home } from "lucide-react"
import Link from "next/link"
import { setUserPreference } from '@/lib/user-preferences-manager'

interface TownData {
  name: string
  description: string
  type: 'town'
  locations: {
    id: string
    name: string
    description: string
    icon: string
    image: string
  }[]
}

const defaultTownData: TownData = {
  name: "Riverside Haven",
  type: 'town',
  description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
  locations: [
    {
      id: 'kingdom-marketplace',
      name: 'Marketplace',
      description: 'Buy and sell goods at the local market.',
      icon: 'ShoppingBag',
      image: '/images/locations/kingdom-marketplace.png'
    },
    {
      id: 'the-dragons-rest',
      name: "The Dragon's Rest",
      description: 'Rest and recover while listening to local gossip.',
      icon: 'Home',
      image: '/images/locations/the-dragons-rest-tavern.png'
    },
    {
      id: 'royal-stables',
      name: "Royal Stables",
      description: 'Purchase horses and mounts for your journey.',
      icon: 'Swords',
      image: '/images/locations/royal-stables.png'
    }
  ]
}

interface Props {
  slug: string
}

export default function TownClient({ slug }: Props) {
  const router = useRouter()
  const [townData, setTownData] = useState<TownData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTownData(defaultTownData);
    setIsLoading(false);

    // Track that the user has visited a town for the "New Hero Journey"
    setUserPreference('onboarding_town_visited', 'true');
  }, [slug]);

  const handleVisitLocation = (locationId: string) => {
    router.push(`/town/${slug}/${locationId}`);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!townData) {
    return null
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="h-8 w-8 text-amber-500" />
      case 'Home':
        return <Home className="h-8 w-8 text-amber-500" />
      case 'Swords':
        return <Swords className="h-8 w-8 text-amber-500" />
      default:
        return <Building className="h-8 w-8 text-amber-500" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Cover image banner */}
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/images/locations/town.png)` }}
          aria-label="town-cover-image"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold mb-2 font-serif text-amber-500 drop-shadow-lg">{townData.name}</h2>
            <p className="text-lg text-gray-300 max-w-2xl text-center">{townData.description}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          onClick={() => window.location.href = '/realm'}
          variant="outline"
          className="border-amber-800/20 text-amber-500"
          aria-label="Back to Realm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Realm
        </Button>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="town-locations-grid">
          {townData.locations.map((location) => (
            <Link
              key={location.id}
              href={`/town/${slug}/${location.id}`}
              aria-label={`Enter ${location.name}`}
              className="block"
            >
              <Card className="overflow-hidden bg-black border border-amber-800/20 hover:border-amber-500 transition-colors cursor-pointer rounded-lg">
                <div
                  className="h-48 bg-cover bg-center mb-3 rounded-lg overflow-hidden"
                  style={{ backgroundImage: `url(${location.image})` }}
                  aria-label={`${location.name}-image`}
                />
                <CardHeader className="pb-2 flex-row items-start gap-3">
                  <div className="mr-3" aria-hidden="true">{getIcon(location.icon)}</div>
                  <div>
                    <CardTitle className="text-xl font-medievalsharp text-white mb-1">{location.name}</CardTitle>
                    <CardDescription className="text-gray-400">{location.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
} 