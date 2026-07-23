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
  CreatureType,
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

function generateEncounter(roomLevel: number, playerLevel: number = 1): Encounter {
  const isTreasure = false;
  if (isTreasure) {
    return {
      type: 'treasure',
      loot: [generateLoot(roomLevel, playerLevel)].filter(Boolean) as Loot[]
    };
  }

  // Pick random creature
  const randomId = CREATURE_IDS[Math.floor(Math.random() * CREATURE_IDS.length)] || '001';

  // Dynamic Monster Scaling formula based on room depth and player level
  const baseHp = 25 + (roomLevel * 12);
  const playerScaleHp = 1 + (Math.max(1, playerLevel) - 1) * 0.08;
  const scaledHp = Math.round(baseHp * playerScaleHp);

  return {
    type: 'monster',
    hp: scaledHp,
    maxHp: scaledHp,
    difficulty: roomLevel,
    creatureId: randomId
  };
}

function generateLoot(roomLevel: number, playerLevel: number = 1): Loot | null {
  const levelBonus = 1 + (Math.max(1, playerLevel) - 1) * 0.12;
  if (Math.random() > 0.4) {
    const goldAmount = Math.round((50 + (roomLevel * 15)) * levelBonus);
    return { type: 'gold', amount: goldAmount, name: 'Gold Coins' };
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

  const getElementalSpell = (type: CreatureType) => {
    switch (type) {
      case 'Fire': return { name: 'Inferno Surge', emoji: '🔥', desc: '1.4x Dmg, +25% Crit' };
      case 'Water': return { name: 'Tidal Crash', emoji: '🌊', desc: '1.4x Dmg, +25% Crit' };
      case 'Grass': return { name: 'Leaf Storm', emoji: '🍃', desc: '1.4x Dmg, +25% Crit' };
      case 'Rock': return { name: 'Tremor Smash', emoji: '🪨', desc: '1.4x Dmg, +25% Crit' };
      case 'Ice': return { name: 'Frostbite Blast', emoji: '❄️', desc: '1.4x Dmg, +25% Crit' };
      default: return { name: 'Elemental Arc', emoji: '✨', desc: '1.4x Dmg, +25% Crit' };
    }
  };

  const fight = (actionType: 'strike' | 'elemental' | 'counter' = 'strike') => {
    if (!run || run.currentEncounter.type !== 'monster' || !selectedCreature) return;

    const enemyId = run.currentEncounter.creatureId || '001';
    const enemyDef = CREATURE_DATA[enemyId];

    if (!enemyDef) return;

    const activeFighter = run.party.find(c => c.id === selectedCreature.id);
    if (!activeFighter || activeFighter.hp <= 0) return;

    const logEntries: string[] = [];

    // 1. Calculate Base Stats
    const elementalHabitBuff = (elementBuffs[activeFighter.type] || 0) * 2; // +2 atk per habit
    const buildingAtkBuff = buildingBuffs.atkBuff;

    const playerSpd = activeFighter.stats.spd;
    const playerDef = activeFighter.stats.def;
    let playerAtk = activeFighter.stats.atk + (Math.floor(Math.random() * 5)) + elementalHabitBuff + buildingAtkBuff;

    // Enemy stats
    const enemySpd = enemyDef.stats.spd;
    let enemyDefStat = enemyDef.stats.def;
    let enemyAtk = enemyDef.stats.atk + (Math.floor(Math.random() * 5));

    if (elementalHabitBuff > 0) logEntries.push(`✨ Daily habits empower ${activeFighter.name}! (+${elementalHabitBuff} ATK)`);
    if (buildingAtkBuff > 0) logEntries.push(`⚔️ Blacksmith sharpens your attack! (+${buildingAtkBuff} ATK)`);

    // 2. Type Multipliers
    const playerTypeMult = getMatchupMultiplier(activeFighter.type, enemyDef.type);
    const enemyTypeMult = getMatchupMultiplier(enemyDef.type, activeFighter.type);

    // 3. Tactical Action Resolution (Hogwarts Legacy style 3 choices)
    let playerCritChance = Math.max(0, Math.min(0.5, (playerSpd - enemySpd) * 0.03));
    let isPlayerCrit = false;
    let playerFinalDmg = 0;
    let enemyFinalDmg = 0;
    const isPlayerDodge = Math.random() < Math.max(0, Math.min(0.4, (playerSpd - enemySpd) * 0.02));
    const isEnemyCrit = Math.random() < 0.05;

    if (actionType === 'elemental') {
      const spell = getElementalSpell(activeFighter.type);
      playerCritChance += 0.25; // +25% Crit bonus
      isPlayerCrit = Math.random() < playerCritChance;
      enemyDefStat = Math.floor(enemyDefStat * 0.7); // Ignores 30% enemy armor
      playerAtk = Math.floor(playerAtk * 1.4); // 1.4x base atk
      const critMult = isPlayerCrit ? 1.6 : 1.0;
      playerFinalDmg = Math.max(1, Math.floor((playerAtk * playerTypeMult * critMult) - (enemyDefStat * 0.4)));

      logEntries.push(`✨ ${activeFighter.name} unleashes ${spell.emoji} ${spell.name}! ${isPlayerCrit ? '💥 CRITICAL OVERLOAD!' : ''}`);
      logEntries.push(`You dealt ${playerFinalDmg} ${activeFighter.type} elemental damage to ${enemyDef.name}! ${playerTypeMult > 1 ? '🔥 Super Effective!' : ''}`);
    } else if (actionType === 'counter') {
      // Counter Guard stance: reduces incoming damage by 60% and ripostes!
      logEntries.push(`🛡️ ${activeFighter.name} adopts a Counter Guard stance!`);
      playerFinalDmg = Math.max(1, Math.floor((playerAtk * 0.85 * playerTypeMult) - (enemyDefStat * 0.4)));
      logEntries.push(`You strike ${enemyDef.name} for ${playerFinalDmg} damage while maintaining shield defense.`);
    } else {
      // Basic Heavy Strike
      isPlayerCrit = Math.random() < playerCritChance;
      const critMult = isPlayerCrit ? 1.5 : 1.0;
      playerFinalDmg = Math.max(1, Math.floor((playerAtk * playerTypeMult * critMult) - (enemyDefStat * 0.4)));
      if (isPlayerCrit) logEntries.push(`🎯 CRITICAL STRIKE! You hit ${enemyDef.name} for ${playerFinalDmg} damage!`);
      else logEntries.push(`⚔️ ${activeFighter.name} hits ${enemyDef.name} for ${playerFinalDmg} damage.`);
    }

    const newMonsterHp = Math.max(0, (run.currentEncounter.hp || 0) - playerFinalDmg);

    // Enemy Retaliation
    if (newMonsterHp > 0) {
      if (isPlayerDodge) {
        logEntries.push(`💨 You DODGED ${enemyDef.name}'s attack!`);
      } else {
        const enemyCritMult = isEnemyCrit ? 1.5 : 1.0;
        let rawEnemyDmg = Math.max(1, Math.floor((enemyAtk * enemyTypeMult * enemyCritMult) - (playerDef * 0.4)));
        
        if (actionType === 'counter') {
          // Counter Guard mitigates 60% incoming damage and ripostes 120% back!
          enemyFinalDmg = Math.max(1, Math.floor(rawEnemyDmg * 0.4));
          const riposteDmg = Math.max(1, Math.floor(enemyAtk * 1.2));
          logEntries.push(`🛡️ Counter Guard absorbed 60% damage! Taking only ${enemyFinalDmg} damage.`);
          logEntries.push(`⚡ RIPOSTE COUNTER! You hit ${enemyDef.name} back for ${riposteDmg} counter damage!`);
        } else {
          enemyFinalDmg = rawEnemyDmg;
          if (isEnemyCrit) logEntries.push(`⚠️ ${enemyDef.name} LANDS A CRITICAL HIT for ${enemyFinalDmg}!`);
          else logEntries.push(`${enemyDef.name} hit you for ${enemyFinalDmg} damage. ${enemyTypeMult > 1 ? '💔' : ''}`);
        }
      }
    } else {
      logEntries.push(`🏆 ${enemyDef.name} fainted! Victory!`);
    }

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
          const nextEncounter = generateEncounter(run.currentRoom + 1);
          setRun({
            ...run,
            party: updatedParty,
            currentHp: totalTeamHpAfterDamage,
            currentRoom: run.currentRoom + 1,
            lootCollected: newLoot,
            currentEncounter: nextEncounter
          });
          
          if (isFighterFainted) {
            setSelectedCreature(null);
            setBattlePhase('select');
            setMessage(`Victorious, but ${selectedCreature.name} fainted! Deploy a new fighter!`);
          } else {
            const nextEnemyId = nextEncounter.creatureId || '001';
            const nextEnemyDef = CREATURE_DATA[nextEnemyId];
            let advMessage = 'Victorious! Keep your active fighter or swap squad member?';
            if (nextEnemyDef) {
              const nextMult = getMatchupMultiplier(selectedCreature.type, nextEnemyDef.type);
              if (nextMult > 1) advMessage = `Victorious! ${selectedCreature.name} (${selectedCreature.type}) has STRONG ADVANTAGE vs ${nextEnemyDef.name} (${nextEnemyDef.type})!`;
              else if (nextMult < 1) advMessage = `Victorious! Warning: ${selectedCreature.name} (${selectedCreature.type}) is WEAK vs ${nextEnemyDef.name} (${nextEnemyDef.type})! Consider swapping!`;
            }
            setMessage(advMessage);
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
    // Fleeing is a safe retreat that does NOT consume a daily attempt!
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'dungeon_daily_limit';
    const storage = localStorage.getItem(storageKey);
    if (storage) {
      const data = JSON.parse(storage);
      if (data.date === today && data.count > 0) {
        data.count--;
        localStorage.setItem(storageKey, JSON.stringify(data));
        setDailyCount(data.count);
      }
    }
    notificationService.addNotification(
      "🏃 Safe Retreat!",
      "You safely fled the dungeon. Your daily entry attempt was not consumed!",
      "monster",
      "medium"
    );
    setRun(null);
    setGameResult(null);
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
  const enemyLevel = Math.max(1, run.currentRoom * 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-[#0b0d10] to-black p-4 sm:p-6 lg:p-8 text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Status Message */}
        {message && (
          <div className="bg-gradient-to-r from-blue-900/40 via-amber-950/40 to-zinc-900/40 border border-amber-500/30 p-3.5 rounded-xl text-center text-amber-200 text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-lg">
            {message}
          </div>
        )}

        {/* TOP SECTION: BATTLE ARENA (Enemy Showcase & Deploy Fighter Side-by-Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* LEFT: ENEMY SHOWCASE */}
          <div className="lg:col-span-5 bg-[#0b0d10] border border-amber-900/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

            {run.currentEncounter.type === 'monster' && enemyDef ? (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 w-full space-y-4">
                
                {/* Header Badge Row */}
                <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-950/90 text-red-300 border border-red-500/40 text-xs font-extrabold px-3 py-1 uppercase tracking-wider">
                      Lv. {enemyLevel} Monster
                    </Badge>
                    <span className="text-sm font-bold text-zinc-200">{enemyDef.name}</span>
                  </div>
                  <span className="text-xl filter drop-shadow-md">{getTypeEmoji(enemyDef.type)}</span>
                </div>

                {/* Creature Card Frame (Hugs content naturally, zero cropping, zero letterboxing) */}
                <div className="relative group w-full flex justify-center py-1">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${(getTypeColor(enemyDef.type).split(' ')[0] || 'text-zinc-500').replace('text-', 'from-')}/25 to-transparent blur-2xl rounded-full opacity-60 group-hover:opacity-85 transition-opacity`}></div>
                  
                  <div className={`relative w-full max-w-[310px] transition-all duration-300 ${getTypeColor(enemyDef.type)} border-2 rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl flex flex-col`}>
                    
                    {/* Natural Aspect Creature Image with Top Badges Overlay */}
                    <div className="relative w-full overflow-hidden bg-zinc-950">
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <span className="text-xs text-red-300 font-extrabold bg-red-950/90 px-2.5 py-1 rounded-lg border border-red-500/40 shadow-md">
                          Lv.{enemyLevel}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="p-1.5 bg-zinc-950/90 border border-white/10 rounded-lg text-lg filter drop-shadow-lg inline-block">
                          {getTypeEmoji(enemyDef.type)}
                        </span>
                      </div>

                      <Image
                        src={`/images/creatures/${enemyId}.png`}
                        alt={enemyDef.name}
                        width={768}
                        height={1106}
                        className="w-full h-auto object-contain block drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>

                    {/* Bottom Stats Banner (Natural height panel below image) */}
                    <div className="bg-zinc-950 border-t border-white/10 p-3.5 space-y-2.5 z-10 w-full">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400 font-bold">
                          <span>HP</span>
                          <span className="font-mono">{run.currentEncounter.hp} / {run.currentEncounter.maxHp}</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                            style={{ width: `${((run.currentEncounter.hp || 0) / (run.currentEncounter.maxHp || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-mono text-center pt-0.5">
                        <span className="bg-white/5 py-1 rounded-md flex items-center justify-center gap-1 text-red-300 font-bold">⚔️ {enemyDef.stats.atk}</span>
                        <span className="bg-white/5 py-1 rounded-md flex items-center justify-center gap-1 text-blue-300 font-bold">🛡️ {enemyDef.stats.def}</span>
                        <span className="bg-white/5 py-1 rounded-md flex items-center justify-center gap-1 text-emerald-300 font-bold">💨 {enemyDef.stats.spd}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest pt-1 flex items-center gap-1.5">
                  <span>⚔️ TARGET ENEMY (Room {run.currentRoom})</span>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto space-y-4 py-8">
                <div className="text-7xl animate-bounce">📦</div>
                <h3 className="text-2xl font-bold text-amber-400">Treasure Vault Room!</h3>
                <p className="text-xs text-zinc-400 max-w-xs">A chest filled with gold and rare dungeon materials!</p>
                <Button onClick={openTreasure} size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-5 rounded-xl shadow-lg">
                  Open Chest
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT: DEPLOY FIGHTER & CONTROLS */}
          <div className="lg:col-span-7 bg-[#0b0d10] border border-amber-900/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

            {run.currentEncounter.type === 'monster' && (
              <div className="w-full flex-1 flex flex-col justify-between space-y-4">
                {battlePhase === 'select' ? (
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <span>🛡️ Deploy Fighter</span>
                      </h4>
                      <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-500/30 bg-emerald-950/30 font-bold px-2.5 py-0.5">
                        {run.party ? run.party.filter(c => c.hp > 0).length : 0} / 6 Ready
                      </Badge>
                    </div>

                    {/* 2 ROWS OF 3 FIGHTERS GRID LAYOUT (Natural Aspect Ratio, Hugs Content, Zero Cropping) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full">
                      {(run.party || [DEFAULT_CREATURE]).map((creature, idx) => {
                        const memberHp = creature.hp;
                        const memberMaxHp = creature.maxHp;
                        const isFainted = memberHp <= 0;
                        const fighterLevel = creature.level || 1;

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
                            className={`w-full group relative rounded-2xl border-2 flex flex-col justify-between text-left transition-all duration-200 overflow-hidden bg-zinc-950 ${
                              isFainted 
                                ? 'border-zinc-800 bg-zinc-950 text-zinc-600 opacity-40 cursor-not-allowed shadow-none' 
                                : `${getTypeColor(creature.type)} hover:scale-[1.02] hover:shadow-lg active:scale-95`
                            } ${selectedCreature?.id === creature.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 border-transparent' : 'border-opacity-40 hover:border-opacity-100'}`}
                          >
                            <div className="relative w-full overflow-hidden bg-zinc-950">
                              {/* Top Level Badge & Element Emoji */}
                              <div className="absolute top-2 left-2 z-10">
                                <span className="text-[10px] text-amber-300 font-extrabold bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/30 shadow">
                                  Lv.{fighterLevel}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 z-10">
                                <span className="text-xs filter drop-shadow-md">{getTypeEmoji(creature.type)}</span>
                              </div>

                              {/* Centered Matchup text overlay inside cards */}
                              {matchupText && !isFainted && (
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest shadow-2xl z-20 transition-transform duration-300 group-hover:scale-110 ${matchupColor}`}>
                                  {matchupText}
                                </div>
                              )}

                              {/* Natural Aspect Creature Image */}
                              <Image
                                src={`/images/creatures/${creature.id}.png`}
                                alt={creature.name}
                                width={768}
                                height={1106}
                                className="w-full h-auto object-contain block drop-shadow-lg"
                                unoptimized
                              />
                            </div>

                            {/* Bottom Health Stats & Info Banner */}
                            <div className="space-y-1 z-10 w-full bg-zinc-950 p-2 border-t border-white/10">
                              <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                                <span>HP</span>
                                <span className="font-mono">{memberHp}/{memberMaxHp}</span>
                              </div>
                              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isFainted ? 'bg-red-950' : 'bg-emerald-500'} transition-all duration-300`}
                                  style={{ width: `${(memberHp / memberMaxHp) * 100}%` }}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-0.5 text-[8px] font-mono text-center pt-0.5">
                                <span>⚔️{creature.stats.atk}</span>
                                <span>🛡️{creature.stats.def}</span>
                                <span>💨{creature.stats.spd}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center my-auto w-full py-2">
                    {(() => {
                      const activeSpell = getElementalSpell(selectedCreature!.type);
                      const mult = enemyDef ? getMatchupMultiplier(selectedCreature!.type, enemyDef.type) : 1;
                      let matchupLabel = "NEUTRAL (1.0x DMG)";
                      let matchupBadgeColor = "text-zinc-300 border-zinc-700 bg-zinc-900/90";
                      if (mult > 1) {
                        matchupLabel = `STRONG 🟢 (x${mult} DMG)`;
                        matchupBadgeColor = "text-emerald-300 border-emerald-500/50 bg-emerald-950/95 font-extrabold shadow-lg shadow-emerald-950/50";
                      } else if (mult < 1) {
                        matchupLabel = `WEAK 🔴 (x${mult} DMG)`;
                        matchupBadgeColor = "text-red-300 border-red-500/50 bg-red-950/95 font-extrabold shadow-lg shadow-red-950/50";
                      }

                      return (
                        <>
                          {/* Active Fighter Mini Card with Prominent Matchup Overlay */}
                          <div className="flex flex-col items-center justify-center space-y-3 w-full">
                            <div className="relative group w-full max-w-[210px] animate-in zoom-in-95 duration-300">
                              <div className={`w-full border-2 ${getTypeColor(selectedCreature!.type)} bg-zinc-950 relative overflow-hidden shadow-2xl flex flex-col justify-between rounded-2xl`}>
                                
                                <div className="relative w-full overflow-hidden bg-zinc-950">
                                  {/* Level Badge Overlay */}
                                  <div className="absolute top-2 left-2 z-10">
                                    <span className="text-xs text-amber-300 font-extrabold bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/30">
                                      Lv.{selectedCreature?.level || 1}
                                    </span>
                                  </div>
                                  <div className="absolute top-2 right-2 z-10">
                                    <span className="text-sm filter drop-shadow-md">{getTypeEmoji(selectedCreature!.type)}</span>
                                  </div>

                                  {/* Prominent Matchup Badge Overlay */}
                                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-md ${matchupBadgeColor}`}>
                                      {matchupLabel.split(' ')[0]}
                                    </span>
                                  </div>

                                  <Image
                                    src={`/images/creatures/${selectedCreature!.id}.png`}
                                    alt={selectedCreature!.name}
                                    width={768}
                                    height={1106}
                                    className="w-full h-auto object-contain block drop-shadow-lg"
                                    unoptimized
                                  />
                                </div>

                                <div className="bg-zinc-950 border-t border-white/10 p-3 space-y-1.5 z-10 w-full">
                                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                                    <span>HP</span>
                                    <span className="font-mono">{activeFighterHp} / {activeFighterMaxHp}</span>
                                  </div>
                                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 transition-all duration-300"
                                      style={{ width: `${(activeFighterHp / activeFighterMaxHp) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Matchup Summary Bar */}
                            <div className="flex items-center justify-between w-full max-w-md bg-zinc-950/80 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 font-medium">Element Matchup:</span>
                                <Badge className={`text-[10px] px-2 py-0.5 border ${matchupBadgeColor}`}>
                                  {matchupLabel}
                                </Badge>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setBattlePhase('select')} className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 h-6 px-2">
                                🔄 Swap Fighter
                              </Button>
                            </div>
                          </div>

                          {/* Hogwarts Legacy 3 Tactical Combat Choices */}
                          <div className="space-y-2 w-full pt-1">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                              Choose Combat Action
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                              
                              {/* Choice 1: Heavy Strike */}
                              <Button
                                onClick={() => fight('strike')}
                                className="h-14 flex flex-col items-center justify-center bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border border-red-500/40 rounded-xl shadow-lg transition-all active:scale-95"
                              >
                                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">⚔️ Heavy Strike</span>
                                <span className="text-[9px] text-red-200 opacity-80">Physical Dmg</span>
                              </Button>

                              {/* Choice 2: Elemental Burst */}
                              <Button
                                onClick={() => fight('elemental')}
                                className="h-14 flex flex-col items-center justify-center bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 border border-amber-400/40 rounded-xl shadow-lg transition-all active:scale-95"
                              >
                                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                  {activeSpell.emoji} {activeSpell.name}
                                </span>
                                <span className="text-[9px] text-amber-200 opacity-80">{activeSpell.desc}</span>
                              </Button>

                              {/* Choice 3: Counter Guard */}
                              <Button
                                onClick={() => fight('counter')}
                                className="h-14 flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 border border-blue-400/40 rounded-xl shadow-lg transition-all active:scale-95"
                              >
                                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">🛡️ Counter Guard</span>
                                <span className="text-[9px] text-blue-200 opacity-80">-60% Dmg + Riposte</span>
                              </Button>
                            </div>

                            {/* Safe Flee Action Button (Does not burn entry attempt) */}
                            <div className="flex justify-center pt-1">
                              <Button
                                onClick={flee}
                                variant="ghost"
                                className="text-[11px] text-zinc-400 hover:text-amber-300 hover:bg-zinc-900/60 h-7 px-3 rounded-lg"
                              >
                                🏃 Safe Retreat (Preserves Daily Entry Attempt)
                              </Button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: DUNGEON LEDGER & LOGS (Location, Team Health, Battle Log) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
          
          {/* CARD 1: LOCATION & DUNGEON STATS */}
          <div className="bg-[#0b0d10] p-5 rounded-2xl border border-amber-900/20 shadow-xl flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Location</div>
              <div className="text-2xl font-black text-white flex items-center gap-2 font-cardo">
                <span>Room {run.currentRoom}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-500">{run.maxRooms}</span>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-white/5 pt-3 text-xs">
              <div className="flex justify-between text-yellow-400 font-bold">
                <span>💰 Loot Found:</span>
                <span>{run.lootCollected.length} items</span>
              </div>
              <div className="flex justify-between text-zinc-400 font-bold text-[11px]">
                <span>⚔️ Daily Entry Limit:</span>
                <span className="text-amber-500">{dailyCount} / 3</span>
              </div>
            </div>
          </div>

          {/* CARD 2: TEAM HEALTH STATUS */}
          <div className="bg-[#0b0d10] p-5 rounded-2xl border border-amber-900/20 shadow-xl flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Team Health</div>
                <div className={`font-mono font-bold text-xs ${totalTeamHp < (totalTeamMaxHp * 0.3) ? 'text-red-500' : 'text-emerald-400'}`}>
                  {totalTeamHp} / {totalTeamMaxHp}
                </div>
              </div>
              <Progress value={totalTeamMaxHp > 0 ? (totalTeamHp / totalTeamMaxHp) * 100 : 0} className="h-2.5 bg-zinc-950 border border-white/10" indicatorClassName={totalTeamHp < (totalTeamMaxHp * 0.3) ? 'bg-red-500' : 'bg-emerald-500'} />
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs text-zinc-400 font-semibold">
              <span>Squad Status:</span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 font-bold">
                {run.party ? run.party.filter(c => c.hp > 0).length : 0} / 6 Fighters Active
              </Badge>
            </div>
          </div>

          {/* CARD 3: BATTLE LOG */}
          <div className="bg-[#0b0d10] p-5 rounded-2xl border border-amber-900/20 shadow-xl flex flex-col h-[180px]">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                📜 Battle Log
              </h4>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/40"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></span>
              </div>
            </div>

            <ScrollArea className="flex-1 w-full rounded-xl bg-zinc-950/80 border border-white/5 p-2">
              <div className="space-y-1.5 font-mono text-[11px]">
                {battleLog.length === 0 && (
                  <div className="text-zinc-600 italic text-center text-xs py-6 opacity-60">
                    Waiting for combat to begin...
                  </div>
                )}
                {battleLog.map((log, i) => (
                  <div key={i} className={`p-1.5 rounded text-[11px] border-l-2 shadow-sm animate-in slide-in-from-left-2 duration-300 ${log.includes('victory') || log.includes('Victorious') || log.includes('CRITICAL') ? 'border-yellow-500 bg-yellow-900/20 text-yellow-200' : log.includes('hit you') ? 'border-red-500 bg-red-900/20 text-red-200' : log.includes('DODGED') ? 'border-cyan-500 bg-cyan-900/20 text-cyan-200' : 'border-blue-500 bg-blue-900/10 text-zinc-300'} border-opacity-60`}>
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} className="h-1" />
              </div>
            </ScrollArea>
          </div>

        </div>

      </div>
    </div>
  );
}
