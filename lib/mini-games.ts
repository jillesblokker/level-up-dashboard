import { MiniGameEvent } from './game-events';

// Mini-game Types
export type MiniGameType = 'puzzle' | 'memory' | 'reaction' | 'strategy';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Base Mini-game Interface
export interface MiniGame {
  id: string;
  type: MiniGameType;
  difficulty: Difficulty;
  timeLimit?: number | undefined;
  score: number;
  isComplete: boolean;
  startTime?: Date;
  endTime?: Date;
}

// Puzzle Game Interface
export interface PuzzleGame extends MiniGame {
  type: 'puzzle';
  grid: number[][];
  moves: number;
  targetPattern: number[][];
}

// Memory Game Interface
export interface MemoryGame extends MiniGame {
  type: 'memory';
  cards: {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
  }[];
  pairsFound: number;
  totalPairs: number;
}

// Reaction Game Interface
export interface ReactionGame extends MiniGame {
  type: 'reaction';
  targets: {
    id: number;
    position: { x: number; y: number };
    isHit: boolean;
    timeToHit?: number;
  }[];
  accuracy: number;
  averageReactionTime: number;
}

// Strategy Game Interface
export interface StrategyGame extends MiniGame {
  type: 'strategy';
  board: {
    position: { x: number; y: number };
    value: number;
    isOccupied: boolean;
  }[][];
  moves: number;
  maxMoves: number;
}

// Mini-game Manager Class
export class MiniGamesManager {
  private static instance: MiniGamesManager;
  private activeGames: Map<string, MiniGame>;
  private gameHistory: MiniGame[];

  private constructor() {
    this.activeGames = new Map();
    this.gameHistory = [];
  }

  public static getInstance(): MiniGamesManager {
    if (!MiniGamesManager.instance) {
      MiniGamesManager.instance = new MiniGamesManager();
    }
    return MiniGamesManager.instance;
  }

  public createGame(event: MiniGameEvent): MiniGame {
    let game: MiniGame;

    switch (event.gameType) {
      case 'puzzle':
        game = this.createPuzzleGame(event);
        break;
      case 'memory':
        game = this.createMemoryGame(event);
        break;
      case 'reaction':
        game = this.createReactionGame(event);
        break;
      case 'strategy':
        game = this.createStrategyGame(event);
        break;
      default:
        throw new Error(`Unknown game type: ${event.gameType}`);
    }

    this.activeGames.set(game.id, game);
    return game;
  }

  private createPuzzleGame(event: MiniGameEvent): PuzzleGame {
    return {
      id: event.id,
      type: 'puzzle',
      difficulty: event.difficulty,
      timeLimit: event.timeLimit,
      score: 0,
      isComplete: false,
      grid: this.generatePuzzleGrid(event.difficulty),
      moves: 0,
      targetPattern: this.generateTargetPattern(event.difficulty)
    };
  }

  private createMemoryGame(event: MiniGameEvent): MemoryGame {
    const pairs = this.getPairCount(event.difficulty);
    return {
      id: event.id,
      type: 'memory',
      difficulty: event.difficulty,
      timeLimit: event.timeLimit,
      score: 0,
      isComplete: false,
      cards: this.generateMemoryCards(pairs),
      pairsFound: 0,
      totalPairs: pairs
    };
  }

  private createReactionGame(event: MiniGameEvent): ReactionGame {
    return {
      id: event.id,
      type: 'reaction',
      difficulty: event.difficulty,
      timeLimit: event.timeLimit,
      score: 0,
      isComplete: false,
      targets: this.generateTargets(event.difficulty),
      accuracy: 0,
      averageReactionTime: 0
    };
  }

  private createStrategyGame(event: MiniGameEvent): StrategyGame {
    return {
      id: event.id,
      type: 'strategy',
      difficulty: event.difficulty,
      timeLimit: event.timeLimit,
      score: 0,
      isComplete: false,
      board: this.generateStrategyBoard(event.difficulty),
      moves: 0,
      maxMoves: this.getMaxMoves(event.difficulty)
    };
  }

  private getPairCount(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return 6;
      case 'medium': return 8;
      case 'hard': return 12;
    }
  }

  private getMaxMoves(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return 20;
      case 'medium': return 15;
      case 'hard': return 10;
    }
  }

  private generatePuzzleGrid(difficulty: Difficulty): number[][] {
    // Implement puzzle grid generation based on difficulty
    return [];
  }

  private generateTargetPattern(difficulty: Difficulty): number[][] {
    // Implement target pattern generation based on difficulty
    return [];
  }

  private generateMemoryCards(pairs: number): MemoryGame['cards'] {
    // Implement memory card generation
    return [];
  }

  private generateTargets(difficulty: Difficulty): ReactionGame['targets'] {
    // Implement target generation based on difficulty
    return [];
  }

  private generateStrategyBoard(difficulty: Difficulty): StrategyGame['board'] {
    // Implement strategy board generation based on difficulty
    return [];
  }

  public getGame(gameId: string): MiniGame | undefined {
    return this.activeGames.get(gameId);
  }

  public updateGame(gameId: string, updates: Partial<MiniGame>) {
    const game = this.activeGames.get(gameId);
    if (game) {
      Object.assign(game, updates);
      if (game.isComplete) {
        this.completeGame(gameId);
      }
    }
  }

  public completeGame(gameId: string) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.endTime = new Date();
      this.gameHistory.push(game);
      this.activeGames.delete(gameId);
    }
  }

  public getGameHistory(): MiniGame[] {
    return [...this.gameHistory];
  }
}

// Export singleton instance
export const miniGames = MiniGamesManager.getInstance(); 