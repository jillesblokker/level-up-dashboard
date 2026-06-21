"use client"

import { locationDetails } from "./location-data"
import Image from 'next/image'

export default function LocationPage({ id }: { id: string }) {
  const location = locationDetails[id]
  if (!location) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Location Not Found</h1>
        <p>The requested location could not be found.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">{location.name}</h1>
      <div className="relative h-64 mb-6">
        <Image
          src={location.image}
          alt={location.name}
          className="object-cover w-full h-full rounded-lg"
          width={400}
          height={300}
        />
      </div>
      <p className="text-lg mb-8">{location.description}</p>

      <h2 className="text-2xl font-bold mb-4">Notable Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {location.notableLocations.map((spot) => (
          <div key={spot.name} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">{spot.name}</h3>
            <p className="mb-4">{spot.description}</p>
            
            <h4 className="font-semibold mb-2">Available Items:</h4>
            <ul className="space-y-2">
              {spot.items.map((item) => (
                <li key={item.name} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className="text-amber-600">{item.price} gold</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
} 