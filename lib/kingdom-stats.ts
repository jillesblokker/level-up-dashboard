// Event target for kingdom stats updates
export const updateKingdomStats = new EventTarget(); 

export interface KingdomStats {
  gold: number
  experience: number
  level: number
  population: number
  happiness: number
  resources: {
    wood: number
    stone: number
    food: number
    iron: number
  }
  buildings: {
    houses: number
    farms: number
    mines: number
    barracks: number
    walls: number
    towers: number
    markets: number
    temples: number
    castles: number
  }
  military: {
    soldiers: number
    archers: number
    cavalry: number
    siege: number
  }
  titles: string[]
  perks: string[]
  inventory: {
    id: string
    name: string
    type: string
    quantity: number
    value: number
  }[]
}

export const defaultKingdomStats: KingdomStats = {
  gold: 1000,
  experience: 0,
  level: 1,
  population: 100,
  happiness: 75,
  resources: {
    wood: 200,
    stone: 100,
    food: 300,
    iron: 50
  },
  buildings: {
    houses: 10,
    farms: 5,
    mines: 2,
    barracks: 1,
    walls: 1,
    towers: 0,
    markets: 1,
    temples: 1,
    castles: 0
  },
  military: {
    soldiers: 20,
    archers: 10,
    cavalry: 5,
    siege: 0
  },
  titles: ['Novice Ruler'],
  perks: ['Basic Administration'],
  inventory: [
    {
      id: 'starter-sword',
      name: 'Rusty Sword',
      type: 'weapon',
      quantity: 1,
      value: 50
    },
    {
      id: 'starter-shield',
      name: 'Wooden Shield',
      type: 'armor',
      quantity: 1,
      value: 30
    }
  ]
}

export function calculateIncome(stats: KingdomStats): number {
  const baseIncome = 10
  const populationIncome = stats.population * 0.5
  const marketIncome = stats.buildings.markets * 100
  const happinessMultiplier = stats.happiness / 100

  return Math.floor((baseIncome + populationIncome + marketIncome) * happinessMultiplier)
}

export function calculateUpkeep(stats: KingdomStats): number {
  const militaryUpkeep = 
    stats.military.soldiers * 2 +
    stats.military.archers * 3 +
    stats.military.cavalry * 5 +
    stats.military.siege * 10

  const buildingUpkeep = 
    stats.buildings.houses * 1 +
    stats.buildings.farms * 2 +
    stats.buildings.mines * 3 +
    stats.buildings.barracks * 5 +
    stats.buildings.walls * 2 +
    stats.buildings.towers * 3 +
    stats.buildings.markets * 4 +
    stats.buildings.temples * 3 +
    stats.buildings.castles * 10

  return militaryUpkeep + buildingUpkeep
}

export function calculateResourceProduction(stats: KingdomStats) {
  return {
    wood: stats.buildings.farms * 10,
    stone: stats.buildings.mines * 5,
    food: stats.buildings.farms * 15,
    iron: stats.buildings.mines * 3
  }
}

export function calculateMilitaryStrength(stats: KingdomStats): number {
  const unitStrength = 
    stats.military.soldiers * 10 +
    stats.military.archers * 15 +
    stats.military.cavalry * 25 +
    stats.military.siege * 50

  const defenseStrength = 
    stats.buildings.walls * 100 +
    stats.buildings.towers * 150 +
    stats.buildings.castles * 500

  return unitStrength + defenseStrength
}

export function calculatePopulationGrowth(stats: KingdomStats): number {
  const baseGrowth = stats.population * 0.05
  const foodFactor = stats.resources.food >= stats.population ? 1 : 0.5
  const happinessFactor = stats.happiness / 100
  const housingCapacity = stats.buildings.houses * 10

  if (stats.population >= housingCapacity) {
    return 0
  }

  return Math.floor(baseGrowth * foodFactor * happinessFactor)
}

export function calculateHappinessChange(stats: KingdomStats): number {
  let change = 0

  // Food availability
  const foodPerPerson = stats.resources.food / stats.population
  change += foodPerPerson >= 2 ? 5 : -5

  // Housing
  const housingCapacity = stats.buildings.houses * 10
  const housingOccupancy = stats.population / housingCapacity
  change += housingOccupancy <= 0.8 ? 3 : -3

  // Temples
  change += stats.buildings.temples * 5

  // Markets
  change += stats.buildings.markets * 2

  // Military protection
  const militaryStrength = calculateMilitaryStrength(stats)
  change += militaryStrength >= stats.population * 2 ? 2 : -2

  return Math.min(Math.max(change, -10), 10)
}

export function getNextLevelExperience(level: number): number {
  return Math.floor(1000 * Math.pow(1.5, level - 1))
}

export function getAvailableTitles(stats: KingdomStats): string[] {
  const titles = []

  if (stats.population >= 500) titles.push('Lord of the Realm')
  if (stats.population >= 1000) titles.push('High Lord')
  if (stats.population >= 2000) titles.push('Grand Duke')

  if (stats.buildings.castles >= 1) titles.push('Castle Lord')
  if (stats.buildings.castles >= 3) titles.push('King of Castles')

  if (calculateMilitaryStrength(stats) >= 1000) titles.push('Warlord')
  if (calculateMilitaryStrength(stats) >= 5000) titles.push('Supreme Commander')

  if (stats.gold >= 10000) titles.push('Wealthy Baron')
  if (stats.gold >= 50000) titles.push('Master of Coin')

  return titles
}

export function getAvailablePerks(stats: KingdomStats): string[] {
  const perks = []

  if (stats.level >= 5) perks.push('Efficient Administration')
  if (stats.level >= 10) perks.push('Master Builder')
  if (stats.level >= 15) perks.push('Military Genius')
  if (stats.level >= 20) perks.push('Economic Mastermind')

  if (stats.buildings.markets >= 5) perks.push('Trade Empire')
  if (stats.buildings.temples >= 5) perks.push('Divine Favor')
  if (stats.buildings.barracks >= 5) perks.push('Military Tradition')

  if (stats.military.soldiers >= 100) perks.push('Army Commander')
  if (stats.military.archers >= 100) perks.push('Archery Master')
  if (stats.military.cavalry >= 50) perks.push('Cavalry Commander')

  return perks
} 