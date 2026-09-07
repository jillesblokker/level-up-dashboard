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
  storyIntro: string;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTHLY_TITANS: MonthlyTitan[] = [
  {
    monthIndex: 0,
    name: 'Glacial Colossus',
    title: 'Frost Giant of the Northern Peak',
    element: 'Ice',
    totalHp: 1000,
    image: '/images/titans/glacial_colossus.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'An ancient ice titan threatening the northern borders.',
    storyIntro: 'A glacial colossus descends from the frozen northern peaks, casting a biting blizzard across your borders and freezing trade routes solid. Work together with your fellowship allies to shatter the frost giant before winter consumes the entire realm.'
  },
  {
    monthIndex: 1,
    name: 'Shadowflame Drake',
    title: 'Scourge of the Nether Ruin',
    element: 'Fire',
    totalHp: 1000,
    image: '/images/titans/shadowflame_drake.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A dark fire drake nesting atop the volcano spires.',
    storyIntro: 'The shadowflame drake has awakened atop the volcano spires, raining dark violet fire upon outlying settlements and burning royal granaries. Unite your daily habit momentum with your fellowship to extinguish the shadowflame and reclaim the skies.'
  },
  {
    monthIndex: 2,
    name: 'Obsidian Golem',
    title: 'Living Mountain of the Quarry',
    element: 'Earth',
    totalHp: 1000,
    image: '/images/titans/obsidian_golem.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A giant stone entity awakened by deep mining operations.',
    storyIntro: 'An obsidian golem has ruptured from the deep mining quarries, violently shaking castle foundations and burying mountain passes in jagged rockfalls. Band together with your allies to strike down the living mountain and restore kingdom stability.'
  },
  {
    monthIndex: 3,
    name: 'Verdant Chimera',
    title: 'Guardian of the Forbidden Grove',
    element: 'Nature',
    totalHp: 1000,
    image: '/images/titans/verdant_chimera.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A wild beast protecting primordial forests.',
    storyIntro: 'A primal verdant chimera has surged out of the forbidden groves, suffocating outer farmlands in toxic brambles and hunting livestock in the moonlight. Join forces with your fellowship allies to subdue the rampaging beast and protect your harvest.'
  },
  {
    monthIndex: 4,
    name: 'Storm Tempest Kraken',
    title: 'Sovereign of the Tempest Sea',
    element: 'Water',
    totalHp: 1000,
    image: '/images/titans/storm_tempest_kraken.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A leviathan summoning hurricanes across trade routes.',
    storyIntro: 'The storm tempest kraken rises amidst howling hurricanes, dragging trading galleons into massive whirlpools and shattering coastal harbor sea walls. Rally your fellowship to brave the tempest and sever its tentacles before trade routes are lost.'
  },
  {
    monthIndex: 5,
    name: 'Solar Sun Titan',
    title: 'Radiant Lord of High Noon',
    element: 'Holy',
    totalHp: 1000,
    image: '/images/titans/solar_sun_titan.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A blinding celestial entity demanding proof of daily devotion.',
    storyIntro: 'The solar sun titan blazes high above the citadel, scorching kingdom aqueducts with blinding celestial heat and testing the resilience of mortal rulers. Combine your collective daily discipline to withstand the high noon trial and appease the radiant sovereign.'
  },
  {
    monthIndex: 6,
    name: 'Astral Cosmic Wyrm',
    title: 'Devourer of Nebulae & Stars',
    element: 'Cosmic',
    totalHp: 1000,
    image: '/images/titans/astral_wyrm.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A cosmic dragon descending every July to test unified alliances.',
    storyIntro: 'The astral cosmic wyrm tears through the night sky, devouring starlight and plunging kingdom watchtowers into celestial dread. Stand shoulder to shoulder with your fellowship allies to pierce its constellation armor and banish the cosmic devourer back to the stars.'
  },
  {
    monthIndex: 7,
    name: 'Ember Volcano Fiend',
    title: 'Molten Core Abomination',
    element: 'Fire',
    totalHp: 1000,
    image: '/images/titans/ember_volcano_fiend.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A magma demon rising from subterranean fissures.',
    storyIntro: 'The ember volcano fiend bursts forth from molten subterranean fissures, flooding lowlands with rivers of scalding magma and threatening to incinerate town walls. Unite with your allies to cool its burning core and seal the rift for good.'
  },
  {
    monthIndex: 8,
    name: 'Abyssal Leviathan',
    title: 'Depths Terror of the Trench',
    element: 'Dark Water',
    totalHp: 1000,
    image: '/images/titans/abyssal_leviathan.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A deep sea monster threatening coastal harbors.',
    storyIntro: 'An abyssal leviathan suddenly appears from the dark depths of the sea, smashing tidal surges against coastal harbors and threatening your kingdom and those of your allies. Work together with your fellowship to banish the oceanic beast back to Davy Jones\' locker!'
  },
  {
    monthIndex: 9,
    name: 'Phantom Skeleton Sovereign',
    title: 'Lord of the Dread Masquerade',
    element: 'Undead',
    totalHp: 1000,
    image: '/images/titans/phantom_skeleton_sovereign.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A spectral king raising armies of bone.',
    storyIntro: 'The phantom skeleton sovereign rises from foggy ancestral catacombs, raising legions of spectral bone warriors and casting a deathly chill over kingdom villages. Rally your fellowship\'s righteous habit power to break the lich king\'s dark crown and lay the restless dead to rest.'
  },
  {
    monthIndex: 10,
    name: 'Iron Siege Behemoth',
    title: 'Ironclad Destroyer of Walls',
    element: 'Metal',
    totalHp: 1000,
    image: '/images/titans/iron_siege_behemoth.webp',
    rewardGold: 200,
    rewardGems: 25,
    description: 'A massive armored siege engine powered by dark alchemy.',
    storyIntro: 'An iron siege behemoth rumbles across the plains, grinding stone fortifications to dust with alchemical battering rams and poison-belching furnaces. Mobilize your allied fellowship arsenal to dismantle the mechanical destroyer before it reaches the castle gates.'
  },
  {
    monthIndex: 11,
    name: 'Crown Golden Dragon',
    title: 'Legendary Hoard Guardian',
    element: 'Gold',
    totalHp: 1000,
    image: '/images/titans/crown_golden_dragon.webp',
    rewardGold: 500,
    rewardGems: 50,
    description: 'The grand year-end dragon holding royal chest treasures.',
    storyIntro: 'The crown golden dragon descends in a blinding tempest of liquid gold, locking all year-end realm treasures inside its vaulted mountain hoard. Gather your fellowship\'s full yearly momentum to conquer the golden wyrm and unlock the legendary raid chest for all allies!'
  },
];

export function getCurrentMonthlyTitan(): MonthlyTitan {
  const currentMonth = new Date().getMonth(); // 0 to 11
  return MONTHLY_TITANS[currentMonth] || MONTHLY_TITANS[6]!;
}
