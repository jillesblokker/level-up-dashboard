import { Metadata } from "next"
import LocationPage from "./location-page"
import { locationDetails } from "./location-data"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const location = locationDetails[resolvedParams.id]
  if (!location) {
    return {
      title: "Location Not Found",
      description: "The requested location could not be found.",
    }
  }

  return {
    title: location.name,
    description: location.description,
  }
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <LocationPage id={resolvedParams.id} />
} 