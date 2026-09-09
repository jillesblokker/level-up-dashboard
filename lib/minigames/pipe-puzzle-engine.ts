/**
 * Valerion Plumbing - Pipe Puzzle Engine
 * Logic for pipe rotations, directional connectivity, and fluid flow pathfinding.
 */

export type Direction = 'N' | 'E' | 'S' | 'W';

export type PipeType = 'straight' | 'elbow' | 't-split' | 'cross' | 'empty';

export type FluidType = 'none' | 'water' | 'ether';

export type PipeDifficulty = 'apprentice' | 'journeyman' | 'master' | 'grandmaster' | 'expert';

export interface PipeCell {
  id: string;
  row: number;
  col: number;
  type: PipeType;
  /** 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg */
  rotation: number;
  /** Fixed endpoints cannot be rotated */
  isLocked?: boolean | undefined;
  /** Which fluids are actively flowing through this cell */
  flow: {
    water: boolean;
    ether: boolean;
  };
  /** For cross tiles in expert mode: tracks vertical vs horizontal flow separation */
  crossFlow?: {
    vertical: FluidType;
    horizontal: FluidType;
  };
}

export interface PipeLevelConfig {
  id: string;
  title: string;
  difficulty: PipeDifficulty;
  size: number;
  sources: Array<{ row: number; col: number; dir: Direction; fluid: 'water' | 'ether' }>;
  drains: Array<{ row: number; col: number; dir: Direction; fluid: 'water' | 'ether' }>;
  initialGrid: Array<{
    type: PipeType;
    rotation: number;
    isLocked?: boolean;
  }>;
}

// Direction vectors: [dRow, dCol]
export const DIR_DELTA: Record<Direction, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
};

// Base openings at 0 deg rotation [N, E, S, W]
export const BASE_OPENINGS: Record<PipeType, [boolean, boolean, boolean, boolean]> = {
  straight: [true, false, true, false],
  elbow: [true, true, false, false],
  't-split': [true, true, true, false],
  cross: [true, true, true, true],
  empty: [false, false, false, false],
};

const DIRS: Direction[] = ['N', 'E', 'S', 'W'];

/**
 * Returns whether a pipe cell at a given rotation has an opening in `dir`.
 */
export function hasOpening(type: PipeType, rotation: number, dir: Direction): boolean {
  if (type === 'empty') return false;
  const base = BASE_OPENINGS[type];
  const dirIdx = DIRS.indexOf(dir);
  const baseIdx = (dirIdx - rotation + 4) % 4;
  return base[baseIdx] ?? false;
}

/**
 * Creates a runtime pipe grid from level configuration with optional random scrambling.
 */
export function createPipeGrid(config: PipeLevelConfig, scramble = true): PipeCell[][] {
  const grid: PipeCell[][] = [];
  let idx = 0;

  for (let r = 0; r < config.size; r++) {
    const row: PipeCell[] = [];
    for (let c = 0; c < config.size; c++) {
      const def = config.initialGrid[idx] || { type: 'empty', rotation: 0 };
      idx++;

      let initialRotation = def.rotation;
      if (scramble && !def.isLocked && def.type !== 'empty') {
        const addRot = Math.floor(Math.random() * 3) + 1;
        initialRotation = (initialRotation + addRot) % 4;
      }

      row.push({
        id: `pipe-${r}-${c}`,
        row: r,
        col: c,
        type: def.type,
        rotation: initialRotation,
        isLocked: def.isLocked ?? false,
        flow: { water: false, ether: false },
        crossFlow: { vertical: 'none', horizontal: 'none' }
      });
    }
    grid.push(row);
  }

  return grid;
}

export interface SimulationResult {
  waterConnected: boolean;
  etherConnected: boolean;
  isSolved: boolean;
  updatedGrid: PipeCell[][];
}

/**
 * Simulates fluid flow from all sources using Breadth-First Search.
 */
