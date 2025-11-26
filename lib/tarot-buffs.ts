import { getTodaysCard, TarotCard } from './tarot-data';

export interface BuffedRewards {
    xp: number;
    gold: number;
    buffApplied: boolean;
    buffMessage?: string | undefined;
}

/**
 * Apply tarot card buffs to quest rewards
 * @param baseXp - Base XP reward
 * @param baseGold - Base gold reward
 * @param questCategory - Category of the quest (e.g., 'might', 'knowledge')
 * @returns Buffed rewards with applied multipliers
 */
export function applyTarotBuffs(
    baseXp: number,
    baseGold: number,
    questCategory?: string
): BuffedRewards {
    const activeCard = getTodaysCard();

    // If no card is active, return base rewards
    if (!activeCard) {
        return {
            xp: baseXp,
            gold: baseGold,
            buffApplied: false
        };
    }

    const effect = activeCard.effect;
    let xpMultiplier = 1.0;
    let goldMultiplier = 1.0;
    let buffApplied = false;

    // Determine if buff applies based on card type
    switch (effect.type) {
        case 'xp_boost':
            // Global XP boost
            xpMultiplier = effect.xpMultiplier || 1.0;
            goldMultiplier = effect.goldMultiplier || 1.0;
            buffApplied = true;
            break;

        case 'gold_boost':
            // Global gold boost
            xpMultiplier = effect.xpMultiplier || 1.0;
            goldMultiplier = effect.goldMultiplier || 1.0;
            buffApplied = true;
            break;

        case 'category_boost':
            // Category-specific boost
            if (questCategory && effect.category === questCategory) {
                xpMultiplier = effect.xpMultiplier || 1.0;
                goldMultiplier = effect.goldMultiplier || 1.0;
                buffApplied = true;
            }
            break;

        case 'mixed':
            // Mixed effects (e.g., double XP, half gold)
            xpMultiplier = effect.xpMultiplier || 1.0;
            goldMultiplier = effect.goldMultiplier || 1.0;
            buffApplied = true;
            break;
    }

    return {
        xp: Math.floor(baseXp * xpMultiplier),
        gold: Math.floor(baseGold * goldMultiplier),
        buffApplied,
        buffMessage: buffApplied ? `${activeCard.symbol} ${activeCard.name}: ${effect.message} ` : undefined
    };
}

/**
 * Get a summary of the active tarot buff for display
 */
export function getActiveTarotBuff(): { card: TarotCard; message: string } | null {
    const activeCard = getTodaysCard();
    if (!activeCard) return null;

    return {
        card: activeCard,
        message: `${activeCard.symbol} ${activeCard.name} is active: ${activeCard.effect.message} `
    };
}
