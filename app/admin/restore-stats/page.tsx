"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function RestoreStatsPage() {
    const [level, setLevel] = useState('')
    const [experience, setExperience] = useState('')
    const [gold, setGold] = useState('')
    const { toast } = useToast()

    const handleRestore = async () => {
        try {
            const response = await fetch('/api/character-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stats: {
                        level: parseInt(level) || 1,
                        experience: parseInt(experience) || 0,
                        gold: parseInt(gold) || 0,
                        health: 100,
                        max_health: 100,
                        build_tokens: 0,
                        kingdom_expansions: 0
                    }
                })
            })

            if (response.ok) {
                toast({
                    title: "Stats Restored",
                    description: `Level ${level}, XP ${experience}, Gold ${gold}`,
                })

                // Reload to fetch fresh stats
                setTimeout(() => window.location.reload(), 1000)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to restore stats",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to restore stats",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Restore Character Stats</CardTitle>
                    <CardDescription>
                        Manually restore your character stats if they were lost
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="level">Level</Label>
                        <Input
                            id="level"
                            type="number"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            placeholder="17"
                        />
                    </div>
                    <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Input
                            id="experience"
                            type="number"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="Enter your XP"
                        />
                    </div>
                    <div>
                        <Label htmlFor="gold">Gold</Label>
                        <Input
                            id="gold"
                            type="number"
                            value={gold}
                            onChange={(e) => setGold(e.target.value)}
                            placeholder="Enter your gold"
                        />
                    </div>
                    <Button onClick={handleRestore}>Restore Stats</Button>
                </CardContent>
            </Card>
        </div>
    )
}
