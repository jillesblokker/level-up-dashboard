"use client"

import '../globals.css'
import { ImagePaths } from "@/config/image-paths"
import { Button } from "@/components/ui/button"
import { MapPin, Compass, Mountain, Trees, Waves, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function WorldMapPage() {
  return (
    <div className="min-h-screen bg-black">
      <main className="relative">
        <section className="section castle">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-600 rounded-full p-4 shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.castle.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.castle.desc}</p>
            <Link href="/castle">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                {TEXT_CONTENT.worldMap.castle.button}
              </Button>
            </Link>
          </div>
        </section>

        <section className="section forest">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 rounded-full p-4 shadow-lg">
              <Trees className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.forest.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.forest.desc}</p>
            <Link href="/forest">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {TEXT_CONTENT.worldMap.forest.button}
              </Button>
            </Link>
          </div>
        </section>

        <section className="section mountain">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-600 rounded-full p-4 shadow-lg">
              <Mountain className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.mountain.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.mountain.desc}</p>
            <Link href="/mountain">
              <Button className="bg-stone-600 hover:bg-stone-700 text-white">
                {TEXT_CONTENT.worldMap.mountain.button}
              </Button>
            </Link>
          </div>
        </section>

        <section className="section village">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-600 rounded-full p-4 shadow-lg">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.village.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.village.desc}</p>
            <Link href="/village">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                {TEXT_CONTENT.worldMap.village.button}
              </Button>
            </Link>
          </div>
        </section>

        <section className="section lake">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full p-4 shadow-lg">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.lake.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.lake.desc}</p>
            <Link href="/lake">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                {TEXT_CONTENT.worldMap.lake.button}
              </Button>
            </Link>
          </div>
        </section>

        <section className="section market">
          <div className="content-container transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-600 rounded-full p-4 shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4">{TEXT_CONTENT.worldMap.market.title}</h2>
            <p className="mb-6">{TEXT_CONTENT.worldMap.market.desc}</p>
            <Link href="/market">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                {TEXT_CONTENT.worldMap.market.button}
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

