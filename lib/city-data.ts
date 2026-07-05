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
  if (cityName && cityName.toLowerCase().includes('megapolis')) {
    return {
      name: cityName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: "A colossal megapolis protected by triple-layered walls and a mountain fortress. Six unique districts offer extensive trading opportunities.",
      coverImage: "/images/locations/city.webp",
      locations: [
        {
          id: "marketplace-weapons",
          name: "Weapons Market",
          subtitle: "Blade and bows",
          description: "Purchase weapons of all tiers and shapes from legendary smiths.",
          image: "/images/locations/embers-anvil.webp"
        },
        {
          id: "marketplace-armor",
          name: "Armor Market",
          subtitle: "Shield and plate",
          description: "Protect yourself with the strongest shields and armor available in the realm.",
          image: "/images/locations/royal-stables.webp"
        },
        {
          id: "marketplace-potions",
          name: "Apothecary Shop",
          subtitle: "Potions and elixirs",
          description: "Stock up on health potions, mana, and buffing brews.",
          image: "/images/locations/kingdom-marketplace.webp"
        },
        {
          id: "marketplace-scrolls",
          name: "Arcane Scrolls Shop",
          subtitle: "Magical parchments",
          description: "Obtain scrolls for spells, streak recovery, and magical boosts.",
          image: "/images/allies-header.webp"
        },
        {
          id: "marketplace-artifacts",
          name: "Relics & Artifacts",
          subtitle: "Ancient wonders",
          description: "Obtain rare items and magical artifacts of lost eras.",
          image: "/images/locations/kingdom-marketplace.webp"
        },
        {
          id: "marketplace-food",
          name: "Tavern Provisions",
          subtitle: "Food and ingredients",
          description: "Stock up on food supplies, rations, and rare chef ingredients.",
          image: "/images/allies-header.webp"
        }
      ]
    };
  }
  return defaultCityData;
}