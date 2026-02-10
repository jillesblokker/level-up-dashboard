'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';
import {
  CREATURE_DATA,
  CREATURE_IDS,
  CreatureDef,
  getMatchupMultiplier,
  getTypeEmoji,
  getTypeColor
} from './game-logic';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Loot {
  type: string;
  amount?: number;
  name: string;
  itemId?: string;
  itemStats?: any;
  starRating?: number;
}

interface Encounter {
  type: 'monster' | 'treasure';
  hp?: number;
  maxHp?: number;
  difficulty?: number;
  creatureId?: string; // If monster
  loot?: Loot[];
}

interface DungeonRun {
  currentRoom: number;
  currentHp: number;
  maxHp: number;
  status: 'in_progress' | 'completed' | 'defeated';
  currentEncounter: Encounter;
  lootCollected: Loot[];
  maxRooms: number;
}

const DEFAULT_CREATURE: CreatureDef = {
  id: 'starter',
  name: 'Wanderer',
  type: 'Rock', // Basic starter type
  stats: { atk: 10, def: 10, spd: 10 },
  description: 'A brave adventurer.'
};

function generateEncounter(roomLevel: number): Encounter {
  const isTreasure = Math.random() < 0.2;
  if (isTreasure) {
    return {
      type: 'treasure',
      loot: [generateLoot(roomLevel)].filter(Boolean) as Loot[]
    };
  }

  // Pick random creature
  const randomId = CREATURE_IDS[Math.floor(Math.random() * CREATURE_IDS.length)] || '001';
  const creature = CREATURE_DATA[randomId];

  return {
    type: 'monster',
    hp: 20 + (roomLevel * 5),
    maxHp: 20 + (roomLevel * 5),
    difficulty: roomLevel,
    creatureId: randomId
  };
}

function generateLoot(roomLevel: number): Loot | null {
  if (Math.random() > 0.5) {
    return { type: 'gold', amount: 50 + (roomLevel * 10), name: 'Gold Coins' };
  }

  const possibleItems = comprehensiveItems.filter(i => {
    if (roomLevel < 3) return i.rarity === 'common' || i.rarity === 'uncommon';
    if (roomLevel < 7) return i.rarity === 'rare' || i.rarity === 'epic';
    return i.rarity === 'legendary';
  }).filter(i => i.type === 'weapon' || i.type === 'potion' || i.type === 'armor');

  if (possibleItems.length > 0) {
    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)]!;
    const roll = Math.random();
    let stars = 0;
    if (roll < 0.01) stars = 3;
    else if (roll < 0.05) stars = 2;
    else if (roll < 0.15) stars = 1;

    const starPrefix = stars === 3 ? 'Radiant ' : stars === 2 ? 'Gleaming ' : stars === 1 ? 'Polished ' : '';

    return {
      type: 'item',
      name: `${starPrefix}${item.name}`,
      itemId: item.id,
      itemStats: item.stats,
      starRating: stars
    };
  }

  return null;
}

