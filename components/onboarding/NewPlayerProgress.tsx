"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Trophy, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserPreference } from '@/lib/user-preferences-manager'
import Link from 'next/link'

interface ProgressItem {
    id: string
    label: string
    completed: boolean
    href?: string
}

export function NewPlayerProgress() {
    const [items, setItems] = useState<ProgressItem[]>([
        { id: 'create_quest', label: 'Create your first quest', completed: false, href: '/quests' },
        { id: 'complete_quest', label: 'Complete your first quest', completed: false, href: '/quests' },
        { id: 'visit_realm', label: 'Visit the realm', completed: false, href: '/realm' },
        { id: 'visit_town', label: 'Visit your first town', completed: false, href: '/town/greenhaven' },
        { id: 'build_property', label: 'Build your first property on the kingdom map', completed: false, href: '/kingdom' },
        { id: 'add_ally', label: 'Add an ally', completed: false, href: '/social' },
        { id: 'create_challenge', label: 'Create your first challenge', completed: false, href: '/challenges' },
        { id: 'finish_challenge', label: 'Finish your first challenge', completed: false, href: '/challenges' },
        { id: 'create_milestone', label: 'Create your first milestone', completed: false, href: '/challenges' },
        { id: 'finish_milestone', label: 'Finish your first milestone', completed: false, href: '/challenges' },
    ])
    const [isVisible, setIsVisible] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        loadProgress()
    }, [])

    const loadProgress = async () => {
        try {
            // 1. Check preferences
            const realmPref = await getUserPreference('onboarding_realm_visited')
            const townPref = await getUserPreference('onboarding_town_visited')

            // 2. Check Quests
            const questsRes = await fetch('/api/quests')
            let questCreated = false
            let questCompleted = false
            if (questsRes.ok) {
                const quests = await questsRes.json()
                questCreated = quests.length > 0
                questCompleted = quests.some((q: any) => q.completed)
            }

            // 3. Kingdom Properties
            const kingdomRes = await fetch('/api/kingdom-grid')
            let propertyBuilt = false
            if (kingdomRes.ok) {
                const data = await kingdomRes.json()
                // Handle both grid array directly or { grid: ... } response format
                const grid = Array.isArray(data) ? data : (data.grid || [])
                if (Array.isArray(grid)) {
                    propertyBuilt = grid.some((row: any[]) => row.some(cell => cell && cell.type && cell.type !== 'empty'))
                }
            }

            // 4. Allies
            const friendsRes = await fetch('/api/friends')
            let allyAdded = false
            if (friendsRes.ok) {
                const data = await friendsRes.json()
                // Check for accepted friends or pending requests (sent or received count as interaction)
                allyAdded = (data.friends && data.friends.length > 0) || (data.requests && data.requests.length > 0)
            }

            // 5. Challenges
            const challengesRes = await fetch('/api/challenges')
            let challengeCreated = false
            let challengeFinished = false
            if (challengesRes.ok) {
                const data = await challengesRes.json()
                const list = Array.isArray(data) ? data : (data.data || data.challenges || [])
                challengeCreated = list.length > 0
                challengeFinished = list.some((c: any) => c.completed)
            }

            // 6. Milestones
            // Assuming milestones are fetched via separate endpoint or filtered from challenges/quests
            // If /api/milestones exists:
            let milestoneCreated = false
            let milestoneFinished = false
            try {
                const milestonesRes = await fetch('/api/milestones')
                if (milestonesRes.ok) {
                    const milestones = await milestonesRes.json()
                    milestoneCreated = milestones.length > 0
                    milestoneFinished = milestones.some((m: any) => m.completed)
                }
            } catch (e) {
                console.warn('Milestones API check failed', e)
            }

            const updatedItems = [
                { id: 'create_quest', label: 'Create your first quest', completed: questCreated, href: '/quests' },
                { id: 'complete_quest', label: 'Complete your first quest', completed: questCompleted, href: '/quests' },
                { id: 'visit_realm', label: 'Visit the realm', completed: !!realmPref, href: '/realm' },
                { id: 'visit_town', label: 'Visit your first town', completed: !!townPref, href: '/town/greenhaven' },
                { id: 'build_property', label: 'Build your first property on the kingdom map', completed: propertyBuilt, href: '/kingdom' },
                { id: 'add_ally', label: 'Add an ally', completed: allyAdded, href: '/social' },
                { id: 'create_challenge', label: 'Create your first challenge', completed: challengeCreated, href: '/challenges' },
                { id: 'finish_challenge', label: 'Finish your first challenge', completed: challengeFinished, href: '/challenges' },
                { id: 'create_milestone', label: 'Create your first milestone', completed: milestoneCreated, href: '/challenges' },
                { id: 'finish_milestone', label: 'Finish your first milestone', completed: milestoneFinished, href: '/challenges' },
            ]

            setItems(updatedItems)

            // Only show if not all are completed
            const allDone = updatedItems.every(item => item.completed)
            setIsVisible(!allDone)
            setIsLoaded(true)
        } catch (error) {
            console.error('Failed to load player progress:', error)
            setIsLoaded(true)
        }
    }

    if (!isLoaded || !isVisible) return null

    const completedCount = items.filter(i => i.completed).length
    const progressPercent = (completedCount / items.length) * 100

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
        >
            <Card className="bg-black/60 border-amber-500/30 backdrop-blur-md shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold text-amber-500 flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            New Hero Journey
                        </CardTitle>
                        <span className="text-xs font-medium text-amber-200/50 uppercase tracking-widest">
                            {completedCount} / {items.length} Tasks
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-amber-950/50 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                {item.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-amber-500/30" />
                                )}
                                <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-amber-100'}`}>
                                    {item.label}
                                </span>
                            </div>

                            {!item.completed && item.href && (
                                <Link href={item.href}>
                                    <motion.button
                                        whileHover={{ x: 3 }}
                                        className="p-1 rounded-full hover:bg-amber-500/10 text-amber-500/50 hover:text-amber-500 transition-colors"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </Link>
                            )}
                        </div>
                    ))}

                    {completedCount === items.length && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-xs text-green-400/70 font-medium pt-2"
                        >
                            Journey complete! You are ready for adventure.
                        </motion.p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
