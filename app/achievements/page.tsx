"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import { Switch } from '@/components/ui/switch'

export default function AchievementsPage() {
  const { creatures } = useCreatureStore()
  const [previewMode, setPreviewMode] = useState(false)
  const isCreatureDiscovered = (id: string) => creatures.find(c => c.id === id)?.discovered || false

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="w-full">
        {/* Header section */}
        <div className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden">
          <Image
            src="/images/achievements-header.jpg"
            alt="Achievements Header"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
          
          <div className="absolute inset-0 flex items-center justify-center z-[5]">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
              CREATURE COLLECTION
            </h1>
          </div>
        </div>

        {/* Preview Mode Toggle - Floating */}
        <div className="sticky top-4 z-10 flex items-center justify-end gap-2 px-4 py-2 mt-4 mr-4 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-amber-900/20 w-fit ml-auto">
          <span className="text-gray-400">Preview Mode</span>
          <Switch
            checked={previewMode}
            onCheckedChange={setPreviewMode}
            className="bg-amber-900/20"
          />
        </div>

        {/* Content section */}
        <div className="container mx-auto">
          {/* First Creature - Centered */}
          <div className="flex justify-center mb-8">
            {creatures
              .filter(creature => creature.id === '000')
              .map(creature => {
                const discovered = isCreatureDiscovered(creature.id)
                const showCard = discovered || previewMode
                return (
                  <div key={creature.id} className="w-[500px]">
                    <CreatureCard
                      creature={creature}
                      discovered={discovered}
                      showCard={showCard}
                      previewMode={previewMode}
                      hideNameWhenUndiscovered
                    />
                  </div>
                )
              })}
          </div>

          {/* Category sections */}
          <div className="space-y-8">
            {[
              { ids: ['001', '002', '003'], title: 'Fire Creatures', type: 'Fire' },
              { ids: ['004', '005', '006'], title: 'Water Creatures', type: 'Water' },
              { ids: ['007', '008', '009'], title: 'Grass Creatures', type: 'Grass' },
              { ids: ['010', '011', '012'], title: 'Rock Creatures', type: 'Rock' },
              { ids: ['013', '014', '015'], title: 'Ice Creatures', type: 'Ice' },
              { ids: ['016', '017', '018'], title: 'Electric Creatures', type: 'Electric' },
              { ids: ['101', '102', '103'], title: 'Dragon Creatures', type: 'Dragon' }
            ].map((category) => (
              <div key={category.title}>
                <h2 className="text-3xl font-bold text-amber-500 mb-2">{category.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                  {creatures
                    .filter(creature => category.ids.includes(creature.id))
                    .map(creature => {
                      const discovered = isCreatureDiscovered(creature.id)
                      const showCard = discovered || previewMode
                      return (
                        <div key={creature.id} className="w-full">
                          <CreatureCard
                            creature={creature}
                            discovered={discovered}
                            showCard={showCard}
                            previewMode={previewMode}
                            hideNameWhenUndiscovered
                          />
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}