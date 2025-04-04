import { getRandomElement, getRandomInt } from '@/lib/utils'
import { toast } from "@/components/ui/use-toast";

export type MysteryEventType = 'treasure' | 'battle' | 'quest' | 'trade' | 'blessing' | 'curse'

export interface MysteryEventReward {
  gold?: number
  experience?: number
  items?: {
    id: string
    name: string
    type: string
    quantity: number
    value: number
  }[]
  buffs?: {
    type: string
    value: number
    duration: number
  }[]
}

export interface MysteryEvent {
  id: string
  type: MysteryEventType
  title: string
  description: string
  choices: string[]
  outcomes: {
    message: string
    rewards?: MysteryEventReward
  }[]
  enemyName?: string
  enemyLevel?: number
}

const treasureEvents: MysteryEvent[] = [
  {
    id: 'ancient-chest',
    type: 'treasure',
    title: 'Ancient Chest',
    description: 'You stumble upon an ancient chest covered in mysterious runes.',
    choices: [
      'Try to pick the lock carefully',
      'Break it open with force',
      'Leave it alone'
    ],
    outcomes: [
      {
        message: 'You successfully pick the lock and find valuable treasures!',
        rewards: {
          gold: 500,
          experience: 100,
          items: [
            {
              id: 'ancient-coin',
              name: 'Ancient Coin',
              type: 'treasure',
              quantity: 1,
              value: 1000
            }
          ]
        }
      },
      {
        message: 'The chest breaks open but some contents are damaged.',
        rewards: {
          gold: 200,
          experience: 50
        }
      },
      {
        message: 'You decide to leave the chest untouched.'
      }
    ]
  },
  {
    id: 'buried-treasure',
    type: 'treasure',
    title: 'Buried Treasure',
    description: 'Your foot hits something metallic in the ground.',
    choices: [
      'Dig carefully',
      'Dig quickly',
      'Mark the location and return later'
    ],
    outcomes: [
      {
        message: 'Your careful digging reveals a perfectly preserved treasure!',
        rewards: {
          gold: 800,
          experience: 150,
          items: [
            {
              id: 'jeweled-crown',
              name: 'Jeweled Crown',
              type: 'treasure',
              quantity: 1,
              value: 2000
            }
          ]
        }
      },
      {
        message: 'In your haste, you damage some of the buried items.',
        rewards: {
          gold: 300,
          experience: 75
        }
      },
      {
        message: 'When you return, the treasure is gone.'
      }
    ]
  }
]

const battleEvents: MysteryEvent[] = [
  {
    id: 'bandit-ambush',
    type: 'battle',
    title: 'Bandit Ambush',
    description: 'A group of bandits emerges from hiding!',
    choices: ['Fight', 'Try to negotiate', 'Attempt to flee'],
    outcomes: [
      {
        message: 'You stand your ground and prepare for battle!',
        rewards: {
          gold: 300,
          experience: 200
        }
      },
      {
        message: 'The bandits laugh at your attempt to negotiate and attack anyway!'
      },
      {
        message: 'You manage to escape, but drop some gold in the process.',
        rewards: {
          gold: -100
        }
      }
    ],
    enemyName: 'Bandit Leader',
    enemyLevel: 5
  },
  {
    id: 'wild-beast',
    type: 'battle',
    title: 'Wild Beast',
    description: 'A fearsome creature blocks your path!',
    choices: ['Stand and fight', 'Try to sneak past', 'Intimidate the beast'],
    outcomes: [
      {
        message: 'You ready your weapons for battle!',
        rewards: {
          gold: 0,
          experience: 300
        }
      },
      {
        message: 'The beast spots you and attacks!',
        rewards: {
          gold: 0,
          experience: 150
        }
      },
      {
        message: 'Your intimidation works! The beast retreats.',
        rewards: {
          experience: 100
        }
      }
    ],
    enemyName: 'Dire Wolf',
    enemyLevel: 3
  }
]

