import LocationClient from './location-client'
import { use } from 'react'

interface Props {
  params: Promise<{ slug: string; locationId: string }>
}

export default function TownLocationPage({ params }: Props) {
  const { slug, locationId } = use(params)
  return (
    <div className="min-h-screen bg-background">
      <LocationClient slug={slug} locationId={locationId} />
    </div>
  )
} 