"use client"

import { useState, useEffect } from "react"
import { Activity, Award, Bell, MessageCircleIcon as Message, Search, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavBar } from "@/components/nav-bar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Leaderboard } from "@/components/leaderboard"

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

const mockLeaderboardData = [
  {
    id: 1,
    name: "Sarah",
    avatar: "/avatars/01.png",
    xp: 1200,
    level: 5,
    topCategory: "Quests",
    recentAchievement: "Completed 10 quests"
  },
  {
    id: 2,
    name: "Michael",
    avatar: "/avatars/02.png",
    xp: 980,
    level: 4,
    topCategory: "Battles"
  },
  {
    id: 3,
    name: "Emma",
    avatar: "/avatars/03.png",
    xp: 850,
    level: 4,
    topCategory: "Exploration",
    recentAchievement: "Discovered 5 new areas"
  }
];

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState(friendsData)
  const [friendRequests, setFriendRequests] = useState(friendRequestsData)
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"weekly" | "monthly" | "all-time">("weekly")

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={undefined} />

      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Friends</h1>
            <p className="text-gray-300">Connect with friends and track progress together</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search friends..."
                className="pl-8 bg-gray-900 border-amber-800/20 text-white placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="bg-gray-900 border-amber-800/20">
                <TabsTrigger value="all" className="text-white">All Friends</TabsTrigger>
                <TabsTrigger value="online" className="text-white">Online</TabsTrigger>
                <TabsTrigger value="requests" className="relative text-white">
                  Friend Requests
                  {friendRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 h-5">
                      {friendRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <Card key={friend.id} className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                                <AvatarImage src={friend.avatar} alt={friend.name} />
                                <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base text-white">{friend.name}</CardTitle>
                                <CardDescription className="flex items-center text-gray-300">
                                  Level {friend.level}
                                  {friend.online && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-white border-amber-800/20">
                              {friend.online ? "Online" : `Last active: ${friend.lastActive}`}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-white">Recent Activity</div>
                              <p className="text-sm text-gray-300">{friend.recentActivity}</p>
                            </div>

                            <div>
                              <div className="text-sm font-medium text-white">Top Categories</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {friend.topCategories.map((category) => (
                                  <Badge key={category} variant="secondary" className="text-white bg-amber-900/20">
                                    {category}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-medium text-white">Notable Achievements</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {friend.achievements.map((achievement) => (
                                  <div
                                    key={achievement}
                                    className="text-xs px-2 py-0.5 rounded-full bg-amber-900/20 text-white flex items-center gap-1"
                                  >
                                    <Award className="h-3 w-3 text-amber-500" />
                                    {achievement}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <div className="flex gap-2 w-full">
                            <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20" size="sm">
                              <Message className="mr-1 h-4 w-4" />
                              Message
                            </Button>
                            <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20" size="sm">
                              <Activity className="mr-1 h-4 w-4" />
                              View Stats
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-900">
                        <UserPlus className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-white">No friends found</h3>
                      <p className="text-gray-300 mt-1">Try adjusting your search or add new friends</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="online" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFriends.filter((f) => f.online).length > 0 ? (
                    filteredFriends
                      .filter((f) => f.online)
                      .map((friend) => (
                        <Card key={friend.id} className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                                  <AvatarImage src={friend.avatar} alt={friend.name} />
                                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base text-white">{friend.name}</CardTitle>
                                  <CardDescription className="flex items-center text-gray-300">
                                    Level {friend.level}
                                    <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-white border-amber-800/20 bg-green-500">
                                Online
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm font-medium text-white">Recent Activity</div>
                                <p className="text-sm text-gray-300">{friend.recentActivity}</p>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-white">Top Categories</div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {friend.topCategories.map((category) => (
                                    <Badge key={category} variant="secondary" className="text-white bg-amber-900/20">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-white">Notable Achievements</div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {friend.achievements.map((achievement) => (
                                    <div
                                      key={achievement}
                                      className="text-xs px-2 py-0.5 rounded-full bg-amber-900/20 text-white flex items-center gap-1"
                                    >
                                      <Award className="h-3 w-3 text-amber-500" />
                                      {achievement}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2">
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20" size="sm">
                                <Message className="mr-1 h-4 w-4" />
                                Message
                              </Button>
                              <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20" size="sm">
                                <Activity className="mr-1 h-4 w-4" />
                                View Stats
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-900">
                        <UserPlus className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-white">No online friends</h3>
                      <p className="text-gray-300 mt-1">Check back later or invite more friends</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendRequests.length > 0 ? (
                    friendRequests.map((request) => (
                      <Card key={request.id} className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                                <AvatarImage src={request.avatar} alt={request.name} />
                                <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base text-white">{request.name}</CardTitle>
                                <CardDescription className="text-gray-300">Level {request.level}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-white border-amber-800/20">
                              {request.mutualFriends} mutual {request.mutualFriends === 1 ? "friend" : "friends"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-2">
                          <div className="flex gap-2 w-full">
                            <Button
                              variant="default"
                              className="w-full text-white border-amber-800/20 hover:bg-amber-900/20"
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-white border-amber-800/20 hover:bg-amber-900/20"
                              size="sm"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-900">
                        <Bell className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-white">No friend requests</h3>
                      <p className="text-gray-300 mt-1">
                        When someone sends you a request, it will appear here
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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

            <Leaderboard entries={mockLeaderboardData} timeframe="weekly" />
          </div>
        </div>
      </main>
    </div>
  )
}