export function simulateFlow(grid: PipeCell[][], config: PipeLevelConfig): SimulationResult {
  const size = config.size;
  const updatedGrid: PipeCell[][] = grid.map(row =>
    row.map(cell => ({
      ...cell,
      flow: { water: false, ether: false },
      crossFlow: { vertical: 'none', horizontal: 'none' }
    }))
  );

  const waterDrainsRemaining = new Set(
    config.drains.filter(d => d.fluid === 'water').map(d => `${d.row},${d.col}`)
  );
  const etherDrainsRemaining = new Set(
    config.drains.filter(d => d.fluid === 'ether').map(d => `${d.row},${d.col}`)
  );

  const fluids: Array<'water' | 'ether'> = ['water', 'ether'];

  for (const fluid of fluids) {
    const sources = config.sources.filter(s => s.fluid === fluid);
    if (sources.length === 0) continue;

    const queue: Array<{ r: number; c: number; fromDir?: Direction }> = [];
    const visited = new Set<string>();

    for (const src of sources) {
      const cell = updatedGrid[src.row]?.[src.col];
      if (!cell) continue;

      if (hasOpening(cell.type, cell.rotation, src.dir)) {
        queue.push({ r: src.row, c: src.col, fromDir: src.dir });
        visited.add(`${src.row},${src.col},${src.dir}`);
        cell.flow[fluid] = true;
      }
    }

    while (queue.length > 0) {
      const { r, c, fromDir } = queue.shift()!;
      const currentCell = updatedGrid[r]?.[c];
      if (!currentCell) continue;

      if (currentCell.type === 'cross') {
        if (fromDir === 'N' || fromDir === 'S') {
          currentCell.crossFlow!.vertical = fluid;
        } else if (fromDir === 'E' || fromDir === 'W') {
          currentCell.crossFlow!.horizontal = fluid;
        }
      }

      const coordKey = `${r},${c}`;
      if (fluid === 'water' && waterDrainsRemaining.has(coordKey)) {
        const matchingDrain = config.drains.find(d => d.fluid === 'water' && d.row === r && d.col === c);
        if (matchingDrain && hasOpening(currentCell.type, currentCell.rotation, matchingDrain.dir)) {
          waterDrainsRemaining.delete(coordKey);
        }
      }
      if (fluid === 'ether' && etherDrainsRemaining.has(coordKey)) {
        const matchingDrain = config.drains.find(d => d.fluid === 'ether' && d.row === r && d.col === c);
        if (matchingDrain && hasOpening(currentCell.type, currentCell.rotation, matchingDrain.dir)) {
          etherDrainsRemaining.delete(coordKey);
        }
      }

      let allowedOutDirs = DIRS.filter(dir => hasOpening(currentCell.type, currentCell.rotation, dir));
      if (currentCell.type === 'cross' && fromDir) {
        if (fromDir === 'N') allowedOutDirs = ['S'];
        else if (fromDir === 'S') allowedOutDirs = ['N'];
        else if (fromDir === 'E') allowedOutDirs = ['W'];
        else if (fromDir === 'W') allowedOutDirs = ['E'];
      }

      for (const outDir of allowedOutDirs) {
        const [dr, dc] = DIR_DELTA[outDir];
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const neighbor = updatedGrid[nr]?.[nc];
        if (!neighbor || neighbor.type === 'empty') continue;

        const inDir = OPPOSITE_DIR[outDir];
        if (hasOpening(neighbor.type, neighbor.rotation, inDir)) {
          if (neighbor.type === 'cross') {
            const isVert = inDir === 'N' || inDir === 'S';
            const existingChannel = isVert ? neighbor.crossFlow?.vertical : neighbor.crossFlow?.horizontal;
            if (existingChannel && existingChannel !== 'none' && existingChannel !== fluid) {
              continue;
            }
          }

          const visitKey = `${nr},${nc},${inDir}`;
          if (!visited.has(visitKey)) {
            visited.add(visitKey);
            neighbor.flow[fluid] = true;
            queue.push({ r: nr, c: nc, fromDir: inDir });
          }
        }
      }
    }
  }

  const waterNeeded = config.drains.some(d => d.fluid === 'water');
  const etherNeeded = config.drains.some(d => d.fluid === 'ether');

  const waterConnected = waterNeeded ? waterDrainsRemaining.size === 0 : true;
  const etherConnected = etherNeeded ? etherDrainsRemaining.size === 0 : true;
  const isSolved = waterConnected && etherConnected;

  return {
    waterConnected,
    etherConnected,
    isSolved,
    updatedGrid,
  };
}

