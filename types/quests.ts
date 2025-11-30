// Quest-related types
export interface Quest {
    id: string
    name: string
    description: string
    category: string
    difficulty: string
    xp: number
    gold: number
    completed?: boolean
    isNew?: boolean
}

export interface NewQuestForm {
    name: string
    description: string
    category: string
    difficulty: string
    xp: number
    gold: number
}

// Challenge-related types
export interface Challenge {
    id: string
    name: string
    description: string
    category: string
    reps?: string
    sets?: string
    duration?: string
    distance?: string
    tips?: string
    weight?: string
    completed?: boolean
}

export interface NewChallengeForm {
    name: string
    description: string
    category: string
    reps: string
    sets: string
    duration: string
    distance: string
    tips: string
    weight: string
}

// Milestone-related types
export interface Milestone {
    id: string
    name: string
    description: string
    category: string
    difficulty: string
    xp: number
    gold: number
    target: number
    unit: string
    completed?: boolean
}

export interface NewMilestoneForm {
    name: string
    description: string
    category: string
    difficulty: string
    xp: number
    gold: number
    target: number
    unit: string
}

// Quest categories
export type QuestCategory =
    | 'might'
    | 'mind'
    | 'spirit'
    | 'craft'
    | 'social'
    | 'recovery'

// Difficulty levels
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
