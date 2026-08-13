import { getUserPreference, setUserPreference } from './user-preferences-manager';

export type HappinessTier = 'revolting' | 'restless' | 'loyal' | 'serving';

export interface CitizenHappinessState {
  score: number; // 0 to 100
  lastUpdated: string;
}

export interface PetitionOutcome {
  storyText: string;
  goldChange: number;
  loyaltyChange: number;
  itemReward?: string;
  isFunnyTwist: boolean;
}

export interface PetitionOption {
  label: string;
  description: string;
  outcomes: PetitionOutcome[];
}

export interface Petition {
  id: string;
  title: string;
  requesterRole: string;
  requesterAvatar: string;
  description: string;
  optionA: PetitionOption;
  optionB: PetitionOption;
  completed?: boolean;
  chosenOutcome?: PetitionOutcome;
  chosenOptionLabel?: string;
}

export function getHappinessTier(score: number): { tier: HappinessTier; title: string; color: string; taxMultiplier: number; description: string } {
  if (score >= 85) {
    return {
      tier: 'serving',
      title: 'Serving High Crown',
      color: 'text-amber-400 border-amber-400 bg-amber-950/40',
      taxMultiplier: 1.30,
      description: 'Citizens are overjoyed! Property tax & harvest yield boosted by +30%!'
    };
  }
  if (score >= 50) {
    return {
      tier: 'loyal',
      title: 'Loyal Subjects',
      color: 'text-emerald-400 border-emerald-400 bg-emerald-950/40',
      taxMultiplier: 1.15,
      description: 'Kingdom is thriving peacefully. Harvest yields boosted by +15%.'
    };
  }
  if (score >= 25) {
    return {
      tier: 'restless',
      title: 'Restless Populace',
      color: 'text-orange-400 border-orange-400 bg-orange-950/40',
      taxMultiplier: 1.0,
      description: 'Citizens are dissatisfied. Standard property harvest yield.'
    };
  }
  return {
    tier: 'revolting',
    title: 'Revolting Peasants',
    color: 'text-red-500 border-red-500 bg-red-950/40',
    taxMultiplier: 0.50,
    description: '⚠️ Peasants are rioting! Property harvests and tax reduced by -50%!'
  };
}

export function getCitizenHappiness(): CitizenHappinessState {
  try {
    const local = localStorage.getItem('pref:citizen-happiness-state');
    if (local) return JSON.parse(local);
  } catch {}
  return { score: 75, lastUpdated: new Date().toISOString() };
}

export function updateCitizenHappiness(delta: number): CitizenHappinessState {
  const current = getCitizenHappiness();
  const newScore = Math.max(0, Math.min(100, current.score + delta));
  const updated = {
    score: newScore,
    lastUpdated: new Date().toISOString()
  };
  try { localStorage.setItem('pref:citizen-happiness-state', JSON.stringify(updated)); } catch {}
  setUserPreference('citizen-happiness-state', updated);
  return updated;
}

