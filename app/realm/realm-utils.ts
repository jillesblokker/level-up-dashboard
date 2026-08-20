import { Tile, TileType } from '@/types/tiles';

export const GRID_COLS = 13;
export const INITIAL_ROWS = 7;
export const EXPANSION_INCREMENT = 3;
export const AUTOSAVE_INTERVAL = 30000;
export const INITIAL_POS = { x: 6, y: 3 };

export const defaultTile = (type: TileType | string): Tile => {
    const t = String(type || '');
    let image = `/images/tiles/${t}-tile.webp`;
    if (t === 'crossroad') image = '/images/kingdom-tiles/Crossroad.webp';
    if (t === 'straightroad') image = '/images/kingdom-tiles/Straightroad.webp';
    if (t === 'cornerroad') image = '/images/kingdom-tiles/Cornerroad.webp';
    if (t === 'tsplitroad') image = '/images/kingdom-tiles/Tsplitroad.webp';
    if (t === 'zen-garden') image = '/images/kingdom-tiles/ZenGarden.webp';
    // Navigation Hub Overrides
    if (t === 'quest-board') image = '/images/kingdom-tiles/QuestBoard.webp';
    if (t === 'monument') image = '/images/kingdom-tiles/Monument.webp';
    if (t === 'training-grounds') image = '/images/kingdom-tiles/TrainingGrounds.webp';
    if (t === 'tavern') image = '/images/kingdom-tiles/Inn.webp';
    if (t === 'market') image = '/images/kingdom-tiles/MarketStalls.webp';
    if (t === 'market-stalls') image = '/images/kingdom-tiles/MarketStalls.webp';

    if (t === 'crystal_cavern') image = '/images/kingdom-tiles/CrystalCavern.webp';
    if (t === 'watchtower') image = '/images/kingdom-tiles/Watchtower.webp';
    if (t === 'library') image = '/images/kingdom-tiles/Library.webp';
    if (t === 'wizard') image = '/images/kingdom-tiles/Wizard.webp';
    if (t === 'temple') image = '/images/kingdom-tiles/Temple.webp';

    if (t === 'pyramid') image = '/images/tiles/pyramid-tile.webp';
    if (t === 'whispering-well') image = '/images/tiles/whispering-well-tile.webp';
    if (t === 'sphinx-gates') image = '/images/tiles/sphinx-gates-tile.webp';
    if (t === 'whispering-canopy') image = '/images/tiles/whispering-canopy-tile.webp';
    if (t === 'frostfire-obelisk') image = '/images/tiles/frostfire-obelisk-tile.webp';
    if (t === 'fairy-ring') image = '/images/tiles/fairy-ring-tile.webp';
    if (t === 'settlement') image = '/images/tiles/settlement-tile.webp';
    if (t === 'megapolis') image = '/images/tiles/megapolis-tile.webp';
    if (t === 'mystic-obelisk') image = '/images/tiles/mystic-obelisk-tile.webp';
    if (t === 'golden-pantheon') image = '/images/tiles/golden-pantheon-tile.webp';
    if (t === 'plank-labyrinth') image = '/images/tiles/plank-labyrinth-tile.webp';
    if (t === 'prison') image = '/images/tiles/prison-tile.webp';
    if (t === 'apotheca') image = '/images/tiles/apotheca-tile.webp';
    if (t === 'abbey') image = '/images/tiles/abbey-tile.webp';
    if (t === 'waterway_canal') image = '/images/kingdom-tiles/WaterwayCanal.webp';
    if (t === 'astral_citadel_monument') image = '/images/kingdom-tiles/AstralCitadelMonument.webp';
    if (t === 'serene_lake') image = '/images/kingdom-tiles/SereneLake.webp';

    let name = t.charAt(0).toUpperCase() + t.slice(1);
    if (t === 'coral_reef') name = 'Mermaid';
    if (t === 'floating_island') name = 'Island';
    if (t === 'ruins') name = 'Ancient Ruins';
    if (t === 'crystal_cavern') name = 'Crystal Cavern';
    if (t === 'zen-garden') name = 'Zen Garden';
    if (t === 'pyramid') name = 'Monolith of Devotion';
    if (t === 'whispering-well') name = 'Whispering Well';
    if (t === 'sphinx-gates') name = "Sphinx's Gates";
    if (t === 'whispering-canopy') name = 'Whispering Canopy';
    if (t === 'frostfire-obelisk') name = 'Frostfire Obelisk';
    if (t === 'fairy-ring') name = 'Fairy Ring';
    if (t === 'settlement') name = 'Settlement';
    if (t === 'megapolis') name = 'Megapolis';
    if (t === 'mystic-obelisk') name = 'Mystic Obelisk';
    if (t === 'golden-pantheon') name = 'Golden Pantheon';
    if (t === 'plank-labyrinth') name = 'Plank Labyrinth';
    if (t === 'prison') name = 'Iron Citadel Prison';
    if (t === 'apotheca') name = 'Grand Apotheca';
    if (t === 'abbey') name = 'Silent Abbey';
    if (t === 'waterway_canal') name = 'Waterway Canal & Stone Bridge';
    if (t === 'astral_citadel_monument') name = 'Astral Citadel Monument';
    if (t === 'serene_lake') name = 'Serene Lake';

    return {
        id: t,
        name,
        description: `${name} tile`,
        type: t as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        isVisited: false,
        x: 0,
        y: 0,
        ariaLabel: `${t} tile`,
        image,
        cost: 0,
        quantity: 0
    };
};

