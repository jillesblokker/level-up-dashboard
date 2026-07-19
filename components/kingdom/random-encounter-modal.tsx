"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gift, Wind, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { updateCharacterStats } from '@/lib/character-stats-service';
import { addToInventory } from '@/lib/inventory-manager';
import { useUser } from '@clerk/nextjs';
import { EncounterType } from '@/lib/encounter-trigger-service';

interface EncounterData {
  title: string;
  subtitle: string;
  characterName: string;
  characterRole: string;
  avatarImg: string;
  heroImg: string;
  themeColor: string;
  badgeText: string;
  description: string;
  actionType: 'meditate_timer' | 'claim_direct' | 'choice_forge' | 'cards_reveal';
}

const ENCOUNTER_DATA: Record<EncounterType, EncounterData> = {
  meditation: {
    title: 'The Autumn Sage Speaks',
    subtitle: 'A Moment of Deep Serenity',
    characterName: 'Zenith',
    characterRole: 'Forest Monk Spirit',
    avatarImg: '/images/creatures/Leaf.webp',
    heroImg: '/images/realm-header.webp',
    themeColor: 'from-emerald-900/80 via-zinc-950 to-zinc-950 border-emerald-500/40',
    badgeText: 'Zen Encounter',
    description: 'To construct a great kingdom, one must first find stillness within. Lay down, close your eyes, and let the wind pass through for 10 seconds.',
    actionType: 'meditate_timer',
  },
  quest_completion: {
    title: 'The Royal Gala',
    subtitle: 'Queen Beatrice of Sunspire Visits',
    characterName: 'Queen Beatrice',
    characterRole: 'Monarch of Sunspire',
    avatarImg: '/images/allies-header.webp',
    heroImg: '/images/quests-header.webp',
    themeColor: 'from-amber-900/80 via-zinc-950 to-zinc-950 border-amber-500/40',
    badgeText: 'Royal Invitation',
    description: 'Impressed by your realm’s steadfast quest completions, Queen Beatrice has arrived with her royal court to host a grand ball in your honor!',
    actionType: 'claim_direct',
  },
  forge: {
    title: 'The Fire-Sprite’s Temper',
    subtitle: 'A Fiery Chimney Guest',
    characterName: 'Ignis',
    characterRole: 'Forge Ember Sprite',
    avatarImg: '/images/creatures/Embera.webp',
    heroImg: '/images/daily-hub-hero.webp',
    themeColor: 'from-red-900/80 via-zinc-950 to-zinc-950 border-red-500/40',
    badgeText: 'Forge Encounter',
    description: 'Your continuous hammering woke up Ignis from the furnace! While grumbling about the noise, the sprite offers to inspect your gear.',
    actionType: 'choice_forge',
  },
  harvest: {
    title: 'The Great Harvest Elk',
    subtitle: 'Spiritual Soil Bloom',
    characterName: 'Seqoio',
    characterRole: 'Guardian Spirit of the Soil',
    avatarImg: '/images/creatures/Seqoio.webp',
    heroImg: '/images/kingdom-header.webp',
    themeColor: 'from-green-900/80 via-zinc-950 to-zinc-950 border-green-500/40',
    badgeText: 'Harvest Wonder',
    description: 'A magnificent glowing Harvest Elk wanders into your farmland. Your wandering citizens bow in reverence as the soil surges with ancient energy!',
    actionType: 'claim_direct',
  },
  login: {
    title: 'The Lost Merchant Crate',
    subtitle: 'Barnaby’s Overturned Wagon',
    characterName: 'Barnaby',
    characterRole: 'Wandering Trade Scholar',
    avatarImg: '/images/riddle-sage.webp',
    heroImg: '/images/daily-hub-hero.webp',
    themeColor: 'from-purple-900/80 via-zinc-950 to-zinc-950 border-purple-500/40',
    badgeText: 'Caravan Encounter',
    description: 'Relieved to reach your safe kingdom borders after a long expedition, Barnaby offers you a mystery crate from his trade wagon!',
    actionType: 'cards_reveal',
  },
  feed: {
    title: 'The Gluttonous Slime',
    subtitle: 'Surprise Sky Drop',
    characterName: 'Buldour',
    characterRole: 'Greedy Slime Creature',
    avatarImg: '/images/creatures/Buldour.webp',
    heroImg: '/images/character-header.webp',
    themeColor: 'from-blue-900/80 via-zinc-950 to-zinc-950 border-blue-500/40',
    badgeText: 'Gluttonous Encounter',
    description: 'A gigantic slime drops from above and snatches the food! After gulping it down, it burps up a glowing treasure swallowed from deep in the dungeons.',
    actionType: 'claim_direct',
  },
};

