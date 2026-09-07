import { StoryAdventure } from '@/lib/storybook-manager';

export const STORY_ADVENTURES: StoryAdventure[] = [
  {
    id: 'story-sparky-pace',
    storyNumber: 'Tale 1',
    title: 'Sparky and the slow coach',
    characters: [
      { name: 'Sparky', image: '/images/creatures/Sparky.webp' },
      { name: 'Turtoisy', image: '/images/creatures/Turtoisy.webp' },
      { name: 'Leaf', image: '/images/creatures/Leaf.webp' }
    ],
    avatarImage: '/images/creatures/Sparky.webp',
    locationName: 'Green meadow running track',
    narrativeText: `Sparky was zipping around in circles like a little lightning bolt. Zzzt! Zip! Zoom!

"Look at me!" Sparky shouted. "I am the fastest runner in the whole realm!"

Ten seconds later, Sparky crashed into the grass. His sparks were gone. His little legs were shaking. "Oh no... I am out of energy already. My race is tomorrow, and I cannot even run one lap!"

Down the path, old Turtoisy was walking very, very slowly. He carried a heavy shell on his back, but he was smiling and breathing easily.

"Hello little Sparky," Turtoisy said in a warm, calm voice. "You run like a flash of lightning, but a race is long. If you want to finish, you must learn to run slowly."

Leaf hopped over with a cup of cool water. "Turtoisy is right! Can you let him coach you?"`,
    dialogue: [
      {
        speaker: 'Sparky',
        speakerImage: '/images/creatures/Sparky.webp',
        text: 'Sparky was zipping around in circles like a little lightning bolt. Zzzt! Zip! Zoom! "Look at me! I am the fastest runner in the whole realm!"'
      },
      {
        speaker: 'Sparky',
        speakerImage: '/images/creatures/Sparky.webp',
        text: 'Ten seconds later, Sparky crashed into the grass. His sparks were gone and his little legs were shaking. "Oh no... I am out of energy already. My race is tomorrow, and I cannot even run one lap!"'
      },
      {
        speaker: 'Turtoisy',
        speakerImage: '/images/creatures/Turtoisy.webp',
        text: 'Down the path, old Turtoisy was walking very, very slowly with his heavy shell, smiling and breathing easily. "Hello little Sparky. You run like a flash of lightning, but a race is long. If you want to finish, you must learn to run slowly."'
      },
      {
        speaker: 'Leaf',
        speakerImage: '/images/creatures/Leaf.webp',
        text: 'Leaf hopped over with a cup of cool water. "Turtoisy is right! Can you let him coach you?"'
      }
    ],
    choices: [
      {
        id: 'choice-jog-turtoisy',
        verb: 'Jog with Turtoisy',
        label: 'Match his slow and steady pace without rushing',
        characterName: 'Turtoisy',
        characterImage: '/images/creatures/Turtoisy.webp',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Running slowly helps you go far without running out of breath.',
        resolutionText: `You tell Sparky to match Turtoisy's slow, easy pace.

Sparky tries it. At first, he feels funny going so slow. But after five whole minutes, he realizes something amazing: he is not out of breath! He can keep jogging and talking at the same time.

"I did it!" Sparky zips with joy. "I can run for a long time if I do not sprint!"

Turtoisy gives him a gentle nod and a gold medal made of polished wood.`
      },
      {
        id: 'choice-breathe-leaf',
        verb: 'Breathe with Leaf',
        label: 'Take deep breaths through your nose to keep your heart calm',
        characterName: 'Leaf',
        characterImage: '/images/creatures/Leaf.webp',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Calm breathing gives your muscles more energy when you exercise.',
        resolutionText: `Leaf shows Sparky how to take deep, easy breaths while jogging: in through the nose, out through the mouth.

Sparky's electric sparks change from wild crackles into a smooth, steady glow. His legs feel light, and he jogs across the finish line with a happy smile.`
      },
      {
        id: 'choice-sprint-fast',
        verb: 'Sprint at full speed',
        label: 'Run as fast as possible to show off your speed',
        characterName: 'Sparky',
        characterImage: '/images/creatures/Sparky.webp',
        virtueType: 'might',
        virtuePoints: 10,
        goldReward: 20,
        lessonMoral: 'If you use all your energy at once, your body needs a break.',
        resolutionText: `Sparky zooms down the path like a rocket! For ten seconds, he is super fast.

Then... pop! His sparks flicker out. He flops into the soft grass.

Turtoisy slowly catches up, chuckling. He lets Sparky sit on his shell for a restful ride back home. "Rest now, little friend. Tomorrow we try the steady way."`
      }
    ]
  },
  {
    id: 'story-leaf-tidy',
    storyNumber: 'Tale 2',
    title: 'Leaf cleans his messy room',
    characters: [
      { name: 'Leaf', image: '/images/creatures/Leaf.webp' },
      { name: 'Rockie', image: '/images/creatures/Rockie.webp' }
    ],
    avatarImage: '/images/creatures/Leaf.webp',
    locationName: "Leaf's cozy cottage",
    narrativeText: `Leaf sat on the floor with his sprout drooping down.

His room was a total mess. Books were open on the floor. Plant pots were piled high. Daily quest scrolls were scattered under the table.

"There is too much stuff everywhere," Leaf said in a small voice. "I want to clean, but it feels too big. I don't know where to start, so I am just sitting here doing nothing."

Just then, Rockie the stone golem looked through the window. Rockie was huge and made of smooth river stones.

"Hello friend Leaf," Rockie rumbled in a friendly voice. "A big stone castle is built one stone at a time. You do not need to clean the whole room right now. What if you just pick up one thing?"`,
    dialogue: [
      {
        speaker: 'Leaf',
        speakerImage: '/images/creatures/Leaf.webp',
        text: 'Leaf sat on the floor with his sprout drooping down. His room was a total mess with books and quest scrolls scattered everywhere. "There is too much stuff! I want to clean, but it feels too big and I don\'t know where to start."'
      },
      {
        speaker: 'Rockie',
        speakerImage: '/images/creatures/Rockie.webp',
        text: 'Rockie the river-stone golem looked through the window and rumbled warmly: "Hello friend Leaf! A big stone castle is built one stone at a time. You do not need to clean the whole room right now. What if you just pick up one thing?"'
      }
    ],
    choices: [
      {
        id: 'choice-pick-three',
        verb: 'Pick up 3 things',
        label: 'Clear just your desk and put three books back on the shelf',
        characterName: 'Leaf',
        characterImage: '/images/creatures/Leaf.webp',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Starting with one tiny spot makes a big messy chore feel easy.',
        resolutionText: `You tell Leaf: "Let's only put three books on the shelf. That is all."

Leaf picks up one book, then another, then a third. It took less than one minute!

"Hey, that was easy!" Leaf smiles. Because the desk looks nice and clean, Leaf feels happy and tidies up the rest of the room without even feeling tired.`
      },
      {
        id: 'choice-help-rockie',
        verb: 'Clean with Rockie',
        label: 'Hand the heavy boxes to Rockie to sort them together',
        characterName: 'Rockie',
        characterImage: '/images/creatures/Rockie.webp',
        virtueType: 'craft',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Asking a friend for help turns hard work into fun team time.',
        resolutionText: `Rockie gently lifts the heavy box of old toys and scrolls out to the garden.

Together, you and Leaf sort everything into neat piles. Within ten minutes, the floor is completely clear!

Leaf's cottage feels bright and sunny again. Rockie gets a big bowl of clean river pebbles as a thank-you snack.`
      },
      {
        id: 'choice-hide-bed',
        verb: 'Shove under the bed',
        label: 'Kick all the toys and scrolls under the bed quickly',
        characterName: 'Leaf',
        characterImage: '/images/creatures/Leaf.webp',
        virtueType: 'honor',
        virtuePoints: 10,
        goldReward: 20,
        lessonMoral: 'Hiding a problem only makes it bounce back later.',
        resolutionText: `Leaf sweeps everything under the bed with a broom. Whoosh!

For two seconds, the room looks clean. But there is so much stuff stuffed underneath that the mattress lifts into the air like a tiny hill!

Leaf laughs and pulls the toys back out. "Okay, let's actually put them in the toy chest."`
      }
    ]
  },
  {
    id: 'story-flamio-sleep',
    storyNumber: 'Tale 3',
    title: 'Flamio goes to sleep',
    characters: [
      { name: 'Flamio', image: '/images/creatures/Flamio.webp' },
      { name: 'Sage Owl', image: '/images/creatures/SageOwl.webp' }
    ],
    avatarImage: '/images/creatures/Flamio.webp',
    locationName: 'The high watchtower hearth',
    narrativeText: `It was dark outside. The stars were shining, and everyone in town was asleep.

Except for Flamio.

Flamio was bouncing up and down on the hearthstones. His fire was glowing bright and hot. Crackle! Pop! Spark!

"I cannot sleep, Sage Owl!" Flamio cried. "My head is buzzing! What if I forget my quests tomorrow? What if I miss the morning bell? What if, what if, what if?!"

Up in the wooden rafters, Sage Owl closed his big book quietly. He adjusted his glasses and looked down with kind eyes.

"Little flame," Sage Owl said softly. "A campfire cannot burn all night, or there will be no wood left for the morning. Your thoughts are just spinning like wheels. Let us help your flame settle down."`,
    dialogue: [
      {
        speaker: 'Flamio',
        speakerImage: '/images/creatures/Flamio.webp',
        text: 'It was dark outside and everyone was asleep, but Flamio was bouncing on the hearthstones with crackling sparks! "I cannot sleep, Sage Owl! My head is buzzing with tomorrow\'s quests! What if, what if, what if?!"'
      },
      {
        speaker: 'Sage Owl',
        speakerImage: '/images/creatures/SageOwl.webp',
        text: 'Up in the rafters, Sage Owl closed his big book and whispered kindly: "Little flame, a campfire cannot burn all night, or there will be no wood left for the morning. Let us help your flame settle down."'
      }
    ],
    choices: [
      {
        id: 'choice-dim-lights',
        verb: 'Turn off the lights',
        label: 'Blow out the bright lanterns and take five slow breaths',
        characterName: 'Flamio',
        characterImage: '/images/creatures/Flamio.webp',
        virtueType: 'wellness',
        virtuePoints: 20,
        goldReward: 30,
        lessonMoral: 'Turning off bright screens and lights tells your brain it is time to sleep.',
        resolutionText: `You dim the magic lantern until the room is soft and dark. Then you tell Flamio to take five slow, quiet breaths.

With each breath, Flamio's bright sparks soften into a cozy golden glow. His eyelids feel heavy.

Within three minutes, a tiny snore comes from the fireplace. Flamio is fast asleep, resting up for tomorrow.`
      },
      {
        id: 'choice-write-worries',
        verb: 'Write on paper',
        label: 'Write down tomorrow’s tasks on paper so your mind can rest',
        characterName: 'Sage Owl',
        characterImage: '/images/creatures/SageOwl.webp',
        virtueType: 'knowledge',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Writing down what you need to do tomorrow lets your brain relax tonight.',
        resolutionText: `Sage Owl hands Flamio a small piece of parchment and a quill.

Flamio writes down his three tasks for tomorrow morning: 1. Eat breakfast. 2. Practice spells. 3. Water the garden.

"Now your tasks are safe on paper," Sage Owl whispers. "You do not need to hold them in your head." Flamio curls up and falls asleep immediately.`
      }
    ]
  },
  {
    id: 'story-oaky-stretch',
    storyNumber: 'Tale 4',
    title: 'Oaky learns to stretch',
    characters: [
      { name: 'Oaky', image: '/images/creatures/Oaky.webp' },
      { name: 'Dolphio', image: '/images/creatures/Dolphio.webp' }
    ],
    avatarImage: '/images/creatures/Oaky.webp',
    locationName: 'The castle garden fountain',
    narrativeText: `Oaky the tree guardian had been standing in the exact same spot for four hours.

His wooden back was completely stiff. His branches were locked tight. When he tried to turn his head to look at the flowers, his neck went:

"CREEEAK-SNAP!"

"Ouch!" Oaky groaned. "I want to be a strong guard, but my wooden joints feel like solid stone. I can barely lift my arms!"

Suddenly, Dolphio the blue dolphin leaped out of the fountain pond! Splash! He did a smooth, playful flip in the air and landed with a happy giggle.

"Friend Oaky!" Dolphio clicked cheerfully. "You are standing still like a flagpole! Even trees need to bend with the wind. Have you stretched your branches today?"`,
    dialogue: [
      {
        speaker: 'Oaky',
        speakerImage: '/images/creatures/Oaky.webp',
        text: 'Oaky the tree guardian had been standing still for four hours. His wooden branches went CREEEAK-SNAP! "Ouch! I want to be a strong guard, but my wooden joints feel like solid stone. I can barely lift my arms!"'
      },
      {
        speaker: 'Dolphio',
        speakerImage: '/images/creatures/Dolphio.webp',
        text: 'Dolphio the blue dolphin leaped out of the fountain pond with a cheerful splash! "Friend Oaky! Even trees need to bend with the wind. Have you stretched your branches today?"'
      }
    ],
    choices: [
      {
        id: 'choice-branch-stretch',
        verb: 'Stretch your branches',
        label: 'Reach your arms up to the sky and bend gently side to side',
        characterName: 'Oaky',
        characterImage: '/images/creatures/Oaky.webp',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'A quick 1-minute stretch keeps your back and neck from feeling sore.',
        resolutionText: `Dolphio shows Oaky how to stretch: arms reach high to the clouds, then sway gently to the left and to the right like a willow tree.

Oaky follows along. As he bends, the stiffness in his bark melts away with a pleasant pop.

"Ahhh," Oaky sighs with relief. "My back feels ten years younger! I can stand tall and smile again."`
      },
      {
        id: 'choice-fountain-break',
        verb: 'Take a water break',
        label: 'Step away from your post to splash cool water on your face',
        characterName: 'Dolphio',
        characterImage: '/images/creatures/Dolphio.webp',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Taking short water breaks during work keeps you fresh and alert.',
        resolutionText: `Oaky steps down to the edge of the fountain. Dolphio splashes a refreshing mist of cool water across Oaky's green leaves.

The cool water wakes Oaky right up! His leaves turn bright emerald green, and he feels full of energy again.`
      }
    ]
  },
  {
    id: 'story-penguin-walk',
    storyNumber: 'Tale 5',
    title: 'Penguin takes daily steps',
    characters: [
      { name: 'Penguin', image: '/images/Animals/penguin.webp' },
      { name: 'Leaf', image: '/images/creatures/Leaf.webp' }
    ],
    avatarImage: '/images/Animals/penguin.webp',
    locationName: 'The grassy kingdom hill',
    narrativeText: `Happy Penguin loved sliding on his tummy across the snow. Whoosh! Wheee!

It was fast, it was fun, and he never had to use his feet.

But today, Penguin was in the summer meadows. There was no snow. There was only green grass.

Penguin tried to slide on his belly on the grass, but he just went "THUD" and stopped. He stood up on his little orange feet, took five steps, and sat down with a heavy sigh.

"My feet are so tiny!" Penguin whined. "Walking is too hard! My legs feel like jelly!"

Leaf walked over with his sturdy little roots. "Your legs are only tired because they are not used to walking yet. If you take a few steps every day, they will grow strong!"`,
    dialogue: [
      {
        speaker: 'Penguin',
        speakerImage: '/images/Animals/penguin.webp',
        text: 'Happy Penguin loved sliding on his belly across snow, but on summer grass he just went THUD! He took five wobbly steps and sat down: "My feet are so tiny! Walking is too hard! My legs feel like jelly!"'
      },
      {
        speaker: 'Leaf',
        speakerImage: '/images/creatures/Leaf.webp',
        text: 'Leaf walked over with his sturdy little roots and an encouraging smile: "Your legs are only tired because they are not used to walking yet. If you take a few steps every day, they will grow strong!"'
      }
    ],
    choices: [
      {
        id: 'choice-twenty-steps',
        verb: 'Walk 20 steps together',
        label: 'Hold hands with Leaf and count twenty steps up the path',
        characterName: 'Leaf',
        characterImage: '/images/creatures/Leaf.webp',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Doing a little bit of walking every day builds strong, healthy legs.',
        resolutionText: `Leaf takes Penguin by the wing. "Let's count together: One, two, three..."

Waddle, waddle, waddle! Before Penguin knows it, they count all the way to twenty. They are already halfway up the hill!

"Look at me!" Penguin chirps, flapping his wings. "I am walking! My feet actually work!"`
      },
      {
        id: 'choice-apple-snack',
        verb: 'Have an apple reward',
        label: 'Walk to the apple tree and share a sweet red apple',
        characterName: 'Penguin',
        characterImage: '/images/Animals/penguin.webp',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Rewarding yourself with healthy habits makes exercise feel fun.',
        resolutionText: `Leaf points to an apple tree at the top of the rise. "There are sweet red apples up there!"

Penguin's eyes go wide. He waddles with great determination, motivated by the delicious treat. When they reach the top, they crunch on crisp apples while enjoying the view.`
      }
    ]
  },
  {
    id: 'story-grove-fox-vase',
    storyNumber: 'Tale 6',
    title: 'Grove Fox and the broken vase',
    characters: [
      { name: 'Grove Fox', image: '/images/creatures/GroveFox.webp' },
      { name: 'Turtoisy', image: '/images/creatures/Turtoisy.webp' }
    ],
    avatarImage: '/images/creatures/GroveFox.webp',
    locationName: 'The grand library terrace',
    narrativeText: `Grove Fox was practicing his stealthy leaps along the library stone terrace when his bushy tail clipped a porcelain vase.

CRASH! The vase shattered into ten sparkling shards on the cobblestones.

Grove Fox gasped, his ears pinning flat with panic. "Oh no! Archmage Turtoisy cherished this antique! If I sweep the pieces into the rosebush, nobody will ever know it was me..."

Slow, rhythmic thuds echoed down the corridor as Turtoisy approached.

"Hiding an accident turns a small mistake into a heavy burden of guilt, little fox," Turtoisy spoke gently from the doorway. "True honor is not about never making mistakes; it is having the courage to speak the truth."`,
    dialogue: [
      {
        speaker: 'Grove Fox',
        speakerImage: '/images/creatures/GroveFox.webp',
        text: 'Grove Fox leaped along the terrace until his tail clipped a porcelain vase! CRASH! "Oh no! Archmage Turtoisy loved this antique! If I sweep the pieces into the bushes, nobody will ever know..."'
      },
      {
        speaker: 'Turtoisy',
        speakerImage: '/images/creatures/Turtoisy.webp',
        text: 'Turtoisy walked over slowly with a warm, steady gaze: "Hiding an accident turns a small mistake into a heavy burden of guilt. True honor is having the courage to speak the truth."'
      }
    ],
    choices: [
      {
        id: 'choice-confess-truth',
        verb: 'Tell the truth to Turtoisy',
        label: 'Step forward, admit the accident, and offer to help glue the shards together',
        characterName: 'Turtoisy',
        characterImage: '/images/creatures/Turtoisy.webp',
        virtueType: 'honor',
        virtuePoints: 20,
        goldReward: 35,
        lessonMoral: 'Honesty repairs trust faster than magic, turning accidents into lessons.',
        resolutionText: `Grove Fox takes a deep breath and confesses: "Master Turtoisy, I was jumping recklessly and broke the vase. I am truly sorry."

Turtoisy smiles with immense warmth. He brings out a small jar of golden resin. Together, they mend the porcelain with gleaming golden seams.

The vase is now even stronger and more radiant than before! "A repaired vessel is a mark of resilience," Turtoisy nods proudly.`
      },
      {
        id: 'choice-sweep-rosebush',
        verb: 'Sweep into the bushes',
        label: 'Push the broken shards under the thorny roses and pretend nothing happened',
        characterName: 'Grove Fox',
        characterImage: '/images/creatures/GroveFox.webp',
        virtueType: 'craft',
        virtuePoints: 10,
        goldReward: 15,
        lessonMoral: 'Hiding the truth leaves worry in your chest until you make things right.',
        resolutionText: `Grove Fox sweeps the shards away, but his chest aches with worry all afternoon.

Unable to bear the knot in his stomach, he runs back, digs out the shards, and tells the truth.

Turtoisy gives him a reassuring pat: "I saw you sweep them, little friend. But I waited because I knew your good heart would bring you back. Let us mend it together."`
      }
    ]
  },
  {
    id: 'story-montano-boulder',
    storyNumber: 'Tale 7',
    title: 'Montano and the heavy boulder',
    characters: [
      { name: 'Montano', image: '/images/creatures/Montano.webp' },
      { name: 'Rockie', image: '/images/creatures/Rockie.webp' }
    ],
    avatarImage: '/images/creatures/Montano.webp',
    locationName: 'The northern mountain quarry',
    narrativeText: `Montano the horned mountain guardian was trying to hoist a colossal granite boulder twice his size to prove his strength.

His hooves slipped on the gravel. His back muscles strained and twitched violently.

"GRRR!" Montano bellowed. "I must lift this in one mighty heave, or I am weak!"

Rockie sat nearby on a mossy ledge, calmly polishing a set of smooth training stones.

"Friend Montano," Rockie rumbled gently like rolling thunder. "A muscle grows strong through steady sets and correct form, not by breaking under reckless weight. If you injure your back today, you cannot train for a month. Drop the ego and lift with form!"`,
    dialogue: [
      {
        speaker: 'Montano',
        speakerImage: '/images/creatures/Montano.webp',
        text: 'Montano strained under a giant granite boulder with shaky hooves! "GRRR! I must lift this in one heave to prove I am strong!"'
      },
      {
        speaker: 'Rockie',
        speakerImage: '/images/creatures/Rockie.webp',
        text: 'Rockie rumbled calmly from a stone ledge: "Friend Montano! Real strength comes from steady form, not reckless weight. Lift with control so you can grow stronger tomorrow!"'
      }
    ],
    choices: [
      {
        id: 'choice-progressive-form',
        verb: 'Lift lighter with good form',
        label: 'Switch to a manageable stone and practice five controlled, perfect repetitions',
        characterName: 'Rockie',
        characterImage: '/images/creatures/Rockie.webp',
        virtueType: 'might',
        virtuePoints: 20,
        goldReward: 40,
        lessonMoral: 'Good form and progressive overload build real strength without injury.',
        resolutionText: `Montano rolls the colossal boulder aside and picks up a balanced stone.

He engages his core, plants his hooves firmly, and performs five smooth, powerful repetitions. His muscles burn with invigorating energy!

Rockie nods with a broad grin: "Now that is the form of a true citadel defender!"`
      },
      {
        id: 'choice-rest-day-stretch',
        verb: 'Take a rest day',
        label: 'Put the weights down and drink cool spring water with Rockie',
        characterName: 'Montano',
        characterImage: '/images/creatures/Montano.webp',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Rest days are when your body repairs itself and builds new strength.',
        resolutionText: `Montano sits in the cool shade of the quarry and shares a bowl of fresh spring water with Rockie.

As the afternoon sun warms the stone walls, his tight muscles relax and recover. He feels energized, confident, and ready for tomorrow's workout.`
      }
    ]
  },
  {
    id: 'story-buldour-blueprint',
    storyNumber: 'Tale 8',
    title: 'Buldour forges a blueprint',
    characters: [
      { name: 'Buldour', image: '/images/creatures/Buldour.webp' },
      { name: 'Sage Owl', image: '/images/creatures/SageOwl.webp' }
    ],
    avatarImage: '/images/creatures/Buldour.webp',
    locationName: 'The royal architect workshop',
    narrativeText: `Buldour stared at a massive blank architectural parchment. His drafting table was cluttered with rulers and compasses, but not a single stroke of ink had been drawn.

"I have to design the entire eastern aqueduct!" Buldour groaned, melting into a discouraged puddle of slime. "It is too complex! I don't know the exact water pressure, I don't know the arch height... I think I will just procrastinate and look out the window."

Up on a bookshelf, Sage Owl adjusted his spectacles and fluttered down.

"When a grand project looms before you, do not try to draw the whole aqueduct in one breath," Sage Owl whispered. "Divide your work into one twenty-minute focus block. Draw just the first foundation arch. That is all."`,
    dialogue: [
      {
        speaker: 'Buldour',
        speakerImage: '/images/creatures/Buldour.webp',
        text: 'Buldour slumped over a blank parchment: "The aqueduct is too big! I don\'t know where to start, so I am just going to stare out the window all day."'
      },
      {
        speaker: 'Sage Owl',
        speakerImage: '/images/creatures/SageOwl.webp',
        text: 'Sage Owl tapped his spectacles softly: "Do not draw the whole aqueduct at once, Buldour. Set a timer for twenty minutes and sketch just the first archway."'
      }
    ],
    choices: [
      {
        id: 'choice-focus-timer',
        verb: 'Focus for 20 minutes',
        label: 'Turn over a 20-minute sand timer and sketch only the first foundation archway',
        characterName: 'Sage Owl',
        characterImage: '/images/creatures/SageOwl.webp',
        virtueType: 'knowledge',
        virtuePoints: 20,
        goldReward: 35,
        lessonMoral: 'Starting with a short timer breaks procrastination and gets you into flow.',
        resolutionText: `Buldour turns over the small sand timer and dips his quill into black ink.

Because the goal is so small, his dread completely evaporates! Before the sand runs out, Buldour has drawn three elegant arches and is eager to finish the entire canal.`
      },
      {
        id: 'choice-outline-steps',
        verb: 'Write a 3-step checklist',
        label: 'Break the project into three bite-sized bullet points on scratch paper',
        characterName: 'Buldour',
        characterImage: '/images/creatures/Buldour.webp',
        virtueType: 'craft',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'A clear checklist turns an overwhelming project into easy daily steps.',
        resolutionText: `Buldour writes down three simple steps: 1. Measure canal width. 2. Choose granite type. 3. Sketch foundation.

Crossing off step one takes only two minutes and gives him a quick rush of motivation! Within an hour, his draft is complete.`
      }
    ]
  },
  {
    id: 'story-spirit-sprite-walk',
    storyNumber: 'Tale 9',
    title: 'Spirit Sprite wanders outside',
    characters: [
      { name: 'Spirit Sprite', image: '/images/creatures/SpiritSprite.webp' },
      { name: 'Leaf', image: '/images/creatures/Leaf.webp' }
    ],
    avatarImage: '/images/creatures/SpiritSprite.webp',
    locationName: 'The dim archives cellar',
    narrativeText: `Spirit Sprite had spent three days straight inside the dim castle archives, staring at glowing crystal screens and dusty scrolls.

Her ethereal glow had faded into a dull, tired grey. Her eyes stung and her head felt heavy.

"I feel so sluggish," Spirit Sprite muttered, floating barely an inch above the cold floor. "I have no energy or motivation left."

Leaf popped his head through the cellar door, bathed in warm afternoon sunlight.

"Little sprite!" Leaf cheered with a waving sprout. "You have been cooped up in the shadows for way too long! Even magical beings need fresh air and sunshine. Come take a ten-minute stroll through the clover meadows!"`,
    dialogue: [
      {
        speaker: 'Spirit Sprite',
        speakerImage: '/images/creatures/SpiritSprite.webp',
        text: 'Spirit Sprite drifted barely above the floor with a dim grey glow: "I have been inside for three days. My head hurts and I have no energy left."'
      },
      {
        speaker: 'Leaf',
        speakerImage: '/images/creatures/Leaf.webp',
        text: 'Leaf waved from the sunny doorway: "You need fresh air and sunlight, little sprite! Come take a ten-minute stroll across the flower meadows!"'
      }
    ],
    choices: [
      {
        id: 'choice-sunlight-walk',
        verb: 'Walk in the sunshine',
        label: 'Step outside into the meadows and feel the warm breeze on your face',
        characterName: 'Leaf',
        characterImage: '/images/creatures/Leaf.webp',
        virtueType: 'vitality',
        virtuePoints: 20,
        goldReward: 35,
        lessonMoral: 'Stepping outside into natural light clears brain fog and restores your energy.',
        resolutionText: `Spirit Sprite floats out into the sun-drenched meadow.

The golden sunbeams warm her spirit, and the fresh floral breeze clears her headache within minutes! Her glow returns in dazzling violet and cyan sparkles.`
      },
      {
        id: 'choice-deep-breaths',
        verb: 'Breathe fresh meadow air',
        label: 'Sit on the grassy bank with Leaf and take ten deep, revitalizing breaths',
        characterName: 'Spirit Sprite',
        characterImage: '/images/creatures/SpiritSprite.webp',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Oxygen and quiet nature reset your nervous system when feeling drained.',
        resolutionText: `Spirit Sprite and Leaf sit together on a grassy clover bank.

With each deep breath of crisp outdoor air, the tension in her chest releases, leaving her rejuvenated, cheerful, and ready for the evening.`
      }
    ]
  },
  {
    id: 'story-turtoisy-tea',
    storyNumber: 'Tale 10',
    title: 'Turtoisy\'s tea ceremony',
    characters: [
      { name: 'Turtoisy', image: '/images/creatures/Turtoisy.webp' },
      { name: 'Flamio', image: '/images/creatures/Flamio.webp' }
    ],
    avatarImage: '/images/creatures/Turtoisy.webp',
    locationName: 'The tranquil bamboo courtyard',
    narrativeText: `The sun was dipping below the ramparts of Castle Valoreth. In the courtyard, Archmage Turtoisy was heating a cast-iron kettle over embers.

Flamio rushed into the courtyard, crackling with nervous sparks. "Archmage! I must prepare five more combat scrolls for tomorrow! What if the Titan raids breach our gates? What if I didn't train hard enough today?!"

Turtoisy poured steaming herbal tea into two porcelain cups. A soothing aroma of mint and honey rose into the twilight air.

"Sit with me, Flamio," Turtoisy said in a peaceful voice. "Today's tasks are done. If you spend your evening fighting tomorrow's battles in your mind, you arrive at tomorrow already defeated. Hold this warm cup, breathe in the steam, and name three things you are grateful for today."`,
    dialogue: [
      {
        speaker: 'Flamio',
        speakerImage: '/images/creatures/Flamio.webp',
        text: 'Flamio crackled with nervous sparks: "Archmage! I must prepare more scrolls for tomorrow! What if I didn\'t train hard enough today?!"'
      },
      {
        speaker: 'Turtoisy',
        speakerImage: '/images/creatures/Turtoisy.webp',
        text: 'Turtoisy poured two cups of herbal tea: "Today\'s work is done, Flamio. Hold this warm cup, breathe in the steam, and name three things you are grateful for today."'
      }
    ],
    choices: [
      {
        id: 'choice-practice-gratitude',
        verb: 'Name 3 things you are grateful for',
        label: 'Sip the warm tea slowly and reflect on three good moments from today',
        characterName: 'Turtoisy',
        characterImage: '/images/creatures/Turtoisy.webp',
        virtueType: 'wellness',
        virtuePoints: 25,
        goldReward: 40,
        lessonMoral: 'Daily gratitude rewires your mind to notice progress instead of anxiety.',
        resolutionText: `Flamio holds the warm cup with both hands. He names three blessings: completing his morning habit, sharing a laugh with Leaf, and having a safe kingdom to protect.

His wild flames soften into a cozy, comforting glow. "Thank you, master," Flamio whispers peacefully.`
      },
      {
        id: 'choice-mindful-silence',
        verb: 'Sit in mindful silence',
        label: 'Listen to the wind rustling through the bamboo leaves without speaking',
        characterName: 'Flamio',
        characterImage: '/images/creatures/Flamio.webp',
        virtueType: 'knowledge',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Silent moments allow your mind to digest the day and regain peace.',
        resolutionText: `Flamio and Turtoisy sit quietly for five minutes, watching the steam curl toward the twilight stars.

The evening breeze rustles the bamboo, the fortress ward stones glow steadily, and Castle Valoreth rests in deep peace.`
      }
    ]
  }
];

export function getStoryById(id: string): StoryAdventure | undefined {
  return STORY_ADVENTURES.find(s => s.id === id);
}

export function getRandomAvailableStory(completedStoryIds: string[]): StoryAdventure {
  const uncompleted = STORY_ADVENTURES.filter(s => !completedStoryIds.includes(s.id));
  if (uncompleted.length > 0) {
    return uncompleted[Math.floor(Math.random() * uncompleted.length)]!;
  }
  return STORY_ADVENTURES[Math.floor(Math.random() * STORY_ADVENTURES.length)]!;
}
