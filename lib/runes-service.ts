import { getUserPreference, setUserPreference } from './user-preferences-manager';

export interface RuneDefinition {
  id: string;
  symbol: string;
  name: string;
  phonetic: string;
  aett: 'freyr' | 'heimdall' | 'tyr';
  aettLabel: string;
  meaning: string;
  description: string;
  hint: string;
  letter: string; // Latin letter / phonemic equivalent e.g. "B", "R", "A"
  placements: { id: string; label: string; page: string }[];
}

export interface CipherLetter {
  char: string;
  runeId: string;
  symbol: string;
  letter: string;
  name: string;
}

export interface CipherWord {
  word: string;
  punctuation?: string;
  letters: CipherLetter[];
}

export const CIPHER_SENTENCE = "Brave mind, curiosity, and daily discipline forge true wisdom and eternal strength";

export const CIPHER_WORDS: CipherWord[] = [
  {
    word: "Brave",
    letters: [
      { char: "B", runeId: "berkano", symbol: "ᛒ", letter: "B", name: "Berkano" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "A", runeId: "ansuz", symbol: "ᚨ", letter: "A", name: "Ansuz" },
      { char: "V", runeId: "fehu", symbol: "ᚠ", letter: "V", name: "Fehu" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
    ],
  },
  {
    word: "mind",
    punctuation: ",",
    letters: [
      { char: "M", runeId: "mannaz", symbol: "ᛗ", letter: "M", name: "Mannaz" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
    ],
  },
  {
    word: "curiosity",
    punctuation: ",",
    letters: [
      { char: "C", runeId: "kenaz", symbol: "ᚲ", letter: "C", name: "Kenaz" },
      { char: "U", runeId: "uruz", symbol: "ᚢ", letter: "U", name: "Uruz" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "O", runeId: "othala", symbol: "ᛟ", letter: "O", name: "Othala" },
      { char: "S", runeId: "sowilo", symbol: "ᛊ", letter: "S", name: "Sowilo" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "T", runeId: "tiwaz", symbol: "ᛏ", letter: "T", name: "Tiwaz" },
      { char: "Y", runeId: "jera", symbol: "ᛃ", letter: "Y", name: "Jera" },
    ],
  },
  {
    word: "and",
    letters: [
      { char: "A", runeId: "ansuz", symbol: "ᚨ", letter: "A", name: "Ansuz" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
    ],
  },
  {
    word: "daily",
    letters: [
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
      { char: "A", runeId: "ansuz", symbol: "ᚨ", letter: "A", name: "Ansuz" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "L", runeId: "laguz", symbol: "ᛚ", letter: "L", name: "Laguz" },
      { char: "Y", runeId: "jera", symbol: "ᛃ", letter: "Y", name: "Jera" },
    ],
  },
  {
    word: "discipline",
    letters: [
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "S", runeId: "sowilo", symbol: "ᛊ", letter: "S", name: "Sowilo" },
      { char: "C", runeId: "kenaz", symbol: "ᚲ", letter: "C", name: "Kenaz" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "P", runeId: "perthro", symbol: "ᛈ", letter: "P", name: "Perthro" },
      { char: "L", runeId: "laguz", symbol: "ᛚ", letter: "L", name: "Laguz" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
    ],
  },
  {
    word: "forge",
    letters: [
      { char: "F", runeId: "fehu", symbol: "ᚠ", letter: "F", name: "Fehu" },
      { char: "O", runeId: "othala", symbol: "ᛟ", letter: "O", name: "Othala" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "G", runeId: "gebo", symbol: "ᚷ", letter: "G", name: "Gebo" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
    ],
  },
  {
    word: "true",
    letters: [
      { char: "T", runeId: "tiwaz", symbol: "ᛏ", letter: "T", name: "Tiwaz" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "U", runeId: "uruz", symbol: "ᚢ", letter: "U", name: "Uruz" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
    ],
  },
  {
    word: "wisdom",
    letters: [
      { char: "W", runeId: "wunjo", symbol: "ᚹ", letter: "W", name: "Wunjo" },
      { char: "I", runeId: "isa", symbol: "ᛁ", letter: "I", name: "Isa" },
      { char: "S", runeId: "sowilo", symbol: "ᛊ", letter: "S", name: "Sowilo" },
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
      { char: "O", runeId: "othala", symbol: "ᛟ", letter: "O", name: "Othala" },
      { char: "M", runeId: "mannaz", symbol: "ᛗ", letter: "M", name: "Mannaz" },
    ],
  },
  {
    word: "and",
    letters: [
      { char: "A", runeId: "ansuz", symbol: "ᚨ", letter: "A", name: "Ansuz" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "D", runeId: "dagaz", symbol: "ᛞ", letter: "D", name: "Dagaz" },
    ],
  },
  {
    word: "eternal",
    letters: [
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
      { char: "T", runeId: "tiwaz", symbol: "ᛏ", letter: "T", name: "Tiwaz" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "A", runeId: "ansuz", symbol: "ᚨ", letter: "A", name: "Ansuz" },
      { char: "L", runeId: "laguz", symbol: "ᛚ", letter: "L", name: "Laguz" },
    ],
  },
  {
    word: "strength",
    letters: [
      { char: "S", runeId: "sowilo", symbol: "ᛊ", letter: "S", name: "Sowilo" },
      { char: "T", runeId: "tiwaz", symbol: "ᛏ", letter: "T", name: "Tiwaz" },
      { char: "R", runeId: "raidho", symbol: "ᚱ", letter: "R", name: "Raidho" },
      { char: "E", runeId: "ehwaz", symbol: "ᛖ", letter: "E", name: "Ehwaz" },
      { char: "N", runeId: "nauthiz", symbol: "ᚾ", letter: "N", name: "Nauthiz" },
      { char: "G", runeId: "gebo", symbol: "ᚷ", letter: "G", name: "Gebo" },
      { char: "T", runeId: "tiwaz", symbol: "ᛏ", letter: "T", name: "Tiwaz" },
      { char: "H", runeId: "hagalaz", symbol: "ᚺ", letter: "H", name: "Hagalaz" },
    ],
  },
];

export const ALL_RUNES: RuneDefinition[] = [
  // ─── 1. FREYR'S ÆTT (Creation, Vitality, Social Order) ──────────────────────
  {
    id: 'fehu',
    symbol: 'ᚠ',
    name: 'Fehu',
    letter: 'F',
    phonetic: '[f]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Wealth, mobile abundance & trade',
    description: 'The primordial measure of mobile wealth, fertile cattle, and flowing trade. In Thrivehaven, it guides the Royal Exchange where merchants buy construction materials.',
    hint: 'Seek where merchants trade royal gold for raw construction materials.',
    placements: [
      { id: 'fehu_buy', label: 'Buy materials tab', page: '/market' },
    ],
  },
  {
    id: 'uruz',
    symbol: 'ᚢ',
    name: 'Uruz',
    letter: 'U',
    phonetic: '[u]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Physical endurance, raw strength & vital stamina',
    description: 'The untamed European wild aurochs, embodying physical grit, endurance, and fortitude against disease. In Thrivehaven, it steels your body for weekly challenges.',
    hint: 'Seek where rigorous weekly trials test physical endurance and stamina.',
    placements: [
      { id: 'uruz_challenges', label: 'Weekly challenges tab', page: '/quests' },
    ],
  },
  {
    id: 'thurisaz',
    symbol: 'ᚦ',
    name: 'Thurisaz',
    letter: 'TH',
    phonetic: '[th]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: "Thor's hammer, giant-slayer & primal force",
    description: 'The raw lightning bolt of Thor (Mjölnir) and the giant thorn that shatters monsters. In Thrivehaven, it channels the combined might of your alliance against the Titan Wyrm.',
    hint: 'Seek where fellowships assemble to strike down the colossal weekly raid boss.',
    placements: [
      { id: 'thurisaz_raid', label: 'Fellowship Titan Wyrm raid', page: '/social' },
    ],
  },
  {
    id: 'ansuz',
    symbol: 'ᚨ',
    name: 'Ansuz',
    letter: 'A',
    phonetic: '[a]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Wisdom, Odin, divine truth & sovereign counsel',
    description: 'The breath of Odin, ancestral wisdom, and the inspired spoken word. In Thrivehaven, it watches over citizen petitions and the heroic chronicles of the realm.',
    hint: 'Seek where wisdom is spoken in citizen petitions and tales of the realm.',
    placements: [
      { id: 'ansuz_petitions', label: 'Petitions tab', page: '/quests' },
      { id: 'ansuz_chronicle', label: 'Tales of the realm header', page: '/chronicle' },
    ],
  },
  {
    id: 'raidho',
    symbol: 'ᚱ',
    name: 'Raidho',
    letter: 'R',
    phonetic: '[r]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Journey, cosmic rhythm & habit momentum',
    description: 'The solar wagon and cyclical rhythm of travel. In Thrivehaven, it measures the disciplined, unbroken momentum of your daily habits and long-distance voyages.',
    hint: 'Seek where daily habits measure the unbroken rhythm of your journey.',
    placements: [
      { id: 'raidho_momentum', label: 'Daily momentum card', page: '/daily-hub' },
      { id: 'raidho_journey', label: 'Journey drawer tab', page: '/kingdom' },
    ],
  },
  {
    id: 'kenaz',
    symbol: 'ᚲ',
    name: 'Kenaz',
    letter: 'C',
    phonetic: '[k]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'The torch, revelation, craftsmanship & alchemy',
    description: 'The blazing torch of human ingenuity, artistic craft, and inner illumination. In Thrivehaven, it stokes the alchemical fires of the enhanced workshop.',
    hint: 'Seek where advanced alchemy and enhanced workshop craft are practiced.',
    placements: [
      { id: 'kenaz_alchemy', label: 'Enhanced alchemy tab', page: '/kingdom' },
    ],
  },
  {
    id: 'gebo',
    symbol: 'ᚷ',
    name: 'Gebo',
    letter: 'G',
    phonetic: '[g]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Gift, sacred alliance & mutual partnership',
    description: 'The sacred gift that binds giver and receiver in equal honor. In Thrivehaven, it represents the bonds between companions sharing daily accountability.',
    hint: 'Seek where allies share vows of fellowship and mutual support.',
    placements: [
      { id: 'gebo_allies', label: 'My allies tab', page: '/social' },
    ],
  },
  {
    id: 'wunjo',
    symbol: 'ᚹ',
    name: 'Wunjo',
    letter: 'W',
    phonetic: '[w]',
    aett: 'freyr',
    aettLabel: "Freyr's ætt (Creation & wealth)",
    meaning: 'Joy, harmony, fellowship & shared celebration',
    description: 'The culmination of hard work in joy, harmony, and lack of strife. In Thrivehaven, it welcomes new companions into your growing circle of friends.',
    hint: 'Seek where new companions are welcomed into your circle.',
    placements: [
      { id: 'wunjo_recruit', label: 'Recruit allies tab', page: '/social' },
    ],
  },

  // ─── 2. HEIMDALL'S ÆTT (Adversity, Resilience, Transformation) ─────────────
  {
    id: 'hagalaz',
    symbol: 'ᚺ',
    name: 'Hagalaz',
    letter: 'H',
    phonetic: '[h]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'Hail, wild elemental upheaval & atmospheric renewal',
    description: 'The hailstone: sudden cosmic disruption that dissolves into nourishing water. In Thrivehaven, it watches over the shifting sun, moon, and weather overhead.',
    hint: 'Seek where the shifting sun and moon govern atmospheric cycles.',
    placements: [
      { id: 'hagalaz_weather', label: 'Day-night atmospheric cycle', page: 'floating' },
    ],
  },
  {
    id: 'nauthiz',
    symbol: 'ᚾ',
    name: 'Nauthiz',
    letter: 'N',
    phonetic: '[n]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'Need, necessity, friction & habit evolution',
    description: 'The friction that kindles the fire of necessity. In Thrivehaven, it guides habit evolution: adapting routines when life shifts without forfeiting streaks.',
    hint: 'Seek where routine evolution guides life pivots without breaking streaks.',
    placements: [
      { id: 'nauthiz_evolve', label: 'Evolve routine guidance banner', page: '/quests' },
    ],
  },
  {
    id: 'isa',
    symbol: 'ᛁ',
    name: 'Isa',
    letter: 'I',
    phonetic: '[i]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'Ice, stillness, patience & streak protection',
    description: 'Solid crystal ice: a sacred pause that freezes time and protects against regression. In Thrivehaven, it powers the Streak Freeze Shield on rest days.',
    hint: 'Seek where icy shields freeze daily habit streaks to protect rest days.',
    placements: [
      { id: 'isa_freeze', label: 'Streak freeze shield badge', page: '/quests' },
    ],
  },
  {
    id: 'jera',
    symbol: 'ᛃ',
    name: 'Jera',
    letter: 'Y',
    phonetic: '[j]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'Fruitful harvest, seasons & rightful reward',
    description: 'The cyclical harvest when patient labor bears sweet fruit. In Thrivehaven, it gathers kingdom taxes and trades surplus goods at market.',
    hint: 'Seek where the royal treasury gathers the golden fruits of kingdom labor.',
    placements: [
      { id: 'jera_taxes', label: 'Collect taxes header button', page: '/kingdom' },
      { id: 'jera_sell', label: 'Sell resources tab', page: '/market' },
    ],
  },
  {
    id: 'eihwaz',
    symbol: 'ᛇ',
    name: 'Eihwaz',
    letter: 'EI',
    phonetic: '[ei]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'The yew tree, resilience, endurance & subterranean defense',
    description: 'The eternal yew tree linking the upper world to the deep underworld. In Thrivehaven, it shields heroes braving the dark depths of the Dungeon Keep.',
    hint: 'Seek where brave squads venture into deep subterranean chambers.',
    placements: [
      { id: 'eihwaz_dungeon', label: 'Dungeon Keep expedition header', page: '/dungeon' },
    ],
  },
  {
    id: 'perthro',
    symbol: 'ᛈ',
    name: 'Perthro',
    letter: 'P',
    phonetic: '[p]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'The lot-cup, mystery, fate & hidden chance',
    description: 'The cosmic casting vessel from which destiny is drawn. In Thrivehaven, it unlocks the Cards of Fate and mystery card packs in the Mystic Bazaar.',
    hint: 'Seek where the cards of fate reveal mystical card packs and hidden fortune.',
    placements: [
      { id: 'perthro_mystic', label: 'Mystic bazaar tab', page: '/market' },
    ],
  },
  {
    id: 'algiz',
    symbol: 'ᛉ',
    name: 'Algiz',
    letter: 'Z',
    phonetic: '[z]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'Divine protection, elk sanctuary & guardian companions',
    description: 'The guardian spirit (fylgja) whose antlers ward off harm. In Thrivehaven, it blesses your Guardian Pets (Ember Drake, Sage Owl, Spirit Sprite).',
    hint: 'Seek where companion guardian pets are nurtured with daily treats.',
    placements: [
      { id: 'algiz_guardian', label: 'Guardian pet companion card', page: '/kingdom' },
    ],
  },
  {
    id: 'sowilo',
    symbol: 'ᛊ',
    name: 'Sowilo',
    letter: 'S',
    phonetic: '[s]',
    aett: 'heimdall',
    aettLabel: "Heimdall's ætt (Adversity & transformation)",
    meaning: 'The sun, radiant victory, vitality & championship',
    description: 'The blazing sun of triumph, vital health, and glory. In Thrivehaven, it crowns the House Cup season champions and powers the 7 virtue hourglasses.',
    hint: 'Seek where the 7 virtue hourglasses compete for House Cup glory.',
    placements: [
      { id: 'sowilo_housecup', label: 'House cup championship tab', page: '/social' },
    ],
  },

  // ─── 3. TYR'S ÆTT (Honor, Humanity, Transcendence) ─────────────────────────
  {
    id: 'tiwaz',
    symbol: 'ᛏ',
    name: 'Tiwaz',
    letter: 'T',
    phonetic: '[t]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'Martial honor, justice, steadfast courage & self-discipline',
    description: 'The spear of Tyr, god of upright justice who gave his right hand for the safety of the world. In Thrivehaven, it steels the barracks and lifetime milestones.',
    hint: 'Seek where martial honor prepares the garrison and tests lifetime discipline.',
    placements: [
      { id: 'tiwaz_barracks', label: 'Barracks drawer tab', page: '/kingdom' },
      { id: 'tiwaz_milestones', label: 'Milestones tab', page: '/quests' },
    ],
  },
  {
    id: 'berkano',
    symbol: 'ᛒ',
    name: 'Berkano',
    letter: 'B',
    phonetic: '[b]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'The birch goddess, botanical vitality & gentle healing',
    description: 'The birch mother of quiet rebirth, organic growth, and herbal healing. In Thrivehaven, it presides over potion distillation inside the Grand Apotheca.',
    hint: 'Seek where botanical reagents are distilled into restorative potions.',
    placements: [
      { id: 'berkano_apotheca', label: 'Grand apotheca glasshouse', page: '/market' },
    ],
  },
  {
    id: 'ehwaz',
    symbol: 'ᛖ',
    name: 'Ehwaz',
    letter: 'E',
    phonetic: '[e]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'The noble horse, trusted mount & swift voyage',
    description: 'The sacred partnership between traveler and steed, enabling swift voyages. In Thrivehaven, it powers the ether engines of the Airship Harbor.',
    hint: 'Seek where airships dock before taking flight on ether voyages.',
    placements: [
      { id: 'ehwaz_airship', label: 'Airship harbor header', page: '/airship-harbor' },
    ],
  },
  {
    id: 'mannaz',
    symbol: 'ᛗ',
    name: 'Mannaz',
    letter: 'M',
    phonetic: '[m]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'Humanity, community & shared human potential',
    description: 'The shared intellect, social cooperation, and collective mind of humanity. In Thrivehaven, it supports the loyal citizens who staff your realm.',
    hint: 'Seek where the townsfolk and citizens of the realm are gathered.',
    placements: [
      { id: 'mannaz_citizens', label: 'Citizens drawer tab', page: '/kingdom' },
    ],
  },
  {
    id: 'laguz',
    symbol: 'ᛚ',
    name: 'Laguz',
    letter: 'L',
    phonetic: '[l]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'Living water, creative flow & intuitive depth',
    description: 'The deep, undulating currents of the ocean and the intuitive flow state of the mind. In Thrivehaven, it enriches the waterways and canals of the realm.',
    hint: 'Seek where taxes are gathered from settlements across the creative realm.',
    placements: [
      { id: 'laguz_realm', label: 'Collect realm taxes button', page: '/realm' },
    ],
  },
  {
    id: 'ingwaz',
    symbol: 'ᛜ',
    name: 'Ingwaz',
    letter: 'NG',
    phonetic: '[ng]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'The sacred seed, gestation & fruition of character',
    description: 'The golden seed resting in fertile darkness, quietly gathering strength until it blooms. In Thrivehaven, it guards the hero vault and character ascension.',
    hint: 'Seek where character level, titles, and equipment are enshrined.',
    placements: [
      { id: 'ingwaz_vault', label: 'Hero vault character card', page: '/character' },
    ],
  },
  {
    id: 'dagaz',
    symbol: 'ᛞ',
    name: 'Dagaz',
    letter: 'D',
    phonetic: '[d]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'Dawn, day & daily breakthrough',
    description: 'The radiant daylight that banishes shadow and reveals truth. In Thrivehaven, it heralds each morning with a clean, uncompleted slate of daily quests.',
    hint: 'Seek where each morning brings a fresh awakening of daily quests.',
    placements: [
      { id: 'dagaz_quests', label: 'Daily quests tab', page: '/quests' },
      { id: 'dagaz_momentum', label: 'Daily momentum legend', page: '/daily-hub' },
    ],
  },
  {
    id: 'othala',
    symbol: 'ᛟ',
    name: 'Othala',
    letter: 'O',
    phonetic: '[o]',
    aett: 'tyr',
    aettLabel: "Tyr's ætt (Honor & transcendence)",
    meaning: 'Domain, ancestral realm & permanent sanctuary',
    description: 'The ancestral estate, sacred boundaries, and sovereign home. In Thrivehaven, it anchors your personal sandbox building grid.',
    hint: 'Seek where the sovereign boundaries of your realm are shaped upon the grid.',
    placements: [
      { id: 'othala_realm', label: 'Realm grid drawer tab', page: '/kingdom' },
    ],
  },
];

const STORAGE_KEY = 'thrivehaven_collected_rune_placements';
export const RUNE_COLLECTED_EVENT = 'thrivehaven-rune-collected';

export function getCollectedPlacements(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPlacementCollected(placementId: string): boolean {
  if (typeof window === 'undefined') return false;
  return getCollectedPlacements().includes(placementId);
}

export function getCollectedRuneIds(): string[] {
  const placements = getCollectedPlacements();
  const unlocked = new Set<string>();

  for (const rune of ALL_RUNES) {
    if (rune.placements.some((p) => placements.includes(p.id))) {
      unlocked.add(rune.id);
    }
  }

  return Array.from(unlocked);
}

export function isRuneUnlocked(runeId: string): boolean {
  return getCollectedRuneIds().includes(runeId);
}

export function hasCollectedAnyRune(): boolean {
  return getCollectedPlacements().length > 0;
}

export async function collectRune(placementId: string, runeId: string): Promise<{
  success: boolean;
  isFirstRune: boolean;
  isRuneNewlyUnlocked: boolean;
  totalCollectedPlacements: number;
  unlockedRunesCount: number;
  totalRunes: number;
  rune: RuneDefinition | undefined;
}> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      isFirstRune: false,
      isRuneNewlyUnlocked: false,
      totalCollectedPlacements: 0,
      unlockedRunesCount: 0,
      totalRunes: ALL_RUNES.length,
      rune: ALL_RUNES.find((r) => r.id === runeId),
    };
  }

  const current = getCollectedPlacements();
  const wasEmpty = current.length === 0;
  const previouslyUnlockedRuneIds = getCollectedRuneIds();
  const isRuneNewlyUnlocked = !previouslyUnlockedRuneIds.includes(runeId);

  if (!current.includes(placementId)) {
    const updated = [...current, placementId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Cloud sync
    setUserPreference(STORAGE_KEY, updated).catch(() => {});

    // Dispatch event for instant multi-component reactivity
    window.dispatchEvent(
      new CustomEvent(RUNE_COLLECTED_EVENT, {
        detail: { placementId, runeId, isFirstRune: wasEmpty },
      })
    );

    const runeDef = ALL_RUNES.find((r) => r.id === runeId);
    const newUnlockedCount = getCollectedRuneIds().length;

    return {
      success: true,
      isFirstRune: wasEmpty,
      isRuneNewlyUnlocked,
      totalCollectedPlacements: updated.length,
      unlockedRunesCount: newUnlockedCount,
      totalRunes: ALL_RUNES.length,
      rune: runeDef,
    };
  }

  return {
    success: false,
    isFirstRune: false,
    isRuneNewlyUnlocked: false,
    totalCollectedPlacements: current.length,
    unlockedRunesCount: previouslyUnlockedRuneIds.length,
    totalRunes: ALL_RUNES.length,
    rune: ALL_RUNES.find((r) => r.id === runeId),
  };
}

/**
 * Initializes/syncs rune state from cloud preferences on load.
 */
export async function syncRunesFromCloud(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const cloudValue = await getUserPreference(STORAGE_KEY);
    if (Array.isArray(cloudValue)) {
      const local = getCollectedPlacements();
      const merged = Array.from(new Set([...local, ...cloudValue]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(RUNE_COLLECTED_EVENT, { detail: { synced: true } }));
    }
  } catch {}
}

export function getRequiredCipherRuneIds(): string[] {
  const ids = new Set<string>();
  CIPHER_WORDS.forEach((w) => {
    w.letters.forEach((l) => ids.add(l.runeId));
  });
  return Array.from(ids);
}

export function isCipherSolved(unlockedRuneIds: string[]): boolean {
  const required = getRequiredCipherRuneIds();
  return required.length > 0 && required.every((id) => unlockedRuneIds.includes(id));
}

export function getCipherProgress(unlockedRuneIds: string[]): {
  unlockedLettersCount: number;
  totalLettersCount: number;
  unlockedUniqueRunes: number;
  totalUniqueRunes: number;
  percent: number;
} {
  const required = getRequiredCipherRuneIds();
  const unlockedUnique = required.filter((id) => unlockedRuneIds.includes(id)).length;
  let totalLetters = 0;
  let unlockedLetters = 0;
  CIPHER_WORDS.forEach((w) => {
    w.letters.forEach((l) => {
      totalLetters++;
      if (unlockedRuneIds.includes(l.runeId)) {
        unlockedLetters++;
      }
    });
  });
  return {
    unlockedLettersCount: unlockedLetters,
    totalLettersCount: totalLetters,
    unlockedUniqueRunes: unlockedUnique,
    totalUniqueRunes: required.length,
    percent: totalLetters > 0 ? Math.round((unlockedLetters / totalLetters) * 100) : 0,
  };
}
