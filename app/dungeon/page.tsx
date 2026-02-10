'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

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

function generateEncounter(roomLevel: number): Encounter {
  const isTreasure = Math.random() < 0.2;
  if (isTreasure) {
    return {
      type: 'treasure',
      loot: [generateLoot(roomLevel)].filter(Boolean) as Loot[]
    };
  }
  return {
    type: 'monster',
    hp: 20 + (roomLevel * 5),
    maxHp: 20 + (roomLevel * 5),
    difficulty: roomLevel
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

  useEffect(() => {
    // Load from localStorage if exists
    const saved = localStorage.getItem('dungeon_run');
    if (saved) {
      setRun(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever run changes
    if (run) {
      localStorage.setItem('dungeon_run', JSON.stringify(run));
    } else {
      localStorage.removeItem('dungeon_run');
    }
  }, [run]);

  const startRun = () => {
    const maxHp = 150; // Base HP
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
    setMessage('Dungeon entered! Choose your action.');
  };

  const fight = () => {
    if (!run || run.currentEncounter.type !== 'monster') return;

    const damage = Math.floor(Math.random() * 20) + 10; // Player damage
    const monsterDamage = Math.floor(Math.random() * 15) + 5;

    const newMonsterHp = (run.currentEncounter.hp || 0) - damage;
    const newPlayerHp = run.currentHp - monsterDamage;

    if (newMonsterHp <= 0) {
      // Monster defeated
      const loot = generateLoot(run.currentRoom);
      const newLoot = loot ? [...run.lootCollected, loot] : run.lootCollected;

      if (run.currentRoom >= run.maxRooms) {
        // Dungeon completed!
        completeRun({ ...run, lootCollected: newLoot, status: 'completed' });
      } else {
        setRun({
          ...run,
          currentRoom: run.currentRoom + 1,
          lootCollected: newLoot,
          currentEncounter: generateEncounter(run.currentRoom + 1)
        });
        setMessage(`Monster defeated! ${loot ? `Found: ${loot.name}` : ''} Moving to room ${run.currentRoom + 1}...`);
      }
    } else if (newPlayerHp <= 0) {
      // Player defeated
      completeRun({ ...run, currentHp: 0, status: 'defeated' });
    } else {
      setRun({
        ...run,
        currentHp: newPlayerHp,
        currentEncounter: { ...run.currentEncounter, hp: newMonsterHp }
      });
      setMessage(`You dealt ${damage} damage! Monster hit you for ${monsterDamage}!`);
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
      setMessage(`Treasure opened! ${loot.map(l => l.name).join(', ')} - Moving to room ${run.currentRoom + 1}...`);
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
        body: JSON.stringify({
          loot: finalRun.lootCollected,
          status: finalRun.status
        })
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

  if (!run) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-black to-black p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-red-900/40 to-black/60 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-red-400 mb-4 text-center">🏰 The Dungeon</h1>
            <p className="text-gray-300 mb-6 text-center">
              Monsters lurk in the shadows. Defeat them to claim the treasure.
            </p>
            <div className="text-sm font-medium text-amber-500 mb-6 text-center">
              Entry Cost: <span className="text-green-400 font-bold">Free</span>
            </div>
            <Button
              onClick={startRun}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-xl"
            >
              ⚔️ Enter Dungeon
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-black to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-red-900/40 to-black/60 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 shadow-2xl mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-red-400">Room {run.currentRoom} / {run.maxRooms}</h2>
              <p className="text-gray-400">Loot: {run.lootCollected.length} items</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Your HP</p>
              <p className="text-2xl font-bold text-green-400">{run.currentHp} / {run.maxHp}</p>
              <Progress value={(run.currentHp / run.maxHp) * 100} className="w-32 mt-2" />
            </div>
          </div>

          {run.currentEncounter.type === 'monster' ? (
            <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-red-400 mb-2">👹 Monster</h3>
              <p className="text-gray-300 mb-4">Level {run.currentEncounter.difficulty}</p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">HP:</span>
                <Progress
                  value={((run.currentEncounter.hp || 0) / (run.currentEncounter.maxHp || 1)) * 100}
                  className="flex-1"
                />
                <span className="text-red-400 font-bold">{run.currentEncounter.hp} / {run.currentEncounter.maxHp}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">📦 Treasure Chest</h3>
              <p className="text-gray-300">Open it to claim your rewards!</p>
            </div>
          )}

          {message && (
            <div className="bg-blue-950/50 border border-blue-700/50 rounded-xl p-4 mb-6">
              <p className="text-blue-300">{message}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {run.currentEncounter.type === 'monster' ? (
              <>
                <Button
                  onClick={fight}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-6"
                >
                  ⚔️ Fight
                </Button>
                <Button
                  onClick={flee}
                  disabled={isProcessing}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 font-bold py-6"
                >
                  🏃 Flee
                </Button>
              </>
            ) : (
              <Button
                onClick={openTreasure}
                disabled={isProcessing}
                className="col-span-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-6"
              >
                📦 Open Treasure
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
