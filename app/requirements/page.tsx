"use client"

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useCreatureStore } from '@/stores/creatureStore';
import styles from '../design-system/styles.module.css';

const chapters = [
  {
    title: 'Your Quest Begins',
    ariaLabel: 'chapter-your-quest-begins',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          The candlelight flickers as you open this tome, and a gentle wind whispers through the pages. Welcome, brave soul, to the world of Thrivehaven. Here, every dawn brings a new chance to shape your destiny. Your daily deeds are not mere tasks—they are the seeds from which legends grow. As you rise, so too does your kingdom, blossoming with every habit you nurture and every quest you dare to undertake.
        </p>
        <p className="text-base text-amber-200">
          Step forth, for your legend is about to unfold. Wonders await those who act with courage and heart.
        </p>
      </>
    ),
  },
  {
    title: 'The Realm of Thrivehaven',
    ariaLabel: 'chapter-the-realm',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          Beyond the castle gates lies a living tapestry—your realm. Each day you conquer brings new life: forests thicken, rivers carve their paths, cities rise from humble beginnings, and castles pierce the sky. The land remembers your victories and whispers of your journey in every leaf and stone.
        </p>
        <p className="text-base text-amber-200">
          Return often to witness your progress. New locations will reveal themselves, and mysterious events will beckon you deeper into the heart of Thrivehaven.
        </p>
      </>
    ),
  },
  {
    title: 'Creature Achievements',
    ariaLabel: 'chapter-creature-achievements',
    content: null, // Will be filled dynamically
  },
  {
    title: 'Quests & Deeds',
    ariaLabel: 'chapter-quests-deeds',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          The path to greatness is paved with quests of Might, Knowledge, Honor, Craft, and Vitality. Each challenge is a story waiting to be written. Complete them to earn gold, wisdom, and renown. Some quests are daily rituals, others are epic milestones that echo through the ages.
        </p>
        <p className="text-base text-amber-200">
          Your quest log is your map to glory. Let it guide you to deeds worthy of song.
        </p>
      </>
    ),
  },
  {
    title: 'Inventory & Treasures',
    ariaLabel: 'chapter-inventory-treasures',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          As you journey, treasures and tools will fill your pack: gleaming Weapons, sturdy Armor, potent Potions, ancient Scrolls, and glittering Treasures. Some are trophies of your triumphs, others hold the power to unlock new paths or shield you from peril.
        </p>
        <p className="text-base text-amber-200">
          Visit your inventory to marvel at your spoils and prepare for the adventures yet to come.
        </p>
      </>
    ),
  },
  {
    title: 'Progress & Rewards',
    ariaLabel: 'chapter-progress-rewards',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          With every deed, your legend grows. Gold fills your coffers, your skills sharpen, and new forms of self-expression become yours to claim. The realm itself will change to reflect your journey—castles will gleam brighter, forests will grow deeper, and your name will be whispered with awe.
        </p>
        <p className="text-base text-amber-200">
          Celebrate your victories, track your stats, and let the world of Thrivehaven become the story of you.
        </p>
      </>
    ),
  },
  {
    title: 'Keyboard Shortcuts',
    ariaLabel: 'chapter-keyboard-shortcuts',
    content: (
      <>
        <p className="text-lg font-serif text-amber-100 mb-4">
          Master the art of swift navigation with these keyboard shortcuts. From quick quest access to seamless realm management, these commands will make your journey through Thrivehaven even more fluid.
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-200 mb-2">Global Navigation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-100">⌘/Ctrl + K</span>
                <span className="text-gray-300">Open Command Palette</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">⌘/Ctrl + Shift + K</span>
                <span className="text-gray-300">Quick Quest Access</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">⌘/Ctrl + I</span>
                <span className="text-gray-300">Open Inventory</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">⌘/Ctrl + C</span>
                <span className="text-gray-300">Character Stats</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-amber-200 mb-2">Realm & Kingdom</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-100">R</span>
                <span className="text-gray-300">Return to Realm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">K</span>
                <span className="text-gray-300">Kingdom Overview</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">M</span>
                <span className="text-gray-300">World Map</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">Q</span>
                <span className="text-gray-300">Quest Log</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-amber-200 mb-2">Game Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-100">Space</span>
                <span className="text-gray-300">Place Selected Tile</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">Enter</span>
                <span className="text-gray-300">Confirm Action</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">Escape</span>
                <span className="text-gray-300">Cancel/Close</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">Tab</span>
                <span className="text-gray-300">Next Element</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-amber-200 mb-2">Accessibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-100">F1</span>
                <span className="text-gray-300">Help & Shortcuts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">F2</span>
                <span className="text-gray-300">Toggle High Contrast</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">F3</span>
                <span className="text-gray-300">Focus Mode</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100">F4</span>
                <span className="text-gray-300">Screen Reader Mode</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-base text-amber-200 mt-4">
          These shortcuts will become second nature as you explore Thrivehaven. Use them to navigate swiftly and focus on your adventures!
        </p>
      </>
    ),
  },
];

