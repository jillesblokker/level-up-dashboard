/**
 * Penguino Escape - Glacial Ice Slide Puzzle Engine
 * Frictionless ice sliding physics with rocks, obstacles, and igloo exit.
 */

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export type IceTileType = 'ice' | 'rock' | 'start' | 'exit';

export type IceDifficulty = 'novice' | 'gentle' | 'frosty' | 'glacial' | 'blizzard';

export interface IceLevelConfig {
  id: string;
  title: string;
  difficulty: IceDifficulty;
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
 * Calculates destination and intermediate trajectory of sliding on frictionless ice.
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

    if (nextX < 0 || nextX >= level.width || nextY < 0 || nextY >= level.height) {
      hitBorder = true;
      break;
    }

    if (rocksSet.has(`${nextX},${nextY}`)) {
      hitRock = true;
      break;
    }

    currX = nextX;
    currY = nextY;
    traversed.push({ x: currX, y: currY });

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
 * BFS Solver to find shortest slide path to exit.
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

// 15 verified solvable handcrafted ice slide levels across 5 difficulty tiers
export const ICE_LEVELS: IceLevelConfig[] = [
  // 1. Novice (5x5)
  {
    id: 'ice-novice-1',
    title: 'Snowdrift Pond I',
    difficulty: 'novice',
    width: 5,
    height: 5,
    start: { x: 0, y: 0 },
    exit: { x: 4, y: 4 },
    rocks: [{ x: 3, y: 0 }, { x: 2, y: 4 }, { x: 0, y: 2 }],
    parMoves: 3,
    description: 'A quick slide across the frozen backyard pond to Penguino’s igloo.'
  },
  {
    id: 'ice-novice-2',
    title: 'Snowdrift Pond II',
    difficulty: 'novice',
    width: 5,
    height: 5,
    start: { x: 0, y: 0 },
    exit: { x: 0, y: 4 },
    rocks: [{ x: 0, y: 3 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 2, y: 2 }],
    parMoves: 3,
    description: 'Bank around the frost stones to line up the path into the igloo.'
  },
  {
    id: 'ice-novice-3',
    title: 'Snowdrift Pond III',
    difficulty: 'novice',
    width: 5,
    height: 5,
    start: { x: 2, y: 0 },
    exit: { x: 2, y: 4 },
    rocks: [{ x: 2, y: 2 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
    parMoves: 3,
    description: 'Zigzag through the snowdrifts to help Penguino find his way home.'
  },

  // 2. Gentle (6x6)
  {
    id: 'ice-gentle-1',
    title: 'Frostbite Basin I',
    difficulty: 'gentle',
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    exit: { x: 5, y: 4 },
    rocks: [{ x: 4, y: 0 }, { x: 3, y: 5 }, { x: 0, y: 3 }, { x: 2, y: 2 }, { x: 5, y: 2 }],
    parMoves: 3,
    description: 'Bank off granite boulders to glide straight to the igloo.'
  },
  {
    id: 'ice-gentle-2',
    title: 'Frostbite Basin II',
    difficulty: 'gentle',
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    exit: { x: 4, y: 5 },
    rocks: [{ x: 5, y: 0 }, { x: 4, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 5 }, { x: 0, y: 2 }],
    parMoves: 4,
    description: 'Bank off the glacial rocks to guide Penguino safely to his igloo.'
  },
  {
    id: 'ice-gentle-3',
    title: 'Frostbite Basin III',
    difficulty: 'gentle',
    width: 6,
    height: 6,
    start: { x: 1, y: 0 },
    exit: { x: 5, y: 5 },
    rocks: [{ x: 4, y: 0 }, { x: 3, y: 4 }, { x: 0, y: 4 }, { x: 2, y: 1 }, { x: 5, y: 3 }],
    parMoves: 4,
    description: 'Slide along the frozen perimeter and bank into the igloo entrance.'
  },

  // 3. Frosty (7x7)
  {
    id: 'ice-frosty-1',
    title: 'Crystal Glacier I',
    difficulty: 'frosty',
    width: 7,
    height: 7,
    start: { x: 0, y: 0 },
    exit: { x: 6, y: 5 },
    rocks: [{ x: 4, y: 0 }, { x: 3, y: 5 }, { x: 6, y: 4 }, { x: 0, y: 4 }, { x: 1, y: 1 }, { x: 5, y: 2 }, { x: 4, y: 6 }, { x: 0, y: 2 }, { x: 6, y: 0 }],
    parMoves: 6,
    description: 'Slick corridors with dead ends. Find the true sequence to reach the igloo.'
  },
  {
    id: 'ice-frosty-2',
    title: 'Crystal Glacier II',
    difficulty: 'frosty',
    width: 7,
    height: 7,
    start: { x: 0, y: 1 },
    exit: { x: 5, y: 6 },
    rocks: [{ x: 5, y: 1 }, { x: 4, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 2 }, { x: 6, y: 3 }, { x: 0, y: 4 }, { x: 6, y: 6 }],
    parMoves: 5,
    description: 'Navigate past frosty crevices and bank toward the igloo.'
  },
  {
    id: 'ice-frosty-3',
    title: 'Crystal Glacier III',
    difficulty: 'frosty',
    width: 7,
    height: 7,
    start: { x: 6, y: 0 },
    exit: { x: 0, y: 6 },
    rocks: [{ x: 2, y: 0 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 6 }, { x: 6, y: 4 }],
    parMoves: 5,
    description: 'Traverse from east to west across the slick ice field.'
  },

  // 4. Glacial (8x8)
  {
    id: 'ice-glacial-1',
    title: 'Glacial Cavern I',
    difficulty: 'glacial',
    width: 8,
    height: 8,
    start: { x: 0, y: 0 },
    exit: { x: 7, y: 7 },
    rocks: [{ x: 5, y: 0 }, { x: 4, y: 5 }, { x: 1, y: 4 }, { x: 2, y: 1 }, { x: 7, y: 2 }, { x: 6, y: 6 }, { x: 0, y: 5 }, { x: 1, y: 7 }, { x: 7, y: 6 }, { x: 0, y: 3 }, { x: 7, y: 0 }, { x: 3, y: 7 }],
    parMoves: 6,
    description: 'Deep frost cavern vault with crystalline boulders guarding the sanctuary.'
  },
  {
    id: 'ice-glacial-2',
    title: 'Glacial Cavern II',
    difficulty: 'glacial',
    width: 8,
    height: 8,
    start: { x: 0, y: 2 },
    exit: { x: 6, y: 6 },
    rocks: [{ x: 6, y: 2 }, { x: 5, y: 7 }, { x: 1, y: 6 }, { x: 2, y: 1 }, { x: 7, y: 3 }, { x: 0, y: 6 }, { x: 6, y: 5 }],
    parMoves: 5,
    description: 'Ancient frost formations require precision banking.'
  },
  {
    id: 'ice-glacial-3',
    title: 'Glacial Cavern III',
    difficulty: 'glacial',
    width: 8,
    height: 8,
    start: { x: 1, y: 0 },
    exit: { x: 7, y: 5 },
    rocks: [{ x: 6, y: 0 }, { x: 5, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 1, y: 4 }, { x: 7, y: 4 }],
    parMoves: 6,
    description: 'Bank around the glacial spires to align with the igloo.'
  },

  // 5. Blizzard (9x9)
  {
    id: 'ice-blizzard-1',
    title: 'Frostfire Summit I',
    difficulty: 'blizzard',
    width: 9,
    height: 9,
    start: { x: 0, y: 0 },
    exit: { x: 8, y: 8 },
    rocks: [
      { x: 6, y: 0 }, { x: 5, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 3 },
      { x: 8, y: 3 }, { x: 7, y: 6 }, { x: 1, y: 5 }, { x: 0, y: 4 },
      { x: 8, y: 7 }, { x: 4, y: 8 }, { x: 8, y: 1 }
    ],
    parMoves: 7,
    description: 'Fierce arctic blizzard winds howling over slippery mountain ice.'
  },
  {
    id: 'ice-blizzard-2',
    title: 'Frostfire Summit II',
    difficulty: 'blizzard',
    width: 9,
    height: 9,
    start: { x: 0, y: 1 },
    exit: { x: 7, y: 7 },
    rocks: [
      { x: 7, y: 1 }, { x: 6, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 2 },
      { x: 8, y: 4 }, { x: 0, y: 5 }, { x: 7, y: 6 }, { x: 3, y: 8 }
    ],
    parMoves: 6,
    description: 'The ultimate frozen maze challenge. Guide Penguino home through the blizzard!'
  },
  {
    id: 'ice-blizzard-3',
    title: 'Frostfire Summit III',
    difficulty: 'blizzard',
    width: 9,
    height: 9,
    start: { x: 2, y: 0 },
    exit: { x: 8, y: 6 },
    rocks: [
      { x: 7, y: 0 }, { x: 6, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 4 },
      { x: 8, y: 4 }, { x: 0, y: 6 }, { x: 8, y: 5 }
    ],
    parMoves: 6,
    description: 'Snow-swept mountain peaks where only the cleverest slides reach the warm igloo.'
  }
];

export function getIceLevelsByDifficulty(difficulty: IceDifficulty): IceLevelConfig[] {
  return ICE_LEVELS.filter(l => l.difficulty === difficulty);
}
