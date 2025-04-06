export {};

declare global {
  interface Window {
    headerImages?: {
      realm?: string;
      character?: string;
      quests?: string;
      guildhall?: string;
      achievements?: string;
      kingdom?: string;
    };
  }
} 