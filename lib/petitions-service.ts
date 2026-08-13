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

// Master Handcrafted Story Petitions featuring Thrivehaven Lore & Creatures
export const STORY_PETITIONS_TEMPLATES: Petition[] = [
  {
    id: 'pet-1',
    title: "Ember Drake's Hiccup Calamity",
    requesterRole: 'Dragon Handler Ignis',
    requesterAvatar: '🐉',
    description: "Four angry washerwomen and a dragon handler are screaming in your court room! Ignis's pet Ember Drake got hiccups after eating wild chilies and is accidentally flame-roasting the laundry hanging across the courtyard.",
    optionA: {
      label: "Feed Ember Drake Frost Ice Cream",
      description: "Buy a tub of magical mint ice cream to cool the dragon's throat.",
      outcomes: [
        {
          storyText: "🤪 Brain-Freeze Burp! The Ember Drake loved the ice cream so much it got brain-freeze, tumbled into a hay cart, and burped a giant rainbow sparkler that singed Lord Sterling's velvet cape! Clean-up bill: 50 Gold.",
          goldChange: -50,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "🌟 Steam Ironing Miracle! The ice cream cured the hiccups instantly! The happy Ember Drake blew warm gentle steam that dried 200 wet shirts in 10 seconds, earning tips from the washerwomen!",
          goldChange: 220,
          loyaltyChange: 12,
          itemReward: 'material-wood',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Douse the Drake with Water Barrels",
      description: "Order guards to dump cold moat water on the dragon.",
      outcomes: [
        {
          storyText: "🤮 Courtroom Sauna Catastrophe! The wet Ember Drake sneezed a giant cloud of smelly sulfur steam, turning the throne room into a muggy sauna! The council members had to strip to their silk underwear!",
          goldChange: -40,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "🤝 Unexpected Spa Launch! The warm steam cloud drifted to the apothecary garden, reviving rare orchids that alchemists bought for top gold!",
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
    title: "Sage Owl's Stolen Diary",
    requesterRole: 'Arch-Librarian Ezra',
    requesterAvatar: '🦉',
    description: "Three frantic scholars and a guard captain are arguing before your throne! A wild Sage Owl swooped into the library archives, grabbed the King's secret diary, and roosted atop the castle flagpole.",
    optionA: {
      label: "Offer Sage Owl Premium Cave Mice",
      description: "Send a quiet handler to entice the owl with delicious treats.",
      outcomes: [
        {
          storyText: "💥 Moat Splash Drop! The Sage Owl traded the diary for mice, but accidentally dropped the book into the moat where a giant carp ate page 42! Repairing the binding cost 45 Gold.",
          goldChange: -45,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "📜 Lost Scroll Bonus! The Sage Owl returned the diary along with an ancient lost blueprint scroll it found tucked inside the flagpole rafters!",
          goldChange: 260,
          loyaltyChange: 14,
          itemReward: 'material-crystal',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Order Guard to Climb Flagpole",
      description: "Command Captain Ironclad to shimmy up the flagpole in full armor.",
      outcomes: [
        {
          storyText: "👖 Flagpole Pants Snag! The captain's iron trousers caught on the flagpole finial, dangling him upside down while the Sage Owl hooted sarcastically at the crowd!",
          goldChange: -35,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "🏅 Heroic Retrieval! Captain Ironclad retrieved the diary cleanly and found a nest of shiny golden thimbles at the top!",
          goldChange: 150,
          loyaltyChange: 9,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-3',
    title: "Spirit Sprite's Neon Dye Prank",
    requesterRole: 'Mayor Barnaby',
    requesterAvatar: '🧚',
    description: "Mayor Barnaby and 4 tanners brought a blue duck to court! A mischievous Spirit Sprite dumped glowing dye into the river, turning all the sheep, ducks, and Mayor Barnaby's beard neon blue.",
    optionA: {
      label: "Embrace Neon Blue Wool Fashion",
      description: "Declare neon blue as the realm's official trend.",
      outcomes: [
        {
          storyText: "🥛 Pink Milk Surprise! The Spirit Sprite thought you loved the joke and turned the castle milk supply bright pink the next morning! Cleaning fees: 60 Gold.",
          goldChange: -60,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "✨ Foreign Export Craze! Neon blue wool became a luxury fashion craze in neighboring kingdoms, netting massive export gold!",
          goldChange: 310,
          loyaltyChange: 16,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Set Arcane Spirit Traps",
      description: "Order alchemists to lay glowing net traps around the riverbank.",
      outcomes: [
        {
          storyText: "🦶 Chancellor Trapped! The trap caught High Chancellor Sterling's ankle instead, catapulting him into a manure pile!",
          goldChange: -50,
          loyaltyChange: -8,
          isFunnyTwist: true
        },
        {
          storyText: "💡 Free Street Lighting! The Spirit Sprite surrendered, apologized, and offered to illuminate the dark alleyways for free every night!",
          goldChange: 190,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-4',
    title: "Titan Wyrm's Midnight Toothache",
    requesterRole: 'High Captain Vance',
    requesterAvatar: '🐲',
    description: "Two panicking smiths and Captain Vance reported that a juvenile Titan Wyrm landed outside the city gates with a giant toothache, groaning so loudly that castle chandeliers are rattling!",
    optionA: {
      label: "Send Master Smith with Giant Pliers",
      description: "Dispatch Ironbeard to pull the aching tooth with armory tools.",
      outcomes: [
        {
          storyText: "🐕 Tail Wag Destruction! Ironbeard pulled the tooth, but the relieved Titan Wyrm wagged its tail like a excited puppy, knocking over the tollbooth sign! Repair bill: 75 Gold.",
          goldChange: -75,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "💰 Swallowed Treasure Reward! The grateful Titan Wyrm coughed up a chest of swallowed pirate gold and pledged to guard the harbor!",
          goldChange: 380,
          loyaltyChange: 20,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Feed Wyrm Sticky Marshmallows",
      description: "Send bakers with crates of soft gooey marshmallows to soothe the gum.",
      outcomes: [
        {
          storyText: "🎃 Pumpkin Patch Trample! The marshmallows stuck the Titan Wyrm's jaws shut. It panicked, ran in circles, and squished the royal pumpkin patch!",
          goldChange: -65,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "😴 Peaceful Slumber! The tooth popped out painlessly into the marshmallow goo, and the Wyrm fell asleep peacefully outside the gate!",
          goldChange: 210,
          loyaltyChange: 11,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-5',
    title: "Green Minotaur's Labyrinth Cafe",
    requesterRole: 'Minotaur Chef Asterion',
    requesterAvatar: '🐮',
    description: "A friendly Green Minotaur opened a maze coffee shop near the west wall, but customers keep getting lost in the hedges for 4 days! Three weeping mothers are demanding royal action in court.",
    optionA: {
      label: "Hire Scout Citizens as Maze Guides",
      description: "Pay experienced scouts to escort coffee drinkers through the hedges.",
      outcomes: [
        {
          storyText: "🧵 Yarn Rescue Disaster! The scouts got lost in the maze too! A rescue party had to be guided out by Asterion using a giant spool of wool yarn! Cost: 55 Gold.",
          goldChange: -55,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "☕ Tourist Attraction Boom! The scouts turned the cafe into a famous guided maze adventure, drawing wealthy weekend tourists!",
          goldChange: 290,
          loyaltyChange: 15,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Order Asterion to Trim Hedges",
      description: "Require the Minotaur to cut clear straight pathways.",
      outcomes: [
        {
          storyText: "👑 Royal Face Topiary! Asterion trimmed the hedges into giant funny topiary shapes of your Majesty's face, making the town burst into laughter!",
          goldChange: 170,
          loyaltyChange: 14,
          isFunnyTwist: false
        },
        {
          storyText: "🚿 Pipe Burst Flood! Asterion accidentally clipped through the aqueduct pipe, turning the maze cafe into a muddy swamp!",
          goldChange: -70,
          loyaltyChange: -7,
          isFunnyTwist: true
        }
      ]
    }
  },
  {
    id: 'pet-6',
    title: "Red Cyclops's Reading Monocle",
    requesterRole: 'Cyclops Brontes',
    requesterAvatar: '👁️',
    description: "A giant Red Cyclops wants a massive glass monocle so he can read romance novels in the park. Two glassblowers and a guard captain are arguing in your court room.",
    optionA: {
      label: "Craft Giant Glass Monocle",
      description: "Commission the glassblowers to forge a 4-foot magnifying lens.",
      outcomes: [
        {
          storyText: "🔥 Singed Guardhouse! The monocle acted as a giant magnifying glass in the afternoon sun, accidentally igniting the guardhouse curtains! Repair bill: 80 Gold.",
          goldChange: -80,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "📚 Tears of Joy! The Cyclops put on the monocle, wept tears of joy over a love poem, and donated a sack of iron ore to the forge!",
          goldChange: 260,
          loyaltyChange: 14,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Give Cyclops a Pirate Eye Patch",
      description: "Offer a stylish leather pirate eye patch instead.",
      outcomes: [
        {
          storyText: "🌊 Moat Splashdown! With an eye patch over his ONLY eye, Brontes walked blindly into the moat and drenched the High Council in duckweed!",
          goldChange: -45,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "🏴‍☠️ Harbor Watch Officer! Brontes loved his pirate look, became the official harbor gatekeeper, and scared off river pirates!",
          goldChange: 210,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-7',
    title: "Sky Gryphon's Dock Crane Nest",
    requesterRole: 'Captain Horizon',
    requesterAvatar: '🦅',
    description: "A Sky Gryphon built a giant twig nest directly atop the main airship dock crane, halting all Ether voyages! Captain Horizon and a gryphon breeder are shouting before your throne.",
    optionA: {
      label: "Relocate Nest with Silk Pillows",
      description: "Pay handlers to carefully move the nest to the high watchtower.",
      outcomes: [
        {
          storyText: "🛏️ Pillow Theft! The Sky Gryphon loved the silk pillows so much it swooped down and stole 4 more from your royal bedchamber! Pillow cost: 60 Gold.",
          goldChange: -60,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "⛵ Flight Speed Boost! The Gryphon settled happily on the watchtower, giving all realm airships a +20% flight speed boost!",
          goldChange: 270,
          loyaltyChange: 15,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Scare Gryphon with War Drums",
      description: "Order guards to beat loud bass drums to shoo the bird away.",
      outcomes: [
        {
          storyText: "🥚 Rolling Giant Egg! The drum noise scared the Gryphon into laying a giant egg that rolled down the hill and knocked over 3 beer kegs!",
          goldChange: -50,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "🏹 Swift Arrow Feathers! The Gryphon flew off gracefully, leaving behind shiny feathers that smiths forged into high-tier arrows!",
          goldChange: 180,
          loyaltyChange: 10,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-8',
    title: "Frost Wolf's Summer Heatwave",
    requesterRole: 'Pack Leader Hrothgar',
    requesterAvatar: '🐺',
    description: "A Frost Wolf from the northern peaks came to town in July, panting heavily and melting the town ice house! Two ice merchants and Hrothgar are petitioning for relief in court.",
    optionA: {
      label: "Build Magic Ice Cellar",
      description: "Commission alchemists to freeze the castle cellar for the wolf.",
      outcomes: [
        {
          storyText: "🍷 Wine Pop Freeze! The cellar froze so solid that the castle wine bottles turned into ice pops! Uncorking bill: 40 Gold.",
          goldChange: -40,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "🥩 Meat Preservation Triumph! The Frost Wolf chilled the cellar perfectly, preserving summer meat and cutting kingdom food costs in half!",
          goldChange: 240,
          loyaltyChange: 13,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Shave the Frost Wolf's Fur",
      description: "Order barbers to give the wolf a summer haircut.",
      outcomes: [
        {
          storyText: "🐩 Poodle Humiliation! The shaved Frost Wolf looked like a skinny poodle and felt so embarrassed it hid under the mayor's velvet skirt!",
          goldChange: -30,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "🧶 Lux Coat Profit! The soft frost fur was spun into premium winter cloaks that sold for high prices at the market bazaar!",
          goldChange: 300,
          loyaltyChange: 16,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-9',
    title: "Chrono Turtle's 0.01 MPH Jam",
    requesterRole: 'High Trader Valerius',
    requesterAvatar: '🐢',
    description: "An ancient Chrono Turtle is crossing the main cobblestone avenue at 0.01 mph. A lineup of 40 merchant carts and 2 stubborn nobles are stuck behind it, complaining loudly to your throne!",
    optionA: {
      label: "Feed Turtle Speed-up Potion",
      description: "Administer an alchemy haste elixir to accelerate the turtle.",
      outcomes: [
        {
          storyText: "🥧 50 MPH Rocket Turtle! The potion made the turtle zoom at 50 mph! It rocketed down the street, crashed through the bakery window, and landed in a rhubarb pie!",
          goldChange: -75,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "✨ Temporal Crop Dust! The turtle walked at a brisk pace, leaving behind glowing temporal dust that doubled nearby crop growth!",
          goldChange: 220,
          loyaltyChange: 12,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Build Wooden Ramp Over Turtle",
      description: "Construct a temporary arch ramp for carts to pass over the turtle.",
      outcomes: [
        {
          storyText: "🛒 Carriage Rollback! The ramp was too steep; Lord Sterling's carriage rolled backward into a fruit cart! Repair cost: 55 Gold.",
          goldChange: -55,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "🌉 Turtle Bridge Landmark! The ramp worked great, and citizens turned the turtle bridge into a famous town tourist attraction!",
          goldChange: 170,
          loyaltyChange: 10,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-10',
    title: "Iron Golem's Flower Garden",
    requesterRole: 'Guard Captain Ironclad',
    requesterAvatar: '🤖',
    description: "A retired Iron Golem abandoned his post at the dungeon gate to plant pink daisies in the main square. Captain Ironclad and the head florist are locked in a heated shouting match in your court.",
    optionA: {
      label: "Appoint Golem Head Castle Gardener",
      description: "Assign the gentle Golem to official botanical duty.",
      outcomes: [
        {
          storyText: "🐝 Hornet Swarm Attack! The Golem stepped on a hidden hornet nest while planting roses. Hornets chased the Golem and stung 3 council members!",
          goldChange: -45,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "🌸 Botanical Paradise! The Golem built the most stunning floral garden in the kingdom, raising citizen wellness by 20%!",
          goldChange: 280,
          loyaltyChange: 17,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Order Golem Back to Dungeon Patrol",
      description: "Command the Golem to resume heavy dungeon guard duty.",
      outcomes: [
        {
          storyText: "😭 Squeaky Rusty Tears! The sad Golem cried rusty tears that squeaked loudly every time he walked during night watch, keeping guards awake!",
          goldChange: -30,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "🌼 Daisy Helmet Patrol! The Golem agreed to guard the dungeon while proudly wearing a tiny daisy tucked into his iron visor!",
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

  const districts = ['Southern Port', 'High Citadel', 'East Meadow', 'West Watchtower', 'Old Market', 'River Bend', 'North Wall', 'Sunken Harbor', 'Shadow Alley', 'Royal Gardens'];

  // Fill list by cycling through hand-crafted templates with unique district names and IDs up to 100
  for (let i = 1; i <= 100; i++) {
    const baseTemplate = STORY_PETITIONS_TEMPLATES[(i - 1) % STORY_PETITIONS_TEMPLATES.length]!;
    const districtName = districts[(i - 1) % districts.length]!;

    list.push({
      ...baseTemplate,
      id: `pet-${i}`,
      title: `${baseTemplate.title} (${districtName})`,
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

  // Pick 4 random distinct petitions from 100 pool
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