export default function DungeonPage() {
  const router = useRouter();
  const [run, setRun] = useState<DungeonRun | null>(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedCreatures, setUnlockedCreatures] = useState<CreatureDef[]>([]);
  const [selectedCreature, setSelectedCreature] = useState<CreatureDef | null>(null);
  const [battlePhase, setBattlePhase] = useState<'select' | 'fight' | 'result'>('select');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  // Load Unlocked Creatures
  useEffect(() => {
    async function loadUnlockables() {
      try {
        const res = await fetch('/api/achievements');
        if (res.ok) {
          const achievements = await res.json();
          if (Array.isArray(achievements)) {
            const unlocked = achievements
              .map((a: any) => CREATURE_DATA[a.achievement_id])
              .filter((c: CreatureDef | undefined): c is CreatureDef => !!c);

            if (unlocked.length > 0) {
              setUnlockedCreatures(unlocked);
            } else {
              setUnlockedCreatures([DEFAULT_CREATURE]);
            }
          }
        } else {
          setUnlockedCreatures([DEFAULT_CREATURE]);
        }
      } catch (e) {
        console.error('Failed to load unlocked creatures', e);
        setUnlockedCreatures([DEFAULT_CREATURE]);
      }
    }
    loadUnlockables();
  }, []);

  // Load Run & Fix Legacy Data
  useEffect(() => {
    const saved = localStorage.getItem('dungeon_run');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // FIX LEGACY DATA: If monster encounter is missing creatureId
        if (parsed.currentEncounter && parsed.currentEncounter.type === 'monster' && !parsed.currentEncounter.creatureId) {
          console.warn('Fixing legacy dungeon run data...');
          parsed.currentEncounter.creatureId = '001'; // Default to Flamio
          localStorage.setItem('dungeon_run', JSON.stringify(parsed));
        }
        setRun(parsed);
      } catch (e) {
        console.error("Failed to parse dungeon run", e);
        localStorage.removeItem('dungeon_run');
      }
    }
  }, []);

  useEffect(() => {
    if (run) {
      localStorage.setItem('dungeon_run', JSON.stringify(run));
    } else {
      localStorage.removeItem('dungeon_run');
    }
  }, [run]);

  // Reset phase when new monster appears
  useEffect(() => {
    if (run?.currentEncounter.type === 'monster') {
      if (battlePhase !== 'select' && battlePhase !== 'fight') {
        setBattlePhase('select');
        setSelectedCreature(null);
        setMessage('A wild creature appeared! Choose your fighter!');
        setBattleLog([]);
      }
    } else if (run?.currentEncounter.type === 'treasure') {
      setMessage('You found a treasure chest!');
    }
  }, [run?.currentRoom, run?.currentEncounter.type]);

  const startRun = () => {
    const maxHp = 150;
    const firstEncounter = generateEncounter(1);
    const newRun: DungeonRun = {
      currentRoom: 1,
      currentHp: maxHp,
      maxHp: maxHp,
      status: 'in_progress',
      currentEncounter: firstEncounter,
      lootCollected: [],
      maxRooms: 5
    };
    setRun(newRun);
    setBattlePhase('select');
    setBattleLog(['Dungeon started! Good luck.']);
  };

  const selectFighter = (creature: CreatureDef) => {
    setSelectedCreature(creature);
    setBattlePhase('fight');

    // Calculate initial matchup hint
    if (run?.currentEncounter.creatureId) {
      const enemyDef = CREATURE_DATA[run.currentEncounter.creatureId];
      if (enemyDef) {
        const mult = getMatchupMultiplier(creature.type, enemyDef.type);
        setBattleLog(prev => [...prev, `You chose ${creature.name} (${creature.type}) vs ${enemyDef.name} (${enemyDef.type})`]);

        if (mult > 1) setMessage(`Advantage! Your attacks will be super effective! (x${mult})`);
        else if (mult < 1) setMessage(`Warning! Your attacks will be weak... (x${mult})`);
        else setMessage('Battle ready!');
      }
    }
  };

  const fight = () => {
    if (!run || run.currentEncounter.type !== 'monster' || !selectedCreature) return;

    // Fallback if ID missing (should be fixed by useEffect, but safe guard)
    const enemyId = run.currentEncounter.creatureId || '001';
    const enemyDef = CREATURE_DATA[enemyId];

    if (!enemyDef) return;

    // Multipliers
    const playerMult = getMatchupMultiplier(selectedCreature.type, enemyDef.type);
    const enemyMult = getMatchupMultiplier(enemyDef.type, selectedCreature.type); // Enemy attacking player

    // Damage Calc
    const playerBaseDmg = Math.floor(Math.random() * 5) + selectedCreature.stats.atk;
    const damage = Math.floor(playerBaseDmg * playerMult);

    const enemyBaseDmg = Math.floor(Math.random() * 5) + enemyDef.stats.atk;
    const monsterDamage = Math.floor(enemyBaseDmg * enemyMult);

    const newMonsterHp = (run.currentEncounter.hp || 0) - damage;
    const newPlayerHp = run.currentHp - monsterDamage;

    // Log the turn
    const logEntries: string[] = [];
    logEntries.push(`You hit ${enemyDef.name} for ${damage} damage! ${playerMult > 1 ? '🔥' : ''}`);

    if (newMonsterHp > 0) {
      logEntries.push(`${enemyDef.name} hit you for ${monsterDamage} damage! ${enemyMult > 1 ? '⚠️' : ''}`);
    } else {
      logEntries.push(`${enemyDef.name} fainted! Victory! 🏆`);
    }

    setBattleLog(prev => [...prev, ...logEntries]);

    if (newMonsterHp <= 0) {
      // Monster defeated
      const loot = generateLoot(run.currentRoom);
      const newLoot = loot ? [...run.lootCollected, loot] : run.lootCollected;

      if (loot) logEntries.push(`Loot found: ${loot.name}`);

      if (run.currentRoom >= run.maxRooms) {
        completeRun({ ...run, lootCollected: newLoot, status: 'completed' });
      } else {
        setTimeout(() => {
          setRun({
            ...run,
            currentRoom: run.currentRoom + 1,
            lootCollected: newLoot,
            currentEncounter: generateEncounter(run.currentRoom + 1)
          });
          setBattlePhase('select');
          setBattleLog([]);
        }, 1500); // Delay to read log
      }
    } else if (newPlayerHp <= 0) {
      setBattleLog(prev => [...prev, 'You were defeated... 💀']);
      completeRun({ ...run, currentHp: 0, status: 'defeated' });
    } else {
      setRun({
        ...run,
        currentHp: newPlayerHp,
        currentEncounter: { ...run.currentEncounter, hp: newMonsterHp }
      });
    }
  };

  const openTreasure = () => {
    if (!run || run.currentEncounter.type !== 'treasure') return;

    const loot = run.currentEncounter.loot || [];
    const newLoot = [...run.lootCollected, ...loot];

    const itemNames = loot.map(l => l.name).join(', ');
    setMessage(`You found: ${itemNames || 'Nothing'}`);

    if (run.currentRoom >= run.maxRooms) {
      completeRun({ ...run, lootCollected: newLoot, status: 'completed' });
    } else {
      setTimeout(() => {
        setRun({
          ...run,
          currentRoom: run.currentRoom + 1,
          lootCollected: newLoot,
          currentEncounter: generateEncounter(run.currentRoom + 1)
        });
        setBattlePhase('select');
      }, 1500);
    }
  };

  const flee = () => {
    if (!run) return;
    completeRun({ ...run, status: 'defeated' });
  };

  const completeRun = async (finalRun: DungeonRun) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/dungeon-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loot: finalRun.lootCollected, status: finalRun.status })
      });

      if (!response.ok) throw new Error('Failed to save rewards');
      const data = await response.json();
      setMessage(finalRun.status === 'completed'
        ? `🎉 Dungeon cleared! Rewards: ${data.rewards.gold}g, ${data.rewards.xp}xp, ${data.rewards.items} items!`
        : '💀 You were defeated...');
      setRun(null);
      setTimeout(() => router.push('/kingdom'), 3000);
    } catch (error) {
      setMessage('Error saving rewards: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setTimeout(() => router.push('/kingdom'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDERING ---

  if (!run) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-black to-black p-8 text-white flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">DUNGEON</h1>
            <p className="text-stone-400 text-lg">Brave the depths, fight creatures, earn loot.</p>
          </div>

          <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 backdrop-blur-sm">
            <div className="text-sm font-medium text-stone-500 mb-1">ENTRY COST</div>
            <div className="text-3xl font-bold text-green-400">FREE</div>
          </div>

          <Button onClick={startRun} size="lg" className="w-full h-16 text-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 border border-red-500/30 shadow-xl shadow-red-900/20 font-bold tracking-wide transition-all hover:scale-105">
            ⚔️ ENTER DUNGEON
          </Button>
        </div>
      </div>
    );
  }

  // Ensure we have a valid enemy definition, even if data is slightly malformed (fallback to 001 if needed)
  const enemyId = run.currentEncounter.creatureId || '001';
  const enemyDef = CREATURE_DATA[enemyId];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Room Info */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-md">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Location</div>
            <div className="text-2xl font-black flex items-center gap-2">
              <span>Room {run.currentRoom}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">{run.maxRooms}</span>
            </div>
            <div className="mt-2 text-sm text-yellow-500 font-medium">
              💰 Loot Found: {run.lootCollected.length}
            </div>
          </div>

          {/* Player HP */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-md">
            <div className="flex justify-between items-end mb-2">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Player Health</div>
              <div className={`font-mono font-bold ${run.currentHp < 50 ? 'text-red-500' : 'text-green-400'}`}>
                {run.currentHp} / {run.maxHp}
              </div>
            </div>
            <Progress value={(run.currentHp / run.maxHp) * 100} className="h-3 bg-slate-700" indicatorClassName={run.currentHp < 50 ? 'bg-red-500' : 'bg-green-500'} />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/30 p-3 rounded-lg text-center text-blue-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        {/* Main Encounter Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">

          {/* LEFT: Enemy / Target */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            {run.currentEncounter.type === 'monster' && enemyDef ? (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${getTypeColor(enemyDef.type).split(' ')[0].replace('text-', 'from-')}/20 to-transparent blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  <Card className={`w-64 border-2 ${getTypeColor(enemyDef.type)} bg-slate-900/80 backdrop-blur-sm relative overflow-visible shadow-2xl`}>
                    <div className="absolute -top-5 -right-5 text-6xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      {getTypeEmoji(enemyDef.type)}
                    </div>
                    <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-widest text-white">{enemyDef.name}</h3>
                        <Badge variant="outline" className={`${getTypeColor(enemyDef.type)} mt-2 bg-transparent`}>{enemyDef.type} Type</Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400 font-medium">
                          <span>HP</span>
                          <span>{run.currentEncounter.hp} / {run.currentEncounter.maxHp}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${((run.currentEncounter.hp || 0) / (run.currentEncounter.maxHp || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs opacity-70 border-t border-slate-700/50 pt-4 mt-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-300">{enemyDef.stats.atk}</span>
                          <span className="scale-75">ATK</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-300">{enemyDef.stats.def}</span>
                          <span className="scale-75">DEF</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-300">{enemyDef.stats.spd}</span>
                          <span className="scale-75">SPD</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6 text-slate-500 font-bold text-lg tracking-widest">ENEMY</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">📦</div>
                <h3 className="text-2xl font-bold text-amber-400 mb-2">Treasure Room!</h3>
                <p className="text-slate-400 mb-6">A reward for your bravery.</p>
                <Button onClick={openTreasure} size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8">
                  Open Chest
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT: Player Controls / Combat Log */}
          <div className="flex flex-col gap-4">

            {/* Combat Log */}
            <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 p-4 min-h-[200px] flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Combat Log</h4>
              <ScrollArea className="flex-1 h-[200px] w-full">
                <div className="space-y-2 text-sm font-mono">
                  {battleLog.length === 0 && <span className="text-slate-600 italic">...waiting for action...</span>}
                  {battleLog.map((log, i) => (
                    <div key={i} className={`p-2 rounded border-l-2 ${log.includes('victory') ? 'border-yellow-500 bg-yellow-900/10' : log.includes('hit you') ? 'border-red-500 bg-red-900/10' : 'border-blue-500 bg-blue-900/10'} border-opacity-50`}>
                      {log}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Controls */}
            {run.currentEncounter.type === 'monster' && (
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                {battlePhase === 'select' ? (
                  <>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex justify-between items-center">
                      <span>Select Fighter</span>
                      <span className="text-xs font-normal text-slate-500">{unlockedCreatures.length} available</span>
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1">
                      {unlockedCreatures.map(creature => (
                        <button
                          key={creature.id}
                          onClick={() => selectFighter(creature)}
                          className={`p-2 rounded border text-left transition-all hover:brightness-110 hover:shadow-lg active:scale-95 ${getTypeColor(creature.type)}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm truncate">{creature.name}</span>
                            <span className="text-lg">{getTypeEmoji(creature.type)}</span>
                          </div>
                          <div className="text-[10px] opacity-70 flex gap-1">
                            <span>A:{creature.stats.atk}</span>
                            <span>D:{creature.stats.def}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeEmoji(selectedCreature!.type)}</span>
                        <div>
                          <div className="font-bold text-sm">{selectedCreature!.name}</div>
                          <div className="text-xs text-slate-400">Your Fighter</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setBattlePhase('select')} className="text-xs h-7">Change</Button>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={fight} className="flex-1 h-12 text-lg bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-900/20 active:translate-y-0.5 transition-all">
                        ⚔️ Attack
                      </Button>
                      <Button onClick={flee} variant="secondary" className="h-12 px-6">
                        🏃 Flee
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
