"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface TownViewProps {
  name: string
  isTown: boolean
  onReturn: () => void
}

export function TownView({ name, isTown, onReturn }: TownViewProps) {
  // Placeholder images using a placeholder service
  const buildingImages = {
    townHall: "/images/placeholders/location-placeholder.svg",
    marketplace: "/images/placeholders/location-placeholder.svg",
    inn: "/images/placeholders/location-placeholder.svg",
    blacksmith: "/images/placeholders/location-placeholder.svg",
    castle: "/images/placeholders/location-placeholder.svg",
    cathedral: "/images/placeholders/location-placeholder.svg",
    mageTower: "/images/placeholders/location-placeholder.svg",
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <p className="text-muted-foreground">
          {isTown ? "A peaceful town with basic amenities" : "A bustling city full of opportunities"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Population</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{isTown ? "2,500" : "10,000"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{isTown ? "15" : "50"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notable Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isTown ? (
              <>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.townHall}
                      alt="Town Hall"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-medium">Town Hall</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.marketplace}
                      alt="Marketplace"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-medium">Marketplace</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.inn}
                      alt="Inn"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-medium">Inn</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.blacksmith}
                      alt="Blacksmith"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="font-medium">Blacksmith</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.castle}
                      alt="Royal Castle"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="font-medium">Royal Castle</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.cathedral}
                      alt="Grand Cathedral"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="font-medium">Grand Cathedral</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.marketplace}
                      alt="Market District"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="font-medium">Market District</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={buildingImages.mageTower}
                      alt="Mage's Tower"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-medium">Mage's Tower</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={onReturn} className="w-full">
        Return to Map
      </Button>
    </div>
  )
} 