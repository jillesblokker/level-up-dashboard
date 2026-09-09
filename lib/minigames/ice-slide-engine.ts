/**
 * Glacial Ice Slide Puzzle Engine
 * Frictionless ice sliding physics with rocks and exit target.
 */

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export type IceTileType = 'ice' | 'rock' | 'start' | 'exit';

export interface IceLevelConfig {
  id: string;
  title: string;
  difficulty: 'gentle' | 'frosty' | 'glacial';
  width: number;
  height: number;
  start: { x: number; y: number };
  exit: { x: number; y: number };
  rocks: Array<{ x: number; y: number }>;
  parMoves: number;
  description: string;
}

export interface SlideStep {
  x: number;
  y: number;
  traversed: Array<{ x: number; y: number }>;
  hitExit: boolean;
  hitRock: boolean;
  hitBorder: boolean;
}

const DIR_OFFSETS: Record<SlideDirection, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * Calculates the destination and intermediate path of sliding in a given direction
 * until an obstacle (rock) or the board boundary is hit.
 */
export function calculateSlide(
  currentPos: { x: number; y: number },
  direction: SlideDirection,
  level: IceLevelConfig
): SlideStep {
  const { dx, dy } = DIR_OFFSETS[direction];
  const rocksSet = new Set(level.rocks.map(r => `${r.x},${r.y}`));

  let currX = currentPos.x;
  let currY = currentPos.y;
  const traversed: Array<{ x: number; y: number }> = [];
  let hitExit = false;
  let hitRock = false;
  let hitBorder = false;

  while (true) {
    const nextX = currX + dx;
    const nextY = currY + dy;

    // Boundary check
    if (nextX < 0 || nextX >= level.width || nextY < 0 || nextY >= level.height) {
      hitBorder = true;
      break;
    }

    // Rock obstacle check
    if (rocksSet.has(`${nextX},${nextY}`)) {
      hitRock = true;
      break;
    }

    // Advance onto valid ice tile
    currX = nextX;
    currY = nextY;
    traversed.push({ x: currX, y: currY });

    // Exit check: If penguin slides onto or across the exit, victory!
    if (currX === level.exit.x && currY === level.exit.y) {
      hitExit = true;
      break;
    }
  }

  return {
    x: currX,
    y: currY,
    traversed,
    hitExit,
    hitRock,
    hitBorder,
  };
}

/**
 * BFS Solver to find the shortest path from start to exit and verify level solvability.
 */
export function solveIcePuzzle(level: IceLevelConfig): SlideDirection[] | null {
  const queue: Array<{ pos: { x: number; y: number }; path: SlideDirection[] }> = [
    { pos: level.start, path: [] },
  ];
  const visited = new Set<string>();
  visited.add(`${level.start.x},${level.start.y}`);

  const directions: SlideDirection[] = ['up', 'down', 'left', 'right'];

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    for (const dir of directions) {
      const step = calculateSlide(pos, dir, level);
      // Skip if slide didn't change position
      if (step.x === pos.x && step.y === pos.y) continue;

      if (step.hitExit) {
        return [...path, dir];
      }

      const key = `${step.x},${step.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: { x: step.x, y: step.y }, path: [...path, dir] });
      }
    }
  }

  return null;
}

/**
 * Curated progressive handcrafted ice slide levels.
 * Each has carefully placed interior rocks so that only specific bank angles lead to the exit.
 */
export const ICE_LEVELS: IceLevelConfig[] = [
  {
    id: 'ice-gentle-1',
    title: 'Frostbite Basin',
    difficulty: 'gentle',
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    exit: { x: 5, y: 4 },
    rocks: [
      { x: 4, y: 0 },
      { x: 3, y: 5 },
      { x: 0, y: 3 },
      { x: 2, y: 2 },
      { x: 5, y: 2 },
    ],
    parMoves: 3,
    description: 'A gentle slope across the frozen tarn. Bank off the granite boulders to slide straight into the golden ice hole.',
  },
  {
    id: 'ice-frosty-1',
    title: 'Crystal Glacier',
    difficulty: 'frosty',
    width: 7,
    height: 7,
    start: { x: 0, y: 0 },
    exit: { x: 6, y: 5 },
    rocks: [
      { x: 4, y: 0 },
      { x: 3, y: 5 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 5, y: 2 },
      { x: 4, y: 6 },
      { x: 0, y: 2 },
      { x: 6, y: 0 },
    ],
    parMoves: 6,
    description: 'Icy winds have created slick glacial corridors. Bank against the frost stones to line up your approach to the exit chute.',
  },
  {
    id: 'ice-glacial-1',
    title: 'Glacial Cavern Vault',
    difficulty: 'glacial',
    width: 8,
    height: 8,
    start: { x: 0, y: 0 },
    exit: { x: 7, y: 7 },
    rocks: [
      { x: 5, y: 0 },
      { x: 4, y: 5 },
      { x: 1, y: 4 },
      { x: 2, y: 1 },
      { x: 7, y: 2 },
      { x: 6, y: 6 },
      { x: 0, y: 5 },
      { x: 1, y: 7 },
      { x: 7, y: 6 },
      { x: 0, y: 3 },
      { x: 7, y: 0 },
      { x: 3, y: 7 },
    ],
    parMoves: 6,
    description: 'The deep frost caverns beneath the ancient glaciers. Navigate the slippery maze to reach the sanctuary exit.',
  },
];
