'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  locationId: string
}

export default function LocationClient({ slug, locationId }: Props) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">Location: {locationId}</h1>
          </div>
          <Button 
            onClick={() => router.push(`/town/${slug}`)}
            variant="outline"
            className="border-amber-800/20 text-amber-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Town
          </Button>
        </div>

        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-2 font-serif">Welcome to {locationId}</h2>
              <p className="text-lg text-gray-300">This location is under construction.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 