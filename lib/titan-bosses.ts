export interface MonthlyTitan {
  monthIndex: number; // 0 to 11
  name: string;
  title: string;
  element: string;
  totalHp: number;
  image: string;
  rewardGold: number;
  rewardGems: number;
  description: string;
}

export const MONTHLY_TITANS: MonthlyTitan[] = [
  { monthIndex: 0, name: 'Glacial Colossus', title: 'Frost Giant of the Northern Peak', element: 'Ice', totalHp: 1000, image: '/images/Monsters/Trollie.webp', rewardGold: 200, rewardGems: 25, description: 'An ancient ice titan threatening the northern borders.' },
  { monthIndex: 1, name: 'Shadowflame Drake', title: 'Scourge of the Nether Ruin', element: 'Fire', totalHp: 1000, image: '/images/Monsters/Dragoni.webp', rewardGold: 200, rewardGems: 25, description: 'A dark fire drake nesting atop the volcano spires.' },
  { monthIndex: 2, name: 'Obsidian Golem', title: 'Living Mountain of the Quarry', element: 'Earth', totalHp: 1000, image: '/images/Monsters/Orci.webp', rewardGold: 200, rewardGems: 25, description: 'A giant stone entity awakened by deep mining operations.' },
  { monthIndex: 3, name: 'Verdant Chimera', title: 'Guardian of the Forbidden Grove', element: 'Nature', totalHp: 1000, image: '/images/Monsters/Fairiel.webp', rewardGold: 200, rewardGems: 25, description: 'A wild beast protecting primordial forests.' },
  { monthIndex: 4, name: 'Storm Tempest Kraken', title: 'Sovereign of the Tempest Sea', element: 'Water', totalHp: 1000, image: '/images/Monsters/Sorceror.webp', rewardGold: 200, rewardGems: 25, description: 'A leviathan summoning hurricanes across trade routes.' },
  { monthIndex: 5, name: 'Solar Sun Titan', title: 'Radiant Lord of High Noon', element: 'Holy', totalHp: 1000, image: '/images/Monsters/Peggie.webp', rewardGold: 200, rewardGems: 25, description: 'A blinding celestial entity demanding proof of daily devotion.' },
  { monthIndex: 6, name: 'Astral Cosmic Wyrm', title: 'Devourer of Nebulae & Stars', element: 'Cosmic', totalHp: 1000, image: '/images/titans/astral_wyrm.png', rewardGold: 200, rewardGems: 25, description: 'A cosmic dragon descending every July to test unified alliances.' },
  { monthIndex: 7, name: 'Ember Volcano Fiend', title: 'Molten Core Abomination', element: 'Fire', totalHp: 1000, image: '/images/Monsters/Dragoni.webp', rewardGold: 200, rewardGems: 25, description: 'A magma demon rising from subterranean fissures.' },
  { monthIndex: 8, name: 'Abyssal Leviathan', title: 'Depths Terror of the Trench', element: 'Dark Water', totalHp: 1000, image: '/images/Monsters/Sorceror.webp', rewardGold: 200, rewardGems: 25, description: 'A deep sea monster threatening coastal harbors.' },
  { monthIndex: 9, name: 'Phantom Skeleton Sovereign', title: 'Lord of the Dread Masquerade', element: 'Undead', totalHp: 1000, image: '/images/Monsters/Orci.webp', rewardGold: 200, rewardGems: 25, description: 'A spectral king raising armies of bone.' },
  { monthIndex: 10, name: 'Iron Siege Behemoth', title: 'Ironclad Destroyer of Walls', element: 'Metal', totalHp: 1000, image: '/images/Monsters/Trollie.webp', rewardGold: 200, rewardGems: 25, description: 'A massive armored siege engine powered by dark alchemy.' },
  { monthIndex: 11, name: 'Crown Golden Dragon', title: 'Legendary Hoard Guardian', element: 'Gold', totalHp: 1000, image: '/images/Monsters/Dragoni.webp', rewardGold: 500, rewardGems: 50, description: 'The grand year-end dragon holding royal chest treasures.' },
];

export function getCurrentMonthlyTitan(): MonthlyTitan {
  const currentMonth = new Date().getMonth(); // 0 to 11
  return MONTHLY_TITANS[currentMonth] || MONTHLY_TITANS[6]!;
}
