import { StoryAdventure } from '@/lib/storybook-manager';

export const STORY_ADVENTURES: StoryAdventure[] = [
  {
    id: 'story-sprint-greenbriar',
    storyNumber: 'Scene 0042',
    title: 'The great sprint of Greenbriar Vale',
    characters: ['Bramble the Hare', 'Master Sheldon', 'Leafio'],
    avatarImage: '/images/creatures/007.webp', // Leafio
    locationName: 'Greenbriar Vale • Mile marker 0',
    narrativeText: `Bramble the Hare was panting so hard his ears were flapping in reverse.

"I don't get it, Leafio!" Bramble wheezed, clutching a stopwatch fashioned from a hollowed walnut. "I ran forty laps around the Barracks at dawn, sprinted up Dragon Peak before breakfast, and now my hind legs feel like boiled parsnips. Meanwhile, Master Sheldon over there hasn't even broken a sweat!"

Down the lane, Master Sheldon was performing what looked like exceptionally slow tai chi on a sun-warmed boulder. The elderly tortoise adjusted his wire-rim spectacles, took a deliberate, metronomic sip of spring water, and glided forward with alarming, effortless grace.

"Speed is an illusion of the impatient, young Bramble," Sheldon rumbled with serene gravel in his voice. "A true runner does not fight the path; they harmonize with their breath. Now, how shall we prepare you for tomorrow's 5km Greenbriar relay?"`,
    choices: [
      {
        id: 'choice-sheldon-pace',
        verb: 'Run with Sheldon',
        label: 'Mirror his slow, unbroken cadence and rhythmic breathing',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Real-life pacing beats erratic burnout. Consistency outlasts panic.',
        resolutionText: `You convince Bramble to put away his walnut stopwatch and match Sheldon's steady rhythm step for step. 

At first, Bramble twitches with nervous impatience. But after three kilometers without stopping to gasp for air, a wide grin spreads across his snout.

"Wait... steady pacing actually beats reckless burning?!" Bramble gasps in delight. Sheldon chuckles softly and presents Bramble with an enchanted pair of woven running socks. Tomorrow's race is already won in spirit.`
      },
      {
        id: 'choice-leafio-interval',
        verb: 'Draft an interval plan',
        label: 'Design a structured 2-minute jog and stretch routine with Leafio',
        virtueType: 'knowledge',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Structured systems turn chaotic energy into sustainable athletic progress.',
        resolutionText: `You sit down with Leafio to map out an aerodynamic interval schedule: 2 minutes of relaxed jogging, 30 seconds of brisk stride, followed by hamstring stretches.

Bramble follows the visual diagram to the letter. His chaotic burst energy is finally channeled into a predictable, sustainable training routine. Even Sheldon gives an approving slow nod from his rock.`
      },
      {
        id: 'choice-bramble-dash',
        verb: 'Unleash a sprint dash',
        label: 'Challenge Sheldon to an immediate 50-pace sprint to prove raw power',
        virtueType: 'might',
        virtuePoints: 10,
        goldReward: 20,
        lessonMoral: 'Humility and recovery are essential when physical limits are tested.',
        resolutionText: `Bramble dashes forward in an explosive cloud of dust! For fifty paces, he is a blur of pure furry fury. 

But at pace fifty-one, his lungs screech in protest, and he flops dramatically onto the clover. Sheldon calmly glides past with a steaming cup of herbal tea balanced steadily on his shell.

"A sprint without endurance is just a very loud trip to the physician," Sheldon smiles kindly, offering Bramble a cooling restorative tonic.`
      }
    ]
  },
  {
    id: 'story-leafio-tidyup',
    storyNumber: 'Scene 0043',
    title: "Leafio's towering tidy-up",
    characters: ['Leafio', 'Rockie'],
    avatarImage: '/images/creatures/010.webp', // Rockie
    locationName: "Leafio's botanical cottage",
    narrativeText: `Leafio's cottage looked as if a floral cyclone had struck. Scrolls of daily habits were tangled in creeping ivy, alchemy jars teetered over water basins, and a precarious tower of unfiled kingdom receipts threatened to bury his sleeping mat.

Leafio was curled into a tiny green ball under a fern. "It's too much," he squeaked, his sprout drooping sadly. "I wanted to organize everything, but every time I pick up one scroll, three more roll under the cupboard. If I don't tidy this up, the Duke will evict me!"

At the doorway, Rockie the stone golem peered in. He couldn't enter without knocking the lintel down, but his gravelly voice echoed warmly: "Big mountain made of small pebbles. Why carry whole mountain at once?"`,
    choices: [
      {
        id: 'choice-two-minute-rule',
        verb: 'Apply the 2-minute rule',
        label: 'Clear only the study desk first and ignore the rest of the room',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 40,
        lessonMoral: 'Starting with a micro-task breaks task paralysis and builds instant momentum.',
        resolutionText: `You tell Leafio to ignore the towering chaos and spend exactly two minutes clearing just the top surface of his study desk.

Seeing one clean, polished oak surface brings an immediate spark back to Leafio's eyes. Momentum takes over naturally: within twenty minutes, scrolls are rolled, jars are shelved, and the cottage feels peaceful again.

"Small steps really do banish the overwhelm!" Leafio beams, standing tall.`
      },
      {
        id: 'choice-rockie-haul',
        verb: 'Sort with Rockie',
        label: 'Enlist Rockie to carry the armoire out and organize on the lawn',
        virtueType: 'craft',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Sharing the burden with friends turns overwhelming chores into cheerful team rituals.',
        resolutionText: `Rockie happily lifts Leafio's heavy oak armoire onto the front lawn with one stone hand.

With the floor clear, you, Leafio, and neighboring citizens form a merry bucket brigade, categorizing items into "Keep", "Recycle", and "Apotheca Compost". By sundown, the cottage is an orderly sanctuary, and Rockie gets a fresh coat of moss polish as thanks.`
      },
      {
        id: 'choice-avant-garde',
        verb: 'Declare modern art',
        label: 'Label the mess an avant-garde organic art installation',
        virtueType: 'honor',
        virtuePoints: 10,
        goldReward: 50,
        lessonMoral: 'A playful sense of humor helps defuse stress before tackling real responsibilities.',
        resolutionText: `Leafio places a gilded velvet rope around the cluttered room and writes an ornate sign: "The Creative Mind in Bloom".

When the Duke arrives for inspection, he adjusts his monocle, visibly touched by the bold conceptual statement, and awards Leafio a modest cultural grant. Leafio laughs sheepishly, promising to actually sweep it up tomorrow morning.`
      }
    ]
  },
  {
    id: 'story-flamio-midnight',
    storyNumber: 'Scene 0044',
    title: "Flamio's midnight ember",
    characters: ['Flamio', 'Sage Owl'],
    avatarImage: '/images/creatures/001.webp', // Flamio
    locationName: 'High watchtower hearth',
    narrativeText: `It was three hours past midnight, but Flamio was crackling and spitting sparks like dry pine in a furnace. His flames were glowing an aggressive neon blue, and his little charcoal eyes were darting wildly.

"I can't sleep, Sage Owl!" Flamio hissed, pacing across an iron trivet. "There are too many sparks in my head! What if the dungeon monsters invade? What if I forgot to water my herbs? What if someone challenges my House Cup streak?!"

Perched on a cedar beam, Sage Owl closed his heavy tome with a gentle thump. He peered down over his spectacles with unhurried calm.

"Little fire," the owl murmured softly, "a flame that burns through the midnight hour has no fuel left to light the morning hearth. Your mind is simply choked with ash. Shall we teach your embers how to rest?"`,
    choices: [
      {
        id: 'choice-bellows-breathing',
        verb: 'Practice bellows breathing',
        label: 'Dim the magical lamps and guide Flamio through slow 4-7-8 breathing',
        virtueType: 'wellness',
        virtuePoints: 20,
        goldReward: 30,
        lessonMoral: 'Deliberate down-regulation and screen/light reduction allows the nervous system to rest.',
        resolutionText: `You dim every magical lantern in the watchtower and guide Flamio through a slow 4-7-8 breathing cadence. 

With each measured exhale, his aggressive neon blue flare softens into a cozy, golden hearth glow. Within ten minutes, a quiet, peaceful snore rises from the ashes. Tomorrow, his fire will burn twice as bright.`
      },
      {
        id: 'choice-slate-braindump',
        verb: 'Perform a brain dump',
        label: 'Write down every worry on a slate tablet and schedule it for noon',
        virtueType: 'knowledge',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Externalizing worries onto paper clears working memory for restful sleep.',
        resolutionText: `You hand Flamio a slate tablet and a stick of chalk. Together, you write down every single thought swirling in his head, deliberately marking each one: "To be handled at noon tomorrow."

Seeing his worries safely stored outside his mind allows Flamio's thoughts to still. He curls into an ember ball and immediately drifts into deep slumber.`
      },
      {
        id: 'choice-soothing-tea',
        verb: 'Brew chamomile tea',
        label: 'Visit the Grand Apotheca to brew an ice fern and chamomile infusion',
        virtueType: 'craft',
        virtuePoints: 15,
        goldReward: 25,
        lessonMoral: 'A soothing evening wind-down ritual signals to your body that the day is complete.',
        resolutionText: `You quickly brew an herbal infusion of dried chamomile petals and chilled ice fern leaves. 

Flamio sips the soothing tea with pleasant crackles. The cooling herbs soothe his smoky core without extinguishing his spirit. A cozy yawn escapes him as he curls up beside the warm kettle.`
      }
    ]
  },
  {
    id: 'story-oaky-posture',
    storyNumber: 'Scene 0045',
    title: "Oaky's stubborn posture",
    characters: ['Oaky', 'Dolphio'],
    avatarImage: '/images/creatures/008.webp', // Oaky
    locationName: 'Sunken canal fountain',
    narrativeText: `Oaky the tree guardian was standing at the edge of the palace courtyard, looking as rigid as petrified stone. His wooden branches were locked tight, his wooden shoulders were pinned to his ears, and every time he turned his head, a loud "CRACK-CREAK" echoed across the square.

"I have been standing guard for twelve hours straight," Oaky announced proudly, unable to look down. "True guardians do not slouch! True guardians do not bend! I am a paragon of rigid discipline!"

Splashing up from the canal basin, Dolphio the water dolphin somersaulted through the air with effortless agility, sending cool droplets onto Oaky's dry bark.

"Friend Oaky," Dolphio clicked playfully, "the willow bends in the storm and survives; the stiff branch snaps in the breeze! When was the last time you stretched your roots and breathed?"`,
    choices: [
      {
        id: 'choice-willow-stretch',
        verb: 'Do willow stretches',
        label: 'Guide Oaky through gentle spinal mobility and deep shoulder releases',
        virtueType: 'vitality',
        virtuePoints: 15,
        goldReward: 35,
        lessonMoral: 'Physical flexibility and mental adaptability prevent burnout and stiffness.',
        resolutionText: `You teach Oaky how to loosen his rigid bark, rolling his wooden shoulders back and taking deep, restorative breaths while stretching his branches upward like a weeping willow.

A long, satisfying sigh escapes the guardian as tension dissolves from his wooden spine. "My branches feel light as birch leaves!" he marvels, swaying gently in the evening wind.`
      },
      {
        id: 'choice-canal-swim',
        verb: 'Float in the canal',
        label: 'Take a restorative float in Dolphio’s spring water fountain',
        virtueType: 'wellness',
        virtuePoints: 15,
        goldReward: 30,
        lessonMoral: 'Hydrotherapy and stepping away from your post restores physical vitality.',
        resolutionText: `Dolphio invites Oaky to wade into the buoyancy of the canal basin. 

Weightlessness relieves the strain on Oaky's deep roots. The cool water rehydrates his moss, and Dolphio playfully squirts a gentle fountain arc over his crown. Oaky emerges refreshed, ready to stand guard with effortless ease.`
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
