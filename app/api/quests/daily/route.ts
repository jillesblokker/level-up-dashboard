import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get today's date at midnight
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        // Fetch user's quests
        const { data: quests, error: questsError } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (questsError) {
            console.error('Error fetching quests:', questsError)
            return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
        }

        // Fetch today's completions
        const { data: completions, error: completionsError } = await supabase
            .from('quest_completion')
            .select('quest_id, completed_at')
            .eq('user_id', userId)
            .gte('completed_at', todayStr)

        if (completionsError) {
            console.error('Error fetching completions:', completionsError)
        }

        // Create a set of completed quest IDs for today
        const completedQuestIds = new Set(
            completions?.map(c => c.quest_id) || []
        )

        // Map quests with completion status
        const questsWithStatus = quests.map(quest => ({
            id: quest.id,
            name: quest.name,
            description: quest.description || '',
            category: quest.category || 'general',
            difficulty: quest.difficulty || 'medium',
            xpReward: quest.xp_reward || 50,
            goldReward: quest.gold_reward || 50,
            completed: completedQuestIds.has(quest.id)
        }))

        // Prioritize incomplete quests and limit to 5
        const incompleteQuests = questsWithStatus.filter(q => !q.completed)
        const completedQuests = questsWithStatus.filter(q => q.completed)

        const dailyQuests = [
            ...incompleteQuests.slice(0, 5),
            ...completedQuests.slice(0, Math.max(0, 5 - incompleteQuests.length))
        ]

        return NextResponse.json(dailyQuests)
    } catch (error) {
        console.error('Error in /api/quests/daily:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
