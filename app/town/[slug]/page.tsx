'use client'
import TownClient from './town-client'
import { HeaderSection } from "@/components/HeaderSection";
import Image from "next/image"
import { Home, ShoppingBag, Footprints } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  params: {
    slug: string
  }
}

const townLocations = [
  {
    id: "the-dragons-rest",
    name: "The Dragon's Rest",
    description: "A tavern where you can buy 3 types of potions.",
    icon: "Home",
    image: "/images/locations/The-dragon's-rest-tavern.png"
  },
  {
    id: "kingdom-marketplace",
    name: "Kingdom Marketplace",
    description: "A marketplace for trading/selling artifacts for gold and buying artifacts, scrolls, or books.",
    icon: "ShoppingBag",
    image: "/images/locations/kingdom-marketplace.png"
  },
  {
    id: "royal-stables",
    name: "Royal Stables",
    description: "Where you can buy 3 types of horses with movement stats.",
    icon: "Footprints",
    image: "/images/locations/royal-stables.png"
  }
]

export default function TownPage({ params }: Props) {
  const router = useRouter();
  const { slug } = params;
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="h-8 w-8 text-amber-500" aria-hidden="true" />
      case 'ShoppingBag':
        return <ShoppingBag className="h-8 w-8 text-amber-500" aria-hidden="true" />
      case 'Footprints':
        return <Footprints className="h-8 w-8 text-amber-500" aria-hidden="true" />
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={title}
        imageSrc="/images/locations/town.png"
        canEdit={false}
      />
      <main className="flex-1 p-4 md:p-6 space-y-6" aria-label="town-locations-section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="town-locations-grid">
          {townLocations.map((location) => (
            <Link
              key={location.id}
              href={`/town/${slug}/${location.id}`}
              aria-label={`Enter ${location.name}`}
              className="block"
            >
              <Card className="overflow-hidden bg-black border border-amber-800/20 hover:border-amber-500 transition-colors cursor-pointer rounded-lg" aria-label={`${location.name}-card`}>
                <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={location.image}
                    alt={`${location.name} location image`}
                    fill
                    className="object-cover"
                    aria-label={`${location.name}-image`}
                  />
                </div>
                <CardHeader className="pb-2 flex-row items-start gap-3">
                  <div className="mr-3" aria-hidden="true">{getIcon(location.icon)}</div>
                  <div>
                    <CardTitle className="text-xl font-medievalsharp text-white mb-1">{location.name}</CardTitle>
                    <CardDescription className="text-gray-400">{location.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
} 