const questEvents: MysteryEvent[] = [
  {
    id: 'lost-merchant',
    type: 'quest',
    title: 'Lost Merchant',
    description: 'A merchant asks for your help finding his lost cargo.',
    choices: [
      'Help search for the cargo',
      'Offer to buy information',
      'Decline to help'
    ],
    outcomes: [
      {
        message: 'You find the cargo and the merchant rewards you generously!',
        rewards: {
          gold: 1000,
          experience: 200,
          items: [
            {
              id: 'merchant-favor',
              name: "Merchant's Favor",
              type: 'quest',
              quantity: 1,
              value: 500
            }
          ]
        }
      },
      {
        message: 'The information leads you to the cargo, but at a cost.',
        rewards: {
          gold: 500,
          experience: 100
        }
      },
      {
        message: 'The merchant leaves disappointed.'
      }
    ]
  }
]

const tradeEvents: MysteryEvent[] = [
  {
    id: 'wandering-trader',
    type: 'trade',
    title: 'Wandering Trader',
    description: 'A mysterious trader offers you a deal.',
    choices: [
      'Trade gold for a mystery item',
      'Trade items for gold',
      'Decline trading'
    ],
    outcomes: [
      {
        message: 'You receive a valuable item!',
        rewards: {
          gold: -200,
          items: [
            {
              id: 'mystery-potion',
              name: 'Mystery Potion',
              type: 'consumable',
              quantity: 1,
              value: 500
            }
          ]
        }
      },
      {
        message: 'You make a profit on your trades!',
        rewards: {
          gold: 300
        }
      },
      {
        message: 'You decide not to risk trading with the stranger.'
      }
    ]
  }
]

const blessingEvents: MysteryEvent[] = [
  {
    id: 'ancient-shrine',
    type: 'blessing',
    title: 'Ancient Shrine',
    description: 'You discover an ancient shrine radiating mysterious energy.',
    choices: [
      'Pray at the shrine',
      'Leave an offering',
      'Study the shrine'
    ],
    outcomes: [
      {
        message: 'You feel invigorated by divine energy!',
        rewards: {
          experience: 200,
          buffs: [
            {
              type: 'strength',
              value: 10,
              duration: 3600
            }
          ]
        }
      },
      {
        message: 'The shrine accepts your offering and grants a blessing.',
        rewards: {
          gold: -100,
          buffs: [
            {
              type: 'luck',
              value: 5,
              duration: 7200
            }
          ]
        }
      },
      {
        message: 'You gain valuable knowledge about ancient magic.',
        rewards: {
          experience: 150
        }
      }
    ]
  }
]

const curseEvents: MysteryEvent[] = [
  {
    id: 'cursed-artifact',
    type: 'curse',
    title: 'Cursed Artifact',
    description: 'You find a beautiful but ominous artifact.',
    choices: [
      'Take the artifact',
      'Try to destroy it',
      'Leave it alone'
    ],
    outcomes: [
      {
        message: 'The artifact drains your energy but grants dark power.',
        rewards: {
          experience: -100,
          buffs: [
            {
              type: 'dark-power',
              value: 15,
              duration: 3600
            }
          ]
        }
      },
      {
        message: 'The artifact resists destruction and lashes out!',
        rewards: {
          gold: -200,
          experience: 50
        }
      },
      {
        message: 'You wisely decide to leave the cursed object untouched.'
      }
    ]
  }
]

const allEvents = [
  ...treasureEvents,
  ...battleEvents,
  ...questEvents,
  ...tradeEvents,
  ...blessingEvents,
  ...curseEvents
]

export function generateMysteryEvent(): MysteryEvent {
  return getRandomElement(allEvents)
}

export function handleEventOutcome(
  event: MysteryEvent,
  choiceIndex: number
): {
  message: string
  gold?: number
  experience?: number
  items?: any[]
  buffs?: any[]
} {
  const outcome = event.outcomes[choiceIndex]
  if (!outcome) return { message: 'Invalid choice' }

  return {
    message: outcome.message,
    gold: outcome.rewards?.gold,
    experience: outcome.rewards?.experience,
    items: outcome.rewards?.items,
    buffs: outcome.rewards?.buffs
  }
} 