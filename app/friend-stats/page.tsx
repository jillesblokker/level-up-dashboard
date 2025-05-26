"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Award, Calendar, Activity, BarChart, LineChart, PieChart, Trophy, User, Book } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface FriendData {
  id: number
  name: string
  avatar: string
  level: number
  xp: number
  nextLevelXp: number
  progress: number
  topCategories: string[]
  achievements: string[]
  stats: {
    strength: number
    endurance: number
    knowledge: number
    nutrition: number
    recovery: number
  }
  activityHistory: {
    date: string
    value: number
  }[]
  categoryBreakdown: {
    category: string
    percentage: number
  }[]
  recentActivities: {
    activity: string
    date: string
    xp: number
  }[]
}

export default function FriendStatsPage() {
  const searchParams = useSearchParams()
  const friendId = searchParams?.get("id") || "1"
  const [friend, setFriend] = useState<FriendData | null>(null)
  const [goldBalance, setGoldBalance] = useState(1000)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sampleFriends = {
      "1": {
        id: 1,
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=80&width=80",
        level: 15,
        xp: 2250,
        nextLevelXp: 3000,
        progress: 75,
        topCategories: ["Strength", "Recovery"],
        achievements: ["Marathon Finisher", "Protein Goal Master", "Early Riser", "Book Worm"],
        stats: {
          strength: 85,
          endurance: 70,
          knowledge: 60,
          nutrition: 75,
          recovery: 80,
        },
        activityHistory: [
          { date: "2025-03-10", value: 65 },
          { date: "2025-03-11", value: 70 },
          { date: "2025-03-12", value: 85 },
          { date: "2025-03-13", value: 75 },
          { date: "2025-03-14", value: 90 },
          { date: "2025-03-15", value: 80 },
          { date: "2025-03-16", value: 85 },
        ],
        categoryBreakdown: [
          { category: "Strength", percentage: 35 },
          { category: "Endurance", percentage: 20 },
          { category: "Knowledge", percentage: 15 },
          { category: "Nutrition", percentage: 15 },
          { category: "Recovery", percentage: 15 },
        ],
        recentActivities: [
          { activity: "Completed 10K run", date: "2025-03-16", xp: 150 },
          { activity: "Read 50 pages", date: "2025-03-15", xp: 75 },
          { activity: "Strength workout", date: "2025-03-14", xp: 100 },
          { activity: "Meal prep for the week", date: "2025-03-13", xp: 80 },
          { activity: "8 hours of sleep tracked", date: "2025-03-12", xp: 50 },
        ],
      },
      "2": {
        id: 2,
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=80&width=80",
        level: 18,
        xp: 1200,
        nextLevelXp: 3000,
        progress: 40,
        topCategories: ["Knowledge", "Productivity"],
        achievements: ["Book Worm", "Deep Work Master", "Language Learner", "Meditation Guru"],
        stats: {
          strength: 60,
          endurance: 65,
          knowledge: 90,
          nutrition: 70,
          recovery: 75,
        },
        activityHistory: [
          { date: "2025-03-10", value: 80 },
          { date: "2025-03-11", value: 85 },
          { date: "2025-03-12", value: 75 },
          { date: "2025-03-13", value: 90 },
          { date: "2025-03-14", value: 85 },
          { date: "2025-03-15", value: 70 },
          { date: "2025-03-16", value: 80 },
        ],
        categoryBreakdown: [
          { category: "Strength", percentage: 15 },
          { category: "Endurance", percentage: 15 },
          { category: "Knowledge", percentage: 40 },
          { category: "Nutrition", percentage: 15 },
          { category: "Recovery", percentage: 15 },
        ],
        recentActivities: [
          { activity: "Read 100 pages", date: "2025-03-16", xp: 120 },
          { activity: "Completed coding project", date: "2025-03-15", xp: 150 },
          { activity: "30 min meditation", date: "2025-03-14", xp: 60 },
          { activity: "Language practice", date: "2025-03-13", xp: 80 },
          { activity: "Deep work session", date: "2025-03-12", xp: 100 },
        ],
      },
    }

    setTimeout(() => {
      setFriend(sampleFriends[friendId as keyof typeof sampleFriends] || sampleFriends["1"])
      setLoading(false)
    }, 500)

    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }
  }, [friendId])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <NavBar goldBalance={1000} session={undefined} />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading friend stats...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!friend) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <NavBar goldBalance={1000} session={undefined} />
        <main className="flex-1 p-4 md:p-6">
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-medium mb-2">Friend Not Found</h3>
            <p className="text-muted-foreground mb-4">The friend you're looking for doesn't exist.</p>
            <Link href="/community">
              <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white">
                Return to Community
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar goldBalance={1000} session={undefined} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">{friend.name}'s Stats</h1>
            <p className="text-muted-foreground">View detailed statistics and progress</p>
          </div>
          <Link href="/community">
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Community
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="font-serif">Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-amber-500">
                  <AvatarImage src={friend.avatar} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{friend.name}</h3>
                  <p className="text-sm text-muted-foreground">Level {friend.level}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Level Progress</span>
                  <span className="tabular-nums">
                    {friend.xp} / {friend.nextLevelXp} XP
                  </span>
                </div>
                <Progress value={friend.progress} className="h-2" />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {friend.topCategories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notable Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {friend.achievements.map((achievement) => (
                    <div
                      key={achievement}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted flex items-center gap-1"
                    >
                      <Award className="h-3 w-3 text-yellow-500" />
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Stats Area */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">
                  <Activity className="mr-2 h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  <LineChart className="mr-2 h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex-1">
                  <PieChart className="mr-2 h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Stat Breakdown</CardTitle>
                    <CardDescription>Key performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Strength</span>
                          <span>{friend.stats.strength}/100</span>
                        </div>
                        <Progress value={friend.stats.strength} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Endurance</span>
                          <span>{friend.stats.endurance}/100</span>
                        </div>
                        <Progress value={friend.stats.endurance} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Knowledge</span>
                          <span>{friend.stats.knowledge}/100</span>
                        </div>
                        <Progress value={friend.stats.knowledge} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Nutrition</span>
                          <span>{friend.stats.nutrition}/100</span>
                        </div>
                        <Progress value={friend.stats.nutrition} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Recovery</span>
                          <span>{friend.stats.recovery}/100</span>
                        </div>
                        <Progress value={friend.stats.recovery} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Recent Activities</CardTitle>
                    <CardDescription>Latest logged activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {friend.recentActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center border-b border-gray-800 pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">{activity.activity}</p>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                          <Badge className="bg-amber-500/80">
                            <Trophy className="mr-1 h-3 w-3" />
                            {activity.xp} XP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-4">
                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Weekly Activity</CardTitle>
                    <CardDescription>Activity level over the past 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between">
                      {friend.activityHistory.map((day, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-10 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md"
                            style={{ height: `${day.value * 2}px` }}
                          ></div>
                          <p className="text-xs mt-2">{day.date.split("-")[2]}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Activity Streaks</CardTitle>
                    <CardDescription>Consecutive days of activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-amber-500">7</div>
                        <p className="text-sm text-muted-foreground mt-2">Day Streak</p>
                      </div>
                      <div className="mx-8 h-16 border-r border-gray-800"></div>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-amber-500">21</div>
                        <p className="text-sm text-muted-foreground mt-2">Longest Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="mt-4 space-y-4">
                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Category Breakdown</CardTitle>
                    <CardDescription>Distribution of activity across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {friend.categoryBreakdown.map((category) => (
                        <div key={category.category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category.category}</span>
                            <span>{category.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                category.category === "Strength"
                                  ? "bg-red-500"
                                  : category.category === "Endurance"
                                    ? "bg-blue-500"
                                    : category.category === "Knowledge"
                                      ? "bg-purple-500"
                                      : category.category === "Nutrition"
                                        ? "bg-green-500"
                                        : "bg-yellow-500"
                              }`}
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="font-serif">Category Achievements</CardTitle>
                    <CardDescription>Milestones reached in each category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-red-500/20 rounded-full">
                            <BarChart className="h-5 w-5 text-red-500" />
                          </div>
                          <h4 className="font-medium">Strength</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Level 8</p>
                        <p className="text-xs mt-1">3 achievements unlocked</p>
                      </div>

                      <div className="p-4 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-blue-500/20 rounded-full">
                            <Activity className="h-5 w-5 text-blue-500" />
                          </div>
                          <h4 className="font-medium">Endurance</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Level 7</p>
                        <p className="text-xs mt-1">2 achievements unlocked</p>
                      </div>

                      <div className="p-4 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-purple-500/20 rounded-full">
                            <Book className="h-5 w-5 text-purple-500" />
                          </div>
                          <h4 className="font-medium">Knowledge</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Level 9</p>
                        <p className="text-xs mt-1">4 achievements unlocked</p>
                      </div>

                      <div className="p-4 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-green-500/20 rounded-full">
                            <Calendar className="h-5 w-5 text-green-500" />
                          </div>
                          <h4 className="font-medium">Nutrition</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Level 6</p>
                        <p className="text-xs mt-1">2 achievements unlocked</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

