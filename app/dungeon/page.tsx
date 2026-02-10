'use client';

import { useState, useEffect } from 'react';
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
  loot?: Loot[];
  creatureId?: string; // If monster
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

  // Load Unlocked Creatures
  useEffect(() => {
    async function loadUnlockables() {
      try {
        const res = await fetch('/api/achievements');
        if (res.ok) {
          const achievements = await res.json();
          // Find achievements that match CREATURE_IDS
          // The achievement definitions have IDs like '001', '002' but user_achievements key on definitions table id.
          // Wait, user_achievements table has `achievement_id` which usually links to `achievement_definitions.id`.
          // Our CREATURE_DATA uses the same IDs '001', etc.
          // We need to match user_achievements.achievement_id === CREATURE_DATA key.

          if (Array.isArray(achievements)) {
            const unlocked = achievements
              .map((a: any) => CREATURE_DATA[a.achievement_id]) // Assuming a.achievement_id matches
              .filter(Boolean) as CreatureDef[];

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

  useEffect(() => {
    const saved = localStorage.getItem('dungeon_run');
    if (saved) {
      setRun(JSON.parse(saved));
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
      setBattlePhase('select');
      setSelectedCreature(null);
      setMessage('A wild creature appeared! Choose your fighter!');
    } else if (run?.currentEncounter.type === 'treasure') {
      setMessage('You found a treasure chest!');
    }
  }, [run?.currentRoom, run?.currentEncounter.type]);

  const startRun = () => {
    const maxHp = 150;
    const newRun: DungeonRun = {
      currentRoom: 1,
      currentHp: maxHp,
      maxHp: maxHp,
      status: 'in_progress',
      currentEncounter: generateEncounter(1),
      lootCollected: [],
      maxRooms: 5
    };
    setRun(newRun);
  };

  const selectFighter = (creature: CreatureDef) => {
    setSelectedCreature(creature);
    setBattlePhase('fight');

    // Calculate initial matchup hint
    if (run?.currentEncounter.creatureId) {
      const enemyDef = CREATURE_DATA[run.currentEncounter.creatureId];
      if (enemyDef) {
        const mult = getMatchupMultiplier(creature.type, enemyDef.type);
        if (mult > 1) setMessage(`It's super effective! (x${mult})`);
        else if (mult < 1) setMessage(`It's not very effective... (x${mult})`);
        else setMessage('Battle started!');
      }
    }
  };

  const fight = () => {
    if (!run || run.currentEncounter.type !== 'monster' || !selectedCreature) return;

    const enemyDef = run.currentEncounter.creatureId ? CREATURE_DATA[run.currentEncounter.creatureId] : null;
    if (!enemyDef) return;

    // Multipliers
    const playerMult = getMatchupMultiplier(selectedCreature.type, enemyDef.type);
    const enemyMult = getMatchupMultiplier(enemyDef.type, selectedCreature.type); // Enemy attacking player

    // Damage Calc
    const playerBaseDmg = Math.floor(Math.random() * 10) + selectedCreature.stats.atk;
    const damage = Math.floor(playerBaseDmg * playerMult);

    const enemyBaseDmg = Math.floor(Math.random() * 8) + enemyDef.stats.atk;
    const monsterDamage = Math.floor(enemyBaseDmg * enemyMult);

    const newMonsterHp = (run.currentEncounter.hp || 0) - damage;
    const newPlayerHp = run.currentHp - monsterDamage;

    if (newMonsterHp <= 0) {
      // Monster defeated
      const loot = generateLoot(run.currentRoom);
      const newLoot = loot ? [...run.lootCollected, loot] : run.lootCollected;

      if (run.currentRoom >= run.maxRooms) {
        completeRun({ ...run, lootCollected: newLoot, status: 'completed' });
      } else {
        setRun({
          ...run,
          currentRoom: run.currentRoom + 1,
          lootCollected: newLoot,
          currentEncounter: generateEncounter(run.currentRoom + 1)
        });
        // Phase will reset via Effect
      }
    } else if (newPlayerHp <= 0) {
      completeRun({ ...run, currentHp: 0, status: 'defeated' });
    } else {
      setRun({
        ...run,
        currentHp: newPlayerHp,
        currentEncounter: { ...run.currentEncounter, hp: newMonsterHp }
      });

      let msg = `You dealt ${damage} dmg`;
      if (playerMult > 1) msg += ' (Super Effective!)';
      else if (playerMult < 1) msg += ' (Weak)';

      msg += `. Enemy dealt ${monsterDamage} dmg`;
      if (enemyMult > 1) msg += ' (Critical!)';
      else if (enemyMult < 1) msg += ' (Resisted)';

      setMessage(msg);
    }
  };

  const openTreasure = () => {
    if (!run || run.currentEncounter.type !== 'treasure') return;

    const loot = run.currentEncounter.loot || [];
    const newLoot = [...run.lootCollected, ...loot];

    if (run.currentRoom >= run.maxRooms) {
      completeRun({ ...run, lootCollected: newLoot, status: 'completed' });
    } else {
      setRun({
        ...run,
        currentRoom: run.currentRoom + 1,
        lootCollected: newLoot,
        currentEncounter: generateEncounter(run.currentRoom + 1)
      });
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
      setTimeout(() => router.push('/kingdom'), 2000);
    } catch (error) {
      setMessage('Error saving rewards: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDERING ---

  if (!run) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-black to-black p-8 text-white">
        <div className="max-w-md mx-auto text-center space-y-6 mt-20">
          <h1 className="text-5xl font-bold text-red-500 mb-2">🏰 Dungeon</h1>
          <p className="text-gray-400">Enter if you dare.</p>
          <div className="text-sm font-medium text-amber-500">
            Entry Cost: <span className="text-green-400 font-bold">Free</span>
          </div>
          <Button onClick={startRun} className="w-full h-16 text-xl bg-red-600 hover:bg-red-700">⚔️ Enter Dungeon</Button>
        </div>
      </div>
    );
  }

  const enemyDef = run.currentEncounter.creatureId ? CREATURE_DATA[run.currentEncounter.creatureId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-200">Room {run.currentRoom} / {run.maxRooms}</h2>
            <div className="flex gap-2 text-sm text-yellow-500 mt-1">
              <span>💰 Loot: {run.lootCollected.length}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Player HP</div>
            <div className="font-mono font-bold text-green-400">{run.currentHp} / {run.maxHp}</div>
            <Progress value={(run.currentHp / run.maxHp) * 100} className="w-32 h-2 mt-1" />
          </div>
        </div>

        {/* Message Area */}
        {message && (
          <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl text-center text-blue-200 animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        {/* Encounter Area */}
        <div className="min-h-[400px] flex flex-col justify-center gap-8">

          {/* Monster Section */}
          {run.currentEncounter.type === 'monster' && enemyDef && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <Card className={`w-64 border-2 ${getTypeColor(enemyDef.type)} bg-opacity-20 backdrop-blur-sm relative overflow-visible`}>
                <div className="absolute -top-3 -right-3 text-4xl filter drop-shadow-md">
                  {getTypeEmoji(enemyDef.type)}
                </div>
                <CardContent className="pt-6 text-center space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-wider">{enemyDef.name}</h3>
                  <Badge variant="outline" className="border-current opacity-80">{enemyDef.type}</Badge>
                  <div className="w-full bg-slate-900/50 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${((run.currentEncounter.hp || 0) / (run.currentEncounter.maxHp || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono opacity-70">
                    HP: {run.currentEncounter.hp} / {run.currentEncounter.maxHp}
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs mt-2 opacity-80 pt-2 border-t border-current/20">
                    <div>⚔️ {enemyDef.stats.atk}</div>
                    <div>🛡️ {enemyDef.stats.def}</div>
                    <div>💨 {enemyDef.stats.spd}</div>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-4 text-slate-400 text-sm font-medium">VS</div>
            </div>
          )}

          {/* Treasure Section */}
          {run.currentEncounter.type === 'treasure' && (
            <div className="flex flex-col items-center animate-in zoom-in-95">
              <div className="text-8xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-amber-400">Treasure Room</h3>
              <Button onClick={openTreasure} size="lg" className="mt-6 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Open Chest
              </Button>
            </div>
          )}

          {/* Player Selection / Battle Controls */}
          {run.currentEncounter.type === 'monster' && (
            <div className="w-full">
              {battlePhase === 'select' ? (
                <div className="space-y-4">
                  <h4 className="text-center text-slate-300 font-medium">Select Your Creature</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {unlockedCreatures.map(creature => (
                      <button
                        key={creature.id}
                        onClick={() => selectFighter(creature)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-105 active:scale-95 ${getTypeColor(creature.type)}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold">{creature.name}</span>
                          <span className="text-xl">{getTypeEmoji(creature.type)}</span>
                        </div>
                        <div className="text-xs opacity-70">Atk: {creature.stats.atk} | Def: {creature.stats.def}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {selectedCreature && (
                    <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-full border border-slate-600 px-6">
                      <span className="text-2xl">{getTypeEmoji(selectedCreature.type)}</span>
                      <span className="font-bold">{selectedCreature.name}</span>
                      <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setBattlePhase('select')}>Change</Badge>
                    </div>
                  )}
                  <div className="flex gap-4 w-full max-w-md">
                    <Button onClick={fight} className="flex-1 h-14 text-lg bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-900/20">
                      ⚔️ Attack
                    </Button>
                    <Button onClick={flee} variant="secondary" className="h-14 px-8">
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
  );
}
