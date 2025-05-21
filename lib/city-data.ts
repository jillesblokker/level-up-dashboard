export interface CityLocation {
  id: string
  name: string
  subtitle: string
  description: string
  image: string
}

export interface CityData {
  name: string
  description: string
  coverImage: string
  locations: CityLocation[]
}

const defaultCityData: CityData = {
  name: "Grand Citadel",
  description: "A magnificent city with towering spires and bustling markets. The heart of commerce and culture in the realm.",
  coverImage: "/images/locations/city.png",
  locations: [
    {
      id: "embers-anvil",
      name: "Ember's Anvil",
      subtitle: "Blacksmith's Forge",
      description: 'A forge where weapons and armor are crafted.',
      image: "/images/locations/embers-anvil.png"
    },
    {
      id: 'kingdom-marketplace',
      name: 'Kingdom Marketplace',
      subtitle: "Trading Center",
      description: 'A bustling marketplace for trading and buying artifacts, scrolls, and books.',
      image: '/images/locations/kingdom-marketplace.png'
    },
    {
      id: 'royal-stables',
      name: 'Royal Stables',
      subtitle: "Horse Breeding Grounds",
      description: 'Where the finest horses in the realm are kept.',
      image: '/images/locations/royal-stables.png'
    }
  ]
}

export function getCityData(cityName: string): CityData | null {
  // For now, return default city data for any city name
  // In the future, this could fetch from an API or database
  return defaultCityData
} 