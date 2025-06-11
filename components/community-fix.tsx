"use client"

import { useState, useEffect } from "react"
import {
  Award,
  Bell,
  Check,
  Clock,
  Coins,
  MessageCircle,
  Search,
  Shield,
  Sword,
  Trophy,
  Users,
  X,
  Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Leaderboard } from "@/components/leaderboard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageTransition } from "@/components/page-transition"
import Image from 'next/image'

// Sample leaderboard data
const leaderboardData = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=80&width=80",
    xp: 25000,
    level: 15,
    topCategory: "Strength",
    recentAchievement: "100 Push-ups Club",
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=80&width=80",
    xp: 23500,
    level: 18,
    topCategory: "Knowledge",
    recentAchievement: "Book Worm",
  },
  {
    id: 3,
    name: "Jessica Patel",
    avatar: "/placeholder.svg?height=80&width=80",
    xp: 22000,
    level: 12,
    topCategory: "Nutrition",
  },
  {
    id: 4,
    name: "David Wilson",
    avatar: "/placeholder.svg?height=80&width=80",
    xp: 21000,
    level: 20,
    topCategory: "Strength",
    recentAchievement: "Muscle-up Master",
  },
  {
    id: 5,
    name: "Emma Thompson",
    avatar: "/placeholder.svg?height=80&width=80",
    xp: 20500,
    level: 14,
    topCategory: "Recovery",
  },
]

// Sample data for friends
const friendsData = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 15,
    progress: 75,
    xp: 2250,
    nextLevelXp: 3000,
    topCategories: ["Strength", "Recovery"],
    achievements: ["Marathon Finisher", "Protein Goal Master"],
    lastActive: "2 hours ago",
    recentActivity: "Completed 10K run",
    online: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 18,
    progress: 40,
    xp: 1200,
    nextLevelXp: 3000,
    topCategories: ["Knowledge", "Productivity"],
    achievements: ["Book Worm", "Deep Work Master"],
    lastActive: "Just now",
    recentActivity: "Read 50 pages",
    online: true,
  },
  {
    id: 3,
    name: "Jessica Patel",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 12,
    progress: 60,
    xp: 1800,
    nextLevelXp: 3000,
    topCategories: ["Nutrition", "Condition"],
    achievements: ["Perfect Meals Week", "10K Steps Champion"],
    lastActive: "Yesterday",
    recentActivity: "Logged nutrition goals",
    online: false,
  },
  {
    id: 4,
    name: "David Wilson",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 20,
    progress: 90,
    xp: 2700,
    nextLevelXp: 3000,
    topCategories: ["Strength", "Knowledge"],
    achievements: ["Muscle-up Master", "Language Learner"],
    lastActive: "3 days ago",
    recentActivity: "Completed strength workout",
    online: false,
  },
]

// Sample friend requests
const friendRequestsData = [
  {
    id: 1,
    name: "Alex Roberts",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 8,
    mutualFriends: 3,
  },
  {
    id: 2,
    name: "Taylor Smith",
    avatar: "/placeholder.svg?height=80&width=80",
    level: 15,
    mutualFriends: 1,
  },
]

// Rival types
interface Rival {
  id: string
  name: string
  level: number
  avatar: string
  status: "active" | "pending" | "completed"
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  duration: number // in days
  startDate: string
  endDate: string
  rivalId: string
  rivalName: string
  progress: {
    user: number
    rival: number
  }
  rewards: {
    win: {
      xp: number
      gold: number
    }
    participate: {
      xp: number
      gold: number
    }
  }
  status: "active" | "won" | "lost" | "pending"
}

