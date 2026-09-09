/**
 * Location naming utility for Thrivehaven settlements, towns, cities, and abbeys.
 * Ensures consistent, atmospheric fantasy names instead of raw tile identifiers or URL encoded strings.
 */

const SETTLEMENT_NAMES = [
  'Akercity',
  'Oakhaven Outpost',
  'Valenford Settlement',
  'Pinecrest Hamlet',
  'Eldermoor Post',
  'Sunspire Outpost',
  'Silverbrook Settlement',
  'Drakenshire Post',
];

const TOWN_NAMES = [
  'Riverside Haven',
  'Greenhaven Market Town',
  'Briarwood Town',
  'Fallowmere Town',
  'Amberfall Haven',
  'Highford Crossing',
];

const CITY_NAMES = [
  'Grand Citadel',
  'Bravos Prime',
  'Valoreth City',
  'Astraea Capital',
  'Sunspire City',
  'Ironspire Citadel',
];

const ABBEY_NAMES = [
  'Sanctuary of Light',
  'St. Jude Abbey',
  'Silent Dawn Monastery',
  'Highland Hermitage',
];

/**
 * Resolves a clean, atmospheric name for a given location type and raw slug/tile name.
 */
export function getResolvedLocationName(
  type: 'settlement' | 'town' | 'city' | 'abbey',
  rawName?: string,
  coordinates?: { x: number; y: number }
): string {
  if (rawName) {
    const decoded = decodeURIComponent(rawName).trim();
    const lower = decoded.toLowerCase();

    // If it's an explicit custom name that doesn't just say "tile", "settlement", etc.
    const isGeneric =
      lower === 'settlement' ||
      lower === 'town' ||
      lower === 'city' ||
      lower === 'abbey' ||
      lower.includes('settlement tile') ||
      lower.includes('town tile') ||
      lower.includes('city tile') ||
      lower.includes('abbey tile') ||
      lower.endsWith('-tile') ||
      lower.endsWith(' tile');

    if (!isGeneric && decoded.length > 2) {
      // Clean up hyphens and title case
      const cleaned = decoded.replace(/[-_]+/g, ' ');
      return cleaned
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Pick deterministic name from pool based on coordinates or default
  const pool =
    type === 'settlement'
      ? SETTLEMENT_NAMES
      : type === 'town'
      ? TOWN_NAMES
      : type === 'city'
      ? CITY_NAMES
      : ABBEY_NAMES;

  if (coordinates) {
    const idx = Math.abs((coordinates.x * 31 + coordinates.y * 17)) % pool.length;
    return pool[idx]!;
  }

  return pool[0]!; // "Akercity" for settlements, "Riverside Haven" for towns, etc.
}