export const initialInventory: Record<string, Tile> = {
    grass: { ...defaultTile('grass'), cost: 25, owned: 10 },
    water: { ...defaultTile('water'), cost: 50, owned: 10 },
    forest: { ...defaultTile('forest'), cost: 75, owned: 10 },
    mountain: { ...defaultTile('mountain'), cost: 20, owned: 10 },
    desert: { ...defaultTile('desert'), cost: 100, owned: 10 },
    ice: { ...defaultTile('ice'), cost: 120, owned: 10 },
    snow: { ...defaultTile('snow'), cost: 125, owned: 10 },
    cave: { ...defaultTile('cave'), cost: 200, owned: 5 },
    town: { ...defaultTile('town'), cost: 250, owned: 1 },
    city: { ...defaultTile('city'), cost: 300, owned: 1 },
    castle: { ...defaultTile('castle'), cost: 500, owned: 1 },
    dungeon: { ...defaultTile('dungeon'), cost: 400, owned: 2 },
    volcano: { ...defaultTile('volcano'), cost: 500, owned: 1 },
    lava: { ...defaultTile('lava'), cost: 200, owned: 5 },
    'portal-entrance': { ...defaultTile('portal-entrance'), cost: 250, owned: 1 },
    'portal-exit': { ...defaultTile('portal-exit'), cost: 250, owned: 1 },
    mystery: { ...defaultTile('mystery'), cost: 300, owned: 1 },
    empty: { ...defaultTile('empty'), cost: 0, owned: 0 },
    sheep: { ...defaultTile('sheep'), cost: 0, owned: 0 },
    horse: { ...defaultTile('horse'), cost: 0, owned: 0 },
    special: { ...defaultTile('special'), cost: 0, owned: 0 },
    swamp: { ...defaultTile('swamp'), cost: 0, owned: 0 },
    treasure: { ...defaultTile('treasure'), cost: 0, owned: 0 },
    monster: { ...defaultTile('monster'), cost: 0, owned: 0 },
    vacant: { ...defaultTile('empty'), cost: 0, owned: 0 },
    archery: { ...defaultTile('archery'), cost: 150, owned: 0 },
    blacksmith: { ...defaultTile('blacksmith'), cost: 200, owned: 0 },
    sawmill: { ...defaultTile('sawmill'), cost: 120, owned: 0 },
    fisherman: { ...defaultTile('fisherman'), cost: 120, owned: 0 },
    grocery: { ...defaultTile('grocery'), cost: 160, owned: 0 },
    foodcourt: { ...defaultTile('foodcourt'), cost: 250, owned: 0 },
    well: { ...defaultTile('well'), cost: 100, owned: 0 },
    windmill: { ...defaultTile('windmill'), cost: 180, owned: 0 },
    fountain: { ...defaultTile('fountain'), cost: 180, owned: 0 },
    house: { ...defaultTile('house'), cost: 100, owned: 0 },
    inn: { ...defaultTile('inn'), cost: 220, owned: 0 },
    jousting: { ...defaultTile('jousting'), cost: 300, owned: 0 },
    mansion: { ...defaultTile('mansion'), cost: 500, owned: 0 },
    mayor: { ...defaultTile('mayor'), cost: 800, owned: 0 },
    'streak-scroll': { ...defaultTile('streak-scroll'), cost: 500, owned: 0 },
    farm: { ...defaultTile('farm'), cost: 150, owned: 0 },
    lumber_mill: { ...defaultTile('lumber_mill'), cost: 200, owned: 0 },
    market: { ...defaultTile('market'), cost: 400, owned: 0 },
    cottage: { ...defaultTile('cottage'), cost: 100, owned: 0 },
    crossroad: { ...defaultTile('crossroad'), cost: 0, owned: 0 },
    straightroad: { ...defaultTile('straightroad'), cost: 0, owned: 0 },
    cornerroad: { ...defaultTile('cornerroad'), cost: 0, owned: 0 },
    tsplitroad: { ...defaultTile('tsplitroad'), cost: 0, owned: 0 },
    jungle: { ...defaultTile('jungle'), cost: 100, owned: 5 },
    ruins: { ...defaultTile('ruins'), cost: 150, owned: 2 },
    graveyard: { ...defaultTile('graveyard'), cost: 150, owned: 2 },
    farmland: { ...defaultTile('farmland'), cost: 80, owned: 5 },
    oasis: { ...defaultTile('oasis'), cost: 120, owned: 3 },
    coral_reef: { ...defaultTile('coral_reef'), cost: 150, owned: 5 },
    crystal_cavern: { ...defaultTile('crystal_cavern'), cost: 200, owned: 2 },
    floating_island: { ...defaultTile('floating_island'), cost: 500, owned: 1 },
    pyramid: { ...defaultTile('pyramid'), cost: 1000, owned: 0 },
    'whispering-well': { ...defaultTile('whispering-well'), cost: 1000, owned: 0 },
    'sphinx-gates': { ...defaultTile('sphinx-gates'), cost: 1000, owned: 0 },
    settlement: { ...defaultTile('settlement'), cost: 300, owned: 0 },
    megapolis: { ...defaultTile('megapolis'), cost: 3000, owned: 0 },
    abbey: { ...defaultTile('abbey'), cost: 600, owned: 0 },
    waterway_canal: { ...defaultTile('waterway_canal'), cost: 750, owned: 1 },
    astral_citadel_monument: { ...defaultTile('astral_citadel_monument'), cost: 1500, owned: 1 },
    serene_lake: { ...defaultTile('serene_lake'), cost: 25, owned: 2 },
};

