import LocationClient from './location-client'

interface Props {
  params: {
    slug: string
    locationId: string
  }
}

export default function TownLocationPage({ params }: Props) {
  const { slug, locationId } = params
  return (
    <div className="min-h-screen bg-background">
      <LocationClient slug={slug} locationId={locationId} />
    </div>
  )
} 