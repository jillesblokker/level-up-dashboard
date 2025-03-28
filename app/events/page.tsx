"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Award, Calendar, Coins, Flame, Gift, Trophy } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { toast } from "@/components/ui/use-toast"

// Event types
interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  progress: number
  rewards: {
    xp: number
    gold: number
    items?: string[]
    title?: string
  }
  challenges: {
    id: string
    title: string
    description: string
    completed: boolean
    rewards: {
      xp: number
      gold: number
    }
  }[]
  isActive: boolean
}

export default function EventsPage() {
  const [goldBalance, setGoldBalance] = useState(1000)

  // Load gold balance from localStorage on component mount
  useEffect(() => {
    const savedGold = localStorage.getItem("levelup-gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold, 10))
    }
  }, [])

  // Current date for checking active events
  const currentDate = new Date()

  // Sample events data
  const [events, setEvents] = useState<Event[]>([
    {
      id: "e1",
      title: "Winter Trials",
      description: "Brave the cold and complete winter-themed challenges to earn exclusive rewards.",
      startDate: "2025-01-01",
      endDate: "2025-03-21",
      progress: 60,
      rewards: {
        xp: 500,
        gold: 250,
        items: ["Winter Warrior Armor", "Frost Resistance Potion"],
        title: "Winter Champion",
      },
      challenges: [
        {
          id: "c1",
          title: "Cold Endurance",
          description: "Complete 10 outdoor workouts during winter.",
          completed: true,
          rewards: {
            xp: 100,
            gold: 50,
          },
        },
        {
          id: "c2",
          title: "Frost Resistance",
          description: "Maintain a 7-day streak during the coldest week.",
          completed: true,
          rewards: {
            xp: 150,
            gold: 75,
          },
        },
        {
          id: "c3",
          title: "Ice Warrior",
          description: "Complete a 5K run in sub-freezing temperatures.",
          completed: false,
          rewards: {
            xp: 200,
            gold: 100,
          },
        },
      ],
      isActive: true,
    },
    {
      id: "e2",
      title: "Spring Renewal",
      description: "Embrace the season of growth with challenges that renew your body and mind.",
      startDate: "2025-03-22",
      endDate: "2025-06-21",
      progress: 0,
      rewards: {
        xp: 500,
        gold: 250,
        items: ["Spring Bloom Garb", "Growth Elixir"],
        title: "Spring Harbinger",
      },
      challenges: [
        {
          id: "c4",
          title: "New Beginnings",
          description: "Start a new fitness routine and maintain it for 14 days.",
          completed: false,
          rewards: {
            xp: 100,
            gold: 50,
          },
        },
        {
          id: "c5",
          title: "Growth Mindset",
          description: "Learn a new skill or read a new book.",
          completed: false,
          rewards: {
            xp: 150,
            gold: 75,
          },
        },
        {
          id: "c6",
          title: "Bloom",
          description: "Increase your personal record in any exercise by 10%.",
          completed: false,
          rewards: {
            xp: 200,
            gold: 100,
          },
        },
      ],
      isActive: false,
    },
    {
      id: "e3",
      title: "Summer Challenge",
      description: "Make the most of the sunny days with these summer-themed challenges.",
      startDate: "2025-06-22",
      endDate: "2025-09-22",
      progress: 0,
      rewards: {
        xp: 500,
        gold: 250,
        items: ["Sun Warrior Armor", "Heat Resistance Potion"],
        title: "Summer Champion",
      },
      challenges: [
        {
          id: "c7",
          title: "Beach Body",
          description: "Complete 20 strength workouts during summer.",
          completed: false,
          rewards: {
            xp: 100,
            gold: 50,
          },
        },
        {
          id: "c8",
          title: "Water Warrior",
          description: "Swim a total of 5km during the season.",
          completed: false,
          rewards: {
            xp: 150,
            gold: 75,
          },
        },
        {
          id: "c9",
          title: "Sun Salutation",
          description: "Complete 15 outdoor yoga sessions.",
          completed: false,
          rewards: {
            xp: 200,
            gold: 100,
          },
        },
      ],
      isActive: false,
    },
  ])

  // Function to complete a challenge
  const completeChallenge = (eventId: string, challengeId: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          // Update the challenge
          const updatedChallenges = event.challenges.map((challenge) => {
            if (challenge.id === challengeId) {
              // If already completed, do nothing
              if (challenge.completed) return challenge

              // Add rewards to gold balance
              setGoldBalance((prev) => prev + challenge.rewards.gold)

              // Show completion toast
              toast({
                title: "Challenge Completed!",
                description: (
                  <div className="flex flex-col">
                    <span>You've completed: {challenge.title}</span>
                    <span className="flex items-center mt-1">
                      <Trophy className="h-4 w-4 mr-1 text-amber-500" /> +{challenge.rewards.xp} XP
                    </span>
                    <span className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-500" /> +{challenge.rewards.gold} Gold
                    </span>
                  </div>
                ),
              })

              return { ...challenge, completed: true }
            }
            return challenge
          })

          // Calculate new progress
          const totalChallenges = event.challenges.length
          const completedChallenges = updatedChallenges.filter((c) => c.completed).length
          const newProgress = Math.round((completedChallenges / totalChallenges) * 100)

          // Check if event is now completed
          if (newProgress === 100 && event.progress < 100) {
            // Add event rewards to gold balance
            setGoldBalance((prev) => prev + event.rewards.gold)

            // Show event completion toast
            toast({
              title: "Event Completed!",
              description: (
                <div className="flex flex-col">
                  <span>You've completed the {event.title} event!</span>
                  <span className="flex items-center mt-1">
                    <Trophy className="h-4 w-4 mr-1 text-amber-500" /> +{event.rewards.xp} XP
                  </span>
                  <span className="flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-yellow-500" /> +{event.rewards.gold} Gold
                  </span>
                  {event.rewards.items && (
                    <span className="flex items-center">
                      <Gift className="h-4 w-4 mr-1 text-purple-500" /> Items: {event.rewards.items.join(", ")}
                    </span>
                  )}
                  {event.rewards.title && (
                    <span className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-blue-500" /> Title: {event.rewards.title}
                    </span>
                  )}
                </div>
              ),
            })
          }

          return { ...event, challenges: updatedChallenges, progress: newProgress }
        }
        return event
      }),
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Seasonal Events</h1>
            <p className="text-muted-foreground">Complete special challenges to earn exclusive rewards</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Active Events */}
          <div>
            <h2 className="text-xl font-bold mb-4 font-serif">Active Events</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {events
                .filter((event) => event.isActive)
                .map((event) => (
                  <Card key={event.id} className="medieval-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-serif">{event.title}</CardTitle>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Event Progress</span>
                          <span>{event.progress}%</span>
                        </div>
                        <Progress value={event.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Starts: {new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Ends: {new Date(event.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Challenges:</h3>
                        <div className="space-y-2">
                          {event.challenges.map((challenge) => (
                            <div
                              key={challenge.id}
                              className={`p-3 rounded-md border ${challenge.completed ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800"}`}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{challenge.title}</h4>
                                {challenge.completed ? (
                                  <Badge className="bg-green-500">Completed</Badge>
                                ) : (
                                  <Button size="sm" onClick={() => completeChallenge(event.id, challenge.id)}>
                                    Complete
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{challenge.description}</p>
                              <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs">
                                  <Trophy className="h-3 w-3 text-amber-500" />
                                  <span>{challenge.rewards.xp} XP</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  <span>{challenge.rewards.gold} Gold</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full space-y-2">
                        <h3 className="font-medium">Event Rewards:</h3>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span>{event.rewards.xp} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span>{event.rewards.gold} Gold</span>
                          </div>
                          {event.rewards.items &&
                            event.rewards.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-1 text-sm">
                                <Gift className="h-4 w-4 text-purple-500" />
                                <span>{item}</span>
                              </div>
                            ))}
                          {event.rewards.title && (
                            <div className="flex items-center gap-1 text-sm">
                              <Award className="h-4 w-4 text-blue-500" />
                              <span>Title: {event.rewards.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}

              {events.filter((event) => event.isActive).length === 0 && (
                <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Flame className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Events</h3>
                  <p className="text-muted-foreground">Check back later for new seasonal events!</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h2 className="text-xl font-bold mb-4 font-serif">Upcoming Events</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {events
                .filter((event) => !event.isActive)
                .map((event) => (
                  <Card key={event.id} className="medieval-card opacity-80">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-serif">{event.title}</CardTitle>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Starts: {new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Ends: {new Date(event.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Event Rewards:</h3>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span>{event.rewards.xp} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span>{event.rewards.gold} Gold</span>
                          </div>
                          {event.rewards.items &&
                            event.rewards.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-1 text-sm">
                                <Gift className="h-4 w-4 text-purple-500" />
                                <span>{item}</span>
                              </div>
                            ))}
                          {event.rewards.title && (
                            <div className="flex items-center gap-1 text-sm">
                              <Award className="h-4 w-4 text-blue-500" />
                              <span>Title: {event.rewards.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

              {events.filter((event) => !event.isActive).length === 0 && (
                <div className="col-span-2 text-center py-12 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Calendar className="mx-auto h-12 w-12 text-amber-500 opacity-50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground">Check back later for new seasonal events!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

