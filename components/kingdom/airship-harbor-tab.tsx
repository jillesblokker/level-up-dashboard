"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { Plane, Sparkles, Check, Flame, Shield, Users, Clock, Trophy, Trash2, ArrowRight } from "lucide-react"
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

interface JourneyRegion {
  id: string;
  name: string;
  category: 'knowledge' | 'might' | 'wellness' | 'social';
  description: string;
  affinityElements: string[];
  rewards: { id: string; name: string; emoji: string; quantity: number }[];
}

const HABIT_JOURNEYS: JourneyRegion[] = [
  {
    id: 'pilgrimage-knowledge',
    name: 'Pilgrimage of Knowledge',
    category: 'knowledge',
    description: 'Advance by completing Knowledge or Intelligence habits. Collect magical crystals and pure water.',
    affinityElements: ['water', 'ice'],
    rewards: [
      { id: 'material-crystal', name: 'Essence Crystals', emoji: '💎', quantity: 2 },
      { id: 'material-water', name: 'Water', emoji: '💧', quantity: 3 }
    ]
  },
  {
    id: 'march-might',
    name: 'March of Might',
    category: 'might',
    description: 'Advance by completing Might or Agility habits. Forge ahead for solid steel and building logs.',
    affinityElements: ['fire', 'earth'],
    rewards: [
      { id: 'material-steel', name: 'Steel Ingots', emoji: '⚔️', quantity: 2 },
      { id: 'material-logs', name: 'Wooden Logs', emoji: '🪵', quantity: 4 }
    ]
  },
  {
    id: 'trail-wellness',
    name: 'Trail of Wellness',
    category: 'wellness',
    description: 'Advance by completing Wellness, Vitality, or Spiritual habits. Net rare rainbow fish and mountain water.',
    affinityElements: ['nature', 'water'],
    rewards: [
      { id: 'fish-rainbow', name: 'Rainbow Fish', emoji: '🌈🐟', quantity: 1 },
      { id: 'material-water', name: 'Water', emoji: '💧', quantity: 2 }
    ]
  },
  {
    id: 'social-bonds',
    name: 'Expedition of Social Bonds',
    category: 'social',
    description: 'Advance by completing Social or Creative habits. Bring back premium silver and golden fish.',
    affinityElements: ['special', 'earth'],
    rewards: [
      { id: 'material-silver', name: 'Silver Bars', emoji: '🪙', quantity: 2 },
      { id: 'fish-silver', name: 'Silver Fish', emoji: '🐟', quantity: 2 }
    ]
  }
];