export function RandomEncounterModal() {
  const { user } = useUser();
  const [currentType, setCurrentType] = useState<EncounterType | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvt = e as CustomEvent<{ eventType: EncounterType }>;
      if (customEvt.detail?.eventType) {
        setCurrentType(customEvt.detail.eventType);
        setTimerSeconds(10);
        setIsTimerActive(false);
        setTimerCompleted(false);
        setSelectedCard(null);
        setIsClaiming(false);
      }
    };

    window.addEventListener('trigger-random-encounter', handleTrigger);
    return () => {
      window.removeEventListener('trigger-random-encounter', handleTrigger);
    };
  }, []);

  // Meditation timer Countdown loop
  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          setTimerCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive]);

  if (!currentType) return null;

  const data = ENCOUNTER_DATA[currentType];

  const handleClose = () => {
    setCurrentType(null);
  };

  // 1. Meditation Claim (10x Water, 10x Planks)
  const handleClaimMeditation = async () => {
    if (!user?.id || isClaiming) return;
    setIsClaiming(true);
    try {
      await addToInventory(user.id, {
        id: 'material-water',
        name: 'Fresh Spring Water',
        quantity: 10,
        type: 'material',
        category: 'material',
        rarity: 'common',
      } as any);

      await addToInventory(user.id, {
        id: 'material-planks',
        name: 'Building Planks',
        quantity: 10,
        type: 'material',
        category: 'material',
        rarity: 'common',
      } as any);

      toast.success('Zenith’s Blessing Granted! 🍃', {
        description: 'Received 10x Water and 10x Building Planks.',
      });
      handleClose();
    } catch (e) {
      toast.error('Failed to claim rewards.');
    } finally {
      setIsClaiming(false);
    }
  };

  // 2. Queen's Gala Claim (250 EXP, 10 Gems)
  const handleClaimQueenGala = async () => {
    if (!user?.id || isClaiming) return;
    setIsClaiming(true);
    try {
      await updateCharacterStats({ experience: 250 });
      // Fetch current gems & update
      const statsRes = await fetch('/api/character-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const curGems = statsData.stats?.gems || statsData.gems || 0;
        await fetch('/api/character-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: { gems: curGems + 10 } }),
        });
      }

      toast.success('Royal Celebration Concluded! 👑✨', {
        description: 'Gained +250 EXP and +10 Royal Gems!',
      });
      handleClose();
    } catch (e) {
      toast.error('Failed to claim gala rewards.');
    } finally {
      setIsClaiming(false);
    }
  };

  // 3. Forge Choice Claim
  const handleForgeChoice = async (choice: 'stoke' | 'apology') => {
    if (!user?.id || isClaiming) return;
    setIsClaiming(true);
    try {
      if (choice === 'stoke') {
        await updateCharacterStats({ experience: 100 });
        toast.success('Ember Sprite Stoked the Flames! 🔥🔨', {
          description: 'Forge temperature maxed out! Gained +100 EXP.',
        });
      } else {
        await addToInventory(user.id, {
          id: 'material-crystal',
          name: 'Fire Essence Crystal',
          quantity: 3,
          type: 'material',
          category: 'material',
          rarity: 'rare',
        } as any);
        toast.success('Ember Sprite Left a Gift! 💎', {
          description: 'Received 3x Fire Essence Crystals.',
        });
      }
      handleClose();
    } catch (e) {
      toast.error('Failed to process forge choice.');
    } finally {
      setIsClaiming(false);
    }
  };

  // 4. Harvest Elk / Glutton Slime Claim
  const handleClaimGeneralEncounter = async () => {
    if (!user?.id || isClaiming) return;
    setIsClaiming(true);
    try {
      if (currentType === 'harvest') {
        await updateCharacterStats({ gold: 500 });
        toast.success('Soil Blessed by the Harvest Elk! 🦌🌾', {
          description: 'Harvest yields surged! Gained +500 Gold.',
        });
      } else if (currentType === 'feed') {
        await addToInventory(user.id, {
          id: 'key-golden',
          name: 'Golden Chest Key',
          quantity: 1,
          type: 'key',
          category: 'consumable',
          rarity: 'epic',
        } as any);
        toast.success('Slime Burped Up Treasure! 🟢🔑', {
          description: 'Found 1x Golden Chest Key.',
        });
      }
      handleClose();
    } catch (e) {
      toast.error('Failed to claim rewards.');
    } finally {
      setIsClaiming(false);
    }
  };

  // 5. Merchant Card Flip
  const handleFlipCard = async (cardIdx: number) => {
    if (!user?.id || isClaiming || selectedCard !== null) return;
    setSelectedCard(cardIdx);
    setIsClaiming(true);

    try {
      if (cardIdx === 0) {
        await updateCharacterStats({ build_tokens: 5 });
        toast.success('Barnaby Unwrapped a Blueprint! 📜', {
          description: 'Gained +5 Build Tokens.',
        });
      } else if (cardIdx === 1) {
        await updateCharacterStats({ gold: 300 });
        toast.success('Barnaby Unwrapped Gold Coin Sack! 🪙', {
          description: 'Gained +300 Gold.',
        });
      } else {
        await addToInventory(user.id, {
          id: 'potion-double-harvest',
          name: 'Double Harvest Draught',
          quantity: 1,
          type: 'potion',
          category: 'consumable',
          rarity: 'uncommon',
        } as any);
        toast.success('Barnaby Unwrapped an Elixir! 🧪', {
          description: 'Received 1x Double Harvest Draught.',
        });
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (e) {
      toast.error('Failed to claim card reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog open={!!currentType} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[#0f1115] border border-amber-950/40 text-white overflow-hidden shadow-2xl p-0 rounded-2xl">
        {/* Header Hero Banner */}
        <div className="relative h-44 w-full overflow-hidden border-b border-white/10 flex items-end">
          <Image
            src={data.heroImg}
            alt={data.title}
            fill
            className="object-cover brightness-75 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/50 to-transparent" />
          
          <div className="relative z-10 p-5 flex items-center gap-4 w-full">
            {/* Character Avatar Container */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-zinc-950 shadow-xl shrink-0">
              <Image
                src={data.avatarImg}
                alt={data.characterName}
                fill
                className="object-cover select-none pointer-events-none"
              />
            </div>

            <div className="space-y-0.5">
              <Badge className="bg-amber-600/30 text-amber-300 border border-amber-500/30 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 mb-1">
                {data.badgeText}
              </Badge>
              <DialogTitle className="font-cardo font-bold text-xl text-amber-100">
                {data.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs italic">
                {data.subtitle} • {data.characterName} ({data.characterRole})
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 font-serif italic">
            &quot;{data.description}&quot;
          </p>

          {/* Action Renderers */}
          {/* A. Meditation 10s Timer */}
          {data.actionType === 'meditate_timer' && (
            <div className="flex flex-col items-center space-y-4">
              {!timerCompleted ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative w-24 h-24 rounded-full border-2 border-emerald-500/40 flex items-center justify-center bg-emerald-950/20">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-emerald-400"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="font-serif text-3xl font-bold text-emerald-300">
                      {timerSeconds}s
                    </span>
                  </div>

                  {!isTimerActive ? (
                    <Button
                      onClick={() => setIsTimerActive(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-lg flex items-center gap-2"
                    >
                      <Wind className="w-4 h-4" /> Close Eyes & Meditate (10s)
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                      Keep your eyes closed and remain still...
                    </span>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleClaimMeditation}
                  disabled={isClaiming}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Claim Zenith&apos;s Gift (10x Water + 10x Planks)
                </Button>
              )}
            </div>
          )}

          {/* B. Queen's Gala / Harvest Elk / Glutton Slime Direct Claim */}
          {data.actionType === 'claim_direct' && (
            <Button
              onClick={
                currentType === 'quest_completion'
                  ? handleClaimQueenGala
                  : handleClaimGeneralEncounter
              }
              disabled={isClaiming}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {currentType === 'quest_completion'
                ? 'Join Royal Ball (+250 EXP & +10 Gems)'
                : currentType === 'harvest'
                ? 'Bow to Harvest Elk (+500 Gold)'
                : 'Take Slime Treasure (1x Golden Key)'}
            </Button>
          )}

          {/* C. Forge Choice */}
          {data.actionType === 'choice_forge' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => handleForgeChoice('stoke')}
                disabled={isClaiming}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg flex flex-col items-center gap-1"
              >
                <Flame className="w-4 h-4" />
                <span>Stoke Furnace</span>
                <span className="text-[9px] font-normal text-orange-200">+100 EXP Boost</span>
              </Button>

              <Button
                onClick={() => handleForgeChoice('apology')}
                disabled={isClaiming}
                variant="outline"
                className="border-red-500/40 text-red-300 hover:bg-red-950/40 font-bold text-xs py-3 rounded-xl flex flex-col items-center gap-1"
              >
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>Apologize to Sprite</span>
                <span className="text-[9px] font-normal text-red-400">3x Fire Crystals</span>
              </Button>
            </div>
          )}

          {/* D. Cards Reveal */}
          {data.actionType === 'cards_reveal' && (
            <div className="space-y-3">
              <p className="text-[10px] text-zinc-400 text-center font-semibold uppercase tracking-wider">
                Choose a Mystery Crate:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => {
                  const isPicked = selectedCard === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={selectedCard === null ? { scale: 1.05 } : {}}
                      onClick={() => handleFlipCard(idx)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        isPicked
                          ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          : selectedCard !== null
                          ? 'bg-zinc-950 border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-zinc-900 border-white/10 hover:border-purple-500/40 hover:bg-purple-950/20'
                      }`}
                    >
                      <Gift className="w-6 h-6 text-purple-400 mb-1" />
                      <span className="text-[10px] font-bold">
                        {isPicked ? 'Claimed!' : `Crate #${idx + 1}`}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
