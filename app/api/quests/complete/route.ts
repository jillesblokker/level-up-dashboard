import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { questId } = body

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 })
        }

        // Get the quest details
        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .eq('user_id', userId)
            .single()

        if (questError || !quest) {
            console.error('Error fetching quest:', questError)
            return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
        }

        // Check if already completed today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        const { data: existingCompletion } = await supabase
            .from('quest_completion')
            .select('id')
            .eq('quest_id', questId)
            .eq('user_id', userId)
            .gte('completed_at', todayStr)
            .single()

        if (existingCompletion) {
            return NextResponse.json({
                message: 'Quest already completed today',
                alreadyCompleted: true
            })
        }

        // Mark quest as complete
        const { error: completionError } = await supabase
            .from('quest_completion')
            .insert({
                quest_id: questId,
                user_id: userId,
                completed_at: new Date().toISOString()
            })

        if (completionError) {
            console.error('Error marking quest complete:', completionError)
            return NextResponse.json({ error: 'Failed to complete quest' }, { status: 500 })
        }

        // Determine rewards based on difficulty
        const difficultyRewards: Record<string, { xp: number; gold: number }> = {
            easy: { xp: 25, gold: 25 },
            medium: { xp: 50, gold: 50 },
            hard: { xp: 100, gold: 100 }
        }

        const rewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 }

        // Update character stats
        const { data: currentStats, error: statsError } = await supabase
            .from('character_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (statsError && statsError.code !== 'PGRST116') {
            console.error('Error fetching character stats:', statsError)
        }

        const currentLevel = currentStats?.level || 1
        const currentXP = currentStats?.experience || 0
        const currentGold = currentStats?.gold || 0
        const xpToNextLevel = currentStats?.experience_to_next_level || 100

        const newXP = currentXP + rewards.xp
        const newGold = currentGold + rewards.gold

        // Check for level up
        let newLevel = currentLevel
        let remainingXP = newXP
        let newXPToNextLevel = xpToNextLevel

        if (newXP >= xpToNextLevel) {
            newLevel = currentLevel + 1
            remainingXP = newXP - xpToNextLevel
            newXPToNextLevel = Math.floor(xpToNextLevel * 1.5) // 50% increase per level
        }

        // Update stats
        const { error: updateError } = await supabase
            .from('character_stats')
            .upsert({
                user_id: userId,
                level: newLevel,
                experience: remainingXP,
                experience_to_next_level: newXPToNextLevel,
                gold: newGold,
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            console.error('Error updating character stats:', updateError)
            return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
        }

        // Update streak
        const { data: streakData } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', userId)
            .single()

        const lastCompletionDate = streakData?.last_completion_date
        const currentStreak = streakData?.current_streak || 0

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)

        let newStreak = currentStreak

        if (!lastCompletionDate) {
            newStreak = 1
        } else {
            const lastDate = new Date(lastCompletionDate)
            lastDate.setHours(0, 0, 0, 0)

            if (lastDate.getTime() === yesterday.getTime()) {
                newStreak = currentStreak + 1
            } else if (lastDate.getTime() < yesterday.getTime()) {
                newStreak = 1 // Reset streak
            }
            // If same day, keep current streak
        }

        await supabase
            .from('streaks')
            .upsert({
                user_id: userId,
                current_streak: newStreak,
                last_completion_date: todayStr,
                updated_at: new Date().toISOString()
            })

        return NextResponse.json({
            success: true,
            rewards,
            levelUp: newLevel > currentLevel,
            newLevel,
            newXP: remainingXP,
            newGold,
            newStreak
        })
    } catch (error) {
        console.error('Error in /api/quests/complete:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