function safeCheck(obj: any, key: any) {
    return obj && obj[key] !== undefined;
}

export const getTileImage = (type: TileType | string): string => {
    const t = String(type || '');
    if (t.startsWith('siege_')) return `/images/kingdom-tiles/${t}.webp`;
    if (t === 'crossroad') return '/images/kingdom-tiles/Crossroad.webp';
    if (t === 'straightroad') return '/images/kingdom-tiles/Straightroad.webp';
    if (t === 'cornerroad') return '/images/kingdom-tiles/Cornerroad.webp';
    if (t === 'tsplitroad') return '/images/kingdom-tiles/Tsplitroad.webp';
    if (t === 'quest-board') return '/images/kingdom-tiles/QuestBoard.webp';
    if (t === 'monument') return '/images/kingdom-tiles/Monument.webp';
    if (t === 'training-grounds') return '/images/kingdom-tiles/TrainingGrounds.webp';
    if (t === 'tavern') return '/images/kingdom-tiles/Inn.webp';
    if (t === 'market') return '/images/kingdom-tiles/MarketStalls.webp';
    if (t === 'market-stalls') return '/images/kingdom-tiles/MarketStalls.webp';
    if (t === 'crystal_cavern') return '/images/kingdom-tiles/CrystalCavern.webp';
    if (t === 'watchtower') return '/images/kingdom-tiles/Watchtower.webp';
    if (t === 'sawmill') return '/images/kingdom-tiles/Sawmill.webp';
    if (t === 'stone-quarry') return '/images/kingdom-tiles/StoneQuarry.webp';
    if (t === 'windmill') return '/images/kingdom-tiles/Windmill.webp';
    if (t === 'royal-stables') return '/images/locations/royal-stables.webp';
    if (t === 'embers-anvil') return '/images/locations/embers-anvil.webp';
    if (t === 'archery') return '/images/kingdom-tiles/Archery.webp';
    if (t === 'fisherman') return '/images/kingdom-tiles/Fisherman.webp';
    if (t === 'pond') return '/images/kingdom-tiles/Pond.webp';
    if (t === 'library') return '/images/kingdom-tiles/Library.webp';
    if (t === 'wizard') return '/images/kingdom-tiles/Wizard.webp';
    if (t === 'temple') return '/images/kingdom-tiles/Temple.webp';
    if (t === 'fortune_teller') return '/images/kingdom-tiles/fortune_teller.webp';
    if (t === 'pyramid') return '/images/tiles/pyramid-tile.webp';
    if (t === 'whispering-well') return '/images/tiles/whispering-well-tile.webp';
    if (t === 'sphinx-gates') return '/images/tiles/sphinx-gates-tile.webp';
    if (t === 'whispering-canopy') return '/images/tiles/whispering-canopy-tile.webp';
    if (t === 'frostfire-obelisk') return '/images/tiles/frostfire-obelisk-tile.webp';
    if (t === 'fairy-ring') return '/images/tiles/fairy-ring-tile.webp';
    if (t === 'settlement') return '/images/tiles/settlement-tile.webp';
    if (t === 'megapolis') return '/images/tiles/megapolis-tile.webp';
    if (t === 'mystic-obelisk') return '/images/tiles/mystic-obelisk-tile.webp';
    if (t === 'golden-pantheon') return '/images/tiles/golden-pantheon-tile.webp';
    if (t === 'plank-labyrinth') return '/images/tiles/plank-labyrinth-tile.webp';
    if (t === 'prison') return '/images/tiles/prison-tile.webp';
    if (t === 'apotheca') return '/images/tiles/apotheca-tile.webp';
    if (t === 'abbey') return '/images/tiles/abbey-tile.webp';
    if (t === 'waterway_canal') return '/images/kingdom-tiles/WaterwayCanal.webp';
    if (t === 'astral_citadel_monument') return '/images/kingdom-tiles/AstralCitadelMonument.webp';
    if (t === 'serene_lake') return '/images/kingdom-tiles/SereneLake.webp';
    if (t === 'mystic_bazaar') return '/images/kingdom-tiles/Mystic_bazaar.webp';
    if (t === 'airship_harbor') return '/images/kingdom-tiles/Airship_harbor.webp';
    if (t === 'housecup') return '/images/kingdom-tiles/Housecup.webp';
    if (t === 'observatory') return '/images/kingdom-tiles/Observatory.webp';
    if (t === 'hall_of_champions') return '/images/kingdom-tiles/Hall_of_champions.webp';
    if (t === 'titan_watchtower') return '/images/kingdom-tiles/Titan_watchtower.webp';
    return `/images/tiles/${t}-tile.webp`;
};

