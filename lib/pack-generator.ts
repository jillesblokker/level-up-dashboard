export const CARD_TYPES = [
  {
    number: 1,
    rarity: "Super Common",
    color: "#689d99",
    background: "linear-gradient(160deg, #92d18b, #689d99 42%, #41837e 100%)",
    ink: "#003430",
    weight: 35,
    price: 5,
  },
  {
    number: 2,
    rarity: "Common",
    color: "#7788aa",
    background: "linear-gradient(160deg, #b6bfd5, #7788aa 42%, #4e638e 100%)",
    ink: "#061739",
    weight: 22,
    price: 8,
  },
  {
    number: 3,
    rarity: "Uncommon",
    color: "#5fae57",
    background: "linear-gradient(160deg, #b7dc9c, #5fae57 42%, #378b2e 100%)",
    ink: "#074600",
    weight: 15,
    price: 12,
  },
  {
    number: 4,
    rarity: "Uncommon+",
    color: "#41837e",
    background: "linear-gradient(160deg, #8bc2bd, #41837e 42%, #236863 100%)",
    ink: "#003430",
    weight: 10,
    price: 18,
  },
  {
    number: 5,
    rarity: "Rare",
    color: "#d4986a",
    background: "linear-gradient(160deg, #ffcfaa, #d4986a 42%, #aa6a39 100%)",
    ink: "#552500",
    weight: 7,
    price: 30,
  },
  {
    number: 6,
    rarity: "Epic",
    color: "#2d4471",
    background: "linear-gradient(160deg, #788ab1, #2d4471 42%, #152b55 100%)",
    ink: "#f4f8ff",
    weight: 5,
    price: 45,
  },
  {
    number: 7,
    rarity: "Very Epic",
    color: "#0d4e4a",
    background: "linear-gradient(160deg, #5f9f9b, #0d4e4a 42%, #003430 100%)",
    ink: "#eefcfb",
    weight: 3,
    price: 70,
  },
  {
    number: 8,
    rarity: "Legendary",
    color: "#804315",
    background: "linear-gradient(160deg, #d7b088, #804315 42%, #552500 100%)",
    ink: "#fff4ea",
    weight: 1.8,
    price: 110,
  },
  {
    number: 9,
    rarity: "Mythic",
    color: "#1a6811",
    background: "linear-gradient(160deg, #92d18b, #1a6811 42%, #074600 100%)",
    ink: "#efffe9",
    weight: 0.9,
    price: 180,
  },
  {
    number: 10,
    rarity: "Ultra Special",
    color: "#ffcfaa",
    background:
      "conic-gradient(from 220deg, #689d99, #4e638e, #378b2e, #aa6a39, #0d4e4a, #ffcfaa, #689d99)",
    ink: "#003430",
    weight: 0.3,
    price: 320,
  },
];

export const VARIANTS_PER_CARD = 5;
export const CARD_BY_NUMBER = new Map(CARD_TYPES.map((card) => [card.number, card]));

export function variantLabel(number: number, variantIndex: number) {
    const colors = ['Red', 'Green', 'Blue', 'White', 'Black'];
    return colors[variantIndex] ? `${colors[variantIndex]} Edition` : 'Unknown Variant';
}

export const PACK_TYPES = [
  {
    id: "starter",
    title: "Drift Pack",
    subtitle: "Budget pull with balanced odds",
    shortLabel: "Tier I",
    price: 500,
    rarityShift: 0,
    accent: "starter",
    description: "Best for steady farming. Keeps the classic odds curve.",
  },
  {
    id: "vault",
    title: "Vault Pack",
    subtitle: "Better chance at rarer side cards",
    shortLabel: "Tier II",
    price: 5000,
    rarityShift: 0.38,
    accent: "vault",
    description: "Costs more, trims low-rarity weight, and improves premium filler odds.",
  },
  {
    id: "crown",
    title: "Crown Pack",
    subtitle: "Highest chance for unique high-rarity pulls",
    shortLabel: "Tier III",
    price: 50,
    currency: 'gems',
    rarityShift: 0.76,
    accent: "crown",
    description: "Most expensive tier with the strongest push toward rare winners and elite side cards.",
  },
];

