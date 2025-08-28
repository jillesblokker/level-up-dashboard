"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'

interface ProgressData {
  today: {
    completed: number
    total: number
    xp: number
    gold: number
  }
  week: {
    completed: number
    total: number
    xp: number
    gold: number
    dailyBreakdown: Array<{ day: string; count: number }>
  }
  streak: number
  achievements: Array<{ name: string; description: string; unlocked: boolean }>
}

export function ProgressDashboard() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'weekly' | 'achievements'>('overview')
  const { userId, isLoaded, getToken } = useAuth()

  const fetchProgressData = useCallback(async () => {
    if (!userId || !isLoaded) return

    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      // Fetch progress data from multiple endpoints
      const [questsRes, challengesRes, milestonesRes] = await Promise.all([
        fetch(`/api/kingdom-stats-v2?tab=quests&period=week&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/kingdom-stats-v2?tab=challenges&period=week&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/kingdom-stats-v2?tab=milestones&period=week&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const [questsData, challengesData, milestonesData] = await Promise.all([
        questsRes.json(),
        challengesRes.json(),
        milestonesRes.json()
      ])

      // Process the data into a clean progress structure
      const today = new Date().toISOString().slice(0, 10)
      const weekData = questsData.data || []
      
      const todayData = weekData.find((d: any) => d.day === today) || { day: today, value: 0 }
      const weekTotal = weekData.reduce((sum: number, d: any) => sum + d.value, 0)
      
      const progress: ProgressData = {
        today: {
          completed: todayData.value || 0,
          total: 5, // Default daily goal
          xp: (todayData.value || 0) * 50, // 50 XP per quest
          gold: (todayData.value || 0) * 25 // 25 gold per quest
        },
        week: {
          completed: weekTotal,
          total: 35, // Weekly goal (5 per day * 7 days)
          xp: weekTotal * 50,
          gold: weekTotal * 25,
          dailyBreakdown: weekData.map((d: any) => ({
            day: new Date(d.day).toLocaleDateString('en-US', { weekday: 'short' }),
            count: d.value
          }))
        },
        streak: 3, // This would come from streaks API
        achievements: [
          { name: "First Steps", description: "Complete your first quest", unlocked: true },
          { name: "Week Warrior", description: "Complete 5 quests in a week", unlocked: weekTotal >= 5 },
          { name: "Streak Master", description: "Maintain a 7-day streak", unlocked: false },
          { name: "Gold Collector", description: "Earn 1000 gold in a week", unlocked: false }
        ]
      }

      setProgressData(progress)
    } catch (error) {
      console.error('Error fetching progress data:', error)
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, isLoaded, getToken])

  useEffect(() => {
    if (userId && isLoaded) {
      fetchProgressData()
    }
  }, [userId, isLoaded, fetchProgressData])

  if (!progressData) {
    return (
      <Card className="bg-black border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            {isLoading ? (
              <div className="flex items-center gap-2 text-amber-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading progress...
              </div>
            ) : (
              <div className="text-gray-400">No progress data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const todayProgress = (progressData.today.completed / progressData.today.total) * 100
  const weekProgress = (progressData.week.completed / progressData.week.total) * 100

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-amber-500 text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Progress Dashboard
            </CardTitle>
            <CardDescription className="text-gray-300">
              Track your quest completion progress and achievements
            </CardDescription>
          </div>
          <Button
            onClick={fetchProgressData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-amber-800 text-amber-500 hover:bg-amber-800/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-black border border-amber-800/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-800 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-amber-800 data-[state=active]:text-white">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-amber-800 data-[state=active]:text-white">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-amber-800 data-[state=active]:text-white">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Today's Progress */}
            <Card className="bg-black/50 border-amber-800/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today&apos;s Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Quest Progress</span>
                  <span className="text-amber-400 font-bold">
                    {progressData.today.completed}/{progressData.today.total}
                  </span>
                </div>
                <Progress value={todayProgress} className="h-3 bg-amber-800/20">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500" 
                       style={{ width: `${todayProgress}%` }} />
                </Progress>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-amber-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{progressData.today.xp}</div>
                    <div className="text-sm text-gray-300">XP Earned</div>
                  </div>
                  <div className="text-center p-3 bg-amber-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{progressData.today.gold}</div>
                    <div className="text-sm text-gray-300">Gold Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak & Weekly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-black/50 border-amber-800/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-amber-400">{progressData.streak}</div>
                  <div className="text-sm text-gray-300">Day Streak</div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-amber-800/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-amber-400">{progressData.week.completed}</div>
                  <div className="text-sm text-gray-300">This Week</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Daily Tab */}
          <TabsContent value="daily" className="space-y-4">
            <Card className="bg-black/50 border-amber-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-amber-400">Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progressData.week.dailyBreakdown.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-800/10 rounded-lg">
                      <span className="text-gray-300 font-medium">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{day.count}</span>
                        {day.count > 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Tab */}
          <TabsContent value="weekly" className="space-y-4">
            <Card className="bg-black/50 border-amber-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-amber-400">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Weekly Goal</span>
                  <span className="text-amber-400 font-bold">
                    {progressData.week.completed}/{progressData.week.total}
                  </span>
                </div>
                <Progress value={weekProgress} className="h-3 bg-amber-800/20">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500" 
                       style={{ width: `${weekProgress}%` }} />
                </Progress>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-amber-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{progressData.week.xp}</div>
                    <div className="text-sm text-gray-300">Total XP</div>
                  </div>
                  <div className="text-center p-3 bg-amber-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{progressData.week.gold}</div>
                    <div className="text-sm text-gray-300">Total Gold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressData.achievements.map((achievement, index) => (
                <Card 
                  key={index} 
                  className={`border transition-all duration-300 ${
                    achievement.unlocked 
                      ? 'bg-amber-800/20 border-amber-500' 
                      : 'bg-black/50 border-amber-800/30'
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-3">
                      {achievement.unlocked ? (
                        <Award className="w-8 h-8 text-amber-400" />
                      ) : (
                        <Target className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div className={`font-bold mb-1 ${
                      achievement.unlocked ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {achievement.name}
                    </div>
                    <div className={`text-sm ${
                      achievement.unlocked ? 'text-amber-300' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </div>
                    {achievement.unlocked && (
                      <Badge className="mt-2 bg-amber-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 