function makeGrid(size: number, path: Array<{ r: number; c: number; type: PipeType; rot: number }>): Array<{ type: PipeType; rotation: number }> {
  const g: Array<{ type: PipeType; rotation: number }> = [];
  const map = new Map<string, { type: PipeType; rot: number }>();
  for (const p of path) {
    map.set(`${p.r},${p.c}`, { type: p.type, rot: p.rot });
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (map.has(`${r},${c}`)) {
        const item = map.get(`${r},${c}`)!;
        g.push({ type: item.type, rotation: item.rot });
      } else {
        g.push({ type: (r + c) % 2 === 0 ? 'straight' : 'elbow', rotation: (r + c) % 4 });
      }
    }
  }
  return g;
}

// 15 verified solvable pipe levels across 5 difficulty tiers
export const PIPE_LEVELS: PipeLevelConfig[] = [
  // 1. Apprentice (4x4)
  {
    id: 'pipe-apprentice-1',
    title: 'Aqueduct Conduit I',
    difficulty: 'apprentice',
    size: 4,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 3, col: 3, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(4, [
      { r: 0, c: 0, type: 'elbow', rot: 0 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 2 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'elbow', rot: 0 }, { r: 2, c: 3, type: 'elbow', rot: 2 },
      { r: 3, c: 3, type: 'straight', rot: 0 }
    ])
  },
  {
    id: 'pipe-apprentice-2',
    title: 'Aqueduct Conduit II',
    difficulty: 'apprentice',
    size: 4,
    sources: [{ row: 0, col: 0, dir: 'W', fluid: 'water' }],
    drains: [{ row: 3, col: 3, dir: 'E', fluid: 'water' }],
    initialGrid: makeGrid(4, [
      { r: 0, c: 0, type: 'straight', rot: 1 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'straight', rot: 1 }, { r: 0, c: 3, type: 'elbow', rot: 2 },
      { r: 1, c: 3, type: 'straight', rot: 0 },
      { r: 2, c: 3, type: 'straight', rot: 0 },
      { r: 3, c: 3, type: 'elbow', rot: 0 }
    ])
  },
  {
    id: 'pipe-apprentice-3',
    title: 'Aqueduct Conduit III',
    difficulty: 'apprentice',
    size: 4,
    sources: [{ row: 0, col: 1, dir: 'N', fluid: 'water' }],
    drains: [{ row: 3, col: 2, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(4, [
      { r: 0, c: 1, type: 'straight', rot: 0 },
      { r: 1, c: 1, type: 'elbow', rot: 0 }, { r: 1, c: 2, type: 'elbow', rot: 2 },
      { r: 2, c: 2, type: 'straight', rot: 0 },
      { r: 3, c: 2, type: 'straight', rot: 0 }
    ])
  },

  // 2. Journeyman (5x5)
  {
    id: 'pipe-journeyman-1',
    title: 'Citadel Flume I',
    difficulty: 'journeyman',
    size: 5,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 4, col: 4, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 0, c: 0, type: 'elbow', rot: 0 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 2 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'elbow', rot: 3 }, { r: 2, c: 1, type: 'elbow', rot: 1 },
      { r: 3, c: 1, type: 'elbow', rot: 0 }, { r: 3, c: 2, type: 'straight', rot: 1 }, { r: 3, c: 3, type: 'straight', rot: 1 }, { r: 3, c: 4, type: 'elbow', rot: 2 },
      { r: 4, c: 4, type: 'straight', rot: 0 }
    ])
  },
  {
    id: 'pipe-journeyman-2',
    title: 'Citadel Flume II',
    difficulty: 'journeyman',
    size: 5,
    sources: [{ row: 0, col: 2, dir: 'N', fluid: 'water' }],
    drains: [{ row: 4, col: 2, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 0, c: 2, type: 'elbow', rot: 0 }, { r: 0, c: 3, type: 'elbow', rot: 2 },
      { r: 1, c: 3, type: 'straight', rot: 0 },
      { r: 2, c: 3, type: 'elbow', rot: 3 }, { r: 2, c: 2, type: 'straight', rot: 1 }, { r: 2, c: 1, type: 'elbow', rot: 1 },
      { r: 3, c: 1, type: 'straight', rot: 0 },
      { r: 4, c: 1, type: 'elbow', rot: 0 }, { r: 4, c: 2, type: 'elbow', rot: 2 }
    ])
  },
  {
    id: 'pipe-journeyman-3',
    title: 'Citadel Flume III',
    difficulty: 'journeyman',
    size: 5,
    sources: [{ row: 0, col: 0, dir: 'W', fluid: 'water' }],
    drains: [{ row: 4, col: 4, dir: 'E', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 0, c: 0, type: 'straight', rot: 1 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 2 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'elbow', rot: 0 }, { r: 2, c: 3, type: 'straight', rot: 1 }, { r: 2, c: 4, type: 'elbow', rot: 2 },
      { r: 3, c: 4, type: 'straight', rot: 0 },
      { r: 4, c: 4, type: 'elbow', rot: 0 }
    ])
  },

  // 3. Master (5x5)
  {
    id: 'pipe-master-1',
    title: 'High Reservoir I',
    difficulty: 'master',
    size: 5,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 4, col: 4, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 0, c: 0, type: 'elbow', rot: 0 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'straight', rot: 1 }, { r: 0, c: 3, type: 'elbow', rot: 2 },
      { r: 1, c: 3, type: 'straight', rot: 0 },
      { r: 2, c: 3, type: 'elbow', rot: 3 }, { r: 2, c: 2, type: 'straight', rot: 1 }, { r: 2, c: 1, type: 'elbow', rot: 1 },
      { r: 3, c: 1, type: 'straight', rot: 0 },
      { r: 4, c: 1, type: 'elbow', rot: 0 }, { r: 4, c: 2, type: 'straight', rot: 1 }, { r: 4, c: 3, type: 'straight', rot: 1 }, { r: 4, c: 4, type: 'elbow', rot: 2 }
    ])
  },
  {
    id: 'pipe-master-2',
    title: 'High Reservoir II',
    difficulty: 'master',
    size: 5,
    sources: [{ row: 2, col: 0, dir: 'W', fluid: 'water' }],
    drains: [{ row: 2, col: 4, dir: 'E', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 2, c: 0, type: 'elbow', rot: 3 },
      { r: 1, c: 0, type: 'elbow', rot: 1 }, { r: 1, c: 1, type: 'straight', rot: 1 }, { r: 1, c: 2, type: 'elbow', rot: 2 },
      { r: 2, c: 2, type: 'straight', rot: 0 },
      { r: 3, c: 2, type: 'elbow', rot: 0 }, { r: 3, c: 3, type: 'straight', rot: 1 }, { r: 3, c: 4, type: 'elbow', rot: 3 },
      { r: 2, c: 4, type: 'elbow', rot: 1 }
    ])
  },
  {
    id: 'pipe-master-3',
    title: 'High Reservoir III',
    difficulty: 'master',
    size: 5,
    sources: [{ row: 0, col: 4, dir: 'N', fluid: 'water' }],
    drains: [{ row: 4, col: 0, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(5, [
      { r: 0, c: 4, type: 'elbow', rot: 3 }, { r: 0, c: 3, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 1 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'elbow', rot: 3 }, { r: 2, c: 1, type: 'straight', rot: 1 }, { r: 2, c: 0, type: 'elbow', rot: 1 },
      { r: 3, c: 0, type: 'straight', rot: 0 },
      { r: 4, c: 0, type: 'straight', rot: 0 }
    ])
  },

  // 4. Grandmaster (6x6 single line)
  {
    id: 'pipe-grandmaster-1',
    title: 'Royal Vault Mains I',
    difficulty: 'grandmaster',
    size: 6,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 5, col: 5, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(6, [
      { r: 0, c: 0, type: 'elbow', rot: 0 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 2 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'elbow', rot: 0 }, { r: 2, c: 3, type: 'straight', rot: 1 }, { r: 2, c: 4, type: 'elbow', rot: 2 },
      { r: 3, c: 4, type: 'straight', rot: 0 },
      { r: 4, c: 4, type: 'elbow', rot: 0 }, { r: 4, c: 5, type: 'elbow', rot: 2 },
      { r: 5, c: 5, type: 'straight', rot: 0 }
    ])
  },
  {
    id: 'pipe-grandmaster-2',
    title: 'Royal Vault Mains II',
    difficulty: 'grandmaster',
    size: 6,
    sources: [{ row: 0, col: 1, dir: 'N', fluid: 'water' }],
    drains: [{ row: 5, col: 4, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(6, [
      { r: 0, c: 1, type: 'straight', rot: 0 },
      { r: 1, c: 1, type: 'elbow', rot: 0 }, { r: 1, c: 2, type: 'straight', rot: 1 }, { r: 1, c: 3, type: 'elbow', rot: 2 },
      { r: 2, c: 3, type: 'straight', rot: 0 },
      { r: 3, c: 3, type: 'elbow', rot: 0 }, { r: 3, c: 4, type: 'elbow', rot: 2 },
      { r: 4, c: 4, type: 'straight', rot: 0 },
      { r: 5, c: 4, type: 'straight', rot: 0 }
    ])
  },
  {
    id: 'pipe-grandmaster-3',
    title: 'Royal Vault Mains III',
    difficulty: 'grandmaster',
    size: 6,
    sources: [{ row: 0, col: 5, dir: 'N', fluid: 'water' }],
    drains: [{ row: 5, col: 0, dir: 'S', fluid: 'water' }],
    initialGrid: makeGrid(6, [
      { r: 0, c: 5, type: 'elbow', rot: 3 }, { r: 0, c: 4, type: 'straight', rot: 1 }, { r: 0, c: 3, type: 'elbow', rot: 1 },
      { r: 1, c: 3, type: 'straight', rot: 0 },
      { r: 2, c: 3, type: 'elbow', rot: 3 }, { r: 2, c: 2, type: 'straight', rot: 1 }, { r: 2, c: 1, type: 'elbow', rot: 1 },
      { r: 3, c: 1, type: 'straight', rot: 0 },
      { r: 4, c: 1, type: 'elbow', rot: 3 }, { r: 4, c: 0, type: 'elbow', rot: 1 },
      { r: 5, c: 0, type: 'straight', rot: 0 }
    ])
  },

  // 5. Expert Dual (6x6 dual-pipe)
  {
    id: 'pipe-expert-1',
    title: 'Subterranean Overpass I',
    difficulty: 'expert',
    size: 6,
    sources: [
      { row: 0, col: 0, dir: 'N', fluid: 'water' },
      { row: 2, col: 0, dir: 'W', fluid: 'ether' },
    ],
    drains: [
      { row: 5, col: 5, dir: 'S', fluid: 'water' },
      { row: 2, col: 5, dir: 'E', fluid: 'ether' },
    ],
    initialGrid: makeGrid(6, [
      { r: 0, c: 0, type: 'elbow', rot: 0 }, { r: 0, c: 1, type: 'straight', rot: 1 }, { r: 0, c: 2, type: 'elbow', rot: 2 },
      { r: 1, c: 2, type: 'straight', rot: 0 },
      { r: 2, c: 2, type: 'cross', rot: 0 },
      { r: 3, c: 2, type: 'straight', rot: 0 },
      { r: 4, c: 2, type: 'elbow', rot: 0 }, { r: 4, c: 3, type: 'straight', rot: 1 }, { r: 4, c: 4, type: 'straight', rot: 1 }, { r: 4, c: 5, type: 'elbow', rot: 2 },
      { r: 5, c: 5, type: 'straight', rot: 0 },
      { r: 2, c: 0, type: 'straight', rot: 1 }, { r: 2, c: 1, type: 'straight', rot: 1 },
      { r: 2, c: 3, type: 'straight', rot: 1 }, { r: 2, c: 4, type: 'straight', rot: 1 }, { r: 2, c: 5, type: 'straight', rot: 1 }
    ])
  },
  {
    id: 'pipe-expert-2',
    title: 'Subterranean Overpass II',
    difficulty: 'expert',
    size: 6,
    sources: [
      { row: 0, col: 2, dir: 'N', fluid: 'water' },
      { row: 3, col: 0, dir: 'W', fluid: 'ether' },
    ],
    drains: [
      { row: 5, col: 2, dir: 'S', fluid: 'water' },
      { row: 3, col: 5, dir: 'E', fluid: 'ether' },
    ],
    initialGrid: makeGrid(6, [
      { r: 0, c: 2, type: 'straight', rot: 0 }, { r: 1, c: 2, type: 'straight', rot: 0 }, { r: 2, c: 2, type: 'straight', rot: 0 },
      { r: 3, c: 2, type: 'cross', rot: 0 },
      { r: 4, c: 2, type: 'straight', rot: 0 }, { r: 5, c: 2, type: 'straight', rot: 0 },
      { r: 3, c: 0, type: 'straight', rot: 1 }, { r: 3, c: 1, type: 'straight', rot: 1 },
      { r: 3, c: 3, type: 'straight', rot: 1 }, { r: 3, c: 4, type: 'straight', rot: 1 }, { r: 3, c: 5, type: 'straight', rot: 1 }
    ])
  },
  {
    id: 'pipe-expert-3',
    title: 'Subterranean Overpass III',
    difficulty: 'expert',
    size: 6,
    sources: [
      { row: 0, col: 4, dir: 'N', fluid: 'water' },
      { row: 1, col: 0, dir: 'W', fluid: 'ether' },
    ],
    drains: [
      { row: 5, col: 1, dir: 'S', fluid: 'water' },
      { row: 1, col: 5, dir: 'E', fluid: 'ether' },
    ],
    initialGrid: makeGrid(6, [
      { r: 0, c: 4, type: 'straight', rot: 0 },
      { r: 1, c: 4, type: 'cross', rot: 0 },
      { r: 2, c: 4, type: 'straight', rot: 0 },
      { r: 3, c: 4, type: 'elbow', rot: 3 }, { r: 3, c: 3, type: 'straight', rot: 1 }, { r: 3, c: 2, type: 'straight', rot: 1 }, { r: 3, c: 1, type: 'elbow', rot: 1 },
      { r: 4, c: 1, type: 'straight', rot: 0 }, { r: 5, c: 1, type: 'straight', rot: 0 },
      { r: 1, c: 0, type: 'straight', rot: 1 }, { r: 1, c: 1, type: 'straight', rot: 1 }, { r: 1, c: 2, type: 'straight', rot: 1 }, { r: 1, c: 3, type: 'straight', rot: 1 },
      { r: 1, c: 5, type: 'straight', rot: 1 }
    ])
  }
];

export function getPipeLevelsByDifficulty(difficulty: PipeDifficulty): PipeLevelConfig[] {
  return PIPE_LEVELS.filter(l => l.difficulty === difficulty);
}
