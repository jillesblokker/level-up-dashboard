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
  xpReward?: number;
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
  },
  {
    id: 'pet-11',
    title: "Valerion's singing sewer pipes",
    requesterRole: 'Valerion',
    requesterAvatar: '🐉',
    requesterImage: '/images/creatures/Valerion.webp',
    description: "Valerion the Sewer master arrived in court carrying brass pipe wrenches. Subterranean conduit steam valves are whistling in three-part harmony, keeping rampart sentries awake all night!",
    optionA: {
      label: "Install acoustic pressure dampers",
      description: "Order royal plumbers to fit lead baffles onto the whistling exhaust valves.",
      outcomes: [
        {
          storyText: "Kazoo chorus! The dampers vibrated at high resonance, making the castle gutters sound like an army of kazoos at sunrise! Tuning bill: 40 Gold.",
          goldChange: -40,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Hydraulic serenity! Valerion calibrated the steam pressure into a soft subterranean hum that puts tired guards straight to restful sleep!",
          goldChange: 240,
          loyaltyChange: 14,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Host underground steam concert",
      description: "Open the aqueduct catacombs for a novelty musical performance.",
      outcomes: [
        {
          storyText: "Wine cork pop! The acoustic crescendo vibrated the cellar racks, popping three casks of aged royal berry cider into the puddles!",
          goldChange: -50,
          loyaltyChange: -5,
          isFunnyTwist: true
        },
        {
          storyText: "Subterranean acoustic gala! Nobles and bards praised the resonant cistern acoustics, donating generously to kingdom plumbing funds!",
          goldChange: 300,
          loyaltyChange: 16,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-12',
    title: "Penguino's rampart ice slide",
    requesterRole: 'Happy Penguin',
    requesterAvatar: '🐧',
    requesterImage: '/images/Animals/penguin.webp',
    description: "Penguino paved a slick ice toboggan slide down the castle ramparts and is charging passing citizens two fresh herring per belly-slide! Castle guards and fishmongers are petitioning your court.",
    optionA: {
      label: "Sanction official royal slide races",
      description: "Incorporate the rampart slide into a kingdom winter sports attraction.",
      outcomes: [
        {
          storyText: "Snowdrift spill! An over-enthusiastic knight slid at 40 mph directly into the royal cabbage wagon! Veggie replacement fees: 55 Gold.",
          goldChange: -55,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Winter tourism boom! Citizens and wandering squires flock to ride Penguino's championship ice chute, sharing fish and cheering daily!",
          goldChange: 270,
          loyaltyChange: 15,
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Melt the slide with coarse salt",
      description: "Clear the ramparts so guards can patrol safely without slipping.",
      outcomes: [
        {
          storyText: "Snowball barrage! Penguino and his frosty pals launched a retaliatory snowball barrage from the parapets, knocking off the captain's helmet!",
          goldChange: -35,
          loyaltyChange: -6,
          isFunnyTwist: true
        },
        {
          storyText: "Peaceful ramparts! Penguino accepted a warm fleece scarf instead and waddled cheerfully to practice belly-sliding on the frozen moat!",
          goldChange: 190,
          loyaltyChange: 11,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-13',
    title: "Buldour's shifted watchtower",
    requesterRole: 'Buldour',
    requesterAvatar: '🧱',
    requesterImage: '/images/creatures/Buldour.webp',
    description: "Buldour the Fortress builder discovered that a cornerstone in the east watchtower shifted by two inches. He demands permission to dismantle all three stories to relevel the mortar foundation!",
    optionA: {
      label: "Authorize complete tower teardown",
      description: "Let Buldour rebuild the tower with granite perfection from the bedrock up.",
      outcomes: [
        {
          storyText: "Rainy tent camp! A sudden autumn thunderstorm soaked the dismounted ramparts while the sentries huddled under canvas tents! Tarpaulin costs: 60 Gold.",
          goldChange: -60,
          loyaltyChange: -4,
          isFunnyTwist: true
        },
        {
          storyText: "Impenetrable granite bastion! Buldour rebuilt the east watchtower so squarely that architects from neighboring empires arrived to marvel at the masonry!",
          goldChange: 320,
          loyaltyChange: 18,
          itemReward: 'material-steel',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Brace the base with steel buttresses",
      description: "Reinforce the foundation without tearing down the upper crenellations.",
      outcomes: [
        {
          storyText: "Doorway squeeze! The steel brace was bolted so tight it warped the heavy oak armory door, requiring grease and mallet work to unstick!",
          goldChange: -40,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Rock-solid reinforcement! The steel buttress stabilized the tower foundation instantly, saving the treasury hundreds of construction hours!",
          goldChange: 210,
          loyaltyChange: 13,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
    id: 'pet-14',
    title: "Barnaby's whispering spellbooks",
    requesterRole: 'Barnaby',
    requesterAvatar: '📚',
    requesterImage: '/images/creatures/000.webp',
    description: "Barnaby the Library archivist reports that ancient arcane grimoires in the high tower broke their silencing wax seals and are gossiping loudly during quiet study hours!",
    optionA: {
      label: "Cast tranquil silencing wards",
      description: "Enchant the shelves with soothing herbal mist and silencing runes.",
      outcomes: [
        {
          storyText: "Librarian slumber! The herbal mist was so soothing that Barnaby fell sound asleep on his research desk for two days! Late ledger fines: 35 Gold.",
          goldChange: -35,
          loyaltyChange: -3,
          isFunnyTwist: true
        },
        {
          storyText: "Serene sanctuary! The quiet wards restored solemn tranquility to the library archives, allowing scholars to transcribe double the daily scrolls!",
          goldChange: 260,
          loyaltyChange: 15,
          itemReward: 'material-crystal',
          isFunnyTwist: false
        }
      ]
    },
    optionB: {
      label: "Transcribe the books' gossip",
      description: "Dispatch scribes to write down everything the chatty grimoires are whispering.",
      outcomes: [
        {
          storyText: "Royal turnip scandal! The book only whispered a three-century-old rumor about a chancellor burning cabbage soup! Scribe parchment bill: 30 Gold.",
          goldChange: -30,
          loyaltyChange: -2,
          isFunnyTwist: true
        },
        {
          storyText: "Ancient dungeon secret! The chattering grimoire revealed the forgotten location of a hidden dungeon keep treasure vault!",
          goldChange: 340,
          loyaltyChange: 18,
          isFunnyTwist: false
        }
      ]
    }
  },
  {
      id: 'pet-15',
      title: "Baker Pippin's sourdough golem",
      requesterRole: 'Baker Pippin',
      requesterAvatar: '🥖',
      requesterImage: '/images/creatures/001.webp',
      description: "Pippin accidentally tipped a vial of ether yeast into his dough trough. Now a warm, crusty bread golem is lumbering happily down the street handing out hot buns!",
      optionA: {
        label: "Bake it in the royal kiln",
        description: "Lure the runaway loaf into the palace ovens to make the kingdom's largest celebratory feast.",
        outcomes: [
          {
            storyText: "Giant golden crust! The kingdom enjoyed freshly buttered bread for a week, boosting civilian morale to all-time highs!",
            goldChange: 180,
            loyaltyChange: 12,
            isFunnyTwist: false
          },
          {
            storyText: "Crumb calamity! The golem exploded into a shower of warm garlic bread crumbs, coating the royal guards' armor in melted butter! Cleanup costs: 25 gold.",
            goldChange: -25,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Adopt it as town baker mascot",
        description: "Name the bread golem Loafy and commission an apron for it to knead morning dough.",
        outcomes: [
          {
            storyText: "Best baker in the realm! Loafy kneads twenty batches a minute without breaking a sweat, doubling the baker's guild revenue!",
            goldChange: 280,
            loyaltyChange: 14,
            itemReward: 'material-wood',
            isFunnyTwist: false
          },
          {
            storyText: "Hungry birds attack! Pigeons and sparrows from three valleys swooped down to peck at Loafy, causing a feathered riot in the bakery! Guard overtime: 30 gold.",
            goldChange: -30,
            loyaltyChange: -3,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-16',
      title: "Falconer Aaron's lovesick ravens",
      requesterRole: 'Falconer Aaron',
      requesterAvatar: '🦅',
      requesterImage: '/images/creatures/002.webp',
      description: "The citadel scout ravens intercepted a crate of scented perfume letters and now refuse to carry defense dispatches, delivering romantic poetry to random villagers instead.",
      optionA: {
        label: "Train them on shiny decoy gems",
        description: "Retrain the flock with glittering silver stones to break their obsession with floral love notes.",
        outcomes: [
          {
            storyText: "Eagle-eyed scouts! The ravens returned to their military posts with razor precision, spotting a hidden ether crystal deposit on the border!",
            goldChange: 240,
            loyaltyChange: 10,
            itemReward: 'material-crystal',
            isFunnyTwist: false
          },
          {
            storyText: "Kleptomaniac flock! Instead of scouting, the ravens swiped three teaspoons from the tavern and the captain's ceremonial whistle! Replacement: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Open a royal matchmaking courier",
        description: "Let the ravens fly their love letters and charge citizens a postage fee for anonymous romantic deliveries.",
        outcomes: [
          {
            storyText: "Courtly romance! Three knight weddings were arranged within a fortnight, filling the royal treasury with celebration permits!",
            goldChange: 310,
            loyaltyChange: 15,
            isFunnyTwist: false
          },
          {
            storyText: "Awkward mixup! The blacksmith received a passionate poem meant for the town florist, resulting in three hours of heated guild hall confusion! Peace offering: 35 gold.",
            goldChange: -35,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-17',
      title: "Cobbler Tobias's dancing boots",
      requesterRole: 'Cobbler Tobias',
      requesterAvatar: '👞',
      requesterImage: '/images/creatures/003.webp',
      description: "Tobias enchanted seven pairs of leather boots with swiftness runes, but the magic went haywire. The wearers cannot stop tap-dancing across the cobblestones!",
      optionA: {
        label: "Host an impromptu town square jig",
        description: "Bring out fiddlers and turn the mishap into an impromptu festival of rhythm and stamina.",
        outcomes: [
          {
            storyText: "Joyous celebration! Villagers danced until sunset, raising community spirits and attracting coin-spending traveling traders!",
            goldChange: 220,
            loyaltyChange: 14,
            isFunnyTwist: false
          },
          {
            storyText: "Exhausted cobblers! The dancers wore right through the leather into the stone paving! Cobbler repair subsidization: 30 gold.",
            goldChange: -30,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Dispense cooling salt baths",
        description: "Submerge the frantic footwear in brine vats infused with dispelling sea salt.",
        outcomes: [
          {
            storyText: "Enchantment calmed! The swiftness magic stabilized, yielding seven pairs of masterwork boots that double walking speed!",
            goldChange: 190,
            loyaltyChange: 11,
            itemReward: 'material-iron',
            isFunnyTwist: false
          },
          {
            storyText: "Salty pickles! Tobias accidentally mixed pickling vinegar with the salt, making the guild square smell of pickled cabbage for three days! Air fresheners: 25 gold.",
            goldChange: -25,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-18',
      title: "Astronomer Selene's fallen star",
      requesterRole: 'Astronomer Selene',
      requesterAvatar: '🔭',
      requesterImage: '/images/creatures/004.webp',
      description: "A sparkling fragment of a fallen celestial meteorite landed directly in the center of the royal botanical fountain, radiating warm astral light.",
      optionA: {
        label: "Study its astral radiation",
        description: "Mount magnifying lenses and mirrors to channel the starlight into the academy research ward.",
        outcomes: [
          {
            storyText: "Cosmic breakthrough! Selene decoded astral resonance patterns that unlock new alchemy recipes and grant XP!",
            goldChange: 150,
            loyaltyChange: 12,
            xpReward: 40,
            itemReward: 'material-crystal',
            isFunnyTwist: false
          },
          {
            storyText: "Blinding flash! An astronomer adjusted the lens backward, temporarily scorching a hole in the observatory ceiling curtain! Repairs: 35 gold.",
            goldChange: -35,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Carve protective talismans",
        description: "Carefully chip the starstone into protective amulets for the town gate guards.",
        outcomes: [
          {
            storyText: "Radiant armor! Gate guards now glow with a warm aura that discourages dungeon shadows from approaching the walls!",
            goldChange: 260,
            loyaltyChange: 16,
            raidBossDamage: 25,
            isFunnyTwist: false
          },
          {
            storyText: "Magnetic mishap! The fragments proved magnetic, pulling the kitchen cookware of five houses directly toward the town gate! Detangling fee: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-19',
      title: "Bard Finnegan's hypnotic ballad",
      requesterRole: 'Bard Finnegan',
      requesterAvatar: '🪕',
      requesterImage: '/images/creatures/005.webp',
      description: "Finnegan composed a tune so catchy that guards, cooks, and stonemasons have been absent-mindedly whistling it on repeat for forty-eight hours straight.",
      optionA: {
        label: "Make it the official kingdom anthem",
        description: "Organize the town choir to perform the ballad formally at the midday bell.",
        outcomes: [
          {
            storyText: "Harmonious unity! The unified anthem inspired citizen cooperation and pride across all twelve settlement districts!",
            goldChange: 230,
            loyaltyChange: 15,
            isFunnyTwist: false
          },
          {
            storyText: "Earworm quarantine! The town crier lost his voice from singing the chorus eighty times in one morning! Lozenges: 15 gold.",
            goldChange: -15,
            loyaltyChange: 0,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Commission a sleepy counter-melody",
        description: "Have Finnegan strum a soothing lullaby to purge the frantic tune from everyone's head.",
        outcomes: [
          {
            storyText: "Restful tranquility! Citizens enjoyed their deepest night of restorative sleep in months, boosting morning productivity!",
            goldChange: 200,
            loyaltyChange: 11,
            isFunnyTwist: false
          },
          {
            storyText: "Midday nap wave! Half the market fell asleep right onto their display stands, allowing stray cats to sample the smoked cheese! Cheese refund: 30 gold.",
            goldChange: -30,
            loyaltyChange: -3,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-20',
      title: "Beastmaster Orson's baby gryphon",
      requesterRole: 'Beastmaster Orson',
      requesterAvatar: '🐾',
      requesterImage: '/images/creatures/006.webp',
      description: "A fluffy baby feather-tailed gryphon escaped its sanctuary nest and is currently perched atop the citadel weather vane, chirping loudly for treats.",
      optionA: {
        label: "Coax it down with roasted smoked fish",
        description: "Set up a fragrant landing platter of seasoned trout at the base of the tower.",
        outcomes: [
          {
            storyText: "Fluffy rescue! The young gryphon glided down safely into Orson's arms and adopted the royal courtyard as its playground!",
            goldChange: 180,
            loyaltyChange: 13,
            isFunnyTwist: false
          },
          {
            storyText: "Seagull invasion! The scent of smoked trout lured sixty coastal gulls who made off with the fish and the town banner! Banner cleaning: 25 gold.",
            goldChange: -25,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Build an observation perch",
        description: "Let the gryphon stay atop the spire and install a nesting platform so it acts as an aerial lookout.",
        outcomes: [
          {
            storyText: "Sky guardian! The young gryphon screeches whenever storm clouds or dungeon wyrms approach the valley, keeping citizens safe!",
            goldChange: 270,
            loyaltyChange: 16,
            raidBossDamage: 20,
            isFunnyTwist: false
          },
          {
            storyText: "Shiny nest hoard! The gryphon decorated its new nest with seven brass door knockers and the jeweler's magnifying lens! Return compensation: 40 gold.",
            goldChange: -40,
            loyaltyChange: -3,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-21',
      title: "Glassblower Mira's rainbow prisms",
      requesterRole: 'Glassblower Mira',
      requesterAvatar: '💎',
      requesterImage: '/images/creatures/007.webp',
      description: "Mira crafted enchanted stained-glass panes for the greenhouse, but during sunrise the refracted beams concentrate intense heat like miniature magnifying glasses.",
      optionA: {
        label: "Rotate the panes toward the solar collector",
        description: "Channel the focused light into the town forge to smelt ore using zero charcoal.",
        outcomes: [
          {
            storyText: "Eco-friendly smelting! The radiant forge burned hot and clean, doubling metal ingot production without spending fuel gold!",
            goldChange: 290,
            loyaltyChange: 14,
            itemReward: 'material-iron',
            isFunnyTwist: false
          },
          {
            storyText: "Singed laundry! A rogue rainbow beam reflected off a copper pot and burned a hole through Lord Pemberton's velvet trousers! Tailor bill: 35 gold.",
            goldChange: -35,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Frost the glass with frosted dew wax",
        description: "Coat the panes in translucent beeswax to diffuse the light into gentle, soothing ambient hues.",
        outcomes: [
          {
            storyText: "Botanical paradise! The soft pastel glow tripled the growth rate of delicate apothecary orchids and healing herbs!",
            goldChange: 210,
            loyaltyChange: 12,
            itemReward: 'material-herbs',
            isFunnyTwist: false
          },
          {
            storyText: "Melting wax drips! The beeswax softened in the afternoon heat, dripping onto three visiting botanists' sun hats! Dry cleaning: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-22',
      title: "Clockmaker Ferris's temporal pendulum",
      requesterRole: 'Clockmaker Ferris',
      requesterAvatar: '⏱️',
      requesterImage: '/images/creatures/008.webp',
      description: "Ferris installed a chronomantic gear inside the kingdom bell tower. Whenever the clock chimes three, everyone in the square experiences ten seconds in slow motion.",
      optionA: {
        label: "Use the slow motion for archer training",
        description: "Schedule the town militia target drills precisely during the three o'clock chronomantic chime.",
        outcomes: [
          {
            storyText: "Bullseye every time! Recruits learned arrow trajectories in crisp slow-motion, dramatically elevating defensive readiness!",
            goldChange: 250,
            loyaltyChange: 15,
            raidBossDamage: 25,
            isFunnyTwist: false
          },
          {
            storyText: "Spilled stew! The palace chef tried to ladle soup during the temporal chime, splashing gravy across six slow-moving guards! Uniform washing: 25 gold.",
            goldChange: -25,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Dampen the gear with ether grease",
        description: "Pack the temporal cog with neutralizing grease to keep time flowing at a steady, reliable pace.",
        outcomes: [
          {
            storyText: "Precision rhythm! The clock now chimes with flawless musical cadence, keeping all city workshops running like clockwork!",
            goldChange: 195,
            loyaltyChange: 10,
            isFunnyTwist: false
          },
          {
            storyText: "Greasy gears! Ferris dropped the oil canister down the spiral steps, leaving the bell tower stairs slippery as butter! Sand cleanup: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-23',
      title: "Fisherwoman Tamsin's talking salmon",
      requesterRole: 'Fisherwoman Tamsin',
      requesterAvatar: '🎣',
      requesterImage: '/images/creatures/009.webp',
      description: "Tamsin caught a shimmering golden river trout that speaks fluent royal court dialect, demanding safe passage back to the Whispering Falls in exchange for river secrets.",
      optionA: {
        label: "Release it with royal honors",
        description: "Escort the magical fish to the deep waterfall pool and return it to its ancestral waters.",
        outcomes: [
          {
            storyText: "Blessing of the waters! The river fish guided fisherman boats to abundant schools of silver trout all season long!",
            goldChange: 260,
            loyaltyChange: 16,
            itemReward: 'material-water',
            isFunnyTwist: false
          },
          {
            storyText: "Fishy riddle! Before swimming off, the trout left a three-hour riddle that had the harbor council arguing through the lunch hour! Council dinner tab: 25 gold.",
            goldChange: -25,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Interview it in the palace aquarium",
        description: "Place the salmon in a comfortable fountain and ask it about sunken treasures beneath the river mud.",
        outcomes: [
          {
            storyText: "Sunken chest discovered! The trout pointed out a mossy iron chest containing ancient gold coins lost during the old kingdom wars!",
            goldChange: 350,
            loyaltyChange: 18,
            isFunnyTwist: false
          },
          {
            storyText: "Endless complaints! The fish criticized the palace fountain's pebble arrangement and demanded imported mountain spring water! Catering bill: 30 gold.",
            goldChange: -30,
            loyaltyChange: -2,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-24',
      title: "Tailor Vivienne's glowing moth silks",
      requesterRole: 'Tailor Vivienne',
      requesterAvatar: '🧵',
      requesterImage: '/images/creatures/010.webp',
      description: "Vivienne bred silk moths that feed on starlight clover. The resulting silk fabric glows gently in the dark, illuminating cobblestones at night without torches.",
      optionA: {
        label: "Weave night-patrol capes",
        description: "Equip city watchmen with soft glowing capes to navigate narrow alleys without lantern smoke.",
        outcomes: [
          {
            storyText: "Alley guardians! The luminescent cloaks deterred prowlers completely, ensuring peaceful and safe nights across the realm!",
            goldChange: 270,
            loyaltyChange: 15,
            isFunnyTwist: false
          },
          {
            storyText: "Moth party! Every wild moth within five leagues flocked to the glowing guards, turning night patrol into a fluttery carnival! Swatter purchases: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Sell glowing dresses at the grand market",
        description: "Launch a high-society fashion line for nobles and traveling dignitaries visiting the court.",
        outcomes: [
          {
            storyText: "Fashion sensation! Visiting ambassadors bought every bolt of luminescent silk at triple price, enriching the royal textile guild!",
            goldChange: 380,
            loyaltyChange: 14,
            isFunnyTwist: false
          },
          {
            storyText: "Static shock! The fabric built up minor static sparks on dry carpets, giving the visiting high duke a surprise jolt to the nose! Diplomatic wine gift: 45 gold.",
            goldChange: -45,
            loyaltyChange: -3,
            isFunnyTwist: true
          }
        ]
      }
    },
    {
      id: 'pet-25',
      title: "Traveling Chef Remy's dragon pepper chili",
      requesterRole: 'Traveling Chef Remy',
      requesterAvatar: '🍲',
      requesterImage: '/images/creatures/011.webp',
      description: "Chef Remy brewed a massive cauldron of five-alarm dragon pepper stew for the annual autumn fair. One spoonful grants temporary cold resistance, but the steam is melting candles!",
      optionA: {
        label: "Serve it to the mountain garrison",
        description: "Send barrels of the spicy stew to the icy mountain watchtower to keep soldiers toasty through the frost.",
        outcomes: [
          {
            storyText: "Fire in the snow! The garrison stayed warm and motivated through a three-day blizzard without burning extra firewood!",
            goldChange: 230,
            loyaltyChange: 13,
            itemReward: 'material-iron',
            isFunnyTwist: false
          },
          {
            storyText: "Hiccup outbreak! The whole garrison caught spicy chili hiccups simultaneously, misfiring one celebratory firework into the snowdrift! Firework cost: 20 gold.",
            goldChange: -20,
            loyaltyChange: -1,
            isFunnyTwist: true
          }
        ]
      },
      optionB: {
        label: "Host a spicy chili eating contest",
        description: "Charge spectators admission to watch the toughest knights attempt to finish a full bowl.",
        outcomes: [
          {
            storyText: "Riotous applause! Villagers cheered as the blacksmith swallowed three bowls in a row, raising substantial fair admission coin!",
            goldChange: 320,
            loyaltyChange: 15,
            isFunnyTwist: false
          },
          {
            storyText: "Milk shortage! Contestants drank the royal dairy completely dry of whole milk to soothe their burning tongues! Dairy replenishment: 35 gold.",
            goldChange: -35,
            loyaltyChange: -2,
            isFunnyTwist: true
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

function parseStoredDate(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw !== 'string') return String(raw);
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
  } catch {}
  return raw.replace(/^"|"$/g, '').trim();
}

/**
 * Heals any completed petition that previously ended up with the generic fallback
 * "Decree enacted peacefully." outcome so players always get their funny story outcome!
 */
function healPetitionOutcomes(petitions: Petition[]): Petition[] {
  return petitions.map(p => {
    if (
      p.completed &&
      (!p.chosenOutcome ||
        p.chosenOutcome.storyText === "Decree enacted peacefully." ||
        p.chosenOptionLabel === "Decree")
    ) {
      const match =
        ALL_100_PETITIONS.find(tpl => tpl.id === p.id) ||
        STORY_PETITIONS_TEMPLATES.find(tpl => tpl.requesterRole === p.requesterRole) ||
        ALL_100_PETITIONS.find(tpl => tpl.requesterRole === p.requesterRole);

      if (match) {
        const option = match.optionA;
        const rolled =
          option.outcomes[Math.floor(Math.random() * option.outcomes.length)] ||
          option.outcomes[0];
        if (rolled) {
          const isFunny = rolled.isFunnyTwist;
          return {
            ...p,
            chosenOptionLabel: option.label,
            chosenOutcome: {
              ...rolled,
              xpReward: rolled.xpReward ?? (isFunny ? 10 : 35),
              raidBossDamage: rolled.raidBossDamage ?? (isFunny ? 10 : 15),
            }
          };
        }
      }
    }
    return p;
  });
}

/**
 * Strict calendar date in user's local timezone (YYYY-MM-DD).
 * Conforms to AGENTS.md Strict Reset Anti-Regression Rule.
 */
export function getLocalTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getActivePetitions(): Petition[] {
  const today = getLocalTodayDate();
  try {
    const rawStoredDate = localStorage.getItem('pref:petitions-date');
    const storedDate = parseStoredDate(rawStoredDate);
    const local = localStorage.getItem('pref:active-petitions-list');

    // 1. Strict calendar date reset: if date changed, automatically refresh a fresh batch!
    if (storedDate && storedDate !== today) {
      return refreshAllPetitions();
    }

    if (local) {
      let parsed: unknown;
      try { parsed = JSON.parse(local); } catch { parsed = null; }

      // Validate that parsed items have the new outcomes array, requesterImage, and no legacy brackets
      if (
        Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every(p => p && p.optionA && Array.isArray(p.optionA.outcomes) && p.requesterImage && !p.title?.includes('('))
      ) {
        const healed = healPetitionOutcomes(parsed as Petition[]);
        // 2. Migration guard for existing sessions without a date saved:
        if (!storedDate) {
          if (healed.some(p => p.completed)) {
            return refreshAllPetitions();
          }
          try { localStorage.setItem('pref:petitions-date', JSON.stringify(today)); } catch {}
          setUserPreference('petitions-date', today);
        }
        return healed;
      }
    }
  } catch {}

  // Pick 4 random distinct petitions from 100 pool
  return refreshAllPetitions();
}

/**
 * Background cloud sync to ensure multi-device continuity and daily reset
 */
export async function syncPetitionsFromCloud(): Promise<Petition[]> {
  const today = getLocalTodayDate();
  try {
    const rawCloudDate = await getUserPreference('petitions-date');
    const cloudDate = parseStoredDate(rawCloudDate);
    if (cloudDate && cloudDate !== today) {
      return refreshAllPetitions();
    }
    const cloudList = (await getUserPreference('active-petitions-list')) as Petition[] | null;
    if (
      Array.isArray(cloudList) &&
      cloudList.length === 4 &&
      cloudList.every(p => p && p.optionA && Array.isArray(p.optionA.outcomes) && p.requesterImage && !p.title?.includes('('))
    ) {
      const healed = healPetitionOutcomes(cloudList);
      try {
        localStorage.setItem('pref:active-petitions-list', JSON.stringify(healed));
        localStorage.setItem('pref:petitions-date', JSON.stringify(today));
      } catch {}
      return healed;
    }
  } catch {}
  return getActivePetitions();
}

export function resolvePetition(
  petitionId: string,
  choice: 'A' | 'B',
  currentPetitions?: Petition[]
): {
  happiness: CitizenHappinessState;
  goldChange: number;
  xpReward: number;
  raidBossDamage: number;
  outcome: PetitionOutcome;
  chosenOptionLabel: string;
  updatedPetitions: Petition[];
} {
  const activeList = (currentPetitions && currentPetitions.length > 0)
    ? currentPetitions
    : getActivePetitions();

  // Find target in current list, or search ALL_100_PETITIONS / STORY_PETITIONS_TEMPLATES so we NEVER lose story outcomes!
  let target = activeList.find(p => p.id === petitionId);
  if (!target) {
    target = ALL_100_PETITIONS.find(p => p.id === petitionId) ||
             STORY_PETITIONS_TEMPLATES.find(p => p.id === petitionId) ||
             ALL_100_PETITIONS.find(p => p.requesterRole?.toLowerCase() === petitionId.toLowerCase()) ||
             STORY_PETITIONS_TEMPLATES.find(p => p.requesterRole?.toLowerCase() === petitionId.toLowerCase());
  }

  const option = choice === 'A' ? target?.optionA : target?.optionB;
  const outcomes = option?.outcomes || [];
  
  // Pick 50/50 randomized outcome roll between funny twist and favorable triumph
  let rolledOutcome: PetitionOutcome;
  if (outcomes.length > 0) {
    rolledOutcome = outcomes[Math.floor(Math.random() * outcomes.length)] || outcomes[0]!;
  } else {
    rolledOutcome = {
      storyText: choice === 'A'
        ? "The court declared your royal decree across the square! Citizens celebrated with cheers and spiced cider."
        : "A quiet decree was sealed into law. The town council nodded solemnly in agreement.",
      goldChange: choice === 'A' ? 140 : -35,
      loyaltyChange: choice === 'A' ? 8 : -3,
      xpReward: 35,
      raidBossDamage: 15,
      isFunnyTwist: choice === 'B'
    };
  }

  // Calculate real XP reward (+35 XP for favorable triumph, +10 XP for chaotic mishap)
  const xpReward = rolledOutcome.xpReward ?? (rolledOutcome.isFunnyTwist ? 10 : 35);
  const raidBossDamage = rolledOutcome.raidBossDamage ?? (rolledOutcome.isFunnyTwist ? 10 : 15);
  const resolvedOutcome: PetitionOutcome = {
    ...rolledOutcome,
    xpReward,
    raidBossDamage,
  };

  const newHappiness = updateCitizenHappiness(rolledOutcome.loyaltyChange || 0);

  // Update petitions in list
  const hasTargetInList = activeList.some(p => p.id === petitionId);
  const baseList = hasTargetInList
    ? activeList
    : (target ? [...activeList.slice(0, 3), target] : activeList);

  const updatedPetitions = baseList.map(p => {
    if (p.id === petitionId || (target && p.id === target.id)) {
      return {
        ...p,
        completed: true,
        chosenOutcome: resolvedOutcome,
        chosenOptionLabel: option?.label || "Decree"
      };
    }
    return p;
  });

  const today = getLocalTodayDate();
  try {
    localStorage.setItem('pref:active-petitions-list', JSON.stringify(updatedPetitions));
    localStorage.setItem('pref:petitions-date', JSON.stringify(today));
  } catch {}
  setUserPreference('active-petitions-list', updatedPetitions);
  setUserPreference('petitions-date', today);

  return {
    happiness: newHappiness,
    goldChange: rolledOutcome.goldChange || 0,
    xpReward,
    raidBossDamage,
    outcome: resolvedOutcome,
    chosenOptionLabel: option?.label || "Decree",
    updatedPetitions
  };
}

export function refreshAllPetitions(): Petition[] {
  const today = getLocalTodayDate();
  const shuffled = [...ALL_100_PETITIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);
  try {
    localStorage.setItem('pref:active-petitions-list', JSON.stringify(selected));
    localStorage.setItem('pref:petitions-date', JSON.stringify(today));
  } catch {}
  setUserPreference('active-petitions-list', selected);
  setUserPreference('petitions-date', today);
  return selected;
}