// Helper function for safe string fallback
function safeString(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

export function CommunityComponent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState(friendsData)
  const [friendRequests, setFriendRequests] = useState(friendRequestsData)
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"weekly" | "monthly" | "all-time">("weekly")
  const [goldBalance, setGoldBalance] = useState(1000)
  const [showNewChallengeDialog, setShowNewChallengeDialog] = useState(false)
  const [selectedRival, setSelectedRival] = useState<Rival | null>(null)
  const [newChallengeName, setNewChallengeName] = useState("")
  const [newChallengeCategory, setNewChallengeCategory] = useState("Might")
  const [newChallengeDuration, setNewChallengeDuration] = useState(7)
  const [activeTab, setActiveTab] = useState("allies")

  // Load gold balance from localStorage on component mount
  useEffect(() => {
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold, 10))
    }
  }, [])

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sample rivals data
  const [rivals, setRivals] = useState<Rival[]>([
    {
      id: "r1",
      name: "Sarah",
      level: 14,
      avatar: "/placeholder.svg?height=150&width=150",
      status: "active",
    },
    {
      id: "r2",
      name: "Michael",
      level: 10,
      avatar: "/placeholder.svg?height=150&width=150",
      status: "active",
    },
    {
      id: "r3",
      name: "Emma",
      level: 15,
      avatar: "/placeholder.svg?height=150&width=150",
      status: "pending",
    },
  ])

  // Sample challenges data
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "c1",
      title: "Push-up Challenge",
      description: "Who can do the most push-ups in a week?",
      category: "Might",
      duration: 7,
      startDate: "2025-03-10",
      endDate: "2025-03-17",
      rivalId: "r1",
      rivalName: "Sarah",
      progress: {
        user: 75,
        rival: 60,
      },
      rewards: {
        win: {
          xp: 200,
          gold: 100,
        },
        participate: {
          xp: 50,
          gold: 25,
        },
      },
      status: "active",
    },
    {
      id: "c2",
      title: "Reading Challenge",
      description: "Who can read the most pages in two weeks?",
      category: "Wisdom",
      duration: 14,
      startDate: "2025-03-01",
      endDate: "2025-03-15",
      rivalId: "r2",
      rivalName: "Michael",
      progress: {
        user: 100,
        rival: 85,
      },
      rewards: {
        win: {
          xp: 300,
          gold: 150,
        },
        participate: {
          xp: 75,
          gold: 40,
        },
      },
      status: "won",
    },
    {
      id: "c3",
      title: "Running Challenge",
      description: "Who can run the most kilometers in a month?",
      category: "Endurance",
      duration: 30,
      startDate: "2025-02-15",
      endDate: "2025-03-15",
      rivalId: "r1",
      rivalName: "Sarah",
      progress: {
        user: 90,
        rival: 95,
      },
      rewards: {
        win: {
          xp: 400,
          gold: 200,
        },
        participate: {
          xp: 100,
          gold: 50,
        },
      },
      status: "lost",
    },
  ])

  const handleAcceptRequest = (id: number) => {
    const request = friendRequests.find((req) => req.id === id)
    if (request) {
      // Add to friends
      setFriends([
        ...friends,
        {
          ...request,
          progress: 50,
          xp: 1500,
          nextLevelXp: 3000,
          topCategories: ["Strength", "Condition"],
          achievements: ["50 Pushups Club"],
          lastActive: "Just now",
          recentActivity: "Joined your friends list",
          online: true,
        },
      ])

      // Remove from requests
      setFriendRequests(friendRequests.filter((req) => req.id !== id))
    }
  }

  const handleDeclineRequest = (id: number) => {
    setFriendRequests(friendRequests.filter((req) => req.id !== id))

    toast({
      title: "Friend Request Declined",
      description: "The request has been removed.",
    })
  }

  // Function to open new challenge dialog
  const openNewChallengeDialog = (rival: Rival) => {
    setSelectedRival(rival)
    setShowNewChallengeDialog(true)
  }

  // Function to create a new challenge
  const createNewChallenge = () => {
    if (!selectedRival) return
    if (!newChallengeName.trim()) {
      toast({
        title: "Challenge Name Required",
        description: "Please enter a name for your challenge.",
        variant: "destructive",
      })
      return
    }

    // Create start and end dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + newChallengeDuration)

    // Create new challenge
    const newChallenge: Challenge = {
      id: `c${challenges.length + 1}`,
      title: newChallengeName,
      description: `A ${newChallengeDuration}-day challenge in ${newChallengeCategory}.`,
      category: newChallengeCategory,
      duration: newChallengeDuration,
      startDate: startDate?.toISOString().split("T")[0] || "",
      endDate: endDate?.toISOString().split("T")[0] || "",
      rivalId: selectedRival.id,
      rivalName: selectedRival.name,
      progress: {
        user: 0,
        rival: 0,
      },
      rewards: {
        win: {
          xp: newChallengeDuration * 20,
          gold: newChallengeDuration * 10,
        },
        participate: {
          xp: newChallengeDuration * 5,
          gold: newChallengeDuration * 3,
        },
      },
      status: "active",
    }

    // Add to challenges
    setChallenges((prev) => [newChallenge, ...prev])

    // Reset form and close dialog
    setNewChallengeName("")
    setNewChallengeCategory("Might")
    setNewChallengeDuration(7)
    setShowNewChallengeDialog(false)

    toast({
      title: "Challenge Created!",
      description: `You've challenged ${selectedRival.name} to a ${newChallengeDuration}-day ${newChallengeCategory} challenge.`,
    })
  }

  // Function to update challenge progress
  const updateChallengeProgress = (challengeId: string, progress: number) => {
    setChallenges((prev) =>
      prev.map((challenge) => {
        if (challenge.id === challengeId) {
          // Update user progress
          const updatedProgress = {
            ...challenge.progress,
            user: progress,
          }

          // Check if challenge is completed
          let updatedStatus = challenge.status
          if (progress >= 100 && challenge.progress.rival >= 100) {
            // Both completed - determine winner
            updatedStatus = updatedProgress.user > updatedProgress.rival ? "won" : "lost"

            // Award rewards
            const rewardXP = updatedStatus === "won" ? challenge.rewards.win.xp : challenge.rewards.participate.xp
            const rewardGold = updatedStatus === "won" ? challenge.rewards.win.gold : challenge.rewards.participate.gold

            // Add gold to balance
            setGoldBalance((prev) => prev + rewardGold)

            // Show completion toast
            toast({
              title: updatedStatus === "won" ? "Challenge Won!" : "Challenge Lost",
              description: (
                <div className="flex flex-col">
                  <span>
                    {updatedStatus === "won"
                      ? `You've defeated ${challenge.rivalName} in the ${challenge.title} challenge!`
                      : `${challenge.rivalName} has won the ${challenge.title} challenge.`}
                  </span>
                  <span className="flex items-center mt-1">
                    <Trophy className="h-4 w-4 mr-1 text-amber-500" /> +{rewardXP} XP
                  </span>
                  <span className="flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-yellow-500" /> +{rewardGold} Gold
                  </span>
                </div>
              ),
            })
          }

          return { ...challenge, progress: updatedProgress, status: updatedStatus }
        }
        return challenge
      }),
    )
  }

  // Function to accept a rival request
  const acceptRivalRequest = (rivalId: string) => {
    setRivals((prev) => prev.map((rival) => (rival.id === rivalId ? { ...rival, status: "active" } : rival)))

    toast({
      title: "Rival Request Accepted",
      description: "You can now challenge each other to competitions!",
    })
  }

  // Function to decline a rival request
  const declineRivalRequest = (rivalId: string) => {
    setRivals((prev) => prev.filter((rival) => rival.id !== rivalId))

    toast({
      title: "Rival Request Declined",
      description: "The request has been removed.",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageTransition>
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-serif">Community</h1>
              <p className="text-muted-foreground">Connect with allies and rivals to stay motivated</p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search community..."
                  className="pl-8 border-amber-800/20"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white">
                <Users className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full bg-amber-100/50 dark:bg-amber-900/20">
              <TabsTrigger
                value="allies"
                className="flex-1 data-[state=active]:bg-amber-200/50 dark:data-[state=active]:bg-amber-800/50"
              >
                <Users className="mr-2 h-4 w-4" />
                Allies
              </TabsTrigger>
              <TabsTrigger
                value="challenges"
                className="flex-1 data-[state=active]:bg-amber-200/50 dark:data-[state=active]:bg-amber-800/50"
              >
                <Sword className="mr-2 h-4 w-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger
                value="rivals"
                className="flex-1 data-[state=active]:bg-amber-200/50 dark:data-[state=active]:bg-amber-800/50"
              >
                <Shield className="mr-2 h-4 w-4" />
                Rivals
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="flex-1 data-[state=active]:bg-amber-200/50 dark:data-[state=active]:bg-amber-800/50 relative"
              >
                <Bell className="mr-2 h-4 w-4" />
                Requests
                {(friendRequests.length > 0 || rivals.filter((r) => r.status === "pending").length > 0) && (
                  <Badge className="ml-2 px-1.5 py-0.5 h-5 bg-red-500/20 text-red-300 border-red-800/20">
                    {friendRequests.length + rivals.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ALLIES TAB */}
            <TabsContent value="allies" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => (
                        <Card key={friend.id} className="medieval-card hover-scale">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-muted">
                                  <AvatarImage src={friend.avatar} alt={friend.name} />
                                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base font-serif">{friend.name}</CardTitle>
                                  <CardDescription className="flex items-center">
                                    Level {friend.level}
                                    {friend.online && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge className="text-amber-300 border-amber-800/20">
                                {friend.online ? "Online" : `Last active: ${friend.lastActive}`}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1 text-sm">
                                  <span>Level Progress</span>
                                  <span className="tabular-nums">
                                    {friend.xp} / {friend.nextLevelXp} XP
                                  </span>
                                </div>
                                <Progress value={friend.progress} className="h-2" />
                              </div>

                              <div className="space-y-1">
                                <div className="text-sm font-medium">Top Categories</div>
                                <div className="flex gap-2">
                                  {friend.topCategories.map((category) => (
                                    <Badge key={category} className="text-amber-300 border-amber-800/20">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium">Recent Activity</div>
                                <div className="text-sm text-muted-foreground">{friend.recentActivity}</div>
                              </div>

                              <div>
                                <div className="text-sm font-medium">Notable Achievements</div>
                                <div className="flex flex-wrap gap-2 mt-1">
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
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2">
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" className="w-full" size="sm">
                                <MessageCircle className="mr-1 h-4 w-4" />
                                Message
                              </Button>
                              <Button variant="outline" className="w-full" size="sm">
                                <Activity className="mr-1 h-4 w-4" />
                                View Stats
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-muted">
                          <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No allies found</h3>
                        <p className="text-muted-foreground mt-1">Try adjusting your search or add new allies</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaderboard Column */}
                <div className="space-y-4">
                  <Tabs
                    value={leaderboardTimeframe}
                    onValueChange={(v) => setLeaderboardTimeframe(v as typeof leaderboardTimeframe)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="weekly" className="flex-1">
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger value="monthly" className="flex-1">
                        Monthly
                      </TabsTrigger>
                      <TabsTrigger value="all-time" className="flex-1">
                        All Time
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Leaderboard entries={leaderboardData} timeframe={leaderboardTimeframe} />
                </div>
              </div>
            </TabsContent>

            {/* CHALLENGES TAB */}
            <TabsContent value="challenges" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-serif">Active Challenges</h2>
                <Button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                  onClick={() => {
                    const activeRival = rivals.find((r) => r.status === "active")
                    if (activeRival) {
                      openNewChallengeDialog(activeRival)
                    } else {
                      toast({
                        title: "No Active Rivals",
                        description: "You need to have active rivals to create challenges.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <Sword className="mr-2 h-4 w-4" />
                  New Challenge
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {challenges
                  .filter((challenge) => challenge.status === "active")
                  .map((challenge) => (
                    <Card key={challenge.id} className="medieval-card hover-scale">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="font-serif">{challenge.title}</CardTitle>
                          <Badge className="bg-blue-500">Active</Badge>
                        </div>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              alt="Your avatar"
                              className="w-10 h-10 rounded-full border-2 border-amber-500"
                              width={40}
                              height={40}
                            />
                            <div>
                              <p className="font-medium">You</p>
                              <Progress value={challenge.progress.user} className="h-2 w-20" />
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-medium">VS</p>
                            <p className="text-xs text-muted-foreground">
                              {challenge.progress.user > challenge.progress.rival ? "Leading" : "Trailing"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium">{challenge.rivalName}</p>
                              {(() => {
                                const foundRival = rivals.find((r) => r.id === challenge.rivalId);
                                return (
                                  <Progress value={challenge.progress.rival} className="h-2 w-20" />
                                );
                              })()}
                            </div>
                            {(() => {
                              const foundRival = rivals.find((r) => r.id === challenge.rivalId);
                              return (
                                <Image
                                  src={safeString(foundRival?.avatar)}
                                  alt={safeString(foundRival?.name)}
                                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                                  width={40}
                                  height={40}
                                />
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <Badge className="text-amber-300 border-amber-800/20">{challenge.category}</Badge>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Rewards:</h3>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span>Win: {challenge.rewards.win.xp} XP</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span>Win: {challenge.rewards.win.gold} Gold</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="w-full flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() =>
                              updateChallengeProgress(challenge.id, Math.min(100, challenge.progress.user + 25))
                            }
                          >
                            Update Progress
                          </Button>
                          <Button variant="outline" onClick={() => updateChallengeProgress(challenge.id, 100)}>
                            Complete
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}

                {challenges.filter((challenge) => challenge.status === "active").length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Sword className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Challenges</h3>
                    <p className="text-muted-foreground mb-4">Challenge a rival to compete and stay motivated!</p>
                    <Button
                      className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                      onClick={() => {
                        const activeRival = rivals.find((r) => r.status === "active")
                        if (activeRival) {
                          openNewChallengeDialog(activeRival)
                        } else {
                          toast({
                            title: "No Active Rivals",
                            description: "You need to have active rivals to create challenges.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Start a Challenge
                    </Button>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold font-serif mt-8">Completed Challenges</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {challenges
                  .filter((challenge) => challenge.status === "won" || challenge.status === "lost")
                  .map((challenge) => (
                    <Card
                      key={challenge.id}
                      className={`medieval-card hover-scale ${challenge.status === "won" ? "border-green-500" : "border-red-500"}`}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="font-serif">{challenge.title}</CardTitle>
                          <Badge className="ml-2 px-1.5 py-0.5 h-5 bg-red-500/20 text-red-300 border-red-800/20">
                            {challenge.status === "won" ? "Won" : "Lost"}
                          </Badge>
                        </div>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              alt="Your avatar"
                              className="w-10 h-10 rounded-full border-2 border-amber-500"
                              width={40}
                              height={40}
                            />
                            <div>
                              <p className="font-medium">You</p>
                              <Progress value={challenge.progress.user} className="h-2 w-20" />
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-medium">VS</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium">{challenge.rivalName}</p>
                              {(() => {
                                const foundRival = rivals.find((r) => r.id === challenge.rivalId);
                                return (
                                  <Progress value={challenge.progress.rival} className="h-2 w-20" />
                                );
                              })()}
                            </div>
                            {(() => {
                              const foundRival = rivals.find((r) => r.id === challenge.rivalId);
                              return (
                                <Image
                                  src={safeString(foundRival?.avatar)}
                                  alt={safeString(foundRival?.name)}
                                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                                  width={40}
                                  height={40}
                                />
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <Badge className="text-amber-300 border-amber-800/20">{challenge.category}</Badge>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Ended: {new Date(challenge.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            const foundRival = rivals.find((r) => r.id === challenge.rivalId);
                            if (foundRival) {
                              openNewChallengeDialog(foundRival);
                            } else if (rivals[0]) {
                              openNewChallengeDialog(rivals[0]);
                            }
                          }}
                        >
                          Challenge Again
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}

                {challenges.filter((challenge) => challenge.status === "won" || challenge.status === "lost").length ===
                  0 && (
                  <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Trophy className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Completed Challenges</h3>
                    <p className="text-muted-foreground">Complete challenges to see your history here.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* RIVALS TAB */}
            <TabsContent value="rivals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-serif">My Rivals</h2>
                <Button
                  variant="outline"
                  className="border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Find New Rivals
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rivals
                  .filter((rival) => rival.status === "active")
                  .map((rival) => (
                    <Card key={rival.id} className="medieval-card hover-scale">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Image
                            src={safeString(rival?.avatar)}
                            alt={safeString(rival?.name)}
                            className="w-16 h-16 rounded-full border-2 border-amber-500"
                            width={64}
                            height={64}
                          />
                          <div>
                            <CardTitle className="font-serif">{rival.name}</CardTitle>
                            <CardDescription>Level {rival.level}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Win Rate</span>
                            <span>
                              {challenges.filter((c) => c.rivalId === rival.id && c.status === "won").length} /
                              {
                                challenges.filter(
                                  (c) => c.rivalId === rival.id && (c.status === "won" || c.status === "lost"),
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Challenges</span>
                            <span>
                              {challenges.filter((c) => c.rivalId === rival.id && c.status === "active").length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                          onClick={() => openNewChallengeDialog(rival)}
                        >
                          Challenge
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}

                {rivals.filter((rival) => rival.status === "active").length === 0 && (
                  <div className="col-span-full text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Users className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Rivals Yet</h3>
                    <p className="text-muted-foreground mb-4">Add rivals to challenge them and stay motivated!</p>
                    <Button
                      variant="outline"
                      className="border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                    >
                      Find Rivals
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* REQUESTS TAB */}
            <TabsContent value="requests" className="space-y-4">
              <Tabs defaultValue="friend-requests" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="friend-requests" className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Friend Requests
                    {friendRequests.length > 0 && (
                      <Badge className="ml-2 px-1.5 py-0.5 h-5 bg-red-500/20 text-red-300 border-red-800/20">
                        {friendRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="rival-requests" className="flex-1">
                    <Sword className="mr-2 h-4 w-4" />
                    Rival Requests
                    {rivals.filter((r) => r.status === "pending").length > 0 && (
                      <Badge className="ml-2 px-1.5 py-0.5 h-5 bg-red-500/20 text-red-300 border-red-800/20">
                        {rivals.filter((r) => r.status === "pending").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="friend-requests" className="mt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    {friendRequests.length > 0 ? (
                      friendRequests.map((request) => (
                        <Card key={request.id} className="medieval-card hover-scale">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-muted">
                                  <AvatarImage src={request.avatar} alt={request.name} />
                                  <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base font-serif">{request.name}</CardTitle>
                                  <CardDescription>Level {request.level}</CardDescription>
                                </div>
                              </div>
                              <Badge className="text-amber-300 border-amber-800/20">
                                {request.mutualFriends} mutual {request.mutualFriends === 1 ? "friend" : "friends"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="default"
                                className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                                size="sm"
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                                size="sm"
                                onClick={() => handleDeclineRequest(request.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Decline
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Bell className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Friend Requests</h3>
                        <p className="text-muted-foreground mt-1">
                          When someone sends you a request, it will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="rival-requests" className="mt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    {rivals.filter((r) => r.status === "pending").length > 0 ? (
                      rivals
                        .filter((r) => r.status === "pending")
                        .map((rival) => (
                          <Card key={rival.id} className="medieval-card hover-scale">
                            <CardHeader>
                              <div className="flex items-center gap-4">
                                <Image
                                  src={safeString(rival.avatar)}
                                  alt={safeString(rival.name)}
                                  className="w-16 h-16 rounded-full border-2 border-amber-500"
                                  width={64}
                                  height={64}
                                />
                                <div>
                                  <CardTitle className="font-serif">{rival.name}</CardTitle>
                                  <CardDescription>Level {rival.level}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {rival.name} wants to be your rival and challenge you to competitions!
                              </p>
                            </CardContent>
                            <CardFooter>
                              <div className="w-full flex gap-2">
                                <Button
                                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                                  onClick={() => acceptRivalRequest(rival.id)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                                  onClick={() => declineRivalRequest(rival.id)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Decline
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Shield className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Rival Requests</h3>
                        <p className="text-muted-foreground">You don&apos;t have any rival requests at the moment.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>

      {/* New Challenge Dialog */}
      <Dialog open={showNewChallengeDialog} onOpenChange={setShowNewChallengeDialog}>
        <DialogContent className="sm:max-w-md border-2 border-amber-800/20">
          <DialogHeader>
            <DialogTitle className="font-serif">New Challenge</DialogTitle>
            <DialogDescription>
              {selectedRival && `Challenge ${selectedRival.name} to a competition!`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="challenge-name" className="text-sm font-medium">
                  Challenge Name
                </label>
                <Input
                  id="challenge-name"
                  placeholder="e.g., Push-up Challenge"
                  value={newChallengeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChallengeName(e.target.value)}
                  className="border-amber-800/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="challenge-category" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="challenge-category"
                  className="w-full px-3 py-2 border border-amber-800/20 rounded-md bg-background"
                  value={newChallengeCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewChallengeCategory(e.target.value)}
                >
                  <option value="Might">Might</option>
                  <option value="Endurance">Endurance</option>
                  <option value="Wisdom">Wisdom</option>
                  <option value="Vitality">Vitality</option>
                  <option value="Resilience">Resilience</option>
                  <option value="Dexterity">Dexterity</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="challenge-duration" className="text-sm font-medium">
                  Duration (days)
                </label>
                <select
                  id="challenge-duration"
                  className="w-full px-3 py-2 border border-amber-800/20 rounded-md bg-background"
                  value={newChallengeDuration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewChallengeDuration(Number.parseInt(e.target.value))}
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Rewards:</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>Win: {newChallengeDuration * 20} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>Win: {newChallengeDuration * 10} Gold</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewChallengeDialog(false)}
              className="border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
              onClick={createNewChallenge}
            >
              Create Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

