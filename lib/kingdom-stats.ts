import { EventEmitter } from 'events';

export interface TileItem {
  type: string;
  // Add other tile properties as needed
}

export type MapGrid = TileItem[];

export interface BuildingsData {
  houses: number;
  farms: number;
  markets: number;
  mines: number;
  barracks: number;
  walls: number;
  towers: number;
  temples: number;
  castles: number;
  total: number;
}

export interface MilitaryData {
  soldiers: number;
  archers: number;
  cavalry: number;
  siege: number;
  total: number;
}

export interface KingdomStatsData {
  questsCompleted: number;
  goldEarned: number;
  expEarned: number;
  population: number;
  happiness: number;
  buildings: BuildingsData;
  military: MilitaryData;
  gold: number;
}

export interface KingdomStatsInterface {
  population: number;
  happiness: number;
  buildings: BuildingsData;
  military: MilitaryData;
  gold: number;
}

export class KingdomStats extends EventEmitter implements KingdomStatsInterface {
  private questsCompleted: number = 0;
  private goldEarned: number = 0;
  private expEarned: number = 0;
  public population: number = 0;
  public happiness: number = 50;
  public buildings: BuildingsData = {
    houses: 0,
    farms: 0,
    markets: 0,
    mines: 0,
    barracks: 0,
    walls: 0,
    towers: 0,
    temples: 0,
    castles: 0,
    total: 0
  };
  public military: MilitaryData = {
    soldiers: 0,
    archers: 0,
    cavalry: 0,
    siege: 0,
    total: 0
  };
  public gold: number = 0;

  constructor() {
    super();
  }

  updateStats(type: 'quest' | 'gold' | 'exp', amount: number = 1) {
    switch (type) {
      case 'quest':
        this.questsCompleted += amount;
        this.emit('questComplete');
        break;
      case 'gold':
        this.goldEarned += amount;
        this.gold += amount;
        this.emit('goldUpdate', { amount });
        break;
      case 'exp':
        this.expEarned += amount;
        this.emit('expUpdate', { amount });
        break;
    }
  }

  getStats(): KingdomStatsData {
    return {
      questsCompleted: this.questsCompleted,
      goldEarned: this.goldEarned,
      expEarned: this.expEarned,
      population: this.population,
      happiness: this.happiness,
      buildings: { ...this.buildings },
      military: { ...this.military },
      gold: this.gold
    };
  }

  resetStats() {
    this.questsCompleted = 0;
    this.goldEarned = 0;
    this.expEarned = 0;
    this.population = 0;
    this.happiness = 50;
    this.buildings = {
      houses: 0,
      farms: 0,
      markets: 0,
      mines: 0,
      barracks: 0,
      walls: 0,
      towers: 0,
      temples: 0,
      castles: 0,
      total: 0
    };
    this.military = {
      soldiers: 0,
      archers: 0,
      cavalry: 0,
      siege: 0,
      total: 0
    };
    this.gold = 0;
  }

  calculateStats(grid: MapGrid) {
    // Calculate buildings
    this.buildings.houses = grid.filter(tile => tile.type === 'house').length;
    this.buildings.farms = grid.filter(tile => tile.type === 'farm').length;
    this.buildings.markets = grid.filter(tile => tile.type === 'market').length;
    this.buildings.mines = grid.filter(tile => tile.type === 'mine').length;
    this.buildings.barracks = grid.filter(tile => tile.type === 'barracks').length;
    this.buildings.walls = grid.filter(tile => tile.type === 'wall').length;
    this.buildings.towers = grid.filter(tile => tile.type === 'tower').length;
    this.buildings.temples = grid.filter(tile => tile.type === 'temple').length;
    this.buildings.castles = grid.filter(tile => tile.type === 'castle').length;
    
    this.buildings.total = 
      this.buildings.houses + 
      this.buildings.farms + 
      this.buildings.markets +
      this.buildings.mines +
      this.buildings.barracks +
      this.buildings.walls +
      this.buildings.towers +
      this.buildings.temples +
      this.buildings.castles;

    // Calculate population based on houses and castles
    this.population = (this.buildings.houses * 5) + (this.buildings.castles * 20);

    // Calculate happiness based on amenities
    this.happiness = Math.min(100, 50 + 
      (this.buildings.markets * 5) + 
      (this.buildings.farms * 2) +
      (this.buildings.temples * 10) +
      (this.buildings.castles * 15));

    // Calculate military based on barracks and training grounds
    this.military.soldiers = this.buildings.barracks * 10;
    this.military.archers = this.buildings.towers * 5;
    this.military.cavalry = Math.floor((this.buildings.barracks + this.buildings.castles) * 2);
    this.military.siege = this.buildings.castles * 1;
    this.military.total = 
      this.military.soldiers + 
      this.military.archers + 
      this.military.cavalry +
      this.military.siege;

    this.emit('statsCalculated', this.getStats());
  }
}

export const kingdomStats = new KingdomStats();

export interface KingdomStats {
  questsCompleted: number
  goldEarned: number
  expEarned: number
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
    total: number
  }
  buildings: BuildingsData
  military: MilitaryData
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
  questsCompleted: 0,
  goldEarned: 0,
  expEarned: 0,
  gold: 1000,
  experience: 0,
  level: 1,
  population: 100,
  happiness: 75,
  resources: {
    wood: 200,
    stone: 100,
    food: 300,
    iron: 50,
    total: 650
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
    castles: 0,
    total: 21
  },
  military: {
    soldiers: 10,
    archers: 0,
    cavalry: 2,
    siege: 0,
    total: 12
  },
  titles: [],
  perks: [],
  inventory: []
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