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
  raidBossDamage?: number;
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
  requesterImage?: string;
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

// Master Handcrafted Story Petitions featuring Thrivehaven Lore & Creatures
export const STORY_PETITIONS_TEMPLATES: Petition[] = [
  {
    id: 'pet-1',
    title: "Ember Drake's hiccup calamity",
    requesterRole: 'Ember Drake',
    requesterAvatar: '🐉',
    requesterImage: '/images/creatures/EmberDrake.webp',
    description: "Town weavers and alchemists are in court! An Ember Drake got hiccups after eating wild chili peppers and is accidentally flame-roasting the laundry drying across the castle courtyard.",
    optionA: {
      label: "Feed Ember Drake frost ice cream",
      description: "Buy a tub of magical mint ice cream to soothe the dragon's throat.",
      outcomes: [
        {
          storyText: "Brain freeze burp! The Ember Drake loved the ice cream so much it got brain freeze, tumbled into a hay cart, and burped a giant rainbow sparkler that singed a royal tapestry! Clean-up bill: 50 Gold.",
          goldChange: -50,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Steam ironing miracle! The ice cream cured the hiccups instantly! The happy Ember Drake blew warm gentle steam that dried 200 wet shirts in seconds, earning tips from grateful weavers!",
          goldChange: 220,
          loyaltyChange: 12,
          itemReward: 'material-wood',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Douse the Drake with cool water",
      description: "Order guards to splash clean well water on the dragon.",
      outcomes: [
        {
          storyText: "Sauna surprise! The wet Ember Drake sneezed a giant cloud of warm sulfur steam, turning the courtroom into a steamy bathhouse! The town council had to fan themselves with parchment.",
          goldChange: -40,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "Aromatic mist! The warm steam drifted into the apothecary garden, reviving rare orchids that herbalists bought for top gold!",
          goldChange: 180,
          loyaltyChange: 10,
          itemReward: 'material-plank',
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-2',
    title: "Sage Owl's stolen diary",
    requesterRole: 'Sage Owl',
    requesterAvatar: '🦉',
    requesterImage: '/images/creatures/SageOwl.webp',
    description: "Town scholars and guards are arguing in your courtroom! A wild Sage Owl swooped into the library archives, snatched the King's secret diary, and roosted high atop the castle flagpole.",
    optionA: {
      label: "Offer Sage Owl golden seeds",
      description: "Send a quiet handler to entice the wise bird down with roasted pumpkin seeds.",
      outcomes: [
        {
          storyText: "Moat splash! The Sage Owl traded the diary for seeds, but accidentally dropped the book into the moat where a giant carp nibbled the cover! Restoration bill: 45 Gold.",
          goldChange: -45,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Ancient blueprint bonus! The Sage Owl returned the diary along with an ancient blueprint scroll it found tucked beneath the tower rafters!",
          goldChange: 260,
          loyaltyChange: 14,
          itemReward: 'material-crystal',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Climb the flagpole with a net",
      description: "Send an agile scout to retrieve the diary quietly.",
      outcomes: [
        {
          storyText: "Flagpole snag! The scout's trousers caught on the banner finial, leaving him dangling upside down while the Sage Owl hooted softly at the crowd!",
          goldChange: -35,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "Graceful retrieval! The scout retrieved the diary safely and found a clutch of shiny copper badges in the owl's nest!",
          goldChange: 150,
          loyaltyChange: 9,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-3',
    title: "Spirit Sprite's neon dye prank",
    requesterRole: 'Spirit Sprite',
    requesterAvatar: '🧚',
    requesterImage: '/images/creatures/SpiritSprite.webp',
    description: "Town tanners and shepherds brought a bright blue duck to court! A mischievous Spirit Sprite dumped glowing dye into the river, turning the sheep, ducks, and town bridges neon blue.",
    optionA: {
      label: "Embrace neon blue wool fashion",
      description: "Declare bright neon blue as the realm's new official festival color.",
      outcomes: [
        {
          storyText: "Pink milk surprise! The Spirit Sprite thought you loved the color joke and turned the town milk supply rosy pink the next morning! Refreshment fees: 60 Gold.",
          goldChange: -60,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "Trade trend boom! Neon blue wool became a luxury fashion craze across neighboring ports, bringing great wealth to local spinners!",
          goldChange: 310,
          loyaltyChange: 16,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Set arcane spirit traps",
      description: "Ask alchemists to lay glowing net traps along the riverbank.",
      outcomes: [
        {
          storyText: "Net tangle! The trap caught a wandering merchant's boots instead, tipping a cart of cabbages into the cobblestone ditch!",
          goldChange: -50,
          loyaltyChange: -8,
          isFunnyTwist: true
        },
        {
          storyText: "Evening streetlights! The Spirit Sprite made peace and offered to illuminate the dark alleyways with friendly fairy fire every evening!",
          goldChange: 190,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-4',
    title: "Titan Wyrm's midnight toothache",
    requesterRole: 'Titan Wyrm',
    requesterAvatar: '🐲',
    requesterImage: '/images/titans/astral_wyrm.webp',
    description: "Blacksmiths and gate sentries report that a juvenile Titan Wyrm curled outside the city gates with a giant toothache, groaning so deeply that castle chandeliers are rattling!",
    optionA: {
      label: "Extract tooth with forge tongs",
      description: "Dispatch royal smiths with giant iron pliers to pull the aching fang.",
      outcomes: [
        {
          storyText: "Tail wag tumble! The tooth popped out cleanly, but the relieved Wyrm wagged its tail like a happy puppy, knocking over the stone toll sign! Repair bill: 75 Gold.",
          goldChange: -75,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Wyrm gift reward! Grateful for the relief, the Titan Wyrm coughed up a chest of sunken pirate silver and pledged to watch over the gates!",
          goldChange: 380,
          loyaltyChange: 20,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Feed Wyrm soft sweet buns",
      description: "Send town bakers with crates of honey-glazed buns to soothe the gum.",
      outcomes: [
        {
          storyText: "Sticky snout! The sweet buns stuck the Wyrm's jaws shut temporarily. It sneezed in surprise, scattering flour over the guardhouse!",
          goldChange: -65,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "Peaceful slumber! The tooth worked loose painlessly in the soft dough, and the gentle beast curled up to sleep soundly outside the walls.",
          goldChange: 210,
          loyaltyChange: 11,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-5',
    title: "Greeny minotaur's labyrinth cafe",
    requesterRole: 'Greeny minotaur',
    requesterAvatar: '🐮',
    requesterImage: '/images/Mythics/Mythic1green.webp',
    description: "A friendly Greeny minotaur opened an outdoor maze coffee terrace near the city wall, but patrons keep wandering in circles for hours! Three concerned citizens are petitioning your court.",
    optionA: {
      label: "Hire scout citizens as guides",
      description: "Pay experienced scouts to escort beverage drinkers safely through the hedges.",
      outcomes: [
        {
          storyText: "Yarn rescue party! The scouts got turned around too! A search party had to be led out with a giant spool of colorful yarn! Cost: 55 Gold.",
          goldChange: -55,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Terrace tourism boom! The scouts turned the cafe into a beloved guided garden adventure, drawing visitors from across the realm!",
          goldChange: 290,
          loyaltyChange: 15,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Trim hedges into straight paths",
      description: "Help the Minotaur prune clear walking corridors.",
      outcomes: [
        {
          storyText: "Royal topiary! The Minotaur sculpted the hedges into funny topiary portraits of your Majesty, delighting town visitors with laughter!",
          goldChange: 170,
          loyaltyChange: 14,
          isFunnyTwist: false
        },
        {
          storyText: "Water pipe snip! An accidental hedge clipper clipped a fountain conduit, turning the seating area into a shallow duck pond!",
          goldChange: -70,
          loyaltyChange: -7,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-6',
    title: "Reddy cyclops's reading monocle",
    requesterRole: 'Reddy cyclops',
    requesterAvatar: '👁️',
    requesterImage: '/images/Mythics/Mythic1red.webp',
    description: "A friendly Reddy cyclops wishes for a massive magnifying monocle so he can read adventure scrolls in the public park. Town glassblowers and scholars are seeking your guidance.",
    optionA: {
      label: "Craft giant glass monocle",
      description: "Commission the glassworks to forge a polished four-foot lens.",
      outcomes: [
        {
          storyText: "Sunbeam scare! The big lens caught the bright afternoon sun and singed the lawn gazebo curtains! Repair cost: 80 Gold.",
          goldChange: -80,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "Tears of joy! The Cyclops put on the monocle, read his favorite poetry with tears of happiness, and gifted a pouch of iron ingots to the forge!",
          goldChange: 260,
          loyaltyChange: 14,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Offer stylish pirate patch",
      description: "Present a dashing leather eye patch as a fun disguise.",
      outcomes: [
        {
          storyText: "Pond tumble! With an eye patch over his single eye, the Cyclops stepped blindly into the duck pond, splashing water all over the terrace!",
          goldChange: -45,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "Harbor sentinel! The Cyclops loved his brave pirate look, took up a post as harbor gatekeeper, and kept stray river monsters away!",
          goldChange: 210,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-7',
    title: "Dolphio's harbor fountain splash",
    requesterRole: 'Dolphio',
    requesterAvatar: '🐬',
    requesterImage: '/images/creatures/Dolphio.webp',
    description: "Dolphio has been performing acrobatic triple flips in the royal fountain canal, splashing trade wagons and gathering a crowd of clapping apprentices.",
    optionA: {
      label: "Host aquatic festival show",
      description: "Turn the fountain display into an official public spectacle with grandstands.",
      outcomes: [
        {
          storyText: "Massive splash wave! Dolphio did an extra-high twist and drenched the front row of dignitaries head to toe! Drying bills: 50 Gold.",
          goldChange: -50,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Festival cheer! Thousands cheered as Dolphio performed synchronized fountain jumps, bringing record merchant trade to the avenue!",
          goldChange: 270,
          loyaltyChange: 15,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Guide Dolphio to the deep lagoon",
      description: "Direct Dolphio to the calm coastal waters where ships arrive.",
      outcomes: [
        {
          storyText: "Anchor rope tangle! Dolphio played tag with the dock ropes, entangling an incoming fishing skiff until divers untangled it!",
          goldChange: -40,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Safe harbor pilot! Dolphio guided trade caravels smoothly through the fog, earning praise from grateful sea captains!",
          goldChange: 230,
          loyaltyChange: 13,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-8',
    title: "Leaf's overgrown flower vines",
    requesterRole: 'Leaf',
    requesterAvatar: '🌱',
    requesterImage: '/images/creatures/Leaf.webp',
    description: "Leaf planted magical honeysuckle seeds along the southern gate. Overnight, lush blooming vines grew so fast they wrapped around the gate hinges and locked the wooden latch!",
    optionA: {
      label: "Harvest flowers for apothecary",
      description: "Have herbalists carefully snip the blossoms to brew soothing health teas.",
      outcomes: [
        {
          storyText: "Bee parade! The sweet aroma attracted friendly bumblebees that hovered over the bakery, sending patrons running indoors with their honey cakes!",
          goldChange: -40,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Healing tea reserve! The fragrant honeysuckle produced barrels of restorative flower tonic that filled the kingdom dispensary!",
          goldChange: 250,
          loyaltyChange: 15,
          itemReward: 'material-wood',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Weave vines into living arch",
      description: "Train the leafy vines into an ornamental greeting arch over the gate.",
      outcomes: [
        {
          storyText: "Gate creak! The vines were so thick the wooden gate groaned every time it opened, sounding like an old trombone at sunrise!",
          goldChange: -30,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Living floral landmark! Travelers marveled at the green blossoming entryway, praising the kingdom's natural beauty far and wide!",
          goldChange: 220,
          loyaltyChange: 13,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-9',
    title: "Turtoisy's 0.01 mph jam",
    requesterRole: 'Turtoisy',
    requesterAvatar: '🐢',
    requesterImage: '/images/creatures/Turtoisy.webp',
    description: "An ancient Turtoisy is crossing the main cobblestone avenue at 0.01 mph. A lineup of 40 merchant carts and 2 stubborn citizens are stuck behind him, complaining loudly to your throne!",
    optionA: {
      label: "Feed Turtoisy haste potion",
      description: "Administer a mild alchemy speed elixir to help Turtoisy walk a little faster.",
      outcomes: [
        {
          storyText: "Rocket Turtoisy! The elixir made Turtoisy zoom at 50 mph! He rocketed down the cobblestones, skidded through the bakery door, and landed softly inside a rhubarb pie!",
          goldChange: -75,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "Temporal crop dust! Turtoisy walked at a brisk gentle pace, leaving behind glowing temporal sparkles that doubled nearby garden growth!",
          goldChange: 220,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Build wooden ramp over Turtoisy",
      description: "Construct a gentle wooden bridge over Turtoisy so carts can pass freely.",
      outcomes: [
        {
          storyText: "Carriage rollback! The ramp was a bit steep; a merchant wagon rolled backward into a melon stand! Clean-up cost: 55 Gold.",
          goldChange: -55,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "Turtoisy bridge landmark! The wooden arch worked wonderfully, and citizens praised the thoughtful solution as a town monument!",
          goldChange: 170,
          loyaltyChange: 10,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-10',
    title: "Rockie's flower garden",
    requesterRole: 'Rockie',
    requesterAvatar: '🪨',
    requesterImage: '/images/creatures/Rockie.webp',
    description: "Rockie the gentle stone golem left his guard post at the dungeon gate to plant pink daisies across the town square. Town florists and sentries are discussing his new hobby in court.",
    optionA: {
      label: "Appoint Rockie head castle gardener",
      description: "Assign the gentle stone giant to official kingdom botanical duty.",
      outcomes: [
        {
          storyText: "Hornet scuffle! Rockie accidentally stepped on a hidden wild hornet nest while planting shrubs. Hornets chased him into the fountain!",
          goldChange: -45,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Botanical paradise! Rockie built the most charming stone-lined daisy garden in the realm, delighting all walking citizens!",
          goldChange: 280,
          loyaltyChange: 17,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Order Rockie to wear daisy on patrol",
      description: "Invite Rockie to guard the dungeon while proudly wearing his flowers.",
      outcomes: [
        {
          storyText: "Squeaky pebbles! Rockie tucked daisies into his stone joints, causing tiny pebble clicks every time he took a step during night watch!",
          goldChange: -30,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Daisy armor patrol! Rockie returned to watch duty with bright pink daisies tucked in his rocky helm, spreading smiles across the ramparts!",
          goldChange: 160,
          loyaltyChange: 9,
          isFunnyTwist: false
        }
      ]
    }
  }
];

// Helper to generate procedural variety up to 100 total story petitions
function generateProceduralPool(): Petition[] {
  const list: Petition[] = [];

  const districts = [
    'Southern Port',
    'High Citadel',
    'East Meadow',
    'West Watchtower',
    'Old Market',
    'River Bend',
    'North Wall',
    'Sunken Harbor',
    'Shadow Alley',
    'Royal Gardens'
  ];

  // Fill list by cycling through hand-crafted templates with clean district names and IDs up to 100 (no brackets)
  for (let i = 1; i <= 100; i++) {
    const baseTemplate = STORY_PETITIONS_TEMPLATES[(i - 1) % STORY_PETITIONS_TEMPLATES.length]!;
    const districtName = districts[(i - 1) % districts.length]!;

    list.push({
      ...baseTemplate,
      id: `pet-${i}`,
      title: `${baseTemplate.title} in ${districtName}`,
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
      // Validate that parsed items have the new outcomes array, requesterImage, and no legacy brackets
      if (
        Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every(p => p && p.optionA && Array.isArray(p.optionA.outcomes) && p.requesterImage && !p.title.includes('('))
      ) {
        return parsed;
      }
    }
  } catch {}

  // Pick 4 random distinct petitions from 100 pool
  return refreshAllPetitions();
}

export function resolvePetition(petitionId: string, choice: 'A' | 'B'): { happiness: CitizenHappinessState; goldChange: number; raidBossDamage: number; outcome: PetitionOutcome; chosenOptionLabel: string } {
  const petitions = getActivePetitions();
  const target = petitions.find(p => p.id === petitionId);
  
  const fallbackOutcome: PetitionOutcome = {
    storyText: "Decree enacted peacefully.",
    goldChange: 0,
    loyaltyChange: 0,
    raidBossDamage: 15,
    isFunnyTwist: false
  };

  if (!target) {
    return { happiness: getCitizenHappiness(), goldChange: 0, raidBossDamage: 15, outcome: fallbackOutcome, chosenOptionLabel: "Decree" };
  }

  const option = choice === 'A' ? target.optionA : target.optionB;
  const outcomes = option?.outcomes || [fallbackOutcome];
  // 50/50 randomized outcome roll
  const rolledOutcome = outcomes[Math.floor(Math.random() * outcomes.length)] || outcomes[0] || fallbackOutcome;

  // Calculate raid boss strike damage (15 HP for standard decree, 10 HP for chaotic twist)
  const raidBossDamage = rolledOutcome.raidBossDamage ?? (rolledOutcome.isFunnyTwist ? 10 : 15);
  const outcomeWithRaidDmg: PetitionOutcome = {
    ...rolledOutcome,
    raidBossDamage,
  };

  const newHappiness = updateCitizenHappiness(rolledOutcome.loyaltyChange || 0);

  const updatedPetitions = petitions.map(p => {
    if (p.id === petitionId) {
      return {
        ...p,
        completed: true,
        chosenOutcome: outcomeWithRaidDmg,
        chosenOptionLabel: option?.label || "Decree"
      };
    }
    return p;
  });

  setUserPreference('active-petitions-list', updatedPetitions);

  return {
    happiness: newHappiness,
    goldChange: rolledOutcome.goldChange || 0,
    raidBossDamage,
    outcome: outcomeWithRaidDmg,
    chosenOptionLabel: option?.label || "Decree"
  };
}

export function refreshAllPetitions(): Petition[] {
  const shuffled = [...ALL_100_PETITIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);
  setUserPreference('active-petitions-list', selected);
  return selected;
}
