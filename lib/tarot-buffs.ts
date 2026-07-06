import { getTodaysCard, TarotCard } from './tarot-data';
import { getUserScopedItem } from './user-scoped-storage';

export interface BuffedRewards {
    xp: number;
    gold: number;
    buffApplied: boolean;
    buffMessage?: string | undefined;
}

/**
 * Apply tarot card buffs to quest rewards scaled by current streak
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

    // Retrieve active streak to scale the buff
    let streak = 0;
    try {
        const stored = getUserScopedItem('character-stats');
        if (stored) {
            const stats = JSON.parse(stored);
            streak = stats.streakDays || stats.streak_days || 0;
        }
    } catch (e) {
        // Fallback to 0
    }

    const scaleBonusMultiplier = (val: number, currentStreak: number) => {
        if (val > 1.0) {
            // +2% card potency per streak day
            return 1.0 + (val - 1.0) * (1.0 + currentStreak * 0.02);
        }
        if (val < 1.0) {
            // Mitigate penalty as streak grows
            return 1.0 - (1.0 - val) * (1.0 / (1.0 + currentStreak * 0.02));
        }
        return 1.0;
    };

    const effect = activeCard.effect;
    let xpMultiplier = 1.0;
    let goldMultiplier = 1.0;
    let buffApplied = false;

    // Determine if buff applies based on card type
    switch (effect.type) {
        case 'xp_boost':
            xpMultiplier = scaleBonusMultiplier(effect.xpMultiplier || 1.0, streak);
            goldMultiplier = scaleBonusMultiplier(effect.goldMultiplier || 1.0, streak);
            buffApplied = true;
            break;

        case 'gold_boost':
            xpMultiplier = scaleBonusMultiplier(effect.xpMultiplier || 1.0, streak);
            goldMultiplier = scaleBonusMultiplier(effect.goldMultiplier || 1.0, streak);
            buffApplied = true;
            break;

        case 'category_boost':
            if (questCategory && effect.category === questCategory) {
                xpMultiplier = scaleBonusMultiplier(effect.xpMultiplier || 1.0, streak);
                goldMultiplier = scaleBonusMultiplier(effect.goldMultiplier || 1.0, streak);
                buffApplied = true;
            }
            break;

        case 'mixed':
            xpMultiplier = scaleBonusMultiplier(effect.xpMultiplier || 1.0, streak);
            goldMultiplier = scaleBonusMultiplier(effect.goldMultiplier || 1.0, streak);
            buffApplied = true;
            break;
    }

    const finalXp = Math.floor(baseXp * xpMultiplier);
    const finalGold = Math.floor(baseGold * goldMultiplier);

    let displayMessage = effect.message;
    if (buffApplied && streak > 0) {
        displayMessage = `${effect.message} (Scaled +${streak * 2}% by Day ${streak} Streak)`;
    }

    return {
        xp: finalXp,
        gold: finalGold,
        buffApplied,
        buffMessage: buffApplied ? `${activeCard.symbol} ${activeCard.name}: ${displayMessage}` : undefined
    };
}

/**
 * Get a summary of the active tarot buff for display
 */
export function getActiveTarotBuff(): { card: TarotCard; message: string } | null {
    const activeCard = getTodaysCard();
    if (!activeCard) return null;

    let streak = 0;
    try {
        const stored = getUserScopedItem('character-stats');
        if (stored) {
            const stats = JSON.parse(stored);
            streak = stats.streakDays || stats.streak_days || 0;
        }
    } catch (e) {
        // Fallback to 0
    }

    let displayMessage = activeCard.effect.message;
    if (streak > 0) {
        displayMessage = `${activeCard.effect.message} (Scaled +${streak * 2}% by Day ${streak} Streak)`;
    }

    return {
        card: activeCard,
        message: `${activeCard.symbol} ${activeCard.name} is active: ${displayMessage}`
    };
}