// Full 100 Medieval Story Petitions Library
export const MASTER_PETITIONS_POOL: Petition[] = [
  // 1-10: Farmers, Noblemen & Food Guilds
  {
    id: 'pet-1',
    title: "Farmer's Guild vs Noble Banquet Dispute",
    requesterRole: 'Chief Shepherd Old Oak',
    requesterAvatar: '🌾',
    description: "The farmers petition for grain fodder gold, while Lord Sterling requests royal treasury coins to throw an opulent ballroom gala.",
    optionA: {
      label: "Grant Gold to Farmers",
      description: "Provide royal treasury coins for farm fodder and grain supplies.",
      outcomes: [
        {
          storyText: "🤪 Wild Farm Rave! The farmers spent all the fodder gold on dark mead, threw a 3-day barn festival, and forgot to harvest crops. You lost gold and productivity dropped!",
          goldChange: -100,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "🌟 Bountiful Harvest! The farmers bought prize oxen, doubling crop yield and sending fresh organic wheat straight to the castle kitchen!",
          goldChange: 250,
          loyaltyChange: 10,
          itemReward: 'material-wood',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Fund the Noblemen's Banquet",
      description: "Sponsor Lord Sterling's grand ballroom feast.",
      outcomes: [
        {
          storyText: "🤮 Castle Staircase Catastrophe! The drunk noblemen vomited on the castle marble stairs. Janitorial cleaning costs cost the treasury 50 Gold!",
          goldChange: -50,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "🤝 Unexpected Alliance! Lord Sterling invited the local farmers to the banquet. Peasants and nobles danced together, boosting realm morale!",
          goldChange: 150,
          loyaltyChange: 15,
          itemReward: 'material-plank',
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-2',
    title: "Baker's Yeast Explosion Feud",
    requesterRole: 'Master Baker Crusty Pierre',
    requesterAvatar: '🥖',
    description: "Master Pierre imported experimental dwarf yeast, causing the town bakery dough to rise into a giant mountain that threatens the city gate.",
    optionA: {
      label: "Send Guards to Slice the Giant Bread",
      description: "Order the city watch to hack through the dough with broadswords.",
      outcomes: [
        {
          storyText: "🍞 Fresh Bread for Everyone! The guards sliced 500 loaves of warm sourdough. Citizens held a town sandwich feast and cheered your name!",
          goldChange: 180,
          loyaltyChange: 12,
          isFunnyTwist: false
        },
        {
          storyText: "💥 Sticky Dough Trap! The dough swallowed 4 guards' boots and stuck broadswords to the gate. Weapon replacement bill: 80 Gold!",
          goldChange: -80,
          loyaltyChange: -4,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Let the Dough Bake in the Afternoon Sun",
      description: "Wait for the summer heat to bake the mountain into a giant crusty monument.",
      outcomes: [
        {
          storyText: "🕊️ Pigeon Armada Invasion! Thousands of wild pigeons descended on the giant loaf, leaving bird droppings over the main square. Cleaning bill: 60 Gold!",
          goldChange: -60,
          loyaltyChange: -8,
          isFunnyTwist: true
        },
        {
          storyText: "🏰 Bread Fortress Monument! The baked loaf turned into a sturdy defensive roadblock that defended against rogue bandits!",
          goldChange: 120,
          loyaltyChange: 8,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-3',
    title: "Blacksmith's Anvil Strike",
    requesterRole: 'Master Smith Ironbeard',
    requesterAvatar: '🔨',
    description: "The blacksmiths are striking because the guard captain uses broadswords to open beer kegs.",
    optionA: {
      label: "Buy Steel Bottle Openers for Guards",
      description: "Equip the city watch with proper tavern tools.",
      outcomes: [
        {
          storyText: "🍺 Tavern Harmony! The guards stopped breaking blades, and smiths forged high-tier steel shields for the realm armory!",
          goldChange: 200,
          loyaltyChange: 10,
          itemReward: 'material-steel',
          isFunnyTwist: false
        },
        {
          storyText: "🥴 Drunken Patrol! The guards loved their new openers so much they opened kegs on duty and fell asleep in horse troughs.",
          goldChange: -40,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Force Smiths to Forge Wooden Swords",
      description: "Replace broken steel blades with wooden practice bludgeons.",
      outcomes: [
        {
          storyText: "🪵 Splinter Panic! The guards fought bandits with wooden sticks and got splinters. Bandits stole 100 Gold from the tollbooth!",
          goldChange: -100,
          loyaltyChange: -10,
          isFunnyTwist: true
        },
        {
          storyText: "🥋 Martial Art Mastery! Guards mastered wood combat, entertaining citizens with acrobatic quarterstaff demonstrations!",
          goldChange: 100,
          loyaltyChange: 8,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-4',
    title: "Alchemist's Hiccup Tonic Incident",
    requesterRole: 'Grand Alchemist Fizzy Zenith',
    requesterAvatar: '🧪',
    description: "Zenith accidentally spilled hiccup tonic into the town drinking well, causing the entire council to hiccup in rhythm.",
    optionA: {
      label: "Import Fresh Mountain Spring Water",
      description: "Pay cart drivers to haul pure mountain water to purge the well.",
      outcomes: [
        {
          storyText: "💧 Pure Hydration! The hiccups stopped, and mountain minerals boosted citizen energy levels by 20%!",
          goldChange: 140,
          loyaltyChange: 9,
          isFunnyTwist: false
        },
        {
          storyText: "🚚 Cart Crash! The water barrel wagon tipped on steep hills, soaking the leather market. Water bill: 70 Gold!",
          goldChange: -70,
          loyaltyChange: -3,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Scare the Citizens to Cure Hiccups",
      description: "Order royal guards to hide behind doors and jump out yelling 'BOO!'",
      outcomes: [
        {
          storyText: "👻 Mass Shock Cure! The jump scares cured everyone's hiccups instantly, and citizens laughed at the royal prank!",
          goldChange: 90,
          loyaltyChange: 12,
          isFunnyTwist: false
        },
        {
          storyText: "🥧 Flying Pie Reflex! A scared baker threw a hot rhubarb pie directly into the guard captain's face. Uniform repair bill: 45 Gold!",
          goldChange: -45,
          loyaltyChange: -4,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-5',
    title: "Town Bard's Lute Noise Complaint",
    requesterRole: 'Minstrel Melody',
    requesterAvatar: '🪕',
    description: "Melody sings off-key romantic ballads at 2:00 AM under castle windows, keeping guards awake.",
    optionA: {
      label: "Send Melody to Opera School in the Capital",
      description: "Pay for vocal training so Melody learns pitch control.",
      outcomes: [
        {
          storyText: "🎶 Royal Vocal Maestro! Melody returned with an angelic voice, performing grand castle concerts that drew wealthy tourists!",
          goldChange: 300,
          loyaltyChange: 15,
          isFunnyTwist: false
        },
        {
          storyText: "📢 Glass Shattering High Notes! Melody sang soprano so loudly that 12 stained glass windows shattered. Repair cost: 90 Gold!",
          goldChange: -90,
          loyaltyChange: -6,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Ban Night Lutes in the Castle District",
      description: "Enforce strict 10 PM quiet hours across the realm.",
      outcomes: [
        {
          storyText: "💤 Restful Guards! Guards slept 8 full hours and caught 3 midnight potato thieves near the granary!",
          goldChange: 110,
          loyaltyChange: 7,
          isFunnyTwist: false
        },
        {
          storyText: "🪗 Accordion Protest! Protesting minstrels switched to loud accordions and kazoo duets at sunrise!",
          goldChange: -30,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-6',
    title: "Jester's Throne Room Prank",
    requesterRole: 'Jester Barnaby',
    requesterAvatar: '🃏',
    description: "Barnaby replaced the King's velvet throne cushion with a whoopee cushion during the envoy reception.",
    optionA: {
      label: "Appoint Barnaby as Royal Humor Minister",
      description: "Embrace the joke and award Barnaby an official humor badge.",
      outcomes: [
        {
          storyText: "👑 Royal Laughter! Foreign envoys thought it was a playful icebreaker and signed a lucrative trade deal!",
          goldChange: 220,
          loyaltyChange: 14,
          isFunnyTwist: false
        },
        {
          storyText: "🤡 Jester Prank Spree! Emboldened Barnaby put itching powder in noble wigs. Wig cleaning fee: 65 Gold!",
          goldChange: -65,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Sentence Barnaby to Pillory Custard Duty",
      description: "Put Barnaby in the town square pillory for citizens to pelt with custard pies.",
      outcomes: [
        {
          storyText: "🥧 Custard Bakery Boom! The bakery sold 400 custard pies for the event, generating massive tax revenue!",
          goldChange: 160,
          loyaltyChange: 10,
          isFunnyTwist: false
        },
        {
          storyText: "🐝 Wasp Swarm Attraction! The custard attracted a yellow-jacket wasp swarm that chased the mayor into a pond!",
          goldChange: -50,
          loyaltyChange: -8,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-7',
    title: "Merchant's Cursed Spice Shipment",
    requesterRole: 'Trader Valerius',
    requesterAvatar: '🌶️',
    description: "Valerius imported 'Dragon-Breath Chilies' that cause townspeople to sneeze fire sparks.",
    optionA: {
      label: "Sell Fire Chilies to the Alchemy Guild",
      description: "Sell the spicy chilies as volatile potion reagents.",
      outcomes: [
        {
          storyText: "🔥 Potent Potion Brew! Alchemists created fire-resistance elixirs and paid top gold for the spice lot!",
          goldChange: 280,
          loyaltyChange: 8,
          itemReward: 'material-crystal',
          isFunnyTwist: false
        },
        {
          storyText: "🌋 Lab Singed Curtains! An alchemist sneezed during brewing and scorched the laboratory curtains. Replacement bill: 85 Gold!",
          goldChange: -85,
          loyaltyChange: -4,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Dump Spice Shipment in Mountain Ravine",
      description: "Dispose of the chili crates far outside city walls.",
      outcomes: [
        {
          storyText: "🐉 Happy Fire Drake! A passing Ember Drake ate the chilies, became docile, and gifted a chest of glowing gems!",
          goldChange: 210,
          loyaltyChange: 11,
          isFunnyTwist: false
        },
        {
          storyText: "🌶️ Spicy Mountain Stream! Mountain goats drank chili runoff and stampeded through the berry patch!",
          goldChange: -40,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-8',
    title: "Shepherd's Glowing Wool Phenomenon",
    requesterRole: 'Shepherd Silas',
    requesterAvatar: '🐑',
    description: "Silas's sheep ate glowing cave fungi and now shine in the dark like floating lanterns.",
    optionA: {
      label: "Shear Sheep for Night-Vision Sweaters",
      description: "Spin the luminescent wool into glowing winter coats.",
      outcomes: [
        {
          storyText: "✨ Fashion Miracle! Glowing sweaters became the realm's hottest luxury item, netting massive export gold!",
          goldChange: 320,
          loyaltyChange: 16,
          isFunnyTwist: false
        },
        {
          storyText: "💡 Sleepless Village! Citizens wearing glowing pajamas couldn't sleep because their shirts illuminated bedroom ceilings. Productivity dropped!",
          goldChange: -75,
          loyaltyChange: -6,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Use Glowing Sheep as Road Markers",
      description: "Station sheep along dark mountain paths to guide night travelers.",
      outcomes: [
        {
          storyText: "🛣️ Zero Carriage Crashes! Night traders navigated safely and tipped the shepherds handsomely!",
          goldChange: 170,
          loyaltyChange: 12,
          isFunnyTwist: false
        },
        {
          storyText: "🐺 Confused Wolves! Wolves thought the sheep were magical spirits, got scared, and howled all night long!",
          goldChange: -30,
          loyaltyChange: -3,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-9',
    title: "Stonemason's Leaky Gargoyle Dispute",
    requesterRole: 'Mason Mason',
    requesterAvatar: '🗿',
    description: "Gargoyles sculpted atop the castle gargoyles spit rainwater directly onto the High Bishop's hat.",
    optionA: {
      label: "Rotate Gargoyle Mouths Away from Path",
      description: "Pay stonemasons to adjust gargoyle spouts toward roof gutters.",
      outcomes: [
        {
          storyText: "🏛️ Architectural Triumph! Rain drainage improved, and the bishop blessed the castle treasury!",
          goldChange: 130,
          loyaltyChange: 9,
          isFunnyTwist: false
        },
        {
          storyText: "💥 Scaffolding Collapse! Mason dropped a mallet onto the conservatory glass roof. Repair cost: 95 Gold!",
          goldChange: -95,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Give the High Bishop an Umbrella Hat",
      description: "Present the bishop with a stylish oilskin umbrella helmet.",
      outcomes: [
        {
          storyText: "☔ Trendsetter Bishop! The bishop loved the hat, and all nobles ordered matching umbrella headwear!",
          goldChange: 190,
          loyaltyChange: 11,
          isFunnyTwist: false
        },
        {
          storyText: "💨 Wind Gust Takeoff! A strong gust caught the umbrella hat and blew the bishop into the lily pad pond!",
          goldChange: -60,
          loyaltyChange: -7,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-10',
    title: "Scholar's Bookworm Outbreak",
    requesterRole: 'Arch-Librarian Ezra',
    requesterAvatar: '📚',
    description: "Rare magical bookworms are eating ancient spellbooks and turning pages into confetti.",
    optionA: {
      label: "Adopt Library Owls to Eat the Worms",
      description: "Station 5 barn owls inside the arch-library archives.",
      outcomes: [
        {
          storyText: "🦉 Archive Guardians! Owls cleared the worms completely and kept mice away from parchment scrolls!",
          goldChange: 150,
          loyaltyChange: 10,
          isFunnyTwist: false
        },
        {
          storyText: "🪶 Feather Blizzard! Owls shed feathers everywhere, clogging the chimney and filling reading rooms with soot. Clean-up bill: 55 Gold!",
          goldChange: -55,
          loyaltyChange: -4,
          isFunnyTwist: true
        }
      ]
    },
    optionB: {
      label: "Enchant Books with Lavender Oil",
      description: "Coat leather covers with aromatic natural bug repellent.",
      outcomes: [
        {
          storyText: "🌿 Spa Reading Room! The library smelled divine, attracting scholars who donated rare research funds!",
          goldChange: 240,
          loyaltyChange: 13,
          isFunnyTwist: false
        },
        {
          storyText: "🐝 Bee Swarm Lecture! Lavender scent attracted honeybees that interrupted the history lecture!",
          goldChange: -45,
          loyaltyChange: -5,
          isFunnyTwist: true
        }
      ]
    }
  }
];

// Helper to generate procedural variety up to 100 total story petitions
function generateProceduralPool(): Petition[] {
  const list = [...MASTER_PETITIONS_POOL];

  const roles = [
    { role: 'Fishmonger Fin', avatar: '🐟', title: 'Giant Squid Sighting' },
    { role: 'Falconer Hawks', avatar: '🦅', title: 'Escaped Royal Falcon' },
    { role: 'Vintner Barrel', avatar: '🍷', title: 'Sour Wine Keg Panic' },
    { role: 'Cartographer Atlas', avatar: '🗺️', title: 'Uncharted Coast Map' },
    { role: 'Apothecary Willow', avatar: '🌿', title: 'Garlic Garland Craze' },
    { role: 'Shipwright Anchor', avatar: '⚓', title: 'Leaky Sloop Repair' },
    { role: 'Stablehand Barnaby', avatar: '🐴', title: 'Runaway Royal Stallion' },
    { role: 'Herald Trumpet', avatar: '🎺', title: 'Sore Throat Fanfare' },
    { role: 'Tanner Hide', avatar: '👞', title: 'Smelly Leather Workshop' },
    { role: 'Fletcher Arrow', avatar: '🏹', title: 'Feather Arrow Shortage' }
  ];

  for (let i = 11; i <= 100; i++) {
    const template = roles[(i - 11) % roles.length] || roles[0]!;
    list.push({
      id: `pet-${i}`,
      title: `${template.title} #${i}`,
      requesterRole: template.role,
      requesterAvatar: template.avatar,
      description: `The townspeople are debating how to resolve the ${template.title.toLowerCase()} in district #${i}. Royal decree requested!`,
      optionA: {
        label: `Invest Realm Gold in ${template.role.split(' ')[0]}'s Solution`,
        description: `Allocate treasury coins to fund local ${template.role.split(' ')[0]} equipment.`,
        outcomes: [
          {
            storyText: `🎉 Glorious Success! The ${template.role.split(' ')[0]} resolved the issue, boosting trade and local morale!`,
            goldChange: 150 + (i % 50),
            loyaltyChange: 10,
            isFunnyTwist: false
          },
          {
            storyText: `🤪 Hilarious Blunder! The solution backfired into a messy town spectacle. Cleaning & repair cost 60 Gold!`,
            goldChange: -60,
            loyaltyChange: -4,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: `Enact Strict Realm Decree #${i}`,
        description: `Pass a royal regulation ordering citizens to adapt without extra funding.`,
        outcomes: [
          {
            storyText: `📜 Efficient Governance! Citizens followed decree instructions cleanly, saving treasury funds!`,
            goldChange: 120,
            loyaltyChange: 6,
            isFunnyTwist: false
          },
          {
            storyText: `📢 Protesting Crowd! Citizens grumbled over the strict decree and held a noisy tambourine rally!`,
            goldChange: -40,
            loyaltyChange: -5,
            isFunnyTwist: true
          }
        ]
      }
    });
  }

  return list;
}

const ALL_100_PETITIONS = generateProceduralPool();

export function getActivePetitions(): Petition[] {
  try {
    const local = localStorage.getItem('pref:active-petitions-list');
    if (local) {
      const parsed = JSON.parse(local);
      // Validate that parsed items have the new outcomes array and total 4 items
      if (
        Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every(p => p && p.optionA && Array.isArray(p.optionA.outcomes))
      ) {
        return parsed;
      }
    }
  } catch {}

  // If old invalid cache or not 4 items, pick 4 random distinct petitions from 100 pool
  return refreshAllPetitions();
}

export function resolvePetition(petitionId: string, choice: 'A' | 'B'): { happiness: CitizenHappinessState; goldChange: number; outcome: PetitionOutcome; chosenOptionLabel: string } {
  const petitions = getActivePetitions();
  const target = petitions.find(p => p.id === petitionId);
  
  const fallbackOutcome: PetitionOutcome = {
    storyText: "Decree enacted peacefully.",
    goldChange: 0,
    loyaltyChange: 0,
    isFunnyTwist: false
  };

  if (!target) {
    return { happiness: getCitizenHappiness(), goldChange: 0, outcome: fallbackOutcome, chosenOptionLabel: "Decree" };
  }

  const option = choice === 'A' ? target.optionA : target.optionB;
  const outcomes = option?.outcomes || [fallbackOutcome];
  // 50/50 randomized outcome roll
  const rolledOutcome = outcomes[Math.floor(Math.random() * outcomes.length)] || outcomes[0] || fallbackOutcome;

  const newHappiness = updateCitizenHappiness(rolledOutcome.loyaltyChange || 0);

  const updatedPetitions = petitions.map(p => {
    if (p.id === petitionId) {
      return {
        ...p,
        completed: true,
        chosenOutcome: rolledOutcome,
        chosenOptionLabel: option?.label || "Decree"
      };
    }
    return p;
  });

  setUserPreference('active-petitions-list', updatedPetitions);

  return {
    happiness: newHappiness,
    goldChange: rolledOutcome.goldChange || 0,
    outcome: rolledOutcome,
    chosenOptionLabel: option?.label || "Decree"
  };
}

export function refreshAllPetitions(): Petition[] {
  const shuffled = [...ALL_100_PETITIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);
  setUserPreference('active-petitions-list', selected);
  return selected;
}
