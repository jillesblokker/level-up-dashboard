import { Metadata } from "next"
import { locationDetails } from "./location-data"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const location = locationDetails[params.id]
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