export function AirshipHarborTab() {
  const { user } = useUser();
  
  // States
  const [activeVoyage, setActiveVoyage] = useState<any>(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('pilgrimage-knowledge');
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Citizens store
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);

  const loadVoyageData = useCallback(async () => {
    if (!user?.id) return;
    try {
      await loadCitizens(user.id);
      const voyage = await getUserPreference('active_expeditions') || { active: false };
      setActiveVoyage(voyage);
    } catch (err) {
      logger.error('[Airship] Failed to load voyage data:', err);
    }
  }, [user?.id, loadCitizens]);

  useEffect(() => {
    if (user?.id) {
      loadVoyageData();
    }
  }, [user?.id, loadVoyageData]);

  const selectedJourney = HABIT_JOURNEYS.find(j => j.id === selectedJourneyId)!;
  const idleCitizens = citizens.filter(c => !c.lockedReason);

  const playLaunchSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Airship horn / low rumble sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  const handleToggleCrewSelection = (id: string) => {
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

  const handleLaunch = async () => {
    if (!user?.id || isLaunching) return;
    if (selectedCrew.length === 0) {
      toast({
        title: "No Vanguard Appointed",
        description: "Appoint at least 1 Vanguard Knight to lead your airship voyage.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLaunching(true);
      playLaunchSound();

      // Calculate initial progress based on Element Affinities
      let affinityCount = 0;
      selectedCrew.forEach(cId => {
        const citizen = citizens.find(c => c.id === cId);
        if (citizen && selectedJourney.affinityElements.includes(citizen.type)) {
          affinityCount += 1;
        }
      });
      const initialProgress = affinityCount * 15; // matched crew gives +15% or +30% initial progress!

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
        title: "Airship Launched! 🚀✨",
        description: `${selectedJourney.name} has begun with ${selectedCrew.length} crew member(s). Match habits to advance progress!`
      });

      setSelectedCrew([]);
      await loadVoyageData();
    } catch (err: any) {
      toast({
        title: "Launch failed",
        description: "Failed to launch Airship voyage.",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const handleAbandon = async () => {
    if (!user?.id || !activeVoyage) return;
    const confirm = window.confirm("Are you sure you want to abandon this voyage? Your citizens will return immediately but you will forfeit all progress and rewards.");
    if (!confirm) return;

    try {
      // 1. Unlock citizens in preferences
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      activeVoyage.crew.forEach((cId: string) => {
        if (savedPrefs[cId]) {
          savedPrefs[cId].lockedReason = null;
        }
      });
      await setUserPreference('citizens_state', savedPrefs);

      // 2. Clear voyage preference
      await setUserPreference('active_expeditions', { active: false });

      toast({
        title: "Voyage Abandoned 🗑️",
        description: "Your citizens have returned safely to the Dormitory."
      });

      await loadVoyageData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async () => {
    if (!user?.id || !activeVoyage || isClaiming) return;
    const voyageRegion = HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId)!;

    try {
      setIsClaiming(true);

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

      // Unlock citizens & grant expedition XP + level up
      const savedPrefs: any = await getUserPreference('citizens_state') || {};
      activeVoyage.crew.forEach((cId: string) => {
        if (savedPrefs[cId]) {
          savedPrefs[cId].lockedReason = null;
          // Grant XP and affection to crew members for successfully completing expedition!
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

      // Clear voyage preference
      await setUserPreference('active_expeditions', { active: false });

      toast({
        title: "Chests Retrieved! 🪙📦",
        description: `Your crew returned safely with materials! Crew gained +150 XP and +15 Affection.`
      });

      window.dispatchEvent(new Event('character-inventory-update'));
      await loadVoyageData();
    } catch (err) {
      toast({
        title: "Claim Failed",
        description: "Failed to claim voyage chests.",
        variant: "destructive"
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Airship Harbor Header */}
      <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-amber-950/20 shadow-2xl flex items-end">
        <Image
          src="/images/airship-harbor.png"
          alt="Airship Harbor"
          fill
          className="object-cover brightness-75 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="p-6 relative z-10 space-y-1">
          <Badge className="bg-amber-600 text-black font-extrabold text-[9px] uppercase tracking-wider mb-2">
            Expedition Guild
          </Badge>
          <h2 className="font-cardo font-bold text-2xl text-white">Airship Harbor</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Match real-life habits to propel magical airships forward. Lock citizen crews to gain resource chests and training experience.
          </p>
        </div>
      </div>

      {activeVoyage?.active ? (
        /* Active Voyage Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <Card className="lg:col-span-2 bg-[#0f1115] border border-amber-950/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between min-h-[350px]">
            <div className="space-y-5">
              
              {/* Journey Header */}
              {(() => {
                const region = HABIT_JOURNEYS.find(j => j.id === activeVoyage.journeyId)!;
                const progress = activeVoyage.progress || 0;
                const isFinished = progress >= 100;

                return (
                  <>
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Active Voyage</span>
                        <h3 className="font-cardo font-bold text-lg text-white mt-1">{region.name}</h3>
                      </div>
                      <Badge className={cn(
                        "text-[9px] uppercase font-bold tracking-wider",
                        isFinished ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                      )}>
                        {isFinished ? "Ready to dock" : "In Flight"}
                      </Badge>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-400">Voyage Distance:</span>
                        <span className="text-amber-500">{progress}% Completed</span>
                      </div>
                      <Progress value={progress} className="h-3 bg-zinc-900 border border-white/5" indicatorClassName="bg-gradient-to-r from-blue-600 to-indigo-500 animate-pulse" />
                      
                      {isFinished ? (
                        <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                          <Check className="w-3.5 h-3.5" /> Destination reached! The Airship has safely docked. Claim your resource chests.
                        </p>
                      ) : (
                        <p className="text-[10px] text-zinc-500 leading-relaxed mt-1 font-semibold">
                          Propel this voyage by completing habits/quests under the <strong className="text-amber-500 capitalize">{region.category}</strong> category. Complete any quest to add +20% distance.
                        </p>
                      )}
                    </div>

                    {/* Rewards Preview */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Voyage Chest Cargo:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {region.rewards.map(reward => (
                          <div key={reward.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl flex items-center gap-2.5 text-xs">
                            <span className="text-xl">{reward.emoji}</span>
                            <div>
                              <p className="font-bold text-white">{reward.name}</p>
                              <p className="text-[10px] text-zinc-500 font-bold">Qty: x{reward.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/5 mt-4">
              <Button
                variant="outline"
                onClick={handleAbandon}
                className="w-1/3 text-xs border-red-950/45 text-red-500 bg-red-950/5 hover:bg-red-950/20 font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Abandon Voyage
              </Button>

              <Button
                disabled={activeVoyage.progress < 100 || isClaiming}
                onClick={handleClaim}
                className={cn(
                  "w-2/3 text-xs font-bold py-5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5",
                  activeVoyage.progress >= 100
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-extrabold shadow-lg hover:brightness-110"
                    : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                )}
              >
                {isClaiming ? <>Claiming Chest Cargo...</> : <>Claim Voyage Cargo & Unlock Crew</>}
              </Button>
            </div>

          </Card>

          {/* Slotted Crew List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
              <Users className="w-5 h-5 text-amber-500" /> Slotted Crew Members
            </h3>

            <div className="space-y-3">
              {activeVoyage.crew.map((cId: string) => {
                const citizen = citizens.find(c => c.id === cId);
                if (!citizen) return null;

                return (
                  <div key={cId} className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex items-center gap-3.5 shadow-md">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-2xl relative shrink-0">
                      <Image
                        src={citizen.filename ? `/images/creatures/${citizen.filename}` : '/images/placeholders/creature.webp'}
                        alt={citizen.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs leading-none">{citizen.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1.5 font-bold flex items-center gap-1">
                        <span className="capitalize">{citizen.type} Element</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span>Level {citizen.level || 1}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Launch Setup Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Journeys Selection list */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
              <Plane className="w-5 h-5 text-amber-500" /> Choose Habit Journey
            </h3>
            
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {HABIT_JOURNEYS.map(j => {
                const isSelected = selectedJourneyId === j.id;
                
                return (
                  <div
                    key={j.id}
                    onClick={() => {
                      setSelectedJourneyId(j.id);
                      setSelectedCrew([]); // clear crew on region swap
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5",
                      isSelected
                        ? "bg-amber-950/20 border-amber-500/50 shadow-inner"
                        : "bg-[#0f1115] border-white/5 hover:border-amber-900/30"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white text-xs">{j.name}</h4>
                      <Badge variant="outline" className="text-[8px] uppercase tracking-wider capitalize text-amber-500/80 border-amber-500/20">
                        {j.category}
                      </Badge>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-relaxed line-clamp-2">
                      {j.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Airship Launch Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-6 shadow-2xl min-h-[400px] flex flex-col justify-between">
              
              <div className="space-y-5">
                <div className="flex items-center gap-3.5 pb-4 border-b border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Plane className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-cardo font-bold text-white text-sm">{selectedJourney.name} Setup</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                      Voyage Category: {selectedJourney.category}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
                  {selectedJourney.description}
                </p>

                {/* Affinity Bonus Indicators */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Crew Affinity Elements:</div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedJourney.affinityElements.map(element => (
                      <Badge key={element} className="bg-amber-600/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold">
                        {element}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-normal font-semibold pt-1">
                    Matched elements grant +15% initial progress distance upon launch!
                  </p>
                </div>

                {/* Crew Selection checklists */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Appoint Expedition Vanguard (Max 2):</h4>
                  {idleCitizens.length === 0 ? (
                    <p className="text-xs text-zinc-600 leading-normal">
                      No idle citizens in dormitory. Unlock citizens or wait for active airship crews to return!
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {idleCitizens.map(c => {
                        const isSelected = selectedCrew.includes(c.id);
                        const hasAffinity = selectedJourney.affinityElements.includes(c.type);

                        return (
                          <div
                            key={c.id}
                            onClick={() => handleToggleCrewSelection(c.id)}
                            className={cn(
                              "p-2 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all select-none",
                              isSelected 
                                ? "bg-amber-950/15 border-amber-500/40 text-amber-400" 
                                : "bg-zinc-950/60 border-white/5 hover:border-zinc-800 text-white"
                            )}
                          >
                            <span className="font-bold truncate shrink-0">{c.name}</span>
                            {hasAffinity && (
                              <Badge className="bg-amber-600/20 text-amber-400 text-[7px] uppercase font-black shrink-0 px-1 ml-1">
                                Star ★
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Launch Requirements Checklist */}
                <div className="p-3.5 bg-zinc-950/60 border border-white/5 rounded-xl space-y-2.5">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Launch Requirements Checklist:</div>
                  <div className="space-y-1.5 text-xs font-semibold">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className={cn("w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-black font-extrabold", selectedJourneyId ? "bg-emerald-500" : "bg-red-500")}>
                        {selectedJourneyId ? "✓" : "✗"}
                      </span>
                      <span>Select a Habit Journey (Selected: <strong className="text-amber-500">{selectedJourney.name}</strong>)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className={cn("w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-black font-extrabold", selectedCrew.length > 0 ? "bg-emerald-500" : "bg-red-500")}>
                        {selectedCrew.length > 0 ? "✓" : "✗"}
                      </span>
                      <span>Appoint Vanguard (Appointed: <strong className="text-amber-500">{selectedCrew.length} / 2</strong> — Select knights from the list above)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/5 mt-4">
                <Button
                  disabled={isLaunching || selectedCrew.length === 0}
                  onClick={handleLaunch}
                  className={cn(
                    "w-full text-xs font-bold py-5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    !isLaunching && selectedCrew.length > 0
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold shadow-lg hover:brightness-110 active:scale-[0.98]" 
                      : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  )}
                >
                  {isLaunching ? <>⏳ Prepping Airship Voyage...</> : <>⛵ Unfurl Sails & Launch Expedition</>}
                </Button>
              </div>

            </Card>

          </div>
        </div>
      )}

    </div>
  );
}