export const FREE_PACK_TYPES = [
  {
    id: "free_daily",
    title: "Free Daily Pack",
    subtitle: "Claim once every day",
    shortLabel: "Daily",
    price: 0,
    rarityShift: 0.1,
    accent: "starter",
    description: "Your daily gift! Open to claim random cards.",
    cooldownType: "daily",
  },
  {
    id: "free_weekly",
    title: "Free Weekly Pack",
    subtitle: "Claim once every week",
    shortLabel: "Weekly",
    price: 0,
    rarityShift: 0.4,
    accent: "vault",
    description: "Your weekly premium bounty! Open for enhanced odds.",
    cooldownType: "weekly",
  },
  {
    id: "free_monthly",
    title: "Free Monthly Pack",
    subtitle: "Claim once every month",
    shortLabel: "Monthly",
    price: 0,
    rarityShift: 0.8,
    accent: "crown",
    description: "An elite monthly treasure chest! High chance of ultra-rare pulls.",
    cooldownType: "monthly",
  },
];

export const PACK_TYPE_BY_ID = new Map<string, typeof PACK_TYPES[0] | typeof FREE_PACK_TYPES[0]>([
  ...PACK_TYPES.map((packType) => [packType.id, packType] as const),
  ...FREE_PACK_TYPES.map((packType) => [packType.id, packType] as const),
]);

export function pickWeightedCard(random = Math.random, excludedNumbers = new Set<number>()) {
  const pool = CARD_TYPES.filter((card) => !excludedNumbers.has(card.number));
  const totalWeight = pool.reduce((sum, card) => sum + card.weight, 0);
  let roll = random() * totalWeight;
  for (const card of pool) {
      if (roll < card.weight) return card;
      roll -= card.weight;
  }
  return pool[pool.length - 1]; // Fallback
}

function pickVariantIndex(random = Math.random) {
    const roll = random();
    if (roll < 0.50) return 0; // Red
    if (roll < 0.75) return 1; // Green
    if (roll < 0.90) return 2; // Blue
    if (roll < 0.97) return 3; // White
    return 4; // Black
}

export function generatePack(packTypeId = "starter", random = Math.random) {
  const packType = PACK_TYPE_BY_ID.get(packTypeId) ?? PACK_TYPES[0]!;
  
  // Generating a simple 9-card scratch pack (like typical 3x3)
  // For the scratch off logic: the user must find 3 matching cards to "win" it.
  const winner = pickWeightedCard(random)!;
  const winnerVariant = pickVariantIndex(random);
  
  // The winner must appear 3 times.
  const numbers = [winner.number, winner.number, winner.number];
  
  // Fill the remaining 6 slots with random non-matching cards (appearing 1 or 2 times max)
  const nonWinners = new Set([winner.number]);
  for (let i = 0; i < 6; i++) {
      const filler = pickWeightedCard(random, nonWinners)!;
      numbers.push(filler.number);
      // Let's just make everything unique filler for simplicity, 
      // or we can allow duplicates but not 3.
      nonWinners.add(filler.number); 
  }
  
  // Shuffle numbers array using classic swap
  for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = numbers[i]!;
      numbers[i] = numbers[j]!;
      numbers[j] = temp;
  }
  
  const cards = numbers.map((number, index) => {
    const variantIndex = number === winner.number ? winnerVariant : pickVariantIndex(random);
    const cardDef = CARD_BY_NUMBER.get(number)!;
    return {
      id: `packcard-${index}-${Date.now()}`,
      number: cardDef.number,
      rarity: cardDef.rarity,
      color: cardDef.color,
      background: cardDef.background,
      ink: cardDef.ink,
      price: cardDef.price,
      variantIndex,
      variantLabel: variantLabel(number, variantIndex),
      isWinnerCard: number === winner.number
    };
  });

  return {
    id: `pack-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    packTypeId: packType.id,
    winnerNumber: winner.number,
    winnerVariantIndex: winnerVariant,
    cards,
  };
}
