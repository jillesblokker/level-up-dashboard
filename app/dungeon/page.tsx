'use client'

import { logger } from "@/lib/logger";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { notificationService } from "@/lib/notification-service";
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
  getTypeColor,
  getHabitElementMapping
} from './game-logic';
import { useAuth } from '@clerk/nextjs';
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

interface DungeonPartyMember extends CreatureDef {
  hp: number;
  maxHp: number;
}

interface DungeonRun {
  currentRoom: number;
  currentHp: number;
  maxHp: number;
  status: 'in_progress' | 'completed' | 'defeated';
  currentEncounter: Encounter;
  lootCollected: Loot[];
  maxRooms: number;
  party: DungeonPartyMember[]; // NEW: The drafted team of 6 with individual health
}

interface GameResult {
  success: boolean;
  rewards?: {
    gold: number;
    xp: number;
    items: number;
    gems?: number;
    discoveredRecipe?: {
      id: string;
      name: string;
      emoji: string;
    };
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
  const isTreasure = false;
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
    hp: 20 + (roomLevel * 8),
    maxHp: 20 + (roomLevel * 8),
    difficulty: roomLevel,
    creatureId: randomId
  };
}

function generateLoot(roomLevel: number): Loot | null {
  if (Math.random() > 0.5) {
    return { type: 'gold', amount: 50 + (roomLevel * 10), name: 'Gold Coins' };
  }

  if (roomLevel >= 3 && Math.random() < 0.25) {
    const crystal = comprehensiveItems.find(i => i.id === 'material-crystal');
    if (crystal) {
      return {
        type: 'item',
        name: crystal.name,
        itemId: crystal.id,
        itemStats: {},
        starRating: 0
      };
    }
  }

  const possibleItems = comprehensiveItems.filter(i => {
    if (roomLevel < 3) return i.rarity === 'common' || i.rarity === 'uncommon';
    if (roomLevel < 7) return i.rarity === 'rare' || i.rarity === 'epic';
    return i.rarity === 'legendary';
  }).filter(i => i.type === 'weapon' || i.type === 'potion' || i.type === 'armor' || i.type === 'material');

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
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [unlockedCreatures, setUnlockedCreatures] = useState<CreatureDef[]>(() => {
    const all = CREATURE_IDS.map(id => CREATURE_DATA[id]).filter((c): c is CreatureDef => !!c);
    return all.length > 0 ? all : [DEFAULT_CREATURE];
  });
  const [selectedCreature, setSelectedCreature] = useState<CreatureDef | null>(null);
  const [battlePhase, setBattlePhase] = useState<'select' | 'fight' | 'result'>('select');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { getToken } = useAuth();
  const [elementBuffs, setElementBuffs] = useState<Record<string, number>>({});
  const [buildingBuffs, setBuildingBuffs] = useState<{ atkBuff: number, healingBuff: number }>({ atkBuff: 0, healingBuff: 0 });

  useEffect(() => {
    async function loadBuffs() {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch Quests
        const resQuests = await fetch('/api/quests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resQuests.ok) {
          const quests = await resQuests.json();
          // Filter today's completed quests
          const today = new Date().toISOString().split('T')[0];
          const todaysCompleted = quests.filter((q: any) => 
            q.completed && q.date && q.date.startsWith(today)
          );
          
          const buffs: Record<string, number> = {
            Fire: 0, Water: 0, Rock: 0, Grass: 0, Ice: 0
          };
          
          todaysCompleted.forEach((q: any) => {
            const el = getHabitElementMapping(q.category);
            buffs[el] = (buffs[el] || 0) + 1;
          });
          setElementBuffs(buffs);
        }

        // Fetch Kingdom Grid
        const resGrid = await fetch('/api/kingdom-grid', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resGrid.ok) {
          const data = await resGrid.json();
          if (data.grid) {
            let atk = 0;
            let heal = 0;
            data.grid.forEach((tile: any) => {
              if (tile.item?.id === 'building-blacksmith') atk += 2;
              if (tile.item?.id === 'building-bakery') heal += 5;
            });
            setBuildingBuffs({ atkBuff: atk, healingBuff: heal });
          }
        }
      } catch (e) {
        logger.error('[Dungeon] Error loading buffs:', e);
      }
    }
    loadBuffs();
  }, [getToken]);

  // Helper values for active fighter combat stats
  const selectedPartyMember = run?.party.find(c => c.id === selectedCreature?.id) || null;
  const activeFighterHp = selectedPartyMember?.hp ?? 0;
  const activeFighterMaxHp = selectedPartyMember?.maxHp ?? 100;

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  // Load Run & Fix Legacy Data
  useEffect(() => {
    const saved = localStorage.getItem('dungeon_run');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentEncounter && parsed.currentEncounter.type === 'monster' && !parsed.currentEncounter.creatureId) {
          logger.warn('Fixing legacy dungeon run data...');
          parsed.currentEncounter.creatureId = '001';
          localStorage.setItem('dungeon_run', JSON.stringify(parsed));
        }

        // Draft new party if missing or too small
        if (!parsed.party || parsed.party.length < 6) {
          const all = CREATURE_IDS.map(id => CREATURE_DATA[id]).filter((c): c is CreatureDef => !!c);
          const pool = [...all];
          const party: CreatureDef[] = parsed.party && parsed.party.length > 0 ? [...parsed.party] : [];
          
          while (party.length < 6 && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const creature = pool[randomIndex];
            if (creature && !party.some(p => p.id === creature.id)) {
              party.push(creature);
            }
            pool.splice(randomIndex, 1);
          }
          if (party.length === 0) party.push(DEFAULT_CREATURE);
          parsed.party = party;
        }

        // Ensure all party members have health attributes
        parsed.party = parsed.party.map((c: any) => {
          const memberMaxHp = 50 + Math.floor((c.stats?.def || 10) * 2.5);
          return {
            ...c,
            hp: c.hp !== undefined ? c.hp : memberMaxHp,
            maxHp: c.maxHp !== undefined ? c.maxHp : memberMaxHp
          };
        });

        // Sync overall currentHp / maxHp metrics
        const totalHp = parsed.party.reduce((s: number, c: any) => s + c.hp, 0);
        const totalMaxHp = parsed.party.reduce((s: number, c: any) => s + c.maxHp, 0);
        parsed.currentHp = totalHp;
        parsed.maxHp = totalMaxHp;

        localStorage.setItem('dungeon_run', JSON.stringify(parsed));
        setRun(parsed);
      } catch (e) {
        logger.error("Failed to parse dungeon run", e);
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

  // Load Daily Limit
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'dungeon_daily_limit';
    const storage = localStorage.getItem(storageKey);
    let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
    if (data.date !== today) {
      data = { date: today, count: 0 };
    }
    setDailyCount(data.count);
  }, [run]);

  // Reset phase when new monster appears
  useEffect(() => {
    if (run?.currentEncounter.type === 'monster') {
      if (battlePhase !== 'select' && battlePhase !== 'fight') {
        if (selectedCreature) {
          const active = run.party.find(c => c.id === selectedCreature.id);
          if (active && active.hp > 0) {
            setBattlePhase('fight');
            setMessage(`Encounter started! ${selectedCreature.name} is ready!`);
          } else {
            setSelectedCreature(null);
            setBattlePhase('select');
            setMessage('Your active fighter fainted! Deploy a healthy squad member!');
          }
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
  }, [run?.currentRoom, run?.currentEncounter.type]);

  const startRun = () => {
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

    // DRAFTING PHASE: Pick 6 random creatures
    const pool = [...unlockedCreatures];
    const party: DungeonPartyMember[] = [];
    const draftSize = Math.min(6, pool.length);

    for (let i = 0; i < draftSize; i++) {
      if (pool.length === 0) break;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const creature = pool[randomIndex];
      if (creature) {
        const memberMaxHp = 50 + Math.floor(creature.stats.def * 2.5);
        party.push({
          ...creature,
          hp: memberMaxHp,
          maxHp: memberMaxHp
        });
        pool.splice(randomIndex, 1);
      }
    }

    // Fallback
    if (party.length === 0) {
      const fbMaxHp = 50 + Math.floor(DEFAULT_CREATURE.stats.def * 2.5);
      party.push({
        ...DEFAULT_CREATURE,
        hp: fbMaxHp,
        maxHp: fbMaxHp
      });
    }

    const totalHp = party.reduce((s, c) => s + c.hp, 0);
    const totalMaxHp = party.reduce((s, c) => s + c.maxHp, 0);
    const firstEncounter = generateEncounter(1);

    const newRun: DungeonRun = {
      currentRoom: 1,
      currentHp: totalHp,
      maxHp: totalMaxHp,
      status: 'in_progress',
      currentEncounter: firstEncounter,
      lootCollected: [],
      maxRooms: 5,
      party: party
    };

    setRun(newRun);
    setGameResult(null);
    setSelectedCreature(null);
    setBattlePhase('select');
    setBattleLog([
      `Dungeon started!`,
      `Drafted Team: ${party.map(c => c.name).join(', ')}`
    ]);
  };

  const selectFighter = (creature: DungeonPartyMember) => {
    if (creature.hp <= 0) {
      setMessage(`🛑 ${creature.name} has fainted and cannot fight!`);
      return;
    }
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

    const activeFighter = run.party.find(c => c.id === selectedCreature.id);
    if (!activeFighter || activeFighter.hp <= 0) return;

    const logEntries: string[] = [];

    // 1. Calculate Stats
    const elementalHabitBuff = (elementBuffs[activeFighter.type] || 0) * 2; // +2 atk per habit
    const buildingAtkBuff = buildingBuffs.atkBuff;

    const playerSpd = activeFighter.stats.spd;
    const playerDef = activeFighter.stats.def;
    const playerAtk = activeFighter.stats.atk + (Math.floor(Math.random() * 5)) + elementalHabitBuff + buildingAtkBuff;
    // Enemy
    const enemySpd = enemyDef.stats.spd;
    const enemyDefStat = enemyDef.stats.def;
    const enemyAtk = enemyDef.stats.atk + (Math.floor(Math.random() * 5));

    if (elementalHabitBuff > 0) logEntries.push(`✨ Daily habits empower ${activeFighter.name}! (+${elementalHabitBuff} ATK)`);
    if (buildingAtkBuff > 0) logEntries.push(`⚔️ Blacksmith sharpens your attack! (+${buildingAtkBuff} ATK)`);

    // 2. Type Multipliers
    const playerTypeMult = getMatchupMultiplier(activeFighter.type, enemyDef.type);
    const enemyTypeMult = getMatchupMultiplier(enemyDef.type, activeFighter.type);

    // 3. Crit & Dodge Checks
    const playerCritChance = Math.max(0, Math.min(0.5, (playerSpd - enemySpd) * 0.03));
    const isPlayerCrit = Math.random() < playerCritChance;

    const playerDodgeChance = Math.max(0, Math.min(0.4, (playerSpd - enemySpd) * 0.02));
    const isPlayerDodge = Math.random() < playerDodgeChance;

    const isEnemyCrit = Math.random() < 0.05;

    // 4. Damage Calculation
    let playerFinalDmg = 0;
    const playerCritMult = isPlayerCrit ? 1.5 : 1.0;
    playerFinalDmg = Math.max(1, Math.floor((playerAtk * playerTypeMult * playerCritMult) - (enemyDefStat * 0.4)));

    let enemyFinalDmg = 0;
    if (!isPlayerDodge) {
      const enemyCritMult = isEnemyCrit ? 1.5 : 1.0;
      enemyFinalDmg = Math.max(1, Math.floor((enemyAtk * enemyTypeMult * enemyCritMult) - (playerDef * 0.4)));
    }

    // 5. Apply Results
    if (isPlayerCrit) logEntries.push(`🎯 CRITICAL HIT! You hit for ${playerFinalDmg}!`);
    else logEntries.push(`You hit ${enemyDef.name} for ${playerFinalDmg} damage. ${playerTypeMult > 1 ? '🔥' : ''}`);

    const newMonsterHp = Math.max(0, (run.currentEncounter.hp || 0) - playerFinalDmg);

    // Apply damage to active fighter in party
    let updatedParty = run.party.map(c => {
      if (c.id === selectedCreature.id) {
        let remainingHp = newMonsterHp > 0 && !isPlayerDodge ? Math.max(0, c.hp - enemyFinalDmg) : c.hp;
        if (remainingHp > 0 && buildingBuffs.healingBuff > 0) {
            remainingHp = Math.min(c.maxHp, remainingHp + buildingBuffs.healingBuff);
        }
        return { ...c, hp: remainingHp };
      }
      return c;
    });

    const activeFighterAfterDamage = updatedParty.find(c => c.id === selectedCreature.id)!;
    const isFighterFainted = activeFighterAfterDamage.hp <= 0;

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

    if (!isFighterFainted && buildingBuffs.healingBuff > 0) {
      logEntries.push(`🍞 Bakery heals ${selectedCreature.name} for ${buildingBuffs.healingBuff} HP!`);
    }

    if (isFighterFainted && newMonsterHp > 0) {
      logEntries.push(`💀 ${selectedCreature.name} fainted!`);
    }

    const totalTeamHpAfterDamage = updatedParty.reduce((sum, member) => sum + member.hp, 0);
    const isTeamDefeated = totalTeamHpAfterDamage <= 0;

    if (newMonsterHp <= 0) {
      const loot = generateLoot(run.currentRoom);
      let newLoot = loot ? [...run.lootCollected, loot] : run.lootCollected;

      if (loot) logEntries.push(`✨ Loot found: ${loot.name}`);

      // BOSS REWARD: Guaranteed Essence Crystal on Room 5 if victory
      if (run.currentRoom === run.maxRooms && !newLoot.some(l => l.itemId === 'material-crystal')) {
        const crystal = comprehensiveItems.find(i => i.id === 'material-crystal');
        if (crystal) {
          const bossLoot = {
            type: 'item',
            name: crystal.name,
            itemId: crystal.id,
            itemStats: {},
            starRating: 0
          };
          newLoot = [...newLoot, bossLoot];
          logEntries.push(`💎 BOSS DROPPED: ${crystal.name}!`);
        }
      }

      setBattleLog(prev => [...prev, ...logEntries]);

      if (run.currentRoom >= run.maxRooms) {
        completeRun({
          ...run,
          party: updatedParty,
          currentHp: totalTeamHpAfterDamage,
          lootCollected: newLoot,
          status: 'completed'
        });
      } else {
        setTimeout(() => {
          setRun({
            ...run,
            party: updatedParty,
            currentHp: totalTeamHpAfterDamage,
            currentRoom: run.currentRoom + 1,
            lootCollected: newLoot,
            currentEncounter: generateEncounter(run.currentRoom + 1)
          });
          
          if (isFighterFainted) {
            setSelectedCreature(null);
            setBattlePhase('select');
            setMessage(`Victorious, but ${selectedCreature.name} fainted! Deploy a new fighter!`);
          } else {
            setMessage('Victorious! Continue or swap team member?');
          }
        }, 1500);
      }
    } else if (isTeamDefeated) {
      logEntries.push('💀 All your fighters have fainted... You were defeated...');
      setBattleLog(prev => [...prev, ...logEntries]);
      completeRun({
        ...run,
        party: updatedParty,
        currentHp: 0,
        status: 'defeated'
      });
    } else if (isFighterFainted) {
      logEntries.push(`💀 ${selectedCreature.name} fainted! Deploy another fighter to continue the battle!`);
      setBattleLog(prev => [...prev, ...logEntries]);
      setRun({
        ...run,
        party: updatedParty,
        currentHp: totalTeamHpAfterDamage,
        currentEncounter: { ...run.currentEncounter, hp: newMonsterHp }
      });
      setSelectedCreature(null);
      setBattlePhase('select');
      setMessage(`${selectedCreature.name} fainted! Select another fighter!`);
    } else {
      setBattleLog(prev => [...prev, ...logEntries]);
      setRun({
        ...run,
        party: updatedParty,
        currentHp: totalTeamHpAfterDamage,
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

      notificationService.addNotification(
        finalRun.status === 'completed' ? "Dungeon Completed! 🏆" : "Dungeon Run Ended 💀",
        finalRun.status === 'completed'
          ? `You successfully cleared the dungeon and earned ${data.rewards?.gold || 0} gold and ${data.rewards?.xp || 0} XP!`
          : `Your run ended in defeat, but you recovered ${data.rewards?.gold || 0} gold and ${data.rewards?.xp || 0} XP.`,
        "monster",
        "high",
        {
          label: "Play Again",
          href: "/dungeon"
        }
      );

      if (data.discoveredRecipe) {
        notificationService.addNotification(
          "📖 Recipe Discovered!",
          `You discovered the formula for the ${data.discoveredRecipe.emoji} ${data.discoveredRecipe.name}! It is now available in your Alchemist Cauldron.`,
          "monster",
          "high"
        );
      }

      setGameResult({
        success: finalRun.status === 'completed',
        rewards: {
          ...data.rewards,
          discoveredRecipe: data.discoveredRecipe
        },
        loot: finalRun.lootCollected
      });
      setRun(null); // Clear active run to show result
    } catch (error) {
      logger.error("Dungeon completion error:", error);
      setGameResult({
        success: finalRun.status === 'completed',
        loot: finalRun.lootCollected
      });
      setRun(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pre-calculate values
  const totalTeamHp = run ? run.party.reduce((sum, member) => sum + member.hp, 0) : 0;
  const totalTeamMaxHp = run ? run.party.reduce((sum, member) => sum + member.maxHp, 0) : 0;

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
            <p className="text-xl text-zinc-300 font-medium">
              {gameResult.success ? 'You have cleared the dungeon and returned with your spoils.' : 'You fell in battle and were forced to retreat.'}
            </p>
          </div>

          {gameResult.success && gameResult.rewards && (
            <div className="bg-zinc-950  rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">REWARDS COLLECTED</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                  <div className="text-2xl font-black text-yellow-400">{gameResult.rewards.gold}</div>
                  <div className="text-xs text-yellow-600 font-bold uppercase">Gold</div>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                  <div className="text-2xl font-black text-blue-400">{gameResult.rewards.xp}</div>
                  <div className="text-xs text-blue-600 font-bold uppercase">XP</div>
                </div>
                <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
                  <div className="text-2xl font-black text-pink-400">{gameResult.rewards.gems || 0}</div>
                  <div className="text-xs text-pink-600 font-bold uppercase">Gems</div>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <div className="text-2xl font-black text-purple-400">{gameResult.rewards.items}</div>
                  <div className="text-xs text-purple-600 font-bold uppercase">Items</div>
                </div>
              </div>

              {gameResult.rewards.discoveredRecipe && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3.5 text-left">
                  <span className="text-4xl select-none animate-bounce">{gameResult.rewards.discoveredRecipe.emoji}</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-purple-400">Recipe Discovered!</h4>
                    <p className="text-xs text-zinc-300 leading-normal mt-0.5">
                      You discovered the formula for the <strong>{gameResult.rewards.discoveredRecipe.name}</strong>! It has been added to your Alchemist Cauldron ledger.
                    </p>
                  </div>
                </div>
              )}

              {gameResult.loot && gameResult.loot.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs text-zinc-500 mb-3 text-left">Detailed Loot Log</h4>
                  <ScrollArea className="h-32 w-full pr-4">
                    <div className="space-y-2 text-left">
                      {gameResult.loot.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm text-zinc-300 bg-white/5 p-2 rounded">
                          <span className={item.type === 'item' ? 'text-purple-300' : 'text-amber-200'}>{item.name}</span>
                          {item.amount && <span className="text-zinc-500">x{item.amount}</span>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={() => router.push('/kingdom')} size="lg" className="w-full max-w-xs bg-zinc-700 hover:bg-zinc-600 text-white font-bold h-14">
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
            <p className="text-zinc-400 text-lg">Brave the depths, fight creatures, earn loot.</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 ">
            <div className="text-sm font-medium text-zinc-500 mb-1">DAILY ENTRIES</div>
            <div className={`text-3xl font-bold ${dailyCount >= 3 ? 'text-red-500' : 'text-green-400'}`}>
              {Math.max(0, 3 - dailyCount)} / 3 LEFT
            </div>
          </div>

          <Button
            onClick={startRun}
            disabled={dailyCount >= 3}
            size="lg"
            className={`w-full h-16 text-xl font-bold tracking-wide transition-all ${dailyCount >= 3 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 border border-red-500/30 shadow-xl shadow-red-900/20 hover:scale-105'}`}
          >
            {dailyCount >= 3 ? '🔒 LOCKED UNTIL TOMORROW' : '⚔️ ENTER DUNGEON'}
          </Button>

          <div className="text-zinc-500 text-sm">
            <Button variant="link" onClick={() => router.push('/kingdom')} className="text-zinc-500 hover:text-zinc-300">
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Room Info */}
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 ">
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Location</div>
            <div className="text-2xl font-black flex items-center gap-2">
              <span>Room {run.currentRoom}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500">{run.maxRooms}</span>
            </div>
            <div className="mt-2 text-sm text-yellow-500 font-medium">
              💰 Loot Found: {run.lootCollected.length}
            </div>
          </div>

          {/* Team HP (Summed health of all survivors) */}
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 ">
            <div className="flex justify-between items-end mb-2">
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Team Health</div>
              <div className={`font-mono font-bold ${totalTeamHp < (totalTeamMaxHp * 0.3) ? 'text-red-500' : 'text-green-400'}`}>
                {totalTeamHp} / {totalTeamMaxHp}
              </div>
            </div>
            <Progress value={totalTeamMaxHp > 0 ? (totalTeamHp / totalTeamMaxHp) * 100 : 0} className="h-3 bg-zinc-700" indicatorClassName={totalTeamHp < (totalTeamMaxHp * 0.3) ? 'bg-red-500' : 'bg-green-500'} />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="bg-gradient-to-r from-blue-900/40 to-zinc-900/40 border border-blue-500/30 p-3 rounded-lg text-center text-blue-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        {/* Main Encounter Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">

          {/* LEFT: Enemy / Target */}
          <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
            {run.currentEncounter.type === 'monster' && enemyDef ? (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 w-full max-w-sm">
                <div className="relative group w-full flex justify-center">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${(getTypeColor(enemyDef.type).split(' ')[0] || 'text-zinc-500').replace('text-', 'from-')}/20 to-transparent blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  <div className={`relative w-full max-w-[285px] aspect-[3/4] transition-all duration-300 ${getTypeColor(enemyDef.type)} border-2 rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl flex flex-col p-5 justify-between`}>
                    <div className="absolute top-0 right-0 p-3 bg-zinc-950 rounded-bl-2xl text-2xl filter drop-shadow-lg z-20">
                      {getTypeEmoji(enemyDef.type)}
                    </div>



                    {/* Creature Image (Achievement-card style) */}
                    <div className="relative w-full flex-1 my-3 flex items-center justify-center">
                      <Image
                        src={`/images/creatures/${enemyId}.png`}
                        alt={enemyDef.name}
                        fill
                        className="object-contain scale-[1.25] drop-shadow-lg"
                        unoptimized
                      />
                    </div>

                    <div className="space-y-2.5 z-10 w-full">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                          <span>HP</span>
                          <span>{run.currentEncounter.hp} / {run.currentEncounter.maxHp}</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${((run.currentEncounter.hp || 0) / (run.currentEncounter.maxHp || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-0.5 text-[10px] opacity-90 font-mono text-center">
                        <span className="flex items-center justify-center gap-0.5"><span className="text-red-300">⚔️</span>{enemyDef.stats.atk}</span>
                        <span className="flex items-center justify-center gap-0.5"><span className="text-blue-300">🛡️</span>{enemyDef.stats.def}</span>
                        <span className="flex items-center justify-center gap-0.5"><span className="text-green-300">💨</span>{enemyDef.stats.spd}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-zinc-500 font-bold text-lg tracking-widest">ENEMY</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">📦</div>
                <h3 className="text-2xl font-bold text-amber-400 mb-2">Treasure Room!</h3>
                <p className="text-zinc-400 mb-6">A reward for your bravery.</p>
                <Button onClick={openTreasure} size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8">
                  Open Chest
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 order-1 md:order-2 w-full">
            {/* Combat Log */}
            <div className="flex-none bg-zinc-950 rounded-xl border border-zinc-800 p-4 h-[220px] flex flex-col shadow-inner relative z-10 w-full">
              <div className="flex justify-between items-center mb-2 flex-none">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Battle Log</h4>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500/20"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500/20"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500/20"></span>
                </div>
              </div>

              <ScrollArea className="flex-1 w-full rounded-md bg-zinc-950 border border-white/5 mx-[-4px] sm:mx-0">
                <div className="p-3 space-y-2 text-sm font-mono">
                  {battleLog.length === 0 && (
                    <div className="text-zinc-600 italic text-center text-xs py-8 opacity-50">
                      Waiting for combat to begin...
                    </div>
                  )}
                  {battleLog.map((log, i) => (
                    <div key={i} className={`p-2 rounded text-xs md:text-sm border-l-2 shadow-sm animate-in slide-in-from-left-2 duration-300 ${log.includes('victory') || log.includes('Victorious') || log.includes('CRITICAL') ? 'border-yellow-500 bg-yellow-900/20 text-yellow-200' : log.includes('hit you') ? 'border-red-500 bg-red-900/20 text-red-200' : log.includes('DODGED') ? 'border-cyan-500 bg-cyan-900/20 text-cyan-200' : 'border-blue-500 bg-blue-900/10 text-zinc-300'} border-opacity-60`}>
                      {log}
                    </div>
                  ))}
                  <div ref={logEndRef} className="h-2" />
                </div>
              </ScrollArea>
            </div>

            {/* Controls / Fighter Deployment */}
            {run.currentEncounter.type === 'monster' && (
              <div className="bg-zinc-800/40 p-5 rounded-xl border border-zinc-700/50  shadow-xl flex-1 flex flex-col justify-center w-full min-h-[300px]">
                {battlePhase === 'select' ? (
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-end">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>🛡️ Deploy Fighter</span>
                      </h4>
                      <Badge variant="outline" className="text-xs font-mono bg-zinc-900">
                        {run.party ? run.party.filter(c => c.hp > 0).length : 0}/6 Ready
                      </Badge>
                    </div>

                    {/* Responsive Horizontal Deck Carousel */}
                    <div className="flex overflow-x-auto gap-4 pb-4 pt-1 no-scrollbar snap-x snap-mandatory w-full scroll-smooth">
                      {(run.party || [DEFAULT_CREATURE]).map((creature, idx) => {
                        const memberHp = creature.hp;
                        const memberMaxHp = creature.maxHp;
                        const isFainted = memberHp <= 0;

                        // Calculate matchup for improved UX
                        let matchupText = "";
                        let matchupColor = "text-zinc-500 border-zinc-850";
                        if (enemyDef) {
                          const mult = getMatchupMultiplier(creature.type, enemyDef.type);
                          if (mult > 1) { matchupText = "Strong"; matchupColor = "text-green-400 border-green-500/40 font-bold bg-green-950/90"; }
                          else if (mult < 1) { matchupText = "Weak"; matchupColor = "text-red-400 border-red-500/40 bg-red-950/90"; }
                        }

                        return (
                          <button
                            key={`${creature.id}-${idx}`}
                            onClick={() => selectFighter(creature)}
                            disabled={isFainted}
                            className={`flex-none w-[145px] sm:w-[155px] aspect-[3/4] snap-center snap-always group relative rounded-2xl border-2 flex flex-col justify-between p-3.5 text-left transition-all duration-200 overflow-hidden bg-zinc-950 ${
                              isFainted 
                                ? 'border-zinc-800 bg-zinc-950 text-zinc-600 opacity-50 cursor-not-allowed shadow-none' 
                                : `${getTypeColor(creature.type)} hover:scale-[1.02] hover:shadow-lg active:scale-95`
                            } ${selectedCreature?.id === creature.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 border-transparent' : 'border-opacity-40 hover:border-opacity-100'}`}
                          >
                            <div className="flex justify-end items-start z-10 w-full">
                              <span className="text-sm filter drop-shadow-md">{getTypeEmoji(creature.type)}</span>
                            </div>

                            {/* Centered Matchup text overlay inside cards */}
                            {matchupText && !isFainted && (
                              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border px-2.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest shadow-2xl z-20 transition-transform duration-300 group-hover:scale-110  ${matchupColor}`}>
                                {matchupText}
                              </div>
                            )}

                            {/* Creature Image inside deploy buttons */}
                            <div className="relative w-full flex-1 my-2 flex items-center justify-center">
                              <Image
                                src={`/images/creatures/${creature.id}.png`}
                                alt={creature.name}
                                fill
                                className="object-contain scale-[1.25] drop-shadow-lg"
                                unoptimized
                              />
                            </div>

                            {/* Health Stats */}
                            <div className="space-y-1 z-10 w-full">
                              <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                                <span>HP</span>
                                <span>{memberHp}/{memberMaxHp}</span>
                              </div>
                              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isFainted ? 'bg-red-950' : 'bg-green-500'} transition-all duration-300`}
                                  style={{ width: `${(memberHp / memberMaxHp) * 100}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-0.5 text-[9px] opacity-90 font-mono mt-1.5 z-10 text-center w-full">
                              <span>⚔️{creature.stats.atk}</span>
                              <span>🛡️{creature.stats.def}</span>
                              <span>💨{creature.stats.spd}</span>
                            </div>

                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="flex flex-col items-center justify-center space-y-4 py-2 w-full">
                      {/* Active Fighter Mini Card */}
                      <div className="relative group w-full max-w-[190px] aspect-[3/4] animate-in zoom-in-95 duration-300">
                        <div className={`w-full h-full border-2 ${getTypeColor(selectedCreature!.type)} bg-zinc-950/95  relative overflow-hidden shadow-2xl flex flex-col p-4 justify-between rounded-2xl`}>
                          <div className="flex justify-end items-start z-10 w-full">
                            <span className="text-sm filter drop-shadow-md">{getTypeEmoji(selectedCreature!.type)}</span>
                          </div>

                          <div className="relative w-full flex-1 my-3 flex items-center justify-center">
                            <Image
                              src={`/images/creatures/${selectedCreature!.id}.png`}
                              alt={selectedCreature!.name}
                              fill
                              className="object-contain scale-[1.25] drop-shadow-lg"
                              unoptimized
                            />
                          </div>

                          <div className="space-y-1.5 z-10 w-full">
                            <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                              <span>HP</span>
                              <span>{activeFighterHp} / {activeFighterMaxHp}</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(activeFighterHp / activeFighterMaxHp) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => setBattlePhase('select')} className="text-xs border-amber-900/40 hover:bg-amber-950/20 text-amber-400 font-bold px-4 py-1.5 rounded-xl transition-all shadow-md">
                        🔄 Change Fighter
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button onClick={fight} className="col-span-2 h-14 text-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 font-black tracking-widest uppercase shadow-lg shadow-red-900/40 active:translate-y-1 transition-all border-t border-red-400">
                        ⚔️ Attack
                      </Button>
                      <Button onClick={flee} variant="secondary" className="col-span-1 h-14 bg-zinc-700 hover:bg-zinc-600 font-bold border-t border-zinc-500 text-zinc-200">
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
