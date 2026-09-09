"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from "react"
import { Wind, Sparkles, Check, Flame, Shield, Users, Clock, Trophy, Trash2, ArrowRight, Compass, Anchor, MapPin, Gauge, Radio, Volume2, VolumeX, MessageSquare, ChevronRight, Zap, Coins } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

import { useCitizensStore } from "@/stores/citizensStore"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";
import { addToCharacterStat } from "@/lib/character-stats-service";
import { playSFX } from "@/lib/sound-manager";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { unwrapApiResponse } from "@/lib/api-response-unwrapper";

// --- SKYDOCK WEB AUDIO SYNTHESIZER ---
class SkydockAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playBellChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    [0, 0.18].forEach((delay) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
      }, delay * 1000);
    });
  }

  playSteamHorn() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 1.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  }

  playTelegraphClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playChestUnlock() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }, idx * 90);
    });
  }
}

const skydockAudio = new SkydockAudioEngine();

// --- 7 CORE HABIT CATEGORIES & PERKS ---
export type HabitCategory = 'knowledge' | 'might' | 'vitality' | 'wellness' | 'craft' | 'honor' | 'castle';

export interface CategoryMetadata {
  id: HabitCategory;
  name: string;
  emoji: string;
  colorName: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  gradient: string;
}

