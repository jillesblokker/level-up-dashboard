import { getUserScopedItem, setUserScopedItem } from './user-scoped-storage';

export interface TarotCard {
    id: string;
    name: string;
    symbol: string; // Emoji or unicode symbol
    description: string;
    effect: {
        type: 'xp_boost' | 'gold_boost' | 'category_boost' | 'mixed';
        category?: string; // For category-specific boosts
        xpMultiplier?: number; // e.g., 1.5 = +50% XP
        goldMultiplier?: number; // e.g., 0.5 = -50% gold
        message: string; // Effect description for UI
    };
    rarity: 'common' | 'rare' | 'epic';
}

export const TAROT_DECK: TarotCard[] = [
    {
        id: 'the-warrior',
        name: 'The Warrior',
        symbol: '⚔️',
        description: 'The steel sings to you. Your arm strikes with the weight of legends.',
        effect: {
            type: 'category_boost',
            category: 'might',
            xpMultiplier: 2.0,
            goldMultiplier: 1.0,
            message: 'Double XP for Might quests'
        },
        rarity: 'rare'
    },
    {
        id: 'the-scholar',
        name: 'The Scholar',
        symbol: '📚',
        description: 'The ink of history is not yet dry. Your mind is the quill that writes the future.',
        effect: {
            type: 'category_boost',
            category: 'knowledge',
            xpMultiplier: 2.0,
            goldMultiplier: 1.0,
            message: 'Double XP for Knowledge quests'
        },
        rarity: 'rare'
    },
    {
        id: 'the-merchant',
        name: 'The Merchant',
        symbol: '💰',
        description: 'Fortune favors the bold, but wealth favors the shrewd. Your pockets shall not be empty today.',
        effect: {
            type: 'gold_boost',
            xpMultiplier: 1.0,
            goldMultiplier: 1.5,
            message: '+50% Gold from all quests'
        },
        rarity: 'common'
    },
    {
        id: 'the-sage',
        name: 'The Sage',
        symbol: '🔮',
        description: 'Time is a river, but for you, it flows faster. Wisdom seeks you out.',
        effect: {
            type: 'xp_boost',
            xpMultiplier: 1.5,
            goldMultiplier: 1.0,
            message: '+50% XP from all quests'
        },
        rarity: 'common'
    },
    {
        id: 'the-gambler',
        name: 'The Gambler',
        symbol: '🎲',
        description: 'The dice are cast. Fate smiles—or perhaps she smirks. Will you take the bet?',
        effect: {
            type: 'mixed',
            xpMultiplier: 2.0,
            goldMultiplier: 0.5,
            message: 'Double XP, Half Gold'
        },
        rarity: 'epic'
    },
    {
        id: 'the-noble',
        name: 'The Noble',
        symbol: '👑',
        description: 'Walk with your head high. The realm recognizes true nobility, and rewards it in kind.',
        effect: {
            type: 'category_boost',
            category: 'honor',
            xpMultiplier: 1.5,
            goldMultiplier: 1.5,
            message: '+50% XP and Gold for Honor quests'
        },
        rarity: 'epic'
    },
    {
        id: 'the-builder',
        name: 'The Builder',
        symbol: '🏰',
        description: 'Stone by stone, a legacy is forged. The foundations of your empire have never been stronger.',
        effect: {
            type: 'category_boost',
            category: 'castle',
            xpMultiplier: 1.5,
            goldMultiplier: 2.0,
            message: '+50% XP, Double Gold for Castle quests'
        },
        rarity: 'rare'
    },
    {
        id: 'the-artisan',
        name: 'The Artisan',
        symbol: '🔨',
        description: 'Your hands are guided by the masters of old. Every creation is a masterpiece waiting to be born.',
        effect: {
            type: 'category_boost',
            category: 'craft',
            xpMultiplier: 1.5,
            goldMultiplier: 1.5,
            message: '+50% XP and Gold for Craft quests'
        },
        rarity: 'rare'
    },
    {
        id: 'the-healer',
        name: 'The Healer',
        symbol: '💚',
        description: 'A gentle wind mends what is broken. Your spirit is renewed, ready to face the dawn.',
        effect: {
            type: 'category_boost',
            category: 'vitality',
            xpMultiplier: 1.5,
            goldMultiplier: 1.0,
            message: '+50% XP for Vitality quests'
        },
        rarity: 'common'
    },
    {
        id: 'the-wanderer',
        name: 'The Wanderer',
        symbol: '🗺️',
        description: 'The horizon is not a limit, but an invitation. The unknown whispers your name.',
        effect: {
            type: 'category_boost',
            category: 'exploration',
            xpMultiplier: 2.0,
            goldMultiplier: 1.0,
            message: 'Double XP for Exploration quests'
        },
        rarity: 'rare'
    }
];

// Get a random card from the deck
export function drawRandomCard(): TarotCard {
    // Weighted random based on rarity
    const weights = {
        common: 50,
        rare: 30,
        epic: 20
    };

    const totalWeight = weights.common + weights.rare + weights.epic;
    const random = Math.random() * totalWeight;

    let rarity: 'common' | 'rare' | 'epic';
    if (random < weights.common) {
        rarity = 'common';
    } else if (random < weights.common + weights.rare) {
        rarity = 'rare';
    } else {
        rarity = 'epic';
    }

    const cardsOfRarity = TAROT_DECK.filter(card => card.rarity === rarity);
    const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
    return cardsOfRarity[randomIndex] || TAROT_DECK[0] as TarotCard;
}

// Get today's date string for tracking
export function getTodayDateString(): string {
    const dateString = new Date().toISOString().split('T')[0];
    return dateString || new Date().toISOString().substring(0, 10);
}

// Check if a card was drawn today
export function hasDrawnCardToday(): boolean {
    if (typeof window === 'undefined') return false;
    const lastDrawDate = getUserScopedItem('tarot-last-draw-date');
    return lastDrawDate === getTodayDateString();
}

// Get today's active card
export function getTodaysCard(): TarotCard | null {
    if (typeof window === 'undefined') return null;
    const lastDrawDate = getUserScopedItem('tarot-last-draw-date');
    const cardData = getUserScopedItem('tarot-active-card');

    if (lastDrawDate === getTodayDateString() && cardData) {
        try {
            return JSON.parse(cardData);
        } catch {
            return null;
        }
    }
    return null;
}

// Save today's drawn card
export function saveTodaysCard(card: TarotCard): void {
    if (typeof window === 'undefined') return;
    setUserScopedItem('tarot-last-draw-date', getTodayDateString());
    setUserScopedItem('tarot-active-card', JSON.stringify(card));

    // Sync to server for secure reward verification
    fetch('/api/tarot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card })
    }).catch(err => console.error('[Tarot] Failed to sync to server:', err));
}
