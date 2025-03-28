export const ImagePaths = {
  headers: {
    castleBanner: '/assets/headers/castle-banner.jpg',
    castleNight: '/assets/headers/castle-night.svg',
  },
  backgrounds: {
    placeholder: '/assets/backgrounds/placeholder.svg',
    forest: '/assets/backgrounds/forest.jpg',
    castle: '/assets/backgrounds/castle.jpg',
    mountain: '/assets/backgrounds/mountain.jpg',
    village: '/assets/backgrounds/village.jpg',
    lake: '/assets/backgrounds/lake.jpg',
    market: '/assets/backgrounds/market.jpg',
  },
  avatars: {
    placeholder: '/assets/avatars/placeholder.svg',
    placeholderSmall: '/assets/avatars/placeholder-small.svg',
    placeholderLarge: '/assets/avatars/placeholder-large.svg',
  },
  tiles: {
    grass: '/assets/tiles/grass.svg',
    forest: '/assets/tiles/forest.svg',
    mountain: '/assets/tiles/mountain.svg',
    water: '/assets/tiles/water.svg',
    desert: '/assets/tiles/desert.svg',
    snow: '/assets/tiles/snow.svg',
    ice: '/assets/tiles/ice.svg',
    lava: '/assets/tiles/lava.svg',
    swamp: '/assets/tiles/swamp.svg',
    road: '/assets/tiles/road.svg',
    crossroad: '/assets/tiles/crossroad.svg',
    intersection: '/assets/tiles/intersection.svg',
    cornerRoad: '/assets/tiles/corner-road.svg',
    city: '/assets/tiles/city.svg',
    town: '/assets/tiles/town.svg',
    special: '/assets/tiles/special.svg',
  },
  icons: {
    // Add icons as needed
  }
} as const;

// Type for image paths
export type ImagePath = typeof ImagePaths;

// Helper function to get image path
export function getImagePath(category: keyof ImagePath, name: string): string {
  return ImagePaths[category][name as keyof typeof ImagePaths[typeof category]] || ImagePaths.backgrounds.placeholder;
}

// Helper function to get avatar path with size
export function getAvatarPath(size?: 'small' | 'large'): string {
  if (size === 'small') return ImagePaths.avatars.placeholderSmall;
  if (size === 'large') return ImagePaths.avatars.placeholderLarge;
  return ImagePaths.avatars.placeholder;
} 