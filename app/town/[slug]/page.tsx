'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TownView } from '@/components/town-view'
import { useEffect, useState } from 'react'
import { use } from 'react'

export default function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [townData, setTownData] = useState<{ name: string; isTown: boolean } | null>(null)

  useEffect(() => {
    // Get town data from localStorage
    const storedCities = JSON.parse(localStorage.getItem('cities') || '{}')
    const townData = storedCities[resolvedParams.slug]
    if (townData) {
      setTownData(townData)
    } else {
      // If no data found, redirect back to realm
      router.push('/realm')
    }
  }, [resolvedParams.slug, router])

  if (!townData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => router.push('/realm')}
      >
        ← Back to Realm
      </Button>
      <TownView
        name={townData.name}
        isTown={townData.isTown}
        onReturn={() => router.push('/realm')}
      />
    </div>
  )
} 