export const createBaseGrid = (): Tile[][] => {
    return Array.from({ length: INITIAL_ROWS }, (_, y) =>
        Array.from({ length: GRID_COLS }, (_, x) => ({
            ...defaultTile('grass'),
            x,
            y,
            id: `grass-${x}-${y}`,
            image: getTileImage('grass')
        }))
    );
};

export function getAdjacentPositions(x: number, y: number, grid: any[][]): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) return positions;

    // up
    if (y > 0 && grid[y - 1] && typeof x === 'number' && (grid[y - 1] as any[])[x] !== undefined) {
        positions.push({ x, y: y - 1 });
    }
    // down
    if (y < grid.length - 1 && grid[y + 1] && typeof x === 'number' && (grid[y + 1] as any[])[x] !== undefined) {
        positions.push({ x, y: y + 1 });
    }
    // left
    if (x > 0 && Array.isArray(grid[y]) && grid[y][x - 1] !== undefined) {
        positions.push({ x: x - 1, y });
    }
    // right
    if (Array.isArray(grid[y]) && x < grid[y].length - 1 && grid[y][x + 1] !== undefined) {
        positions.push({ x: x + 1, y });
    }
    return positions;
}

export const countTiles = (grid: Tile[][], type: TileType): number => {
    return grid.reduce((acc, row) => acc + row.filter(tile => tile && tile.type === type).length, 0);
};

export const creatureRequirements = [
    { id: '001', action: 'forest_tiles_destroyed', threshold: 1 },
    { id: '002', action: 'forest_tiles_destroyed', threshold: 5 },
    { id: '003', action: 'forest_tiles_destroyed', threshold: 10 },
    { id: '004', action: 'water_tiles_placed', threshold: 1 },
    { id: '005', action: 'water_tiles_placed', threshold: 5 },
    { id: '006', action: 'water_tiles_placed', threshold: 10 },
    { id: '007', action: 'forest_tiles_placed', threshold: 1 },
    { id: '008', action: 'forest_tiles_placed', threshold: 5 },
    { id: '009', action: 'forest_tiles_placed', threshold: 10 },
    { id: '010', action: 'mountain_tiles_destroyed', threshold: 1 },
    { id: '011', action: 'mountain_tiles_destroyed', threshold: 5 },
    { id: '012', action: 'mountain_tiles_destroyed', threshold: 10 },
    { id: '013', action: 'ice_tiles_placed', threshold: 1 },
    { id: '014', action: 'ice_tiles_placed', threshold: 5 },
    { id: '015', action: 'ice_tiles_placed', threshold: 10 },
];
