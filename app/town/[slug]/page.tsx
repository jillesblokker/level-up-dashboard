'use client'
import TownClient from './town-client'
import { HeaderSection } from "@/components/HeaderSection";
import Image from "next/image"
import { Home, ShoppingBag, Footprints } from "lucide-react"
import { useRouter } from "next/navigation"

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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="h-8 w-8 text-amber-500" />
      case 'ShoppingBag':
        return <ShoppingBag className="h-8 w-8 text-amber-500" />
      case 'Footprints':
        return <Footprints className="h-8 w-8 text-amber-500" />
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={params.slug.charAt(0).toUpperCase() + params.slug.slice(1)}
        imageSrc="/images/locations/town.png"
        canEdit={false}
      />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {townLocations.map((location) => (
            <div
              key={location.id}
              className="bg-black border border-amber-800/20 rounded-lg p-4 cursor-pointer hover:bg-amber-900/10 transition-colors"
            >
              <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
                <Image src={location.image} alt={location.name} fill className="object-cover" />
              </div>
              <div className="flex items-start mb-3">
                <div className="mr-3">{getIcon(location.icon)}</div>
                <div>
                  <h3 className="text-xl font-medievalsharp text-white">{location.name}</h3>
                  <p className="text-gray-400">{location.description}</p>
                </div>
              </div>
              <button
                className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2 rounded mt-auto"
                onClick={() => router.push(`/town/${params.slug}/${location.id}`)}
                aria-label={`Visit ${location.name}`}
              >
                Visit Location
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 