export default function RequirementsPage() {
  const { creatures } = useCreatureStore();
  const [creatureHints, setCreatureHints] = useState<{ name: string; hint: string }[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    // Custom, non-spoiler hints for each creature
    const customHints: Record<string, string> = {
      Necrion: 'Venture forwards and discoveries will walk towards you.',
      Flamio: 'Where forests fall, embers rise.',
      Embera: 'The flames grow stronger with each fallen tree.',
      Vulcana: 'Only the most persistent fire can awaken the volcano spirit.',
      Dolphio: 'Where new waters flow, playful spirits follow.',
      Divero: 'Guardians of the deep reward those who expand their domain.',
      Flippur: 'Mastery of the waters brings forth the rarest dwellers.',
      Leaf: 'New growth brings gentle guardians to your side.',
      Oaky: 'The forest rewards those who nurture its growth.',
      Seqoio: 'Vast woodlands attract mighty spirits.',
      Rockie: 'Shattered peaks reveal hidden life.',
      Buldour: 'Continued upheaval awakens ancient mountain spirits.',
      Montano: 'The master of destroyed peaks awaits the persistent.',
      Icey: 'Frozen lands are home to chilly companions.',
      Blizzey: 'The cold grows stronger as the ice spreads.',
      Hailey: 'Supreme rulers of the frost appear in vast frozen realms.',
      Sparky: 'Urban energy attracts electric surprises.',
      Boulty: "The city's growth brings powerful currents.",
      Voulty: "Master the city's network to meet its electric champion.",
      Drakon: 'Great deeds awaken legendary dragons.',
      Fireon: 'Exceptional accomplishments draw mighty dragons.',
      Valerion: 'Only the supreme can summon the dragon lord.',
      Shello: 'Milestones bring cheerful companions.',
      Turtoisy: 'Wisdom comes to those who persist through many milestones.',
      Turtlo: 'The world turtle appears for the ultimate achiever.'
    };
    const hints = creatures.map(creature => ({
      name: creature.name,
      hint: customHints[creature.name] || 'A mysterious creature awaits those who explore every corner.'
    }));
    setCreatureHints(hints);
  }, [creatures]);

  // Dynamically fill the Creature Achievements chapter
  const dynamicChapters = chapters.map((chapter, idx) => {
    if (chapter.title === 'Creature Achievements') {
      return {
        ...chapter,
        content: (
          <>
            <p className="text-lg font-serif text-amber-100 mb-4">
              In the wilds and shadows of Thrivehaven, legendary creatures await those who prove their worth. Each beast is bound to a secret feat—can you unravel the mysteries and earn their allegiance?
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-4 text-amber-200" aria-label="achievements-list">
              {creatureHints.map(({ name, hint }) => (
                <li key={name}><span className="font-semibold text-amber-100">{name}</span>: {hint}</li>
              ))}
            </ul>
          </>
        ),
      };
    }
    return chapter;
  });

  const currentChapter = dynamicChapters[page];

  if (!currentChapter) {
    return (
      <main className="container max-w-2xl py-8 flex flex-col items-center" aria-label="requirements-book-section">
        <h1 className="text-4xl font-serif font-bold mb-8 text-amber-200" aria-label="book-title">Adventurer&#39;s Guide</h1>
        <div className={`p-6 w-full min-h-[350px] flex flex-col items-center justify-center rounded-lg shadow-lg border border-amber-800/20 bg-gradient-to-b from-black to-gray-900 ${styles['preview-card']}`} aria-label="book-page-card">
          <span className="text-lg text-amber-100">Loading chapter...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-2xl py-8 flex flex-col items-center" aria-label="requirements-book-section">
      <h1 className="text-4xl font-serif font-bold mb-8 text-amber-200" aria-label="book-title">Adventurer&#39;s Guide</h1>
      <div className={`p-6 w-full min-h-[350px] flex flex-col rounded-lg shadow-lg border border-amber-800/20 bg-gradient-to-b from-black to-gray-900 ${styles['preview-card']}`} aria-label="book-page-card">
        <div aria-label="book-page-header" className="mb-4">
          <h2 className="text-2xl font-serif text-amber-300" aria-label="book-chapter-title">{currentChapter.title}</h2>
        </div>
        <div aria-label={currentChapter.ariaLabel} className="flex-1 flex flex-col justify-center">
          {currentChapter.content}
        </div>
        <div className="flex justify-between mt-8" aria-label="book-page-footer">
          <Button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="previous-chapter"
            variant="secondary"
            className="font-serif text-lg"
          >
            Previous Page
          </Button>
          <span className="text-sm text-amber-400 font-serif" aria-label="chapter-indicator">
            Chapter {page + 1} of {dynamicChapters.length}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(dynamicChapters.length - 1, p + 1))}
            disabled={page === dynamicChapters.length - 1}
            aria-label="next-chapter"
            variant="secondary"
            className="font-serif text-lg"
          >
            Next Page
          </Button>
        </div>
      </div>
    </main>
  );
} 