export const HABIT_CATEGORY_META: Record<HabitCategory, CategoryMetadata> = {
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge',
    emoji: '🧪',
    colorName: 'cyan',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-[0_0_15px_#06b6d4]',
    gradient: 'from-cyan-600 via-cyan-400 to-cyan-200'
  },
  might: {
    id: 'might',
    name: 'Might',
    emoji: '⚔️',
    colorName: 'amber',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-[0_0_15px_#f59e0b]',
    gradient: 'from-amber-600 via-amber-400 to-amber-200'
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    emoji: '🌿',
    colorName: 'emerald',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-[0_0_15px_#10b981]',
    gradient: 'from-emerald-600 via-emerald-400 to-emerald-200'
  },
  wellness: {
    id: 'wellness',
    name: 'Wellness',
    emoji: '✨',
    colorName: 'teal',
    textColor: 'text-teal-300',
    borderColor: 'border-teal-500/40',
    glowColor: 'shadow-[0_0_15px_#14b8a6]',
    gradient: 'from-teal-600 via-teal-400 to-teal-200'
  },
  craft: {
    id: 'craft',
    name: 'Craft',
    emoji: '⚙️',
    colorName: 'orange',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-[0_0_15px_#f97316]',
    gradient: 'from-orange-600 via-orange-400 to-orange-200'
  },
  honor: {
    id: 'honor',
    name: 'Honor',
    emoji: '👑',
    colorName: 'purple',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-[0_0_15px_#a855f7]',
    gradient: 'from-purple-600 via-purple-400 to-purple-200'
  },
  castle: {
    id: 'castle',
    name: 'Castle',
    emoji: '🏰',
    colorName: 'indigo',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    glowColor: 'shadow-[0_0_15px_#6366f1]',
    gradient: 'from-indigo-600 via-indigo-400 to-indigo-200'
  }
};

export interface JourneyTubeRequirement {
  category: HabitCategory;
  perkName: string;
  perkEffect: string;
  perkType: 'speed' | 'cargo' | 'crew_exp' | 'gold';
}

export interface JourneyRegion {
  id: string;
  name: string;
  category: 'knowledge' | 'might' | 'wellness' | 'social';
  subheading: string;
  coordinates: string;
  description: string;
  affinityElements: string[];
  pinPosition: { x: string; y: string };
  tubes: JourneyTubeRequirement[];
  rewards: { id: string; name: string; emoji: string; image?: string; quantity: number }[];
}

// 4 THEMATIC JOURNEYS WITH ROTATING CATEGORIES & REAL MECHANICAL PERKS
const HABIT_JOURNEYS: JourneyRegion[] = [
  {
    id: 'pilgrimage-knowledge',
    name: 'Pilgrimage of Knowledge',
    category: 'knowledge',
    subheading: 'Skyhaven Isle & Astral Archives',
    coordinates: '14°N, 48°E',
    description: 'Advance by completing Knowledge or Intelligence habits. Collect magical essence crystals and pure cloud water.',
    affinityElements: ['water', 'ice'],
    pinPosition: { x: '24%', y: '26%' },
    tubes: [
      { category: 'knowledge', perkName: 'Astral speed burst', perkEffect: '+15% starting launch distance', perkType: 'speed' },
      { category: 'craft', perkName: 'Crystal blueprint salvage', perkEffect: '+1 bonus essence crystal', perkType: 'cargo' },
      { category: 'honor', perkName: 'Scholar academy tutor', perkEffect: '+50 bonus EXP to all 3 crew', perkType: 'crew_exp' },
      { category: 'vitality', perkName: 'Sky haven treasury', perkEffect: '+100 gold bonus on arrival', perkType: 'gold' }
    ],
    rewards: [
      { id: 'material-crystal', name: 'Essence Crystals', emoji: '💎', image: '/images/items/materials/material-crystal.webp', quantity: 2 },
      { id: 'material-water', name: 'Water', emoji: '💧', image: '/images/items/materials/material-water.webp', quantity: 3 }
    ]
  },
  {
    id: 'march-might',
    name: 'March of Might',
    category: 'might',
    subheading: "Dragon's Roost & Iron Crags",
    coordinates: '62°N, 82°E',
    description: 'Advance by completing Might or Agility habits. Forge ahead through wind shear for tempered steel and solid building logs.',
    affinityElements: ['fire', 'earth'],
    pinPosition: { x: '78%', y: '28%' },
    tubes: [
      { category: 'might', perkName: 'Storm-cutter momentum', perkEffect: '+15% starting launch distance', perkType: 'speed' },
      { category: 'vitality', perkName: 'Ironbark timber harvesting', perkEffect: '+2 bonus wooden logs', perkType: 'cargo' },
      { category: 'craft', perkName: 'Rigging reinforcement', perkEffect: '+50 bonus EXP to all 3 crew', perkType: 'crew_exp' },
      { category: 'castle', perkName: 'Mountain stronghold tribute', perkEffect: '+100 gold bonus on arrival', perkType: 'gold' }
    ],
    rewards: [
      { id: 'material-steel', name: 'Steel Ingots', emoji: '⚔️', image: '/images/items/materials/material-steel.webp', quantity: 2 },
      { id: 'material-logs', name: 'Wooden Logs', emoji: '🪵', image: '/images/items/materials/material-logs.webp', quantity: 4 }
    ]
  },
  {
    id: 'trail-wellness',
    name: 'Trail of Wellness',
    category: 'wellness',
    subheading: 'Greenpeak Reef & Living Springs',
    coordinates: '42°S, 22°W',
    description: 'Advance by completing Wellness, Vitality, or Spiritual habits. Net iridescent rainbow fish and mountain water.',
    affinityElements: ['nature', 'water'],
    pinPosition: { x: '22%', y: '72%' },
    tubes: [
      { category: 'wellness', perkName: 'Serene tailwind channel', perkEffect: '+15% starting launch distance', perkType: 'speed' },
      { category: 'vitality', perkName: 'Iridescent fish trawling', perkEffect: '+1 bonus rainbow fish', perkType: 'cargo' },
      { category: 'knowledge', perkName: 'Botanical expedition flora', perkEffect: '+50 bonus EXP to all 3 crew', perkType: 'crew_exp' },
      { category: 'honor', perkName: 'Spring guardian offering', perkEffect: '+100 gold bonus on arrival', perkType: 'gold' }
    ],
    rewards: [
      { id: 'fish-rainbow', name: 'Rainbow Fish', emoji: '🌈🐟', image: '/images/items/food/fish-rainbow.webp', quantity: 1 },
      { id: 'material-water', name: 'Water', emoji: '💧', image: '/images/items/materials/material-water.webp', quantity: 2 }
    ]
  },
  {
    id: 'social-bonds',
    name: 'Expedition of Social Bonds',
    category: 'social',
    subheading: 'Empyrean Spires & Celestial Bazaar',
    coordinates: '58°S, 68°E',
    description: 'Advance by completing Social, Honor, or Creative habits. Bring back fine minted silver bars and silver fish.',
    affinityElements: ['special', 'earth'],
    pinPosition: { x: '74%', y: '74%' },
    tubes: [
      { category: 'honor', perkName: 'Bazaar trade pact', perkEffect: '+1 bonus minted silver bar', perkType: 'cargo' },
      { category: 'castle', perkName: 'Port anchorage rights', perkEffect: '+15% starting launch distance', perkType: 'speed' },
      { category: 'craft', perkName: 'Artisan guild commissions', perkEffect: '+50 bonus EXP to all 3 crew', perkType: 'crew_exp' },
      { category: 'might', perkName: 'Heavy caravan hauling', perkEffect: '+100 gold bonus on arrival', perkType: 'gold' }
    ],
    rewards: [
      { id: 'material-silver', name: 'Silver Bars', emoji: '🪙', image: '/images/items/materials/material-silver.webp', quantity: 2 },
      { id: 'fish-silver', name: 'Silver Fish', emoji: '🐟', image: '/images/items/food/fish-silver.webp', quantity: 2 }
    ]
  }
];

const DEFAULT_CREW_FIGHTERS: any[] = [
  { id: '001', name: 'Flamio', filename: '001.webp', type: 'fire', active: true, favorite: false, lastFedAt: null, activeDays: 1, lastHarvestedAt: null, affection: 50, level: 1, experience: 0 },
  { id: '004', name: 'Dolphio', filename: '004.webp', type: 'water', active: true, favorite: false, lastFedAt: null, activeDays: 1, lastHarvestedAt: null, affection: 50, level: 1, experience: 0 },
  { id: '007', name: 'Leaf', filename: '007.webp', type: 'nature', active: true, favorite: false, lastFedAt: null, activeDays: 1, lastHarvestedAt: null, affection: 50, level: 1, experience: 0 },
  { id: '010', name: 'Rockie', filename: '010.webp', type: 'earth', active: true, favorite: false, lastFedAt: null, activeDays: 1, lastHarvestedAt: null, affection: 50, level: 1, experience: 0 },
  { id: '013', name: 'IceCube', filename: '013.webp', type: 'ice', active: true, favorite: false, lastFedAt: null, activeDays: 1, lastHarvestedAt: null, affection: 50, level: 1, experience: 0 },
];

export function AirshipHarborTab() {
  const { user } = useUser();
  
  // States
  const [activeVoyage, setActiveVoyage] = useState<any>(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('pilgrimage-knowledge');
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]); // 3 crew members
  const [isLaunching, setIsLaunching] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [guardianPet, setGuardianPet] = useState<{ id: string; name: string; image: string } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [steamPuff, setSteamPuff] = useState(false);

  // 7 Habit Categories Counts
  const [categoryCounts, setCategoryCounts] = useState<Record<HabitCategory, number>>({
    knowledge: 0,
    might: 0,
    vitality: 0,
    wellness: 0,
    craft: 0,
    honor: 0,
    castle: 0
  });

  // Citizens store
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const rawCitizens = useCitizensStore(state => state.citizens);
  const citizens = rawCitizens.length > 0 ? rawCitizens : DEFAULT_CREW_FIGHTERS;

  const loadVoyageData = useCallback(async () => {
    if (!user?.id) return;
    try {
      await loadCitizens(user.id);
      const voyage: any = (await getUserPreference('active_expeditions')) || { active: false };
      setActiveVoyage(voyage);

      // Load Guardian Pet for Quartermaster Mascot
      try {
        const gState: any = await getUserPreference('habit_guardian_state');
        if (gState?.selectedId === 'ember-drake') {
          setGuardianPet({ id: 'ember-drake', name: 'First Mate Ember Drake', image: '/images/creatures/EmberDrake.webp' });
        } else if (gState?.selectedId === 'spirit-sprite') {
          setGuardianPet({ id: 'spirit-sprite', name: 'Lookout Spirit Sprite', image: '/images/creatures/SpiritSprite.webp' });
        } else {
          setGuardianPet({ id: 'sage-owl', name: 'Quartermaster Sage Owl', image: '/images/creatures/SageOwl.webp' });
        }
      } catch {
        setGuardianPet({ id: 'sage-owl', name: 'Quartermaster Sage Owl', image: '/images/creatures/SageOwl.webp' });
      }

      const isReady = Boolean(voyage && voyage.active && (voyage.progress || 0) >= 100);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('airship-cargo-status', { detail: { ready: isReady } }));
      }

      // Fetch completed quests for today to tally actual habit completions across 7 categories
      try {
        const questRes = await fetchWithAuth('/api/quests');
        if (questRes.ok) {
          const raw = await questRes.json();
          const quests = unwrapApiResponse<any[]>(raw) || [];
          const counts: Record<HabitCategory, number> = {
            knowledge: 0,
            might: 0,
            vitality: 0,
            wellness: 0,
            craft: 0,
            honor: 0,
            castle: 0
          };

          quests.forEach(q => {
            if (q.completed) {
              const cat = (q.category || '').toLowerCase();
              if (cat.includes('know') || cat.includes('intel') || cat.includes('read') || cat.includes('study') || cat.includes('learn')) {
                counts.knowledge++;
              } else if (cat.includes('might') || cat.includes('agil') || cat.includes('strength') || cat.includes('push')) {
                counts.might++;
              } else if (cat.includes('vital') || cat.includes('sleep') || cat.includes('water') || cat.includes('eat') || cat.includes('nutri')) {
                counts.vitality++;
              } else if (cat.includes('well') || cat.includes('medit') || cat.includes('calm') || cat.includes('peace') || cat.includes('spirit')) {
                counts.wellness++;
              } else if (cat.includes('craft') || cat.includes('code') || cat.includes('build') || cat.includes('make') || cat.includes('work')) {
                counts.craft++;
              } else if (cat.includes('honor') || cat.includes('social') || cat.includes('friend') || cat.includes('kind') || cat.includes('help')) {
                counts.honor++;
              } else if (cat.includes('castle') || cat.includes('clean') || cat.includes('tidy') || cat.includes('chore') || cat.includes('house')) {
                counts.castle++;
              } else {
                counts.knowledge++;
              }
            }
          });
          setCategoryCounts(counts);
        }
      } catch (e) {
        logger.error('[Airship] Failed to load quest fuel data:', e);
      }
    } catch (err) {
      logger.error('[Airship] Failed to load voyage data:', err);
    }
  }, [user?.id, loadCitizens]);

  useEffect(() => {
    if (user?.id) {
      loadVoyageData();
    }
  }, [user?.id, loadVoyageData]);

  useEffect(() => {
    skydockAudio.enabled = audioEnabled;
  }, [audioEnabled]);

  // Current Journey definition
  const currentJourney = useMemo(() => {
    if (activeVoyage?.active && activeVoyage.journeyId) {
      return HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId) || HABIT_JOURNEYS[0]!;
    }
    return HABIT_JOURNEYS.find(j => j.id === selectedJourneyId) || HABIT_JOURNEYS[0]!;
  }, [activeVoyage, selectedJourneyId]);

  // 4 Vacuum Tubes metrics calculated for the active/selected journey
  const tubesState = useMemo(() => {
    const tubes = currentJourney.tubes.map(tube => {
      const meta = HABIT_CATEGORY_META[tube.category];
      const count = categoryCounts[tube.category] || 0;
      const isCharged = count >= 1;

      return {
        ...tube,
        meta,
        count,
        isCharged,
        fillPct: isCharged ? 100 : Math.min(25, count * 25)
      };
    });

    const chargedCount = tubes.filter(t => t.isCharged).length;
    const boilerPressurePct = Math.round((chargedCount / 4) * 100);
    const hasResonance = chargedCount === 4;

    return {
      tubes,
      chargedCount,
      boilerPressurePct,
      hasResonance
    };
  }, [currentJourney, categoryCounts]);

  const idleCitizens = citizens.filter(c => !c.lockedReason);

  // Dynamic Quartermaster Mascot Speech Bubble
  const mascotSpeech = useMemo(() => {
    if (activeVoyage?.active) {
      const progress = activeVoyage.progress || 0;
      if (progress >= 100) {
        return "Anchor dropped! We have reached celestial port safely. Crack the cargo bay chest locks and claim our spoils!";
      }
      return `Cruising at 4,820 ft through the cloudsea! Boilers pressurized at ${tubesState.boilerPressurePct}%. Keep completing daily habits to propel our ship!`;
    }
    if (selectedCrew.length === 3) {
      return "All 3 crew stations manned: Helmsman, Machinist, and Lookout! Pull the engine telegraph lever to full ahead to cast off!";
    }
    if (selectedCrew.length > 0) {
      return `Stationed ${selectedCrew.length}/3 crew members. Assign all 3 citizen stations to maximize affinity tailwinds!`;
    }
    if (tubesState.chargedCount === 4) {
      return "Hyper-Ether Resonance active! All 4 vacuum tubes are glowing at maximum pressure. Select 3 crew members and depart!";
    }
    return `Welcome to the Skydock Bridge! Complete habits in ${currentJourney.tubes.map(t => t.category).join(', ')} to pressurize the 4 engine tubes.`;
  }, [activeVoyage, selectedCrew.length, tubesState.chargedCount, tubesState.boilerPressurePct, currentJourney]);

  // Crew Selection (up to 3 citizens)
  const handleToggleCrewSelection = (id: string) => {
    skydockAudio.playTelegraphClick();
    setSelectedCrew(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length >= 3) {
        return [prev[1]!, prev[2]!, id];
      }
      return [...prev, id];
    });
  };

  // Launch Sequence
  const handleTelegraphLaunch = async () => {
    if (!user?.id || isLaunching) return;
    if (selectedCrew.length === 0) {
      toast({
        title: "Crew stations unassigned",
        description: "Please assign at least 1 citizen to the bridge before departure.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLaunching(true);
      setSteamPuff(true);
      setTimeout(() => setSteamPuff(false), 2000);

      skydockAudio.playTelegraphClick();
      skydockAudio.playBellChime();
      setTimeout(() => skydockAudio.playSteamHorn(), 250);

      // Calculate initial starting progress from 3 Crew Affinities (+10% each) + Charged Tubes (+7.5% each)
      let affinityCount = 0;
      selectedCrew.forEach(cId => {
        const citizen = citizens.find(c => c.id === cId);
        if (citizen && currentJourney.affinityElements.includes(citizen.type?.toLowerCase())) {
          affinityCount += 1;
        }
      });

      const affinityBurst = affinityCount * 10;
      const tubesBurst = tubesState.chargedCount * 7.5;
      const initialProgress = Math.min(75, Math.round(20 + affinityBurst + tubesBurst));

      // 1. Lock 3 citizens in preferences
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      selectedCrew.forEach(cId => {
        if (!savedPrefs[cId]) {
          savedPrefs[cId] = { active: false, favorite: false, lastFedAt: null, activeDays: 0, lastHarvestedAt: null, affection: 0, level: 1, experience: 0 };
        }
        savedPrefs[cId].lockedReason = 'expedition';
      });
      await setUserPreference('citizens_state', savedPrefs);

      // 2. Save active expedition preference with charged tubes recorded
      const newVoyage = {
        active: true,
        journeyId: currentJourney.id,
        category: currentJourney.category,
        progress: initialProgress,
        crew: selectedCrew,
        chargedTubes: tubesState.tubes.filter(t => t.isCharged).map(t => t.category),
        startedAt: new Date().toISOString()
      };
      await setUserPreference('active_expeditions', newVoyage);

      toast({
        title: "Mooring lines cast! ⛵✨",
        description: `${currentJourney.name} is underway with ${selectedCrew.length} crew. Initial ether burst: +${initialProgress}%!`
      });

      setSelectedCrew([]);
      await loadVoyageData();
    } catch (err: any) {
      toast({
        title: "Launch failed",
        description: "Failed to launch airship voyage.",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // Abandon Voyage
  const handleAbandon = async () => {
    if (!user?.id || !activeVoyage) return;
    const confirm = window.confirm("Are you sure you want to abandon this voyage? Your citizens will return immediately, but all progress and cargo will be forfeit.");
    if (!confirm) return;

    try {
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      activeVoyage.crew.forEach((cId: string) => {
        if (savedPrefs[cId]) {
          savedPrefs[cId].lockedReason = null;
        }
      });
      await setUserPreference('citizens_state', savedPrefs);
      await setUserPreference('active_expeditions', { active: false });

      toast({
        title: "Voyage abandoned 🗑️",
        description: "Your citizens have returned safely to the dormitory."
      });

      await loadVoyageData();
    } catch (err) {
      logger.error(err);
    }
  };

  // Claim Cargo & Rewards
  const handleClaim = async () => {
    if (!user?.id || !activeVoyage || isClaiming) return;
    const voyageRegion = HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId) || HABIT_JOURNEYS[0]!;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('airship-cargo-status', { detail: { ready: false } }));
    }

    try {
      setIsClaiming(true);
      skydockAudio.playChestUnlock();

      // Check which tube perks were charged
      const chargedTubes: HabitCategory[] = activeVoyage.chargedTubes || [];
      const hasBonusCargo = chargedTubes.some(c => voyageRegion.tubes.some(t => t.category === c && t.perkType === 'cargo'));
      const hasBonusExp = chargedTubes.some(c => voyageRegion.tubes.some(t => t.category === c && t.perkType === 'crew_exp'));
      const hasBonusGold = chargedTubes.some(c => voyageRegion.tubes.some(t => t.category === c && t.perkType === 'gold'));

      // 1. Add base rewards to inventory
      for (const item of voyageRegion.rewards) {
        const extraQty = hasBonusCargo ? 1 : 0;
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item: {
              id: item.id,
              quantity: item.quantity + extraQty
            }
          })
        });
      }

      // 2. Add bonus gold if gold tube was pressurized
      if (hasBonusGold) {
        await addToCharacterStat('gold', 150, 'airship-vacuum-tube');
      }

      // 3. Unlock 3 citizens & grant expedition XP + affection
      const expEarned = hasBonusExp ? 200 : 150;
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      activeVoyage.crew.forEach((cId: string) => {
        if (savedPrefs[cId]) {
          savedPrefs[cId].lockedReason = null;
          const curExp = (savedPrefs[cId].experience || 0) + expEarned;
          const curLvl = savedPrefs[cId].level || 1;
          const reqExp = curLvl * 100;
          let nextLvl = curLvl;
          let nextExp = curExp;

          if (nextExp >= reqExp && curLvl < 10) {
            nextExp = nextExp - reqExp;
            nextLvl = Math.min(10, curLvl + 1);
          }

          savedPrefs[cId].experience = nextExp;
          savedPrefs[cId].level = nextLvl;
          savedPrefs[cId].affection = Math.min(100, (savedPrefs[cId].affection || 0) + 15);
        }
      });
      await setUserPreference('citizens_state', savedPrefs);
      await setUserPreference('active_expeditions', { active: false });

      toast({
        title: "Cargo chests claimed! 🪙📦",
        description: `Your 3 crew members returned safely! Each earned +${expEarned} XP and +15 affection.${hasBonusCargo ? " (Includes +1 bonus material from pressurized tube!)" : ""}`
      });

      window.dispatchEvent(new Event('character-inventory-update'));
      await loadVoyageData();
    } catch (err) {
      toast({
        title: "Claim failed",
        description: "Failed to claim voyage chests.",
        variant: "destructive"
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6 font-serif select-none">

      {/* TOP AIRSHIP HARBOR HERO HEADER (Requested Image: /images/headers/airship-harbor.webp) */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-900/40 shadow-2xl bg-zinc-950">
        
        <div className="relative h-64 sm:h-72 w-full">
          <Image
            src="/images/headers/airship-harbor.webp"
            alt="Airship Harbor"
            fill
            priority
            unoptimized
            className="object-cover brightness-75 contrast-105 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/40" />

          {/* Steam Puff Particle Overlay on Launch */}
          {steamPuff && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] animate-pulse pointer-events-none z-30 flex items-center justify-center">
              <span className="text-amber-300 font-mono text-sm tracking-widest uppercase bg-black/85 px-4 py-1.5 rounded-full border border-amber-500/50 shadow-2xl">
                💨 Steam pressure released — full ahead!
              </span>
            </div>
          )}

          {/* Top Audio Toggle & Skydock Badge */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-amber-400" />
                <span>Skydock flight deck</span>
              </Badge>
              <Badge className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono px-2 py-0.5 backdrop-blur-md hidden sm:flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Channel: 142.8 Mhz</span>
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="h-8 w-8 p-0 rounded-full border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 backdrop-blur-md shadow-md"
              title={audioEnabled ? "Mute audio synthesizer" : "Enable skydock audio synthesizer"}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
            </Button>
          </div>

          {/* Living Quartermaster Mascot & Speech Bubble Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row sm:items-end gap-3.5">
            
            {/* Mascot Avatar Frame */}
            <div
              onClick={() => {
                skydockAudio.playBellChime();
                toast({ title: guardianPet?.name || "Quartermaster", description: mascotSpeech });
              }}
              className="relative flex items-center gap-3 cursor-pointer group shrink-0"
              title="Click quartermaster for navigation report"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/70 via-zinc-900 to-zinc-950 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden">
                <Image
                  src={guardianPet?.image || '/images/creatures/SageOwl.webp'}
                  alt={guardianPet?.name || 'Quartermaster'}
                  width={64}
                  height={64}
                  unoptimized
                  className="object-contain drop-shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.mascot-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'inline';
                  }}
                />
                <span className="mascot-fallback hidden text-3xl">🦉</span>
                <span className="absolute bottom-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              </div>

              <div className="sm:hidden">
                <h3 className="font-bold text-sm text-amber-300 font-serif">
                  {guardianPet?.name || 'Quartermaster Sage Owl'}
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">Bridge command</span>
              </div>
            </div>

            {/* Antique Speech Bubble */}
            <div className="flex-1 bg-black/75 border border-amber-500/40 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xl relative">
              <div className="hidden sm:flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 font-serif">
                    {guardianPet?.name || 'Quartermaster Sage Owl'}
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-400 text-[8px] font-mono px-1.5 py-0 border-amber-500/30">
                    Aviator goggles
                  </Badge>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Flight deck dispatch</span>
              </div>
              <p className="text-xs text-zinc-200 font-serif leading-relaxed italic">
                &ldquo;{mascotSpeech}&rdquo;
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* THE 4 ETHER VACUUM TUBES CONSOLE (ROTATING PER JOURNEY WITH ACTIVE PERKS) */}
      <Card className="bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        
        {/* Boiler Pressure Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Gauge className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cardo font-bold text-base text-amber-100">
                  {currentJourney.name} &mdash; 4 ether vacuum tubes
                </h3>
                <Badge className={cn(
                  "text-[9px] font-mono font-bold tracking-wide uppercase px-2 py-0.5",
                  tubesState.hasResonance
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                    : tubesState.chargedCount > 0
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}>
                  {tubesState.hasResonance
                    ? "⚡ Hyper-resonance active (4/4 tubes)"
                    : `${tubesState.chargedCount} / 4 tubes pressurized`}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Each tube corresponds to a required habit ritual for this voyage. Complete habits IRL to pressurize each chamber and unlock its active perk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 drop-shadow-md">
                {tubesState.boilerPressurePct}%
              </span>
              <span className="text-[10px] text-zinc-500 block font-mono">Boiler output</span>
            </div>
          </div>
        </div>

        {/* 4 Thematic Rotating Vacuum Tubes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 pt-5">
          {tubesState.tubes.map(tube => {
            const { meta, isCharged, count, perkName, perkEffect } = tube;

            return (
              <div
                key={tube.category}
                className={cn(
                  "border rounded-2xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg transition-all",
                  isCharged
                    ? cn("bg-zinc-950/90", meta.borderColor, meta.glowColor)
                    : "bg-zinc-950/50 border-zinc-800 opacity-80"
                )}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between w-full text-[10px] font-mono pb-2">
                  <span className={cn("font-bold capitalize flex items-center gap-1", isCharged ? meta.textColor : "text-zinc-400")}>
                    <span>{meta.emoji}</span> {meta.name}
                  </span>
                  <Badge className={cn("text-[8px] font-mono px-1 py-0", isCharged ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500")}>
                    {count > 0 ? `${count} habits` : "0 / 1"}
                  </Badge>
                </div>

                {/* Vertical Glass Vacuum Chamber Graphic */}
                <div className="w-14 sm:w-16 h-28 sm:h-32 rounded-full border-2 border-zinc-700 bg-black/70 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner my-1">
                  {/* Glass Reflection Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none z-20 rounded-full" />

                  {/* Bubbling Elemental Liquid Level */}
                  <div
                    style={{ height: `${isCharged ? 100 : 15}%` }}
                    className={cn(
                      "w-full rounded-b-full transition-all duration-700 relative",
                      isCharged
                        ? cn("bg-gradient-to-t", meta.gradient, meta.glowColor)
                        : "bg-zinc-800/40"
                    )}
                  >
                    {isCharged && (
                      <span className="absolute top-0 inset-x-0 h-1.5 bg-white/70 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Mechanical Perk Description */}
                <div className="pt-2 text-center w-full">
                  <span className={cn("text-[11px] font-mono font-bold block truncate", isCharged ? meta.textColor : "text-zinc-500")}>
                    {isCharged ? `✓ ${perkName}` : perkName}
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-sans line-clamp-1 mt-0.5">
                    {perkEffect}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </Card>

      {/* CONDITIONAL DISPLAY: ACTIVE FLIGHT DECK vs. SKY-CHART COURSE PLOTTING */}
      {activeVoyage?.active ? (
        
        /* ACTIVE IN-FLIGHT BRIDGE SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <Card className="lg:col-span-2 bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[420px] space-y-6">
            
            {(() => {
              const region = currentJourney;
              const progress = activeVoyage.progress || 0;
              const isFinished = progress >= 100;

              return (
                <div className="space-y-5">
                  
                  {/* Voyage Header */}
                  <div className="flex justify-between items-start border-b border-amber-900/30 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-600 text-black font-extrabold text-[9px] tracking-wider uppercase">
                          Active voyage
                        </Badge>
                        <span className="text-xs text-zinc-400 font-mono">Heading: {region.coordinates}</span>
                      </div>
                      <h3 className="font-cardo font-bold text-xl sm:text-2xl text-white mt-1">
                        {region.name}
                      </h3>
                      <p className="text-xs text-amber-300 font-serif">
                        {region.subheading}
                      </p>
                    </div>

                    <Badge className={cn(
                      "text-[10px] font-mono font-bold tracking-wider px-3 py-1 border shadow-md",
                      isFinished 
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse" 
                        : "bg-blue-950/80 text-blue-300 border-blue-500/50"
                    )}>
                      {isFinished ? "⚓ Anchors dropped" : "🪽 In flight"}
                    </Badge>
                  </div>

                  {/* Flight Deck Observation Window */}
                  <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl flex flex-col justify-between p-4 group">
                    <Image
                      src="/images/headers/airship-skydock-bridge.jpg"
                      alt="Flight Deck View"
                      fill
                      priority
                      unoptimized
                      className="object-cover brightness-85 contrast-105 group-hover:scale-105 transition-transform duration-1000 ease-out select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50 z-10" />

                    {/* Top Flight Telemetry Instruments */}
                    <div className="relative z-20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-[10px] font-mono font-bold px-2 py-0.5 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>Altitude: 4,820 ft</span>
                        </Badge>
                        <Badge className="bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 backdrop-blur-md shadow-lg hidden sm:flex items-center gap-1">
                          <Wind className="w-3 h-3 text-amber-400" />
                          <span>Ether tailwind: +25 kts</span>
                        </Badge>
                      </div>

                      <Badge className="bg-zinc-950/80 border border-zinc-700 text-zinc-300 text-[10px] font-mono px-2 py-0.5 backdrop-blur-md">
                        Port: <span className="text-amber-300 font-bold ml-1">{region.coordinates}</span>
                      </Badge>
                    </div>

                    {/* Center Spinning Brass Gyro-Compass */}
                    <div className="relative z-20 flex items-center justify-center pointer-events-none">
                      <div className="px-4 py-1.5 rounded-full bg-black/70 border border-amber-500/40 backdrop-blur-md shadow-xl flex items-center gap-2">
                        <Compass className="w-4 h-4 text-amber-400 animate-[spin_10s_linear_infinite]" />
                        <span className="text-xs font-serif font-bold text-amber-200 tracking-wide">
                          {isFinished ? "Safe arrival at celestial haven" : "Sailing cloudsea trade winds"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Progress Metrics */}
                    <div className="relative z-20 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                          Navigation helm
                        </p>
                        <p className="text-xs text-zinc-200 font-serif font-semibold">
                          {isFinished ? "Safe arrival — cargo ready to unload" : `Propelling toward ${region.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-mono font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                          {progress}%
                        </span>
                        <span className="text-[9px] text-zinc-300 block font-mono">Distance completed</span>
                      </div>
                    </div>
                  </div>

                  {/* Flight Progress Bar */}
                  <div className="space-y-2 bg-zinc-950/70 p-4 rounded-2xl border border-amber-900/30 shadow-inner">
                    <div className="flex justify-between items-center text-xs font-bold font-mono">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-serif">
                        <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Ether flight propulsion:
                      </span>
                      <span className="text-amber-400">{progress}% completed</span>
                    </div>

                    <div className="w-full bg-zinc-900 rounded-full h-4 p-0.5 border border-white/10 relative overflow-hidden flex shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none z-20" />
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      />
                    </div>

                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                      {isFinished
                        ? "🌟 Safe arrival! The airship is secured at port. Pop the chest locks to claim your cargo."
                        : `Propel this journey forward by completing ${region.category} habits (+30% bonus ether) or any other daily habits (+25% ether).`}
                    </p>
                  </div>

                  {/* Guaranteed Voyage Cargo in Sea-Chests */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-amber-400 tracking-wider uppercase font-mono">
                        📦 Guaranteed cargo hold:
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">Secured in hold</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {region.rewards.map(reward => (
                        <div
                          key={reward.id}
                          className="p-3.5 bg-gradient-to-r from-amber-950/20 via-zinc-950/80 to-zinc-900/60 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner overflow-hidden relative p-1">
                              {reward.image ? (
                                <Image
                                  src={reward.image}
                                  alt={reward.name}
                                  width={32}
                                  height={32}
                                  className="object-contain drop-shadow"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.cargo-emoji-fallback');
                                    if (fallback) (fallback as HTMLElement).style.display = 'inline';
                                  }}
                                />
                              ) : null}
                              <span className={cn("cargo-emoji-fallback", reward.image ? "hidden" : "inline")}>
                                {reward.emoji}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs font-serif truncate group-hover:text-amber-200 transition-colors">
                                {reward.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-sans">
                                Kingdom crafting material
                              </p>
                            </div>
                          </div>

                          <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 shrink-0">
                            x{reward.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-900/30">
              <Button
                variant="outline"
                onClick={handleAbandon}
                className="w-full sm:w-1/3 text-xs border-red-950/45 text-red-400 bg-red-950/10 hover:bg-red-950/30 font-bold rounded-2xl py-4"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Abandon voyage
              </Button>

              <Button
                disabled={activeVoyage.progress < 100 || isClaiming}
                onClick={handleClaim}
                className={cn(
                  "w-full sm:w-2/3 text-xs font-bold py-5 rounded-2xl tracking-wider transition-all flex items-center justify-center gap-2",
                  activeVoyage.progress >= 100
                    ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.98]"
                    : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                )}
              >
                {isClaiming ? <>Unlocking sea-chests...</> : <>Pop cargo chest locks & dock ship</>}
              </Button>
            </div>

          </Card>

          {/* SLOTTED CREW ON ACTIVE FLIGHT (3 Porthole Stations) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-cardo font-bold text-amber-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Slotted crew members
              </h3>
              <Badge className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] px-2 py-0.5">
                {activeVoyage.crew?.length || 0} / 3 active
              </Badge>
            </div>

            <div className="space-y-3">
              {(activeVoyage.crew || []).map((cId: string, stationIdx: number) => {
                const citizen = citizens.find(c => c.id === cId);
                if (!citizen) return null;

                const curExp = citizen.experience || 0;
                const curLvl = citizen.level || 1;
                const reqExp = curLvl * 100;
                const expPct = Math.min(100, Math.round((curExp / reqExp) * 100));
                
                const stationRoles = [
                  "Station 1: Helmsman / Navigator",
                  "Station 2: Machinist / Engineer",
                  "Station 3: Lookout / Quartermaster"
                ];
                const stationRole = stationRoles[stationIdx] || `Station ${stationIdx + 1}: Crew Member`;

                return (
                  <Card
                    key={cId}
                    className="bg-[#0b0d11] border-2 border-amber-500/40 rounded-3xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-3">
                      
                      {/* Riveted Brass Porthole Frame */}
                      <div className="w-14 h-14 rounded-full border-4 border-amber-500/60 bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)] relative p-1 overflow-hidden">
                        <Image
                          src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                          alt={citizen.name}
                          width={44}
                          height={44}
                          unoptimized
                          className="object-contain group-hover:scale-110 transition-transform"
                          onError={(e) => {
                            (e.target as any).src = '/images/placeholders/creature.webp';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                          {stationRole}
                        </span>
                        <h4 className="font-cardo font-bold text-white text-xs sm:text-sm truncate">
                          {citizen.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <span className="text-amber-300 font-bold">Level {curLvl}</span>
                          <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                          <span className="capitalize">{citizen.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* EXP Progress */}
                    <div className="space-y-1 bg-zinc-950/70 p-2 rounded-xl border border-white/5 mt-2.5">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-zinc-400">Expedition EXP</span>
                        <span className="text-amber-300 font-bold">{curExp} / {reqExp} XP</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all" style={{ width: `${expPct}%` }} />
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-1.5">
                      <span>Arrival bonus:</span>
                      <span className="text-emerald-400 font-bold">+150 XP & +15 Affection</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

        </div>

      ) : (

        /* LAUNCH SETUP: CELESTIAL SKY-CHART & 3 CREW STATIONS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* THE CELESTIAL SKY-CHART NAVIGATION TABLE */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500" /> Celestial sky chart & trade routes
              </h3>
              <span className="text-xs text-zinc-400 font-mono">Select route heading</span>
            </div>

            {/* Antique Navigation Table Map Frame */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-900/50 shadow-2xl bg-zinc-950 p-2 sm:p-3">
              
              {/* Parchment Map Background Graphic */}
              <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-amber-900/30">
                <Image
                  src="/images/headers/celestial-sky-chart.jpg"
                  alt="Celestial Sky Chart"
                  fill
                  priority
                  unoptimized
                  className="object-cover brightness-90 contrast-105 select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Interactive Waypoint Pins on the Map */}
                {HABIT_JOURNEYS.map(j => {
                  const isSelected = selectedJourneyId === j.id;

                  return (
                    <div
                      key={j.id}
                      style={{ left: j.pinPosition.x, top: j.pinPosition.y }}
                      onClick={() => {
                        skydockAudio.playTelegraphClick();
                        setSelectedJourneyId(j.id);
                        setSelectedCrew([]);
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                    >
                      <div className={cn(
                        "p-2 rounded-full border-2 transition-all flex items-center justify-center shadow-2xl backdrop-blur-sm",
                        isSelected
                          ? "bg-amber-500 border-amber-200 text-black scale-125 shadow-[0_0_20px_#f59e0b] animate-bounce"
                          : "bg-black/75 border-amber-500/50 text-amber-300 hover:scale-110 hover:border-amber-300"
                      )}>
                        <MapPin className="w-4 h-4" />
                      </div>

                      {/* Floating Waypoint Label */}
                      <div className={cn(
                        "absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold whitespace-nowrap shadow-lg transition-all",
                        isSelected
                          ? "bg-amber-950/90 border-amber-400 text-amber-200"
                          : "bg-black/75 border-zinc-700 text-zinc-300 opacity-80 group-hover:opacity-100"
                      )}>
                        {j.name}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Chart Table Status Banner */}
                <div className="absolute bottom-3 left-3 right-3 z-20 bg-black/80 border border-amber-500/30 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400 animate-spin" />
                    <div>
                      <span className="text-[9px] font-mono uppercase text-amber-400 font-bold block">Plotted heading</span>
                      <span className="text-xs font-serif font-bold text-white">{currentJourney.name} ({currentJourney.coordinates})</span>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono capitalize">
                    {currentJourney.category} rituals
                  </Badge>
                </div>

              </div>

              {/* Waypoint Destination Select Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                {HABIT_JOURNEYS.map(j => {
                  const isSelected = selectedJourneyId === j.id;

                  return (
                    <div
                      key={j.id}
                      onClick={() => {
                        skydockAudio.playTelegraphClick();
                        setSelectedJourneyId(j.id);
                        setSelectedCrew([]);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none",
                        isSelected
                          ? "bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                          : "bg-zinc-950/60 border-zinc-800 hover:border-amber-900/40 hover:bg-zinc-900/40"
                      )}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <h4 className="font-cardo font-bold text-xs text-white truncate">{j.name}</h4>
                        <Badge variant="outline" className="text-[8px] font-mono uppercase tracking-wider text-amber-400 border-amber-500/30">
                          {j.category}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                        {j.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5 text-[9px] font-mono text-zinc-500">
                        <span>Affinities: {j.affinityElements.join(', ')}</span>
                        <span className="text-amber-400 font-bold">{isSelected ? "✓ Course set" : "Plot"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: 3 BRIDGE CREW STATIONS & ENGINE TELEGRAPH LAUNCH */}
          <div className="lg:col-span-1 space-y-4">
            
            <Card className="bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[460px] space-y-5">
              
              <div className="space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
                  <div>
                    <h3 className="font-cardo font-bold text-base text-amber-100">3 Bridge crew stations</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Assign 3 citizens from the dormitory</p>
                  </div>
                  <Badge className="bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                    {selectedCrew.length} / 3 ready
                  </Badge>
                </div>

                {/* The 3 Round Brass Portholes for Station Assignments */}
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Station 1: Helmsman */}
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-2 flex flex-col items-center text-center relative overflow-hidden shadow-md">
                    <span className="text-[8px] font-mono text-amber-400 uppercase font-bold tracking-wider mb-1">
                      1. Helmsman
                    </span>
                    
                    {selectedCrew[0] ? (() => {
                      const citizen = citizens.find(c => c.id === selectedCrew[0]);
                      if (!citizen) return null;
                      const hasAffinity = currentJourney.affinityElements.includes(citizen.type?.toLowerCase());

                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-black/80 flex items-center justify-center p-0.5 shadow-inner relative">
                            <Image
                              src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                              alt={citizen.name}
                              width={38}
                              height={38}
                              unoptimized
                              className="object-contain"
                            />
                            {hasAffinity && (
                              <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow">
                                ★
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-white mt-1 truncate max-w-[70px]">{citizen.name}</span>
                          <span className="text-[8px] text-zinc-400 font-mono capitalize">{citizen.type}</span>
                        </div>
                      );
                    })() : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-zinc-600 text-[9px] my-1">
                        Empty
                      </div>
                    )}
                  </div>

                  {/* Station 2: Machinist / Engineer */}
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-2 flex flex-col items-center text-center relative overflow-hidden shadow-md">
                    <span className="text-[8px] font-mono text-amber-400 uppercase font-bold tracking-wider mb-1">
                      2. Machinist
                    </span>

                    {selectedCrew[1] ? (() => {
                      const citizen = citizens.find(c => c.id === selectedCrew[1]);
                      if (!citizen) return null;
                      const hasAffinity = currentJourney.affinityElements.includes(citizen.type?.toLowerCase());

                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-black/80 flex items-center justify-center p-0.5 shadow-inner relative">
                            <Image
                              src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                              alt={citizen.name}
                              width={38}
                              height={38}
                              unoptimized
                              className="object-contain"
                            />
                            {hasAffinity && (
                              <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow">
                                ★
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-white mt-1 truncate max-w-[70px]">{citizen.name}</span>
                          <span className="text-[8px] text-zinc-400 font-mono capitalize">{citizen.type}</span>
                        </div>
                      );
                    })() : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-zinc-600 text-[9px] my-1">
                        Empty
                      </div>
                    )}
                  </div>

                  {/* Station 3: Lookout / Quartermaster */}
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-2 flex flex-col items-center text-center relative overflow-hidden shadow-md">
                    <span className="text-[8px] font-mono text-amber-400 uppercase font-bold tracking-wider mb-1">
                      3. Lookout
                    </span>

                    {selectedCrew[2] ? (() => {
                      const citizen = citizens.find(c => c.id === selectedCrew[2]);
                      if (!citizen) return null;
                      const hasAffinity = currentJourney.affinityElements.includes(citizen.type?.toLowerCase());

                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-black/80 flex items-center justify-center p-0.5 shadow-inner relative">
                            <Image
                              src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                              alt={citizen.name}
                              width={38}
                              height={38}
                              unoptimized
                              className="object-contain"
                            />
                            {hasAffinity && (
                              <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow">
                                ★
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-white mt-1 truncate max-w-[70px]">{citizen.name}</span>
                          <span className="text-[8px] text-zinc-400 font-mono capitalize">{citizen.type}</span>
                        </div>
                      );
                    })() : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-zinc-600 text-[9px] my-1">
                        Empty
                      </div>
                    )}
                  </div>

                </div>

                {/* Citizen Dormitory Roster (Selection Grid) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                    Select citizens from dormitory:
                  </span>

                  {idleCitizens.length === 0 ? (
                    <p className="text-xs text-zinc-500 bg-zinc-950 p-3 rounded-xl border border-white/5">
                      No idle citizens in dormitory.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                      {idleCitizens.map(c => {
                        const isSelected = selectedCrew.includes(c.id);
                        const hasAffinity = currentJourney.affinityElements.includes(c.type?.toLowerCase());

                        return (
                          <div
                            key={c.id}
                            onClick={() => handleToggleCrewSelection(c.id)}
                            className={cn(
                              "p-2 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all select-none",
                              isSelected
                                ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-md"
                                : "bg-zinc-950/70 border-zinc-800 hover:border-amber-500/40 text-white"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                <Image
                                  src={c.filename ? `/images/creatures/${c.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${c.id}.webp`}
                                  alt={c.name}
                                  width={28}
                                  height={28}
                                  unoptimized
                                  className="object-contain"
                                />
                              </div>
                              <span className="font-bold truncate text-xs">{c.name}</span>
                              <span className="text-[9px] text-zinc-400 capitalize font-mono">({c.type})</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasAffinity && (
                                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-mono px-1">
                                  +10% ★
                                </Badge>
                              )}
                              <Badge className={cn("text-[8px] font-mono font-bold px-1.5 py-0.5", isSelected ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400")}>
                                {isSelected ? "Assigned" : "+ Slot"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* TACTILE ENGINE ORDER TELEGRAPH LEVER (3-Crew Throttle) */}
              <div className="pt-4 border-t border-amber-900/30 space-y-3">
                
                <div className="bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 uppercase font-bold">Engine telegraph:</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 0 ? "bg-zinc-800 text-zinc-400" : "text-zinc-600")}>Standby</span>
                    <span>→</span>
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-600")}>1/3</span>
                    <span>→</span>
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 2 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-600")}>2/3</span>
                    <span>→</span>
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 3 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse" : "text-zinc-600")}>Full ahead</span>
                  </div>
                </div>

                <Button
                  disabled={isLaunching || selectedCrew.length === 0}
                  onClick={handleTelegraphLaunch}
                  className={cn(
                    "w-full text-xs font-bold py-5 rounded-2xl tracking-wider transition-all flex items-center justify-center gap-2",
                    !isLaunching && selectedCrew.length > 0
                      ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.98]"
                      : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  )}
                >
                  {isLaunching ? <>Prepping steam boilers...</> : <>⛵ Pull telegraph to full ahead</>}
                </Button>

              </div>

            </Card>

          </div>

        </div>

      )}

    </div>
  );
}
