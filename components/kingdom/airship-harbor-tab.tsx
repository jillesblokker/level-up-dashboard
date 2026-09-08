"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Wind, Sparkles, Check, Flame, Shield, Users, Clock, Trophy, Trash2, ArrowRight, Compass, Anchor, MapPin, Gauge, Radio, Volume2, VolumeX, MessageSquare, ChevronRight } from "lucide-react"
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

  // Double brass ship bell strike ("Ding-ding!")
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
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6 harmonic

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

  // Deep airship steam horn whistle
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

  // Mechanical brass telegraph lever click
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

  // Rewarding chest unlock fanfare
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

// --- DATA STRUCTURES ---
interface JourneyRegion {
  id: string;
  name: string;
  category: 'knowledge' | 'might' | 'wellness' | 'social';
  subheading: string;
  coordinates: string;
  description: string;
  affinityElements: string[];
  pinPosition: { x: string; y: string };
  rewards: { id: string; name: string; emoji: string; image?: string; quantity: number }[];
}

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
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [guardianPet, setGuardianPet] = useState<{ id: string; name: string; image: string } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [steamPuff, setSteamPuff] = useState(false);

  const [questFuelData, setQuestFuelData] = useState<{
    knowledge: number;
    might: number;
    wellness: number;
    social: number;
    totalCompleted: number;
  }>({ knowledge: 0, might: 0, wellness: 0, social: 0, totalCompleted: 0 });

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

      // Fetch completed quests to compute category-colored Ether Fuel
      try {
        const questRes = await fetchWithAuth('/api/quests');
        if (questRes.ok) {
          const raw = await questRes.json();
          const quests = unwrapApiResponse<any[]>(raw) || [];
          let k = 0, m = 0, w = 0, s = 0, total = 0;
          quests.forEach(q => {
            if (q.completed) {
              total++;
              const cat = (q.category || '').toLowerCase();
              if (cat.includes('know') || cat.includes('intel') || cat.includes('read') || cat.includes('study') || cat.includes('learn')) {
                k++;
              } else if (cat.includes('might') || cat.includes('agil') || cat.includes('craft') || cat.includes('strength')) {
                m++;
              } else if (cat.includes('well') || cat.includes('vital') || cat.includes('spirit')) {
                w++;
              } else if (cat.includes('social') || cat.includes('creat') || cat.includes('honor')) {
                s++;
              } else {
                k++;
              }
            }
          });
          setQuestFuelData({ knowledge: k, might: m, wellness: w, social: s, totalCompleted: total });
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

  // Sync audio toggle with audio synthesizer
  useEffect(() => {
    skydockAudio.enabled = audioEnabled;
  }, [audioEnabled]);

  // Category Ether Fuel Calculation for Vacuum Tubes
  const fuelMetrics = useMemo(() => {
    const isVoyageActive = Boolean(activeVoyage?.active);
    const targetProgress = isVoyageActive
      ? Math.min(100, Math.max(0, activeVoyage.progress || 0))
      : Math.min(100, (questFuelData.totalCompleted || 0) * 25);

    let kPct = 0;
    let mPct = 0;
    let wPct = 0;
    let sPct = 0;
    let basePct = 0;

    if (questFuelData.totalCompleted > 0) {
      if (isVoyageActive) {
        kPct = Math.round((questFuelData.knowledge / questFuelData.totalCompleted) * targetProgress);
        mPct = Math.round((questFuelData.might / questFuelData.totalCompleted) * targetProgress);
        wPct = Math.round((questFuelData.wellness / questFuelData.totalCompleted) * targetProgress);
        sPct = Math.max(0, targetProgress - (kPct + mPct + wPct));
      } else {
        kPct = Math.min(100, questFuelData.knowledge * 25);
        mPct = Math.min(Math.max(0, 100 - kPct), questFuelData.might * 25);
        wPct = Math.min(Math.max(0, 100 - kPct - mPct), questFuelData.wellness * 25);
        sPct = Math.min(Math.max(0, 100 - kPct - mPct - wPct), questFuelData.social * 25);
      }
    } else if (isVoyageActive && targetProgress > 0) {
      basePct = targetProgress;
    }

    const totalFuel = isVoyageActive ? targetProgress : Math.min(100, kPct + mPct + wPct + sPct);

    return {
      totalFuel,
      targetProgress,
      kPct,
      mPct,
      wPct,
      sPct,
      basePct,
      knowledgeCount: questFuelData.knowledge,
      mightCount: questFuelData.might,
      wellnessCount: questFuelData.wellness,
      socialCount: questFuelData.social,
      totalCount: questFuelData.totalCompleted,
    };
  }, [activeVoyage, questFuelData]);

  const selectedJourney = HABIT_JOURNEYS.find(j => j.id === selectedJourneyId) || HABIT_JOURNEYS[0]!;
  const idleCitizens = citizens.filter(c => !c.lockedReason);

  // Dynamic Quartermaster Speech Bubble
  const mascotSpeech = useMemo(() => {
    if (activeVoyage?.active) {
      const progress = activeVoyage.progress || 0;
      if (progress >= 100) {
        return "Anchor dropped! We have reached celestial port safely. Crack the cargo bay chest locks and claim our spoils!";
      }
      return `Cruising at 4,820 ft through the cloudsea! Boilers running steady at ${progress}% to destination. Keep up your habits!`;
    }
    if (selectedCrew.length === 2) {
      return "Crew is stationed at the helm and crow's nest! Pull the engine telegraph lever to full ahead when you are ready to depart.";
    }
    if (selectedCrew.length === 1) {
      return "First station manned! Select one more citizen from the dormitory to complete our 2-person expedition complement.";
    }
    if (fuelMetrics.totalFuel >= 100) {
      return "Boiler vacuum tubes are bubbling at 100% capacity! Plot our heading on the sky chart and assign our bridge crew.";
    }
    return "Welcome to the Skydock Bridge, Captain! Complete daily habits IRL to fill our vacuum tubes with pressurized elemental ether.";
  }, [activeVoyage, selectedCrew.length, fuelMetrics.totalFuel]);

  const handleToggleCrewSelection = (id: string) => {
    skydockAudio.playTelegraphClick();
    setSelectedCrew(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length >= 2) {
        return [prev[1]!, id];
      }
      return [...prev, id];
    });
  };

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

      // Play authentic sound sequence
      skydockAudio.playTelegraphClick();
      skydockAudio.playBellChime();
      setTimeout(() => skydockAudio.playSteamHorn(), 250);

      // Calculate initial progress based on Element Affinities
      let affinityCount = 0;
      selectedCrew.forEach(cId => {
        const citizen = citizens.find(c => c.id === cId);
        if (citizen && selectedJourney.affinityElements.includes(citizen.type)) {
          affinityCount += 1;
        }
      });
      const initialProgress = Math.min(60, affinityCount * 20 + 20);

      // 1. Lock citizens in preferences
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      selectedCrew.forEach(cId => {
        if (!savedPrefs[cId]) {
          savedPrefs[cId] = { active: false, favorite: false, lastFedAt: null, activeDays: 0, lastHarvestedAt: null, affection: 0, level: 1, experience: 0 };
        }
        savedPrefs[cId].lockedReason = 'expedition';
      });
      await setUserPreference('citizens_state', savedPrefs);

      // 2. Save active expedition preference
      const newVoyage = {
        active: true,
        journeyId: selectedJourney.id,
        category: selectedJourney.category,
        progress: initialProgress,
        crew: selectedCrew,
        startedAt: new Date().toISOString()
      };
      await setUserPreference('active_expeditions', newVoyage);

      toast({
        title: "Mooring lines cast! ⛵✨",
        description: `${selectedJourney.name} is underway. Complete habits to propel our voyage!`
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

  const handleClaim = async () => {
    if (!user?.id || !activeVoyage || isClaiming) return;
    const voyageRegion = HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId) || HABIT_JOURNEYS[0]!;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('airship-cargo-status', { detail: { ready: false } }));
    }

    try {
      setIsClaiming(true);
      skydockAudio.playChestUnlock();

      // Sequentially add rewards to inventory
      for (const item of voyageRegion.rewards) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item: {
              id: item.id,
              quantity: item.quantity
            }
          })
        });
      }

      // Unlock citizens & grant expedition XP + affection
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      activeVoyage.crew.forEach((cId: string) => {
        if (savedPrefs[cId]) {
          savedPrefs[cId].lockedReason = null;
          const curExp = (savedPrefs[cId].experience || 0) + 150;
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
        description: `Your crew returned safely with materials! Crew earned +150 XP and +15 affection.`
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

      {/* TOP SKYDOCK HERO WITH PARALLAX BRIDGE & LIVING QUARTERMASTER */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-900/40 shadow-2xl bg-zinc-950">
        
        {/* Background Flight Deck Panoramic Art */}
        <div className="relative h-64 sm:h-72 w-full">
          <Image
            src="/images/headers/airship-skydock-bridge.jpg"
            alt="Airship Skydock Bridge"
            fill
            priority
            unoptimized
            className="object-cover brightness-70 contrast-105 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/40" />

          {/* Steam Puff Particle Overlay */}
          {steamPuff && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] animate-pulse pointer-events-none z-30 flex items-center justify-center">
              <span className="text-amber-300 font-mono text-sm tracking-widest uppercase bg-black/80 px-4 py-1.5 rounded-full border border-amber-500/50 shadow-2xl">
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
                <span>Nav channel: 142.8 Mhz</span>
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
            
            {/* Mascot Avatar Frame (Aviator Goggles Perch) */}
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
                "{mascotSpeech}"
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* THE ETHER BOILER & 4 GLOWING VACUUM TUBES CONSOLE */}
      <Card className="bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        
        {/* Steam Boiler Top Readout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Gauge className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cardo font-bold text-base text-amber-100">Ether boiler & vacuum chambers</h3>
                <Badge className={cn(
                  "text-[9px] font-mono font-bold tracking-wide uppercase px-2 py-0.5",
                  fuelMetrics.totalFuel >= 100 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse" 
                    : fuelMetrics.totalFuel > 0
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}>
                  {fuelMetrics.totalFuel >= 100 ? "⚡ 100% Maximum pressure" : `${fuelMetrics.totalFuel}% / 100% Pressure`}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Real-world habit rituals compress elemental gas into the 4 vacuum tubes below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 drop-shadow-md">
                {fuelMetrics.totalFuel}%
              </span>
              <span className="text-[10px] text-zinc-500 block font-mono">Boiler output</span>
            </div>
          </div>
        </div>

        {/* 4 Vertical Tactile Glass Vacuum Tubes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 pt-5">
          
          {/* 1. Knowledge Vacuum Tube (Cyan) */}
          <div className="bg-zinc-950/80 border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-cyan-950/10 pointer-events-none" />
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-cyan-300 pb-2">
              <span className="font-bold">Knowledge</span>
              <span>{fuelMetrics.knowledgeCount} habits</span>
            </div>

            {/* Vertical Glass Tube Graphic */}
            <div className="w-14 sm:w-16 h-28 sm:h-32 rounded-full border-2 border-cyan-500/50 bg-black/60 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner">
              {/* Glass Reflection Highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none z-20 rounded-full" />
              
              {/* Glowing Liquid */}
              <div
                style={{ height: `${Math.min(100, Math.max(8, fuelMetrics.kPct))}%` }}
                className="w-full bg-gradient-to-t from-cyan-600 via-cyan-400 to-cyan-200 rounded-b-full transition-all duration-700 relative shadow-[0_0_15px_#06b6d4]"
              >
                <span className="absolute top-0 inset-x-0 h-1.5 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs font-mono font-bold text-cyan-400">+{fuelMetrics.kPct}%</span>
              <span className="text-[9px] text-zinc-500 block font-sans">Flight speed perk</span>
            </div>
          </div>

          {/* 2. Might Vacuum Tube (Amber / Flame) */}
          <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-amber-950/10 pointer-events-none" />
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-amber-300 pb-2">
              <span className="font-bold">Might</span>
              <span>{fuelMetrics.mightCount} habits</span>
            </div>

            {/* Vertical Glass Tube Graphic */}
            <div className="w-14 sm:w-16 h-28 sm:h-32 rounded-full border-2 border-amber-500/50 bg-black/60 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none z-20 rounded-full" />
              
              <div
                style={{ height: `${Math.min(100, Math.max(8, fuelMetrics.mPct))}%` }}
                className="w-full bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200 rounded-b-full transition-all duration-700 relative shadow-[0_0_15px_#f59e0b]"
              >
                <span className="absolute top-0 inset-x-0 h-1.5 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs font-mono font-bold text-amber-400">+{fuelMetrics.mPct}%</span>
              <span className="text-[9px] text-zinc-500 block font-sans">Cargo size perk</span>
            </div>
          </div>

          {/* 3. Wellness Vacuum Tube (Emerald / Nature) */}
          <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-emerald-300 pb-2">
              <span className="font-bold">Wellness</span>
              <span>{fuelMetrics.wellnessCount} habits</span>
            </div>

            {/* Vertical Glass Tube Graphic */}
            <div className="w-14 sm:w-16 h-28 sm:h-32 rounded-full border-2 border-emerald-500/50 bg-black/60 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none z-20 rounded-full" />
              
              <div
                style={{ height: `${Math.min(100, Math.max(8, fuelMetrics.wPct))}%` }}
                className="w-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-200 rounded-b-full transition-all duration-700 relative shadow-[0_0_15px_#10b981]"
              >
                <span className="absolute top-0 inset-x-0 h-1.5 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs font-mono font-bold text-emerald-400">+{fuelMetrics.wPct}%</span>
              <span className="text-[9px] text-zinc-500 block font-sans">Hull shielding perk</span>
            </div>
          </div>

          {/* 4. Social Vacuum Tube (Violet / Astral) */}
          <div className="bg-zinc-950/80 border border-purple-500/30 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-purple-950/10 pointer-events-none" />
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-purple-300 pb-2">
              <span className="font-bold">Social</span>
              <span>{fuelMetrics.socialCount} habits</span>
            </div>

            {/* Vertical Glass Tube Graphic */}
            <div className="w-14 sm:w-16 h-28 sm:h-32 rounded-full border-2 border-purple-500/50 bg-black/60 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none z-20 rounded-full" />
              
              <div
                style={{ height: `${Math.min(100, Math.max(8, fuelMetrics.sPct))}%` }}
                className="w-full bg-gradient-to-t from-purple-600 via-purple-400 to-purple-200 rounded-b-full transition-all duration-700 relative shadow-[0_0_15px_#a855f7]"
              >
                <span className="absolute top-0 inset-x-0 h-1.5 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs font-mono font-bold text-purple-400">+{fuelMetrics.sPct}%</span>
              <span className="text-[9px] text-zinc-500 block font-sans">Trading post perk</span>
            </div>
          </div>

        </div>

      </Card>

      {/* CONDITIONAL DISPLAY: ACTIVE FLIGHT DECK vs. SKY-CHART COURSE PLOTTING */}
      {activeVoyage?.active ? (
        
        /* ACTIVE IN-FLIGHT BRIDGE SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <Card className="lg:col-span-2 bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[420px] space-y-6">
            
            {(() => {
              const region = HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId) || HABIT_JOURNEYS[0]!;
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

                  {/* Multi-Segment Ether Progress Bar */}
                  <div className="space-y-2 bg-zinc-950/70 p-4 rounded-2xl border border-amber-900/30 shadow-inner">
                    <div className="flex justify-between items-center text-xs font-bold font-mono">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-serif">
                        <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Ether flight propulsion:
                      </span>
                      <span className="text-amber-400">{progress}% completed</span>
                    </div>

                    <div className="w-full bg-zinc-900 rounded-full h-4 p-0.5 border border-white/10 relative overflow-hidden flex shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none z-20" />
                      {fuelMetrics.kPct > 0 && <div style={{ width: `${fuelMetrics.kPct}%` }} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 first:rounded-l-full last:rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />}
                      {fuelMetrics.mPct > 0 && <div style={{ width: `${fuelMetrics.mPct}%` }} className="h-full bg-gradient-to-r from-amber-600 to-amber-400 first:rounded-l-full last:rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" />}
                      {fuelMetrics.wPct > 0 && <div style={{ width: `${fuelMetrics.wPct}%` }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 first:rounded-l-full last:rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
                      {fuelMetrics.sPct > 0 && <div style={{ width: `${fuelMetrics.sPct}%` }} className="h-full bg-gradient-to-r from-purple-600 to-purple-400 first:rounded-l-full last:rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" />}
                      {fuelMetrics.basePct > 0 && <div style={{ width: `${fuelMetrics.basePct}%` }} className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 first:rounded-l-full last:rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" />}
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

          {/* SLOTTED CREW ON ACTIVE FLIGHT (Porthole Stations) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-cardo font-bold text-amber-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Slotted crew members
              </h3>
              <Badge className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] px-2 py-0.5">
                {activeVoyage.crew.length} / 2 active
              </Badge>
            </div>

            <div className="space-y-3.5">
              {activeVoyage.crew.map((cId: string, stationIdx: number) => {
                const citizen = citizens.find(c => c.id === cId);
                if (!citizen) return null;

                const curExp = citizen.experience || 0;
                const curLvl = citizen.level || 1;
                const reqExp = curLvl * 100;
                const expPct = Math.min(100, Math.round((curExp / reqExp) * 100));
                const stationRole = stationIdx === 0 ? "Station 1: Helmsman / Navigator" : "Station 2: Crow's Nest / Lookout";

                return (
                  <Card
                    key={cId}
                    className="bg-[#0b0d11] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-3.5">
                      
                      {/* Riveted Brass Porthole Frame */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-amber-500/60 bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)] relative p-1 overflow-hidden">
                        <Image
                          src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                          alt={citizen.name}
                          width={52}
                          height={52}
                          unoptimized
                          className="object-contain group-hover:scale-110 transition-transform"
                          onError={(e) => {
                            (e.target as any).src = '/images/placeholders/creature.webp';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                          {stationRole}
                        </span>
                        <h4 className="font-cardo font-bold text-white text-sm truncate">
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
                    <div className="space-y-1 bg-zinc-950/70 p-2.5 rounded-xl border border-white/5 mt-3">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-400">Expedition EXP</span>
                        <span className="text-amber-300 font-bold">{curExp} / {reqExp} XP</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all" style={{ width: `${expPct}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-2">
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

        /* LAUNCH SETUP: CELESTIAL SKY-CHART & ENGINE TELEGRAPH */
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
                      <span className="text-xs font-serif font-bold text-white">{selectedJourney.name} ({selectedJourney.coordinates})</span>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono capitalize">
                    {selectedJourney.category} rituals
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

          {/* RIGHT COLUMN: BRIDGE CREW STATIONS & ENGINE TELEGRAPH LAUNCH */}
          <div className="lg:col-span-1 space-y-4">
            
            <Card className="bg-[#0b0d11] border-2 border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[460px] space-y-5">
              
              <div className="space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
                  <div>
                    <h3 className="font-cardo font-bold text-base text-amber-100">Bridge crew stations</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Assign 2 citizens to the helm</p>
                  </div>
                  <Badge className="bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                    {selectedCrew.length} / 2 ready
                  </Badge>
                </div>

                {/* The 2 Round Brass Portholes for Station Assignments */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Station 1: Helmsman / Navigator */}
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden shadow-md">
                    <span className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-wider mb-1.5">
                      1. Helmsman
                    </span>
                    
                    {selectedCrew[0] ? (() => {
                      const citizen = citizens.find(c => c.id === selectedCrew[0]);
                      if (!citizen) return null;
                      const hasAffinity = selectedJourney.affinityElements.includes(citizen.type?.toLowerCase());

                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-black/80 flex items-center justify-center p-1 shadow-inner relative">
                            <Image
                              src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                              alt={citizen.name}
                              width={44}
                              height={44}
                              unoptimized
                              className="object-contain"
                            />
                            {hasAffinity && (
                              <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-black font-extrabold rounded-full w-4 h-4 flex items-center justify-center shadow">
                                ★
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[90px]">{citizen.name}</span>
                          <span className="text-[9px] text-zinc-400 font-mono capitalize">{citizen.type}</span>
                        </div>
                      );
                    })() : (
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-zinc-600 text-xs my-1">
                        Empty
                      </div>
                    )}
                  </div>

                  {/* Station 2: Crow's Nest / Lookout */}
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden shadow-md">
                    <span className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-wider mb-1.5">
                      2. Lookout
                    </span>

                    {selectedCrew[1] ? (() => {
                      const citizen = citizens.find(c => c.id === selectedCrew[1]);
                      if (!citizen) return null;
                      const hasAffinity = selectedJourney.affinityElements.includes(citizen.type?.toLowerCase());

                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-black/80 flex items-center justify-center p-1 shadow-inner relative">
                            <Image
                              src={citizen.filename ? `/images/creatures/${citizen.filename.replace(/\.png$/i, '.webp')}` : `/images/creatures/${citizen.id}.webp`}
                              alt={citizen.name}
                              width={44}
                              height={44}
                              unoptimized
                              className="object-contain"
                            />
                            {hasAffinity && (
                              <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-black font-extrabold rounded-full w-4 h-4 flex items-center justify-center shadow">
                                ★
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[90px]">{citizen.name}</span>
                          <span className="text-[9px] text-zinc-400 font-mono capitalize">{citizen.type}</span>
                        </div>
                      );
                    })() : (
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-zinc-600 text-xs my-1">
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
                        const hasAffinity = selectedJourney.affinityElements.includes(c.type?.toLowerCase());

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
                                  +15% ★
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

              {/* TACTILE ENGINE ORDER TELEGRAPH LEVER (Launch Control) */}
              <div className="pt-4 border-t border-amber-900/30 space-y-3">
                
                <div className="bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 uppercase font-bold">Engine telegraph:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 0 ? "bg-zinc-800 text-zinc-400" : "text-zinc-600")}>Standby</span>
                    <span>→</span>
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-600")}>Half</span>
                    <span>→</span>
                    <span className={cn("px-1.5 py-0.5 rounded", selectedCrew.length === 2 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse" : "text-zinc-600")}>Full ahead</span>
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
