export type MonsterType = 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy';

export interface MonsterSpawn {
    id: string;
    user_id: string;
    x: number;
    y: number;
    monster_type: MonsterType;
    spawned_at: string; // ISO timestamp
    defeated: boolean;
    reward_claimed: boolean;
}

export interface MonsterBattleResult {
    won: boolean;
    goldEarned: number;
    xpEarned: number;
    itemsEarned?: string[];
}

export interface SpawnCheckResult {
    shouldSpawn: boolean;
    position?: { x: number; y: number };
    monsterType?: MonsterType;
}
