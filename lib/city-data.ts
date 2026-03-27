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
  coverImage: "/images/locations/city.webp",
  locations: [
    {
      id: "tavern",
      name: "The Dragon's Rest",
      subtitle: "The social heart of the realm",
      description: 'Rest and recover while listening to local gossip, forming alliances, or challenging rivals.',
      image: "/images/allies-header.webp"
    },
    {
      id: 'marketplace',
      name: 'Kingdom Marketplace',
      subtitle: "Trading Center",
      description: 'A bustling marketplace for trading and buying artifacts, scrolls, and books.',
      image: '/images/locations/kingdom-marketplace.webp'
    },
    {
      id: "embers-anvil",
      name: "Ember's Anvil",
      subtitle: "Blacksmith's Forge",
      description: 'A forge where weapons and armor are crafted with dragonfire.',
      image: "/images/locations/embers-anvil.webp"
    },
    {
      id: 'royal-stables',
      name: 'Royal Stables',
      subtitle: "Horse Breeding Grounds",
      description: 'Where the finest horses and magical mounts in the realm are groomed.',
      image: '/images/locations/royal-stables.webp'
    }
  ]
}

export function getCityData(cityName: string): CityData | null {
  // We return the same Grand Citadel data for now, but handle potential variations
  return defaultCityData
}