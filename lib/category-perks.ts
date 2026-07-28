/**
 * Category Gameplay Integration Service
 * 
 * Translates completed habits per category (Might, Knowledge, Honor, Castle, Craft, Vitality, Wellness, Exploration)
 * into tangible mechanical gameplay bonuses.
 */

export interface CategoryPerkSummary {
    mightBonus: number;        // Damage / dungeon efficiency %
    knowledgeBonus: number;    // Labyrinth focus point discount %
    honorTaxBonus: number;     // Settlement tax harvest gold %
    craftYieldBonus: number;   // Blacksmith & herbalism yield %
}

/**
 * Calculate active category perks based on completed habit counts per category
 */
export function calculateCategoryPerks(categoryCounts: Record<string, number>): CategoryPerkSummary {
    const mightCount = (categoryCounts['might'] || 0) + (categoryCounts['vitality'] || 0);
    const knowledgeCount = (categoryCounts['knowledge'] || 0) + (categoryCounts['exploration'] || 0);
    const honorCount = (categoryCounts['honor'] || 0) + (categoryCounts['castle'] || 0);
    const craftCount = (categoryCounts['craft'] || 0) + (categoryCounts['wellness'] || 0);

    return {
        // +2% dungeon efficiency per Might/Vitality habit (max +50%)
        mightBonus: Math.min(50, mightCount * 2),

        // +1% Labyrinth focus discount per Knowledge/Exploration habit (max 40%)
        knowledgeBonus: Math.min(40, knowledgeCount * 1),

        // +3% Settlement tax gold yield per Honor/Castle habit (max +60%)
        honorTaxBonus: Math.min(60, honorCount * 3),

        // +2% Blacksmith & herbalism yield per Craft/Wellness habit (max +50%)
        craftYieldBonus: Math.min(50, craftCount * 2)
    };
}
