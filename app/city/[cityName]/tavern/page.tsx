"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

// Deep dynamic import to break any circular dependency chains
const LoadingScreen = dynamic(() => import("@/components/loading-screen").then(mod => mod.LoadingScreen), {
  ssr: false
})

const TAVERN_ITEMS = [
  {
    id: "health-potion",
    name: "Health Potion",
    description: "Restores 50 health points",
    price: "10 gold",
    image: "/images/items/health-potion.webp"
  },
  {
    id: "mana-potion",
    name: "Mana Potion",
    description: "Restores 50 mana points",
    price: "15 gold",
    image: "/images/items/mana-potion.webp"
  },
  {
    id: "stamina-potion",
    name: "Stamina Potion",
    description: "Restores 50 stamina points",
    price: "12 gold",
    image: "/images/items/stamina-potion.webp"
  }
];

export default function TavernPage() {
  const params = useParams()
  const cityName = (params?.['cityName'] as string) || ''
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <LoadingScreen
        title="Resting at The Dragon's Rest"
        content={
          <div className="space-y-4">
            <p className="border-t border-amber-500/20 pt-4 px-12 italic text-amber-100/70">
              &quot;The hearth fire crackles as you step into the warm, dimly lit room. Tavern tales and fresh potions await the weary adventurer.&quot;
            </p>
          </div>
        }
      />
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen text-white">
      <div className="mb-6">
        <Link 
          href={`/city/${cityName}`}
          className="inline-flex items-center px-4 py-2 border border-amber-500/40 rounded-md text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
        >
          ← Back to City
        </Link>
      </div>
      
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-medieval font-bold tracking-tight text-amber-500">The Dragon&apos;s Rest</h1>
        <p className="text-slate-400 mt-3 text-lg italic">A cozy tavern where adventurers gather to rest and share stories.</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {TAVERN_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className="group relative flex flex-col rounded-xl overflow-hidden bg-gray-950 border border-amber-900/30 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black"
          >
            {/* Image Section */}
            <div className="relative h-56 w-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="bg-amber-600/90 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Available</span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-amber-100 group-hover:text-amber-500 transition-colors">{item.name}</h3>
                <span className="text-amber-400 font-mono font-medium">{item.price}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                {item.description}
              </p>
              
              <button 
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-amber-900/20"
                onClick={() => alert(`Purchasing ${item.name}...`)}
              >
                Purchase Item
              </button>
            </div>
            
            {/* Grain Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 bg-[url('/images/noise.png')] mix-blend-overlay transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  )
}

