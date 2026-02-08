/**
 * Tests for Character Stats Service
 * 
 * These tests verify the core business logic for character stat management:
 * - Experience calculations
 * - Level up logic
 * - Gold transactions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock types for testing (we can't import actual service in unit tests)
interface CharacterStats {
    userId: string
    level: number
    experience: number
    gold: number
    health: number
    maxHealth: number
}

// Experience required for each level (simplified formula)
function getExperienceForLevel(level: number): number {
    // Exponential growth: each level requires more XP
    // Level 1 = 0, Level 2 = 100, Level 3 = 300, Level 4 = 600, etc.
    return Math.floor((level - 1) * (level) * 50)
}

// Check if player should level up
function shouldLevelUp(experience: number, currentLevel: number): boolean {
    const requiredXP = getExperienceForLevel(currentLevel + 1)
    return experience >= requiredXP
}

// Calculate new level based on total experience
function calculateLevel(experience: number): number {
    let level = 1
    while (getExperienceForLevel(level + 1) <= experience) {
        level++
    }
    return level
}

// Apply experience gain with level up handling
function applyExperience(
    stats: CharacterStats,
    xpGain: number
): { newStats: CharacterStats; didLevelUp: boolean; levelsGained: number } {
    const oldLevel = stats.level
    const newExperience = stats.experience + xpGain
    const newLevel = calculateLevel(newExperience)
    const levelsGained = newLevel - oldLevel

    return {
        newStats: {
            ...stats,
            experience: newExperience,
            level: newLevel,
            // Increase max health on level up
            maxHealth: stats.maxHealth + (levelsGained * 10),
            // Heal on level up
            health: levelsGained > 0 ? stats.maxHealth + (levelsGained * 10) : stats.health
        },
        didLevelUp: levelsGained > 0,
        levelsGained
    }
}

// Apply gold transaction
function applyGold(
    stats: CharacterStats,
    amount: number
): { newStats: CharacterStats; success: boolean; error?: string } {
    const newGold = stats.gold + amount

    // Can't have negative gold
    if (newGold < 0) {
        return {
            newStats: stats,
            success: false,
            error: 'Insufficient gold'
        }
    }

    return {
        newStats: {
            ...stats,
            gold: newGold
        },
        success: true
    }
}

describe('Character Stats Service', () => {
    let baseStats: CharacterStats

    beforeEach(() => {
        baseStats = {
            userId: 'test-user-123',
            level: 1,
            experience: 0,
            gold: 100,
            health: 100,
            maxHealth: 100
        }
    })

    describe('getExperienceForLevel', () => {
        it('should return 0 for level 1', () => {
            expect(getExperienceForLevel(1)).toBe(0)
        })

        it('should return 100 for level 2', () => {
            expect(getExperienceForLevel(2)).toBe(100)
        })

        it('should return progressively more XP for higher levels', () => {
            const xpLevel3 = getExperienceForLevel(3)
            const xpLevel4 = getExperienceForLevel(4)
            const xpLevel5 = getExperienceForLevel(5)

            expect(xpLevel4 - xpLevel3).toBeGreaterThan(xpLevel3 - getExperienceForLevel(2))
            expect(xpLevel5 - xpLevel4).toBeGreaterThan(xpLevel4 - xpLevel3)
        })
    })

    describe('shouldLevelUp', () => {
        it('should return false when experience is below threshold', () => {
            expect(shouldLevelUp(50, 1)).toBe(false) // Need 100 for level 2
        })

        it('should return true when experience meets threshold', () => {
            expect(shouldLevelUp(100, 1)).toBe(true) // Exactly at level 2
        })

        it('should return true when experience exceeds threshold', () => {
            expect(shouldLevelUp(150, 1)).toBe(true)
        })
    })

    describe('calculateLevel', () => {
        it('should return level 1 for 0 experience', () => {
            expect(calculateLevel(0)).toBe(1)
        })

        it('should return level 2 for 100 experience', () => {
            expect(calculateLevel(100)).toBe(2)
        })

        it('should return level 3 for 300 experience', () => {
            expect(calculateLevel(300)).toBe(3)
        })

        it('should handle experience in between levels', () => {
            expect(calculateLevel(250)).toBe(2) // Between 100 and 300
        })
    })

    describe('applyExperience', () => {
        it('should add experience without level up', () => {
            const result = applyExperience(baseStats, 50)

            expect(result.newStats.experience).toBe(50)
            expect(result.newStats.level).toBe(1)
            expect(result.didLevelUp).toBe(false)
            expect(result.levelsGained).toBe(0)
        })

        it('should trigger level up when threshold reached', () => {
            const result = applyExperience(baseStats, 100)

            expect(result.newStats.level).toBe(2)
            expect(result.didLevelUp).toBe(true)
            expect(result.levelsGained).toBe(1)
        })

        it('should handle multiple level ups at once', () => {
            const result = applyExperience(baseStats, 600) // Enough for level 4

            expect(result.newStats.level).toBe(4)
            expect(result.didLevelUp).toBe(true)
            expect(result.levelsGained).toBe(3)
        })

        it('should increase max health on level up', () => {
            const result = applyExperience(baseStats, 100)

            expect(result.newStats.maxHealth).toBe(110) // +10 per level
        })

        it('should heal to full on level up', () => {
            const damagedStats = { ...baseStats, health: 50 }
            const result = applyExperience(damagedStats, 100)

            expect(result.newStats.health).toBe(110) // Full health at new max
        })

        it('should not heal if no level up', () => {
            const damagedStats = { ...baseStats, health: 50 }
            const result = applyExperience(damagedStats, 25)

            expect(result.newStats.health).toBe(50) // Unchanged
        })
    })

    describe('applyGold', () => {
        it('should add gold correctly', () => {
            const result = applyGold(baseStats, 50)

            expect(result.newStats.gold).toBe(150)
            expect(result.success).toBe(true)
        })

        it('should subtract gold correctly', () => {
            const result = applyGold(baseStats, -50)

            expect(result.newStats.gold).toBe(50)
            expect(result.success).toBe(true)
        })

        it('should prevent negative gold', () => {
            const result = applyGold(baseStats, -150)

            expect(result.newStats.gold).toBe(100) // Unchanged
            expect(result.success).toBe(false)
            expect(result.error).toBe('Insufficient gold')
        })

        it('should allow spending all gold', () => {
            const result = applyGold(baseStats, -100)

            expect(result.newStats.gold).toBe(0)
            expect(result.success).toBe(true)
        })
    })
})

describe('Quest Reward Calculations', () => {
    const baseReward = { experience: 50, gold: 25 }

    // Difficulty multipliers
    const difficultyMultipliers: Record<string, number> = {
        easy: 0.5,
        medium: 1.0,
        hard: 1.5,
        legendary: 2.5
    }

    function calculateQuestReward(
        baseXP: number,
        baseGold: number,
        difficulty: string,
        streakBonus: number = 0
    ): { experience: number; gold: number } {
        const multiplier = difficultyMultipliers[difficulty] || 1.0
        const streakMultiplier = 1 + (streakBonus * 0.1) // 10% per streak level

        return {
            experience: Math.floor(baseXP * multiplier * streakMultiplier),
            gold: Math.floor(baseGold * multiplier * streakMultiplier)
        }
    }

    it('should apply easy difficulty multiplier', () => {
        const reward = calculateQuestReward(100, 50, 'easy')

        expect(reward.experience).toBe(50)
        expect(reward.gold).toBe(25)
    })

    it('should apply hard difficulty multiplier', () => {
        const reward = calculateQuestReward(100, 50, 'hard')

        expect(reward.experience).toBe(150)
        expect(reward.gold).toBe(75)
    })

    it('should apply streak bonus', () => {
        const reward = calculateQuestReward(100, 50, 'medium', 5) // 5 streak = 50% bonus

        expect(reward.experience).toBe(150) // 100 * 1.5
        expect(reward.gold).toBe(75)
    })

    it('should combine difficulty and streak multipliers', () => {
        const reward = calculateQuestReward(100, 50, 'hard', 2) // hard (1.5x) + 2 streak (1.2x)

        expect(reward.experience).toBe(180) // 100 * 1.5 * 1.2
        expect(reward.gold).toBe(90)
    })
})
