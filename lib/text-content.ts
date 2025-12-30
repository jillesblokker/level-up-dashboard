export const TEXT_CONTENT = {
    kingdomTiles: {
        crossroad: {
            name: "Crossroad",
            clickMessage: "A busy crossroad connecting the kingdom."
        },
        straightroad: {
            name: "Straight Road",
            clickMessage: "A straight road connecting the kingdom."
        },
        cornerroad: {
            name: "Corner Road",
            clickMessage: "A curved road connecting the kingdom."
        },
        tsplitroad: {
            name: "T-Split Road",
            clickMessage: "A T-shaped road split connecting three paths."
        },
        well: {
            name: "Well",
            clickMessage: "With a big throw your bucket lands with a splash in the water. You start pulling it up and there are gold coins shining on the bottom of the bucket!"
        },
        blacksmith: {
            name: "Blacksmith",
            clickMessage: "The blacksmith's forge glows with heat as you approach. He hands you a freshly crafted iron sword and a pouch of gold for your patronage."
        },
        sawmill: {
            name: "Sawmill",
            clickMessage: "The sawmill's blades whir as you collect freshly cut timber. The wood is perfect for crafting and building."
        },
        fisherman: {
            name: "Fisherman",
            clickMessage: "You cast your line into the water and feel a tug. Reeling it in, you catch a fish with gold coins in its mouth!"
        },
        grocery: {
            name: "Grocery",
            clickMessage: "The grocer greets you warmly and shows you today's fresh produce. Hidden among the vegetables, you discover some gold coins!"
        },
        foodcourt: {
            name: "Foodcourt",
            clickMessage: "The aroma of freshly cooked meals fills the air. As you enjoy your meal, you find gold coins hidden under your plate!"
        },
        vegetables: {
            name: "Vegetables",
            clickMessage: "You tend to the vegetable garden, pulling up carrots and potatoes. Among the roots, you discover gold coins buried in the soil!"
        },
        wizard: {
            name: "Wizard",
            clickMessage: "The wizard's tower hums with magical energy. He shares ancient knowledge and hands you a scroll, along with gold for your wisdom."
        },
        temple: {
            name: "Temple",
            clickMessage: "The temple's peaceful atmosphere surrounds you. The priest blesses you with a health potion and offers gold for your devotion."
        },
        castle: {
            name: "Castle",
            clickMessage: "The castle's grandeur impresses you. The royal treasurer rewards your loyalty with gold and a valuable item from the royal vault."
        },
        mansion: {
            name: "Mansion",
            clickMessage: "The mansion's elegant halls welcome you. The noble owner appreciates your visit and rewards you with gold and a fine item."
        },
        fountain: {
            name: "Fountain",
            clickMessage: "The fountain's waters sparkle with magical energy. As you drink from it, you find gold coins at the bottom!"
        },
        mayor: {
            name: "Mayor",
            clickMessage: "The mayor greets you warmly in his office. He appreciates your service to the town and rewards you with gold and influence."
        },
        inn: {
            name: "Inn",
            clickMessage: "The inn's warm atmosphere welcomes you. The innkeeper shares local gossip and rewards you with gold and useful items."
        },
        jousting: {
            name: "Jousting",
            clickMessage: "The jousting arena echoes with the clash of lances. You participate in a tournament and win gold along with combat equipment."
        },
        archery: {
            name: "Archery",
            clickMessage: "The archery range tests your skill. You hit the target and find gold coins hidden behind the bullseye!"
        },
        watchtower: {
            name: "Watchtower",
            clickMessage: "From the watchtower's height, you spot something glinting in the distance. Investigating, you find gold and valuable information."
        },
        pond: {
            name: "Pond",
            clickMessage: "The pond's surface ripples as you approach. You spot gold coins glinting at the bottom and fish them out!"
        },
        windmill: {
            name: "Windmill",
            clickMessage: "The windmill's sails turn steadily. You collect freshly ground flour and discover gold coins mixed in with the grain!"
        },
        "winter-fountain": {
            name: "Winter Fountain",
            clickMessage: "Icicles glisten as the fountain flows with enchanted winter water. You scoop out a handful of coins sparkling like snow."
        },
        "snowy-inn": {
            name: "Snowy Inn",
            clickMessage: "Warm lights and cinnamon scents spill from the inn. The keeper slips you a festive pouch jingling with coins."
        },
        "ice-sculpture": {
            name: "Ice Sculpture",
            clickMessage: "An intricately carved sculpture hides a frosty cache—glimmering coins trapped within the ice."
        },
        "fireworks-stand": {
            name: "Fireworks Stand",
            clickMessage: "Crackling fuses and bright sparks—after the show, you find a tidy stack of celebration coins."
        },
        "pumpkin-patch": {
            name: "Pumpkin Patch",
            clickMessage: "You lift a plump pumpkin and discover coins tucked beneath the vines."
        },
        "harvest-barn": {
            name: "Harvest Barn",
            clickMessage: "Bales of hay and bustling workers—your share of the harvest includes a modest pouch of gold."
        },
        bakery: {
            name: "Bakery",
            clickMessage: "Fresh bread and warm pastries—tips and change accumulate into a tidy little treasure."
        },
        brewery: {
            name: "Brewery",
            clickMessage: "Foamy mugs and clinking tankards—profits from the evening's patrons fill your purse."
        },
        "market-stalls": {
            name: "Market Stalls",
            clickMessage: "Merchants haggle and shoppers browse—your cut of the stall fees comes in shiny coins."
        },
        library: {
            name: "Library",
            clickMessage: "Quiet stacks, rare tomes—an appreciative patron donates handsomely to your efforts."
        },
        "training-grounds": {
            name: "Training Grounds",
            clickMessage: "Sparring warriors and clashing steel—your prowess earns coin and respect."
        },
        stable: {
            name: "Stable",
            clickMessage: "Fresh hay and polished tack—your stable services bring in steady coin."
        },
        house: {
            name: "House",
            clickMessage: "The cozy house welcomes you with warmth. The residents appreciate your visit and reward you with gold for your hospitality."
        }
    },
    riddleChallenge: {
        success: {
            title: "Correct!",
            description: "You've earned {xpAmount} XP for your wisdom!"
        },
        failure: {
            title: "Incorrect!",
            description: "You've lost {goldAmount} gold coins. Try again!"
        },
        insufficientGold: {
            title: "Not enough gold!",
            description: "You need at least 50 gold to attempt this riddle."
        },
        ui: {
            title: "Riddle Challenge",
            description: "Answer correctly to earn 50 XP. Wrong answers cost 50 gold.",
            correctOverlay: "Well done, wise one! Your answer is correct.",
            incorrectOverlay: "The correct answer is: {answer}"
        }
    },
    monsterBattle: {
        roundFailed: {
            title: "Round Failed!",
            description: "You lost {lostGold} gold! Try to remember the sequence better."
        },
        defeat: {
            title: "Defeat!",
            description: "The {monsterName} was too strong! You lost {goldLost} gold total."
        },
        genericVictory: {
            title: "Victory!",
            description: "You defeated the {monsterName}! Earned {earnedGold} gold and {earnedXP} XP! Achievement unlocked!"
        },
        victories: {
            '201': {
                title: "🐉 Dragon Slayer!",
                description: "After an epic Simon Says battle, you have vanquished the Ancient Dragon Dragoni and earned {earnedGold} gold and {earnedXP} XP for your legendary victory!"
            },
            '202': {
                title: "👹 Goblin Hunter!",
                description: "After a quick Simon Says battle, you have defeated the Crafty Goblin Orci and earned {earnedGold} gold and {earnedXP} XP for your swift victory!"
            },
            '203': {
                title: "🧌 Troll Crusher!",
                description: "After a challenging Simon Says battle, you have crushed the Mountain Troll Trollie and earned {earnedGold} gold and {earnedXP} XP for your mighty victory!"
            },
            '204': {
                title: "🧙 Dark Wizard Vanquished!",
                description: "After an intense Simon Says battle, you have vanquished the Dark Wizard Sorceror and earned {earnedGold} gold and {earnedXP} XP for your magical victory!"
            },
            '205': {
                title: "🦄 Pegasus Tamed!",
                description: "After a mystical Simon Says battle, you have tamed the Mystical Pegasus Peggie and earned {earnedGold} gold and {earnedXP} XP for your enchanting victory!"
            },
            '206': {
                title: "🧚 Fairy Friend!",
                description: "After a delightful Simon Says battle, you have befriended the Enchanted Fairy Fairiel and earned {earnedGold} gold and {earnedXP} XP for your charming victory!"
            }
        },
        ui: {
            battleAgainst: "Battle Against {monsterName}",
            roundDifficulty: "Round {round}/5 • Difficulty: {difficulty}",
            progress: "Progress",
            watchSequence: "👀 Watch the sequence carefully...",
            yourTurn: "Your turn! Repeat the sequence",
            victory: "🎉 Victory! You defeated the monster!",
            defeat: "💀 Defeat! The monster was too strong!",
            yourSequence: "Your sequence: {current}/{total}",
            closeBattle: "Close Battle"
        }
    }
}
