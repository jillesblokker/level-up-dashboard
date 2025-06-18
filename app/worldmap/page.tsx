"use client"

import '../globals.css'
import { ImagePaths } from "@/config/image-paths"
import { Button } from "@/components/ui/button"
import { MapPin, Compass, Mountain, Trees, Waves, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function WorldMapPage() {
  return (
    <div className="min-h-screen bg-black">
      <main className="relative">
        <section className="section castle">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-600 rounded-full p-4 shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Welcome to Your Medieval Adventure</h2>
            <p className="mb-6">Embark on an epic journey through a world of castles, forests, and ancient mysteries.</p>
            <Link href="/castle">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Enter Castle
              </Button>
            </Link>
          </div>
        </section>

        <section className="section forest">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 rounded-full p-4 shadow-lg">
              <Trees className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Explore the Enchanted Forest</h2>
            <p className="mb-6">Discover hidden treasures and face mythical creatures in the depths of the ancient woods.</p>
            <Link href="/forest">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Enter Forest
              </Button>
            </Link>
          </div>
        </section>

        <section className="section mountain">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-600 rounded-full p-4 shadow-lg">
              <Mountain className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Conquer the Mountain Peaks</h2>
            <p className="mb-6">Scale treacherous heights and uncover the secrets of the mountain dwellers.</p>
            <Link href="/mountain">
              <Button className="bg-stone-600 hover:bg-stone-700 text-white">
                Climb Mountains
              </Button>
            </Link>
          </div>
        </section>

        <section className="section village">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-600 rounded-full p-4 shadow-lg">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Visit Medieval Villages</h2>
            <p className="mb-6">Experience the daily life of medieval townsfolk and trade with local merchants.</p>
            <Link href="/village">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Enter Village
              </Button>
            </Link>
          </div>
        </section>

        <section className="section lake">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full p-4 shadow-lg">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Navigate the Mystic Waters</h2>
            <p className="mb-6">Sail across crystal-clear lakes and encounter mysterious water creatures.</p>
            <Link href="/lake">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Set Sail
              </Button>
            </Link>
          </div>
        </section>

        <section className="section market">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-600 rounded-full p-4 shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">Trade at the Grand Market</h2>
            <p className="mb-6">Barter with merchants from distant lands and collect rare artifacts.</p>
            <Link href="/market">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Enter Market
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

