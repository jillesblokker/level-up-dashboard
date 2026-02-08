/**
 * Centralized API Types
 * 
 * This file contains TypeScript interfaces for all API request/response types.
 * Use these instead of `any` to get proper type safety.
 */

// =============================================================================
// User & Authentication
// =============================================================================

export interface User {
    id: string
    clerkId: string
    email?: string
    username?: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    createdAt: string
    updatedAt: string
}

// =============================================================================
// Character Stats
// =============================================================================

export interface CharacterStats {
    id: string
    userId: string
    gold: number
    experience: number
    level: number
    health: number
    maxHealth: number
    title?: string
    strength: number
    intelligence: number
    vitality: number
    charisma: number
    createdAt: string
    updatedAt: string
}

export interface CharacterStatsUpdate {
    gold?: number
    experience?: number
    level?: number
    health?: number
    strength?: number
    intelligence?: number
    vitality?: number
    charisma?: number
    title?: string
}

// =============================================================================
// Quests
// =============================================================================

export type QuestCategory = 'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality' | 'main' | 'side'
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'
export type QuestFrequency = 'daily' | 'weekly' | 'monthly' | 'once'

export interface Quest {
    id: string
    userId: string
    name: string
    title?: string
    description?: string
    category: QuestCategory
    difficulty: QuestDifficulty
    xpReward: number
    goldReward: number
    frequency?: QuestFrequency
    icon?: string
    senderId?: string // For social quests
    createdAt: string
    updatedAt: string
}

export interface QuestCompletion {
    id: string
    questId: string
    userId: string
    completed: boolean
    completedAt?: string
    createdAt: string
}

export interface QuestWithCompletion extends Quest {
    completed: boolean
    completionDate?: string
    isNew: boolean
    completionId?: string
}

export interface SmartQuestCompletionRequest {
    questId: string
    completed: boolean
    xpReward: number
    goldReward: number
}

export interface SmartQuestCompletionResponse {
    success: boolean
    message: string
    record?: QuestCompletion
    statsUpdated?: boolean
}

// =============================================================================
// Challenges
// =============================================================================

export type ChallengeCategory = 'strength' | 'wisdom' | 'discipline' | 'creativity' | 'social'

export interface Challenge {
    id: string
    userId: string
    name: string
    description?: string
    category: ChallengeCategory
    xpReward: number
    goldReward: number
    completed: boolean
    completedAt?: string
    streakCount: number
    lastCompletedDate?: string
    createdAt: string
    updatedAt: string
}

export interface ChallengeCompletionRequest {
    challengeId: string
    completed: boolean
}

// =============================================================================
// Milestones
// =============================================================================

export interface Milestone {
    id: string
    userId: string
    name: string
    description?: string
    category: string
    targetValue: number
    currentValue: number
    xpReward: number
    goldReward: number
    completed: boolean
    completedAt?: string
    createdAt: string
    updatedAt: string
}

// =============================================================================
// Achievements
// =============================================================================

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    rarity: AchievementRarity
    xpReward: number
    goldReward: number
    requirement: string
    category: string
}

export interface UserAchievement {
    id: string
    userId: string
    achievementId: string
    unlockedAt: string
    achievement?: Achievement
}

// =============================================================================
// Kingdom & Tiles
// =============================================================================

export type TileType = 'grass' | 'forest' | 'mountain' | 'water' | 'castle' | 'village' | 'farm' | 'mine'

export interface KingdomTile {
    id: string
    userId: string
    x: number
    y: number
    type: TileType
    level: number
    building?: string
    createdAt: string
    updatedAt: string
}

export interface TileInventory {
    id: string
    userId: string
    tileType: TileType
    quantity: number
}

// =============================================================================
// Social
// =============================================================================

export interface Friend {
    id: string
    userId: string
    friendId: string
    status: 'pending' | 'accepted' | 'blocked'
    createdAt: string
}

export interface Alliance {
    id: string
    name: string
    description?: string
    leaderId: string
    memberCount: number
    streakCount: number
    createdAt: string
}

export interface AllianceMember {
    id: string
    allianceId: string
    userId: string
    role: 'leader' | 'officer' | 'member'
    joinedAt: string
}

// =============================================================================
// Notifications
// =============================================================================

export type NotificationType =
    | 'quest_completed'
    | 'achievement_unlocked'
    | 'level_up'
    | 'friend_request'
    | 'alliance_invite'
    | 'reward_received'
    | 'system'

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
    read: boolean
    createdAt: string
}

// =============================================================================
// API Response Wrappers
// =============================================================================

export interface ApiSuccessResponse<T = unknown> {
    success: true
    data: T
    message?: string
}

export interface ApiErrorResponse {
    success: false
    error: string
    details?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================================================
// Kingdom Stats
// =============================================================================

export interface KingdomStatsData {
    period: string
    date: string
    quests: number
    challenges: number
    milestones: number
    experience: number
    gold: number
}

export interface KingdomStatsResponse {
    data: KingdomStatsData[]
    period: 'day' | 'week' | 'month' | 'year'
    startDate: string
    endDate: string
}

// =============================================================================
// Database Row Types (for Supabase)
// =============================================================================

export interface DbQuestRow {
    id: string
    user_id: string
    name: string
    title?: string
    description?: string
    category: string
    difficulty: string
    xp_reward: number
    gold_reward: number
    // Legacy field names (some tables may use these)
    xp?: number
    gold?: number
    frequency?: string
    icon?: string
    sender_id?: string
    created_at: string
    updated_at: string
}

export interface DbQuestCompletionRow {
    id: string
    quest_id: string
    user_id: string
    completed: boolean
    completed_at?: string
    created_at: string
}

export interface DbCharacterStatsRow {
    id: string
    user_id: string
    gold: number
    experience: number
    level: number
    health: number
    max_health: number
    title?: string
    strength: number
    intelligence: number
    vitality: number
    charisma: number
    created_at: string
    updated_at: string
}

// Helper function to convert snake_case DB rows to camelCase
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        result[camelKey] = value
    }
    return result
}
