export interface NotableLocation {
  name: string
  description: string
  image: string
  items: {
    name: string
    price: number
    description: string
  }[]
}

export interface LocationData {
  name: string
  description: string
  image: string
  notableLocations: NotableLocation[]
}

export interface LocationDetails {
  [key: string]: LocationData
}

export const locationDetails: LocationDetails = {
  "grand-citadel": {
    name: "Grand Citadel",
    description: "A majestic fortress city that serves as the capital.",
    image: "/images/locations/The-dragon's-rest-tavern.png",
    notableLocations: [
      {
        name: "Merchant's Square",
        description: "A bustling marketplace where traders from all corners gather.",
        image: "/images/locations/kingdom-marketplace.png",
        items: [
          {
            name: "Health Potion",
            price: 50,
            description: "Restores 50 HP"
          },
          {
            name: "Mana Potion",
            price: 75,
            description: "Restores 50 MP"
          }
        ]
      },
      {
        name: "Royal Stables",
        description: "Fine steeds and mounts for your journeys.",
        image: "/images/locations/royal-stables.png",
        items: [
          {
            name: "Horse",
            price: 500,
            description: "A reliable mount"
          }
        ]
      },
      {
        name: "Ember's Forge",
        description: "Master blacksmith crafting weapons and armor.",
        image: "/images/locations/embers-anvil.png",
        items: [
          {
            name: "Iron Sword",
            price: 200,
            description: "A sturdy blade"
          }
        ]
      }
    ]
  }
} 