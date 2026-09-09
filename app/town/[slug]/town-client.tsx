'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from "next/image"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building, ShoppingBag, Swords, Home } from "lucide-react"
import Link from "next/link"
import { setUserPreference } from '@/lib/user-preferences-manager'
import { TEXT_CONTENT } from '@/lib/text-content'
import { HeaderSection } from "@/components/HeaderSection"
import { HabitFocusCard } from "@/components/kingdom/habit-focus-card"
import { getResolvedLocationName } from "@/lib/location-names"

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
  name: TEXT_CONTENT.town.name,
  type: 'town',
  description: TEXT_CONTENT.town.description,
  locations: [
    {
      id: 'kingdom-marketplace',
      name: TEXT_CONTENT.town.locations.marketplace.name,
      description: TEXT_CONTENT.town.locations.marketplace.description,
      icon: 'ShoppingBag',
      image: '/images/locations/kingdom-marketplace.webp'
    },
    {
      id: 'the-dragons-rest',
      name: TEXT_CONTENT.town.locations.dragonsRest.name,
      description: TEXT_CONTENT.town.locations.dragonsRest.description,
      icon: 'Home',
      image: '/images/locations/the-dragons-rest-tavern.webp'
    },
    {
      id: 'royal-stables',
      name: TEXT_CONTENT.town.locations.stables.name,
      description: TEXT_CONTENT.town.locations.stables.description,
      icon: 'Swords',
      image: '/images/locations/royal-stables.webp'
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
    const decodedSlug = decodeURIComponent(slug || '').trim();
    const isSettlement = decodedSlug.toLowerCase().includes('settlement') || decodedSlug.toLowerCase() === 'akercity';
    const resolvedName = getResolvedLocationName(isSettlement ? 'settlement' : 'town', decodedSlug);

    if (isSettlement) {
      setTownData({
        name: resolvedName,
        type: 'town',
        description: 'A cozy frontier settlement equipped with trading stalls, a welcoming hearth tavern, and resting quarters for weary adventurers.',
        locations: [
          {
            id: 'kingdom-marketplace',
            name: 'Settlement Trading Post',
            description: 'Buy, sell, and barter goods with local frontier merchants.',
            icon: 'ShoppingBag',
            image: '/images/locations/kingdom-marketplace.webp'
          },
          {
            id: 'the-dragons-rest',
            name: "The Wayfarer's Hearth",
            description: 'Rest by the hearth, recover stamina, and listen to frontier tales.',
            icon: 'Home',
            image: '/images/locations/the-dragons-rest-tavern.webp'
          },
          {
            id: 'royal-stables',
            name: 'Frontier Stables',
            description: 'Stabling, mounts, and provisions for your long journey.',
            icon: 'Swords',
            image: '/images/locations/royal-stables.webp'
          }
        ]
      });
    } else {
      setTownData({
        ...defaultTownData,
        name: resolvedName,
      });
    }
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
      <HeaderSection
        title={townData.name}
        subtitle={townData.description}
        imageSrc="/images/locations/town.webp"
        shouldRevealImage={true}
        className="mb-6"
        guideComponent={
          <Button
            onClick={() => router.push('/realm')}
            variant="outline"
            className="bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-300 hover:bg-black/80 hover:text-amber-200 text-xs font-serif shadow-lg"
            aria-label="Back to realm"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Back to realm
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <HabitFocusCard
          locationName={townData.name}
          locationType={townData.name.toLowerCase().includes('settlement') || townData.name.toLowerCase().includes('outpost') || townData.name.toLowerCase() === 'akercity' ? 'settlement' : 'town'}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="town-locations-grid">
          {townData.locations.map((location) => (
            <Link
              key={location.id}
              href={`/town/${slug}/${location.id}`}
              aria-label={`Enter ${location.name}`}
              className="block"
            >
              <Card className="overflow-hidden bg-black border border-amber-800/20 hover:border-amber-500 transition-colors cursor-pointer rounded-lg">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-lg bg-zinc-900">
                  <Image
                    src={location.image}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    aria-label={`${location.name}-image`}
                  />
                </div>
                <CardHeader className="pb-2 flex-row items-start gap-3">
                  <div className="mr-3" aria-hidden="true">{getIcon(location.icon)}</div>
                  <div>
                    <CardTitle className="text-xl font-medievalsharp text-white mb-1">{location.name}</CardTitle>
                    <CardDescription className="text-zinc-400">{location.description}</CardDescription>
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