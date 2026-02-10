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
import { Loader2 } from 'lucide-react';

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
  party: CreatureDef[]; // NEW: The drafted team of 6
}

interface GameResult {
  success: boolean;
  rewards?: {
    gold: number;
    xp: number;
    items: number;
  };
  loot?: Loot[];
}

const DEFAULT_CREATURE: CreatureDef = {
  id: 'starter',
  name: 'Wanderer',
  type: 'Rock', // Basic starter type
  stats: { atk: 10, def: 10, spd: 10 },
  description: 'A brave adventurer.'
};

function generateEncounter(roomLevel: number): Encounter {
  // Treasure rooms removed as per request
  const isTreasure = false;
  if (isTreasure) {
    return {
      type: 'treasure',
      loot: [generateLoot(roomLevel)].filter(Boolean) as Loot[]
    };
  }

  // Pick random creature
  const randomId = CREATURE_IDS[Math.floor(Math.random() * CREATURE_IDS.length)] || '001';
  // Increase stats based on room level for scaling difficulty
  // We don't modify the base CREATURE_DATA definition, but the encounter stats below

  return {
    type: 'monster',
    hp: 20 + (roomLevel * 8), // Slightly increased HP scaling
    maxHp: 20 + (roomLevel * 8),
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
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
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

            setUnlockedCreatures(unlocked.length > 0 ? unlocked : [DEFAULT_CREATURE]);
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
        if (parsed.currentEncounter && parsed.currentEncounter.type === 'monster' && !parsed.currentEncounter.creatureId) {
          console.warn('Fixing legacy dungeon run data...');
          parsed.currentEncounter.creatureId = '001';
          localStorage.setItem('dungeon_run', JSON.stringify(parsed));
        }
        // Legacy support: if no party, generate one from unlocked (or defaults if loading fails)
        if (!parsed.party) {
          parsed.party = [DEFAULT_CREATURE];
        }
        setRun(parsed);
        // Automatically re-select the previous creature if available
        if (parsed.status === 'in_progress' && parsed.party.length > 0) {
          // Keep selection null to force choice, or restore? 
          // Better to force choice if phase is select
        }
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
        // Auto-select previous creature if it's still valid, or go to select
        if (selectedCreature) {
          setBattlePhase('fight');
          setMessage(`Encounter started! ${selectedCreature.name} is ready!`);
        } else {
          setBattlePhase('select');
          setMessage('A wild creature appeared! Choose your fighter!');
        }

        if (battleLog.length > 0 && battlePhase === 'result') {
          setBattleLog([]);
        }
      }
    } else if (run?.currentEncounter.type === 'treasure') {
      setMessage('You found a treasure chest!');
    }
  }, [run?.currentRoom, run?.currentEncounter.type]); // Removed selectedCreature from deps to avoid cycle

  const startRun = () => {
    // Check Daily Limit (3 times per day)
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'dungeon_daily_limit';
    const storage = localStorage.getItem(storageKey);
    let data = storage ? JSON.parse(storage) : { date: today, count: 0 };

    if (data.date !== today) {
      data = { date: today, count: 0 };
    }

    if (data.count >= 3) {
      setMessage('🛑 Daily limit reached (3/3)! The dungeon is closed until tomorrow.');
      return;
    }

    // Increment count
    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));

    const maxHp = 150;
    const firstEncounter = generateEncounter(1);

    // DRAFTING PHASE: Pick 6 random creatures
    const pool = [...unlockedCreatures];
    const party: CreatureDef[] = [];
    const draftSize = Math.min(6, pool.length);

    for (let i = 0; i < draftSize; i++) {
      if (pool.length === 0) break;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const creature = pool[randomIndex];
      if (creature) {
        party.push(creature);
        pool.splice(randomIndex, 1);
      }
    }

    // Fallback
    if (party.length === 0) party.push(DEFAULT_CREATURE);

    const newRun: DungeonRun = {
      currentRoom: 1,
      currentHp: maxHp,
      maxHp: maxHp,
      status: 'in_progress',
      currentEncounter: firstEncounter,
      lootCollected: [],
      maxRooms: 5,
      party: party
    };

    setRun(newRun);
    setGameResult(null);
    setBattlePhase('select');
    setBattleLog([
      `Dungeon started!`,
      `Drafted Team: ${party.map(c => c.name).join(', ')}`
    ]);
  };

  const selectFighter = (creature: CreatureDef) => {
    setSelectedCreature(creature);
    setBattlePhase('fight');

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

    const enemyId = run.currentEncounter.creatureId || '001';
    const enemyDef = CREATURE_DATA[enemyId];

    if (!enemyDef) return;

    const logEntries: string[] = [];

    // --- REVISED COMBAT LOGIC ---

    // 1. Calculate Stats
    // Player
    const playerSpd = selectedCreature.stats.spd;
    const playerDef = selectedCreature.stats.def;
    const playerAtk = selectedCreature.stats.atk + (Math.floor(Math.random() * 5)); // Variance
    // Enemy
    const enemySpd = enemyDef.stats.spd;
    const enemyDefStat = enemyDef.stats.def;
    const enemyAtk = enemyDef.stats.atk + (Math.floor(Math.random() * 5));

    // 2. Type Multipliers
    const playerTypeMult = getMatchupMultiplier(selectedCreature.type, enemyDef.type);
    const enemyTypeMult = getMatchupMultiplier(enemyDef.type, selectedCreature.type);

    // 3. Crit & Dodge Checks
    // Player Crit Chance: 3% per speed point variance, max 50%
    const playerCritChance = Math.max(0, Math.min(0.5, (playerSpd - enemySpd) * 0.03));
    const isPlayerCrit = Math.random() < playerCritChance;

    // Player Dodge Chance: 2% per speed point advantage
    const playerDodgeChance = Math.max(0, Math.min(0.4, (playerSpd - enemySpd) * 0.02));
    const isPlayerDodge = Math.random() < playerDodgeChance;

    // Enemy Crit/Dodge (simpler logic for enemy)
    const isEnemyCrit = Math.random() < 0.05; // Fixed 5% chance for enemy

    // 4. Damage Calculation
    // Player vs Enemy
    let playerFinalDmg = 0;
    const playerCritMult = isPlayerCrit ? 1.5 : 1.0;
    // Defense mitigation: Damage - (Def * 0.5)
    // Ensure at least 1 damage
    playerFinalDmg = Math.max(1, Math.floor((playerAtk * playerTypeMult * playerCritMult) - (enemyDefStat * 0.4)));

    // Enemy vs Player
    let enemyFinalDmg = 0;
    if (!isPlayerDodge) {
      const enemyCritMult = isEnemyCrit ? 1.5 : 1.0;
      enemyFinalDmg = Math.max(1, Math.floor((enemyAtk * enemyTypeMult * enemyCritMult) - (playerDef * 0.4)));
    }

    // 5. Apply Results

    // Player Attack Log
    if (isPlayerCrit) logEntries.push(`🎯 CRITICAL HIT! You hit for ${playerFinalDmg}!`);
    else logEntries.push(`You hit ${enemyDef.name} for ${playerFinalDmg} damage. ${playerTypeMult > 1 ? '🔥' : ''}`);

    const newMonsterHp = (run.currentEncounter.hp || 0) - playerFinalDmg;

    // Enemy Attack Log
    if (newMonsterHp > 0) {
      if (isPlayerDodge) {
        logEntries.push(`💨 You DODGED ${enemyDef.name}'s attack!`);
      } else {
        if (isEnemyCrit) logEntries.push(`⚠️ ${enemyDef.name} LANDS A CRITICAL HIT for ${enemyFinalDmg}!`);
        else logEntries.push(`${enemyDef.name} hit you for ${enemyFinalDmg} damage. ${enemyTypeMult > 1 ? '💔' : ''}`);
      }
    } else {
      logEntries.push(`🏆 ${enemyDef.name} fainted! Victory!`);
    }

    const newPlayerHp = run.currentHp - enemyFinalDmg;
    setBattleLog(prev => [...prev, ...logEntries]);

    if (newMonsterHp <= 0) {
      // Monster defeated
      const loot = generateLoot(run.currentRoom);
      const newLoot = loot ? [...run.lootCollected, loot] : run.lootCollected;

      if (loot) logEntries.push(`✨ Loot found: ${loot.name}`);

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
          // Note: We keep the selected creature by default unless they change it
          setMessage('Victorious! Continue or swap team member?');
        }, 1500);
      }
    } else if (newPlayerHp <= 0) {
      setBattleLog(prev => [...prev, '💀 You were defeated...']);
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

      // Set result state instead of immediate redirect
      setGameResult({
        success: finalRun.status === 'completed',
        rewards: data.rewards,
        loot: finalRun.lootCollected
      });
      setRun(null); // Clear active run to show result
    } catch (error) {
      console.error("Dungeon completion error:", error);
      // Create a fallback result state for error but still show defeated/completed
      setGameResult({
        success: finalRun.status === 'completed',
        loot: finalRun.lootCollected
      });
      setRun(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDERING ---

  // 1. RESULT SCREEN
  if (gameResult) {
    return (
      <div className={`min-h-screen p-8 flex items-center justify-center ${gameResult.success ? 'bg-gradient-to-br from-green-950 via-green-900 to-black' : 'bg-gradient-to-br from-red-950 via-red-900 to-black'} text-white animate-in fade-in duration-1000`}>
        <div className="max-w-xl w-full text-center space-y-8">

          <div className="space-y-4">
            <div className="text-8xl mb-4 animate-bounce">
              {gameResult.success ? '🏆' : '💀'}
            </div>
            <h1 className={`text-6xl font-black uppercase tracking-tighter ${gameResult.success ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}>
              {gameResult.success ? 'VICTORY!' : 'DEFEATED'}
            </h1>
            <p className="text-xl text-stone-300 font-medium">
              {gameResult.success ? 'You have cleared the dungeon and returned with your spoils.' : 'You fell in battle and were forced to retreat.'}
            </p>
          </div>

          {gameResult.success && gameResult.rewards && (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">REWARDS COLLECTED</h3>

              {/* Rewards Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                  <div className="text-2xl font-black text-yellow-400">{gameResult.rewards.gold}</div>
                  <div className="text-xs text-yellow-600 font-bold uppercase">Gold</div>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                  <div className="text-2xl font-black text-blue-400">{gameResult.rewards.xp}</div>
                  <div className="text-xs text-blue-600 font-bold uppercase">XP</div>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <div className="text-2xl font-black text-purple-400">{gameResult.rewards.items}</div>
                  <div className="text-xs text-purple-600 font-bold uppercase">Items</div>
                </div>
              </div>

              {/* Loot List */}
              {gameResult.loot && gameResult.loot.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs text-stone-500 mb-3 text-left">Detailed Loot Log</h4>
                  <ScrollArea className="h-32 w-full pr-4">
                    <div className="space-y-2 text-left">
                      {gameResult.loot.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm text-stone-300 bg-white/5 p-2 rounded">
                          <span className={item.type === 'item' ? 'text-purple-300' : 'text-amber-200'}>{item.name}</span>
                          {item.amount && <span className="text-stone-500">x{item.amount}</span>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={() => router.push('/kingdom')} size="lg" className="w-full max-w-xs bg-slate-700 hover:bg-slate-600 text-white font-bold h-14">
              Return to Kingdom
            </Button>
            {!gameResult.success && (
              <Button onClick={startRun} size="lg" className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-bold h-14">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. START SCREEN
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

          <div className="text-stone-500 text-sm">
            <Button variant="link" onClick={() => router.push('/kingdom')} className="text-stone-500 hover:text-stone-300">
              &larr; Back to Kingdom
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN GAME SCREEN
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
                  {/* Safe fallbacks for color strings to avoid undefined errors */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${(getTypeColor(enemyDef.type).split(' ')[0] || 'text-gray-500').replace('text-', 'from-')}/20 to-transparent blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity`}></div>
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

          <div className="flex flex-col gap-6 order-1 md:order-2">
            {/* Combat Log - Fixed Height with Scroll */}
            <div className="flex-none bg-black/40 rounded-xl border border-slate-800 p-4 h-[250px] flex flex-col shadow-inner relative z-10 w-full">
              <div className="flex justify-between items-center mb-2 flex-none">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Battle Log</h4>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500/20"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500/20"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500/20"></span>
                </div>
              </div>

              <ScrollArea className="flex-1 w-full rounded-md bg-black/20 border border-white/5 mx-[-4px] sm:mx-0">
                <div className="p-3 space-y-2 text-sm font-mono">
                  {battleLog.length === 0 && (
                    <div className="text-slate-600 italic text-center text-xs py-8 opacity-50">
                      Waiting for combat to begin...
                    </div>
                  )}
                  {battleLog.map((log, i) => (
                    <div key={i} className={`p-2 rounded text-xs md:text-sm border-l-2 shadow-sm animate-in slide-in-from-left-2 duration-300 ${log.includes('victory') || log.includes('Victorious') || log.includes('CRITICAL') ? 'border-yellow-500 bg-yellow-900/20 text-yellow-200' : log.includes('hit you') ? 'border-red-500 bg-red-900/20 text-red-200' : log.includes('DODGED') ? 'border-cyan-500 bg-cyan-900/20 text-cyan-200' : 'border-blue-500 bg-blue-900/10 text-slate-300'} border-opacity-60`}>
                      {log}
                    </div>
                  ))}
                  <div ref={logEndRef} className="h-2" />
                </div>
              </ScrollArea>

              {/* Fade at bottom of log to indicate more content if scrolling? CSS Mask better but simple for now */}
            </div>

            {/* Controls */}
            {run.currentEncounter.type === 'monster' && (
              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex-1 flex flex-col justify-center w-full">
                {battlePhase === 'select' ? (
                  <>
                    <div className="flex justify-between items-end mb-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>🛡️ Deploy Fighter</span>
                      </h4>
                      <Badge variant="outline" className="text-xs font-mono bg-slate-900/50">
                        {run.party ? run.party.length : 0}/6 Ready
                      </Badge>
                    </div>

                    <ScrollArea className="h-[240px] pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                        {(run.party || [DEFAULT_CREATURE]).map((creature, idx) => {
                          // Calculate matchup for improved UX
                          let matchupText = "";
                          let matchupColor = "text-slate-500";
                          const enemyDef = run.currentEncounter.creatureId ? CREATURE_DATA[run.currentEncounter.creatureId] : null;

                          if (enemyDef) {
                            const mult = getMatchupMultiplier(creature.type, enemyDef.type);
                            if (mult > 1) { matchupText = "Strong"; matchupColor = "text-green-400 font-bold"; }
                            else if (mult < 1) { matchupText = "Weak"; matchupColor = "text-red-400"; }
                          }

                          return (
                            <button
                              key={`${creature.id}-${idx}`}
                              onClick={() => selectFighter(creature)}
                              className={`group relative p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 ${getTypeColor(creature.type)} ${selectedCreature?.id === creature.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 border-transparent' : 'border-opacity-40 hover:border-opacity-100'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-sm uppercase tracking-wide truncate">{creature.name}</span>
                                <span className="text-xl filter drop-shadow-md">{getTypeEmoji(creature.type)}</span>
                              </div>

                              <div className="grid grid-cols-3 gap-1 text-[10px] opacity-80 font-mono mb-2">
                                <span className="flex items-center gap-0.5"><span className="text-red-300">⚔️</span>{creature.stats.atk}</span>
                                <span className="flex items-center gap-0.5"><span className="text-blue-300">🛡️</span>{creature.stats.def}</span>
                                <span className="flex items-center gap-0.5"><span className="text-green-300">💨</span>{creature.stats.spd}</span>
                              </div>

                              {matchupText && (
                                <div className={`text-[10px] text-right uppercase tracking-widest ${matchupColor}`}>
                                  {matchupText}
                                </div>
                              )}

                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-2 rounded-lg text-3xl shadow-lg border border-slate-700">
                          {getTypeEmoji(selectedCreature!.type)}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-white">{selectedCreature!.name}</div>
                          <div className={`text-xs font-bold uppercase tracking-wider ${getTypeColor(selectedCreature!.type).split(' ')[0]}`}>
                            {selectedCreature!.type} Type
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setBattlePhase('select')} className="text-xs hover:bg-white/10 text-slate-400 hover:text-white">
                        Change Fighter
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button onClick={fight} className="col-span-2 h-14 text-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 font-black tracking-widest uppercase shadow-lg shadow-red-900/40 active:translate-y-1 transition-all border-t border-red-400">
                        ⚔️ Attack
                      </Button>
                      <Button onClick={flee} variant="secondary" className="col-span-1 h-14 bg-slate-700 hover:bg-slate-600 font-bold border-t border-slate-500 text-slate-200">
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
