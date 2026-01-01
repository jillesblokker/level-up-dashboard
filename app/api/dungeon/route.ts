import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

interface DungeonState {
    hp: number;
    maxHp: number;
    room: number;
    status: string;
    encounter: any;
    loot: any[];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, runId, choice } = body;

        return await authenticatedSupabaseQuery(req, async (supabase, userId) => {

            // --- ACTION: START NEW RUN ---
            if (action === 'start') {
                // 1. Check Gold (Entry Fee 50G)
                const { data: stats } = await supabase
                    .from('character_stats')
                    .select('gold, vitality, strength, intelligence')
                    .eq('user_id', userId)
                    .single();

                if (!stats || stats.gold < 50) {
                    return NextResponse.json({ error: 'Insufficient Gold (50G required)' }, { status: 400 });
                }

                // 2. Deduct Gold
                await supabase.rpc('deduct_gold', { p_user_id: userId, p_amount: 50 });

                // 3. Create Run
                // Base HP = 100 + (Vitality * 10)
                const maxHp = 100 + ((stats.vitality || 1) * 10);

                const { data: newRun, error } = await supabase
                    .from('dungeon_runs')
                    .insert({
                        user_id: userId,
                        current_hp: maxHp,
                        max_hp: maxHp,
                        current_room: 1,
                        status: 'in_progress',
                        current_encounter: generateEncounter(1) // Initial encounter
                    })
                    .select()
                    .single();

                if (error) throw error;
                return newRun;
            }

            // --- ACTION: PLAY TURN (FIGHT/FLEE/OPEN) ---
            if (action === 'play') {
                if (!runId) return { error: 'Missing runId' };

                // 1. Fetch Run
                const { data: run } = await supabase
                    .from('dungeon_runs')
                    .select('*')
                    .eq('id', runId)
                    .single();

                if (!run || run.status !== 'in_progress') {
                    return { error: 'Run not active' };
                }

                // 2. Resolve Action
                const encounter = run.current_encounter;
                let resultMessage = '';
                let damageTaken = 0;
                let lootFound: any = null;
                let isRoomCleared = false;

                if (encounter.type === 'monster') {
                    if (choice === 'fight') {
                        // Simple combat logic: User hits, Monster hits back
                        // User damage = 10-20
                        // Monster damage = 5-15
                        const userDmg = Math.floor(Math.random() * 10) + 10;
                        const monsterDmg = Math.floor(Math.random() * 10) + 5;

                        encounter.hp = (encounter.hp || 30) - userDmg;
                        damageTaken = monsterDmg;

                        resultMessage = `You hit for ${userDmg} dmg! Monster hit back for ${monsterDmg} dmg.`;

                        if (encounter.hp <= 0) {
                            isRoomCleared = true;
                            resultMessage += ' Monster defeated!';
                            lootFound = generateLoot(run.current_room);
                        }
                    } else if (choice === 'flee') {
                        // 50% chance to flee
                        if (Math.random() > 0.5) {
                            isRoomCleared = true; // Skipped room
                            resultMessage = 'You fled successfully!';
                        } else {
                            damageTaken = 10;
                            resultMessage = 'Failed to flee! Took 10 damage.';
                        }
                    }
                }
                else if (encounter.type === 'treasure') {
                    isRoomCleared = true;
                    lootFound = generateLoot(run.current_room);
                    resultMessage = 'You found treasure!';
                }

                // 3. Update State
                let newHp = run.current_hp - damageTaken;
                let newStatus = run.status;
                let newRoom = run.current_room;
                let newEncounter = encounter;
                let newLoot = run.loot_collected || [];

                if (lootFound) newLoot.push(lootFound);

                if (newHp <= 0) {
                    newStatus = 'defeated';
                    newHp = 0;
                    resultMessage += ' YOU DIED.';
                } else if (isRoomCleared) {
                    if (newRoom >= (run.max_rooms || 5)) {
                        newStatus = 'completed';
                        resultMessage += ' DUNGEON CLEARED!';
                        // Grant big reward?
                        newLoot.push({ type: 'gold', amount: 500, name: 'Completion Bonus' });
                    } else {
                        newRoom++;
                        newEncounter = generateEncounter(newRoom);
                        resultMessage += ' Proceeding to next room...';
                    }
                }

                // Update DB
                const { data: updatedRun, error } = await supabase
                    .from('dungeon_runs')
                    .update({
                        current_hp: newHp,
                        current_room: newRoom,
                        status: newStatus,
                        current_encounter: isRoomCleared && newStatus === 'in_progress' ? newEncounter : run.current_encounter, // Only change encounter if room cleared
                        loot_collected: newLoot
                    })
                    .eq('id', runId)
                    .select()
                    .single();

                if (error) throw error;

                // If completed/died, finalize rewards
                if (newStatus !== 'in_progress') {
                    await processEndRun(supabase, userId, newLoot);
                }

                return { ...updatedRun, message: resultMessage, actionResult: { damageTaken, lootFound } };
            }

            return { error: 'Invalid action' };
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// Helpers
function generateEncounter(roomLevel: number) {
    const type = Math.random() > 0.3 ? 'monster' : 'treasure';
    if (type === 'treasure') {
        return { type: 'treasure', name: 'Old Chest' };
    }
    return {
        type: 'monster',
        name: `Dungeon Monster Lvl ${roomLevel}`,
        hp: 20 + (roomLevel * 10),
        maxHp: 20 + (roomLevel * 10)
    };
}

function generateLoot(roomLevel: number) {
    const gold = Math.floor(Math.random() * 50) + (roomLevel * 10);
    return { type: 'gold', amount: gold, name: `${gold} Gold Coins` };
}

async function processEndRun(supabase: any, userId: string, loot: any[]) {
    // Calculate total gold
    const totalGold = loot.reduce((acc, item) => acc + (item.type === 'gold' ? item.amount : 0), 0);
    if (totalGold > 0) {
        await supabase.rpc('add_gold', { p_user_id: userId, p_amount: totalGold });
    }
    // Add items to inventory would go here
}
