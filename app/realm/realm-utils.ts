import { Tile, TileType } from '@/types/tiles';

export const GRID_COLS = 13;
export const INITIAL_ROWS = 7;
export const EXPANSION_INCREMENT = 3;
export const AUTOSAVE_INTERVAL = 30000;
export const INITIAL_POS = { x: 6, y: 3 };

export const defaultTile = (type: TileType): Tile => ({
    id: type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    description: `${type.charAt(0).toUpperCase() + type.slice(1)} tile`,
    type,
    connections: [],
    rotation: 0,
    revealed: true,
    isVisited: false,
    x: 0,
    y: 0,
    ariaLabel: `${type} tile`,
    image: `/images/tiles/${type}-tile.png`,
    cost: 0,
    quantity: 0
});

export const initialInventory: Record<TileType, Tile> = {
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
};

function safeCheck(obj: any, key: any) {
    return obj && obj[key] !== undefined;
}

export const getTileImage = (type: TileType): string => {
    return `/images/tiles/${type}-tile.png`;
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
