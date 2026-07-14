export interface SeasonalEvent {
  month: number; // 0 = Jan, 11 = Dec
  id: string;
  name: string;
  theme: string;
  activeTileIds: string[];
  goldMultiplier: number;
  xpMultiplier: number;
}

export const MONTHLY_EVENTS: SeasonalEvent[] = [
  {
    month: 0, // Jan
    id: "new_years_day",
    name: "New Year's Celebration",
    theme: "Ring in the New Year with festive fireworks and winter feasts. May your year be filled with prosperity!",
    activeTileIds: ["fireworks-stand", "snowy-inn", "winter-fountain", "tavern"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 1, // Feb
    id: "festival_of_hearts",
    name: "Festival of Hearts",
    theme: "Love and friendship fill the air. Rest at the fairy ring and exchange gifts at the Mayor's Manor.",
    activeTileIds: ["fairy-ring", "mansion", "well", "fountain"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 2, // Mar
    id: "spring_vernal",
    name: "Spring Vernal Festival",
    theme: "The winter thaw reveals fresh paths and rich soils. Plant seeds in the canopy gardens.",
    activeTileIds: ["whispering-canopy", "well", "windmill"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 3, // Apr
    id: "easter",
    name: "Easter Egg Hunt",
    theme: "Find hidden Easter Eggs scattered around the realm! Spring meadows and mills hum with life.",
    activeTileIds: ["windmill", "fountain", "fisherman", "bakery"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 4, // May
    id: "shield_joust",
    name: "Shield-Maiden's Joust",
    theme: "Citadel forces train for tournament games. Sparring partners duel under banners of honor.",
    activeTileIds: ["barracks", "archery", "watchtower"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 5, // Jun
    id: "solstice_fair",
    name: "Solstice Fair",
    theme: "Midsummer feasts, warm sea breezes, and busy local trading stalls along the merchant routes.",
    activeTileIds: ["fisherman", "grocery", "foodcourt"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 6, // Jul
    id: "firefly_revelry",
    name: "Firefly Revelry",
    theme: "Midnight lantern walks under starry skies. Meditate and gain wisdom under the pantheon of gods.",
    activeTileIds: ["zen-garden", "golden-pantheon", "fountain"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 7, // Aug
    id: "forge_fire",
    name: "Forge Fire Festival",
    theme: "Heavy blacksmith anvil beats and steel tempering. Production spikes under August heat waves.",
    activeTileIds: ["blacksmith", "sawmill"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 8, // Sep
    id: "harvest_festival",
    name: "Harvest Festival",
    theme: "Scythes cut the golden crops and fill the barns. Local breweries prepare autumn pumpkin cider.",
    activeTileIds: ["harvest-barn", "pumpkin-patch", "bakery", "brewery", "windmill"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 9, // Oct
    id: "halloween",
    name: "Halloween Pumpkin Hunt",
    theme: "Spooky lanterns glow in the shadows. Search for hidden pumpkins and brave the dark dungeons!",
    activeTileIds: ["dungeon", "portal-entrance", "portal-exit"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 10, // Nov
    id: "remembrance_feast",
    name: "Feast of Remembrance",
    theme: "Study old heritage scrolls in the library and pay respects to ancestors at the Golden Pantheon.",
    activeTileIds: ["library", "golden-pantheon"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  },
  {
    month: 11, // Dec
    id: "christmas",
    name: "Christmas Present Hunt",
    theme: "Find festive holiday presents hidden around the kingdom! Holiday cheer fills the taverns.",
    activeTileIds: ["tavern", "blacksmith", "grocery", "winter-fountain", "snowy-inn", "ice-sculpture", "fireworks-stand"],
    goldMultiplier: 1.2,
    xpMultiplier: 1.1
  }
];

export function getActiveEvent(
  winterManual?: boolean,
  harvestManual?: boolean
): SeasonalEvent {
  // Manual overrides for testing/admin purposes
  if (winterManual) {
    return MONTHLY_EVENTS[11]!; // Dec (Christmas Present Hunt)
  }
  if (harvestManual) {
    return MONTHLY_EVENTS[8]!; // Sep (Harvest Festival)
  }

  // Automatic calendar month (0 = Jan, 11 = Dec)
  const currentMonth = new Date().getMonth();
  return MONTHLY_EVENTS[currentMonth] || MONTHLY_EVENTS[0]!;
}
