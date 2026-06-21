import LocationClient from './location-client'
import { use, Suspense } from 'react' interface Props { params: Promise<{ slug: string; locationId: string }>
} export default function TownLocationPage({ params }: Props) { const { slug, locationId } = use(params) return ( <div className="min-h-screen bg-background"> <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-amber-500">Loading location...</div>}> <LocationClient slug={slug} locationId={locationId} /> </Suspense> </div> )
} 