/**
 * Sewer Pipe Puzzle Engine
 * Logic for pipe rotations, directional connectivity, and fluid flow pathfinding.
 */

export type Direction = 'N' | 'E' | 'S' | 'W';

export type PipeType = 'straight' | 'elbow' | 't-split' | 'cross' | 'empty';

export type FluidType = 'none' | 'water' | 'ether';

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
  difficulty: 'standard' | 'advanced' | 'expert';
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
  // straight: vertical [N, S]
  straight: [true, false, true, false],
  // elbow: corner connecting North and East [N, E]
  elbow: [true, true, false, false],
  // t-split: connects North, East, South [N, E, S]
  't-split': [true, true, true, false],
  // cross: 4-way [N, E, S, W]
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
  // With 90 deg clockwise rotation, index shifts back by rotation
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
        // Randomly rotate 1 to 3 times to scramble
        const addRot = Math.floor(Math.random() * 3) + 1;
        initialRotation = (initialRotation + addRot) % 4;
      }

      row.push({
        id: `pipe-${r}-${c}`,
        row: r,
        col: c,
        type: def.type,
        rotation: initialRotation,
        isLocked: def.isLocked,
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
  // Clone grid to produce immutable updated state
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

  // Traverse for each fluid
  const fluids: Array<'water' | 'ether'> = ['water', 'ether'];

  for (const fluid of fluids) {
    const sources = config.sources.filter(s => s.fluid === fluid);
    if (sources.length === 0) continue;

    // Queue entries: [r, c, incomingDir]
    const queue: Array<{ r: number; c: number; fromDir?: Direction }> = [];
    const visited = new Set<string>();

    for (const src of sources) {
      const cell = updatedGrid[src.row]?.[src.col];
      if (!cell) continue;

      // Check if source opening matches the source's injected direction
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

      // Mark fluid in crossflow if expert cross bridge
      if (currentCell.type === 'cross') {
        if (fromDir === 'N' || fromDir === 'S') {
          currentCell.crossFlow!.vertical = fluid;
        } else if (fromDir === 'E' || fromDir === 'W') {
          currentCell.crossFlow!.horizontal = fluid;
        }
      }

      // Check if this cell satisfies any drain for this fluid
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

      // For cross bridge in expert mode:
      // If entered vertically (N or S), fluid can only exit vertically (S or N)
      // If entered horizontally (E or W), fluid can only exit horizontally (W or E)
      let allowedOutDirs = DIRS.filter(dir => hasOpening(currentCell.type, currentCell.rotation, dir));
      if (currentCell.type === 'cross' && fromDir) {
        if (fromDir === 'N') allowedOutDirs = ['S'];
        else if (fromDir === 'S') allowedOutDirs = ['N'];
        else if (fromDir === 'E') allowedOutDirs = ['W'];
        else if (fromDir === 'W') allowedOutDirs = ['E'];
      }

      // Traverse allowed outward directions
      for (const outDir of allowedOutDirs) {
        const [dr, dc] = DIR_DELTA[outDir];
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const neighbor = updatedGrid[nr]?.[nc];
        if (!neighbor || neighbor.type === 'empty') continue;

        const inDir = OPPOSITE_DIR[outDir];
        // Neighbor must have an opening in the matching opposite direction
        if (hasOpening(neighbor.type, neighbor.rotation, inDir)) {
          // If cross bridge, ensure we don't contaminate the other channel
          if (neighbor.type === 'cross') {
            const isVert = inDir === 'N' || inDir === 'S';
            const existingChannel = isVert ? neighbor.crossFlow?.vertical : neighbor.crossFlow?.horizontal;
            if (existingChannel && existingChannel !== 'none' && existingChannel !== fluid) {
              // Channel already occupied by a different fluid!
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

// Built-in verified solvable levels
export const PIPE_LEVELS: PipeLevelConfig[] = [
  {
    id: 'pipe-standard-1',
    title: 'Town Aqueduct',
    difficulty: 'standard',
    size: 4,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 3, col: 3, dir: 'S', fluid: 'water' }],
    initialGrid: [
      { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 2 },    { type: 'straight', rotation: 0 },
      { type: 'elbow', rotation: 1 },    { type: 't-split', rotation: 1 },  { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 3 },
      { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 0 },    { type: 'elbow', rotation: 0 },    { type: 'elbow', rotation: 2 },
      { type: 'elbow', rotation: 2 },    { type: 'straight', rotation: 0 }, { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 0 },
    ],
  },
  {
    id: 'pipe-advanced-1',
    title: 'Castle Cisterns',
    difficulty: 'advanced',
    size: 5,
    sources: [{ row: 0, col: 0, dir: 'N', fluid: 'water' }],
    drains: [{ row: 4, col: 4, dir: 'S', fluid: 'water' }],
    initialGrid: [
      { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 2 },    { type: 't-split', rotation: 1 },  { type: 'elbow', rotation: 2 },
      { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 0 }, { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 3 },
      { type: 'elbow', rotation: 1 },    { type: 'elbow', rotation: 1 },    { type: 'elbow', rotation: 3 },    { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 0 },
      { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 2 },    { type: 'elbow', rotation: 0 },
      { type: 'elbow', rotation: 3 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 1 },    { type: 'elbow', rotation: 0 },    { type: 'elbow', rotation: 2 },
    ],
  },
  {
    id: 'pipe-expert-dual-1',
    title: 'Deep Royal Sewers (Dual Pipeline)',
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
    initialGrid: [
      // Row 0
      { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 2 },    { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 1 },    { type: 'elbow', rotation: 2 },
      // Row 1
      { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 3 },    { type: 'straight', rotation: 0 }, { type: 'straight', rotation: 0 },
      // Row 2
      { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 1 }, { type: 'cross', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 1 },
      // Row 3
      { type: 'elbow', rotation: 1 },    { type: 'straight', rotation: 1 }, { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 2 },    { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 0 },
      // Row 4
      { type: 'straight', rotation: 0 }, { type: 'elbow', rotation: 0 },    { type: 'elbow', rotation: 0 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 2 },    { type: 'straight', rotation: 0 },
      // Row 5
      { type: 'elbow', rotation: 3 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 1 },    { type: 'straight', rotation: 1 }, { type: 'elbow', rotation: 0 },    { type: 'elbow', rotation: 2 },
    ],
  },
];
