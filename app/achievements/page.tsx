"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ReplayabilityManager, Achievement } from "@/lib/replayability"
import { Trophy, Star, Calendar, Target } from "lucide-react"

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [showAllDiscovered, setShowAllDiscovered] = useState(false)

  useEffect(() => {
    // Load initial data
    const loadAchievements = () => {
      const items = ReplayabilityManager.getInstance().getAchievements()
      setAchievements(items)
    }

    loadAchievements()

    // Listen for achievement updates
    const handleAchievementUpdate = () => loadAchievements()
    window.addEventListener("achievement-update", handleAchievementUpdate)

    return () => {
      window.removeEventListener("achievement-update", handleAchievementUpdate)
    }
  }, [])

  // If toggled, pretend all achievements are discovered
  const displayAchievements = showAllDiscovered
    ? achievements.map(a => ({ ...a, isUnlocked: true }))
    : achievements;
  const filteredAchievements = displayAchievements.filter(achievement => {
    if (activeTab === "all") return true
    if (activeTab === "unlocked") return achievement.isUnlocked
    if (activeTab === "locked") return !achievement.isUnlocked
    return achievement.category === activeTab
  })

  const calculateProgress = (achievement: Achievement) => {
    if (!achievement.requirements || achievement.requirements.length === 0) return 100
    const total = achievement.requirements.length
    const completed = achievement.requirements.filter(req => req.current >= req.count).length
    return Math.round((completed / total) * 100)
  }

  return (
    <main className="container mx-auto p-6" aria-label="achievements-section">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <button
          className="px-4 py-2 rounded bg-amber-500 text-black font-semibold shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={showAllDiscovered ? "Show only real discovered achievements" : "Show all achievements as discovered"}
          onClick={() => setShowAllDiscovered(v => !v)}
        >
          {showAllDiscovered ? "Show Real Progress" : "Show All Discovered"}
        </button>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4" aria-label="achievements-tabs">
          <TabsTrigger value="all">All Achievements</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ScrollArea className="h-[600px] rounded-md border p-4" aria-label="achievements-scroll-area">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} aria-label={`achievement-${achievement.id}-card`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{achievement.title}</CardTitle>
                      <Badge 
                        variant={achievement.isUnlocked ? "default" : "secondary"}
                        aria-label={`achievement-${achievement.id}-status`}
                      >
                        {achievement.isUnlocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4" />
                            <span>{achievement.points} points</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{achievement.category}</span>
                          </div>
                          {achievement.isUnlocked && achievement.unlockDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(achievement.unlockDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!achievement.isUnlocked && achievement.requirements && achievement.requirements.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{calculateProgress(achievement)}%</span>
                          </div>
                          <Progress value={calculateProgress(achievement)} className="h-2" />
                          <div className="text-sm text-muted-foreground">
                            {achievement.requirements.map((req) => (
                              <div key={req.type} className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{req.type}: {req.current}/{req.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unlocked" className="mt-6">
          <ScrollArea className="h-[600px] rounded-md border p-4" aria-label="unlocked-achievements-scroll-area">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} aria-label={`unlocked-${achievement.id}-card`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{achievement.title}</CardTitle>
                      <Badge variant="default" aria-label={`unlocked-${achievement.id}-status`}>
                        Unlocked
                      </Badge>
                    </div>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>{achievement.points} points</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>{achievement.category}</span>
                        </div>
                        {achievement.unlockDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(achievement.unlockDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          <ScrollArea className="h-[600px] rounded-md border p-4" aria-label="locked-achievements-scroll-area">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} aria-label={`locked-${achievement.id}-card`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{achievement.title}</CardTitle>
                      <Badge variant="secondary" aria-label={`locked-${achievement.id}-status`}>
                        Locked
                      </Badge>
                    </div>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4" />
                            <span>{achievement.points} points</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{achievement.category}</span>
                          </div>
                        </div>
                      </div>
                      {achievement.requirements && achievement.requirements.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{calculateProgress(achievement)}%</span>
                          </div>
                          <Progress value={calculateProgress(achievement)} className="h-2" />
                          <div className="text-sm text-muted-foreground">
                            {achievement.requirements.map((req) => (
                              <div key={req.type} className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{req.type}: {req.current}/{req.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <ScrollArea className="h-[600px] rounded-md border p-4" aria-label="categories-scroll-area">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from(new Set(achievements.map(a => a.category))).map((category) => (
                <Card key={category} aria-label={`category-${category}-card`}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>
                      {achievements.filter(a => a.category === category).length} achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>
                            {achievements.filter(a => a.category === category && a.isUnlocked).length} unlocked
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>
                            {achievements
                              .filter(a => a.category === category && a.isUnlocked)
                              .reduce((sum, a) => sum + a.points, 0)} points
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </main>
  )
}