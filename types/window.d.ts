interface HeaderImages {
  realm: string;
  character: string;
  quests: string;
  guildhall: string;
  achievements: string;
  kingdom: string;
}

declare global {
  interface Window {
    headerImages: HeaderImages;
  }
} 