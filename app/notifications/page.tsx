"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bell, CheckCircle, Clock, Coins, Trophy, Trash2, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'

interface Notification {
  id: string
  title: string
  message: string
  type: "achievement" | "quest" | "friend" | "system"
  read: boolean
  timestamp: string
  action?: {
    label: string
    href: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Load notifications data
  useEffect(() => {
    // In a real app, this would come from an API or database
    const sampleNotifications: Notification[] = [
      {
        id: "n1",
        title: "Achievement Unlocked!",
        message: "You've earned the 'Early Riser' achievement for completing 5 tasks before 9 AM.",
        type: "achievement",
        read: false,
        timestamp: "2025-03-15T08:30:00Z",
        action: {
          label: "View Achievement",
          href: "/character",
        },
      },
      {
        id: "n2",
        title: "Quest Completed",
        message: "You've successfully completed the 'Strength Foundation' quest and earned 50 gold!",
        type: "quest",
        read: false,
        timestamp: "2025-03-14T16:45:00Z",
        action: {
          label: "View Rewards",
          href: "/quests",
        },
      },
      {
        id: "n3",
        title: "Friend Request",
        message: "Michael Chen has sent you a friend request.",
        type: "friend",
        read: true,
        timestamp: "2025-03-13T12:20:00Z",
        action: {
          label: "View Request",
          href: "/community",
        },
      },
      {
        id: "n4",
        title: "New Challenge Available",
        message: "A new seasonal challenge 'Spring Renewal' is now available!",
        type: "system",
        read: true,
        timestamp: "2025-03-12T09:15:00Z",
        action: {
          label: "View Challenge",
          href: "/events",
        },
      },
      {
        id: "n5",
        title: "Daily Streak Bonus",
        message: "You've maintained a 7-day streak! You've earned a bonus of 25 gold.",
        type: "achievement",
        read: true,
        timestamp: "2025-03-11T22:00:00Z",
      },
      {
        id: "n6",
        title: "New Challenge",
        message: "Sarah has challenged you to a 'Push-up Challenge'!",
        type: "friend",
        read: false,
        timestamp: "2025-03-10T14:30:00Z",
        action: {
          label: "View Challenge",
          href: "/community?tab=challenges",
        },
      },
      {
        id: "n7",
        title: "System Update",
        message: "The kingdom has been updated with new features! Check out the new marketplace items.",
        type: "system",
        read: true,
        timestamp: "2025-03-09T10:00:00Z",
        action: {
          label: "Visit Marketplace",
          href: "/market",
        },
      },
    ]

    setNotifications(sampleNotifications)
  }, [])

  // --- Supabase real-time sync for notifications ---
  useSupabaseRealtimeSync({
    table: 'notifications',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined,
    onChange: () => {
      // Re-fetch notifications from API or Supabase and update state
      // (Replace with your actual fetch logic if needed)
      fetch('/api/notifications').then(async (response) => {
        if (response.ok) {
          const notifications = await response.json();
          setNotifications(notifications);
        }
      });
    }
  });

  // Filter notifications based on search query and filters
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType ? notification.type === selectedType : true

    return matchesSearch && matchesType
  })

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

    toast({
      title: "All Notifications Marked as Read",
      description: "All your notifications have been marked as read.",
    })
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))

    toast({
      title: "Notification Deleted",
      description: "The notification has been removed.",
    })
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([])

    toast({
      title: "All Notifications Cleared",
      description: "All your notifications have been cleared.",
    })
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="h-5 w-5 text-amber-500" />
      case "quest":
        return <Coins className="h-5 w-5 text-yellow-500" />
      case "friend":
        return <Bell className="h-5 w-5 text-blue-500" />
      case "system":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar session={undefined} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your kingdom&apos;s activities</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Kingdom
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      className="pl-8 bg-gray-900 border-amber-800/20"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Type</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedType === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType(null)}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={selectedType === "achievement" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType("achievement")}
                    >
                      Achievements
                    </Badge>
                    <Badge
                      variant={selectedType === "quest" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType("quest")}
                    >
                      Quests
                    </Badge>
                    <Badge
                      variant={selectedType === "friend" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType("friend")}
                    >
                      Friends
                    </Badge>
                    <Badge
                      variant={selectedType === "system" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType("system")}
                    >
                      System
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-amber-800/20 hover:bg-amber-900/20"
                  onClick={markAllAsRead}
                  disabled={notifications.every((n) => n.read)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-800/20 hover:bg-red-900/20 text-red-500"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Notifications
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Mobile tab selector */}
              <div className="mb-4 md:hidden">
                <label htmlFor="notifications-tab-select" className="sr-only">Select notifications tab</label>
                <select
                  id="notifications-tab-select"
                  aria-label="Notifications tab selector"
                  className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
              <TabsList className="w-full hidden md:flex">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <Badge className="ml-2 bg-red-500">{notifications.filter((n) => !n.read).length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4 space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`bg-gradient-to-b from-black to-gray-900 border-amber-800/20 ${
                        !notification.read ? "border-l-4 border-l-amber-500" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{notification.title}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {formatTimestamp(notification.timestamp)}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                            {notification.action && (
                              <div className="mt-3">
                                <Link href={notification.action.href}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-800/20 hover:bg-amber-900/20"
                                  >
                                    {notification.action.label}
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                    <Bell className="mx-auto h-12 w-12 text-gray-700 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                    <p className="text-muted-foreground">You&apos;re all caught up!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-4 space-y-4">
                {filteredNotifications.filter((n) => !n.read).length > 0 ? (
                  filteredNotifications
                    .filter((n) => !n.read)
                    .map((notification) => (
                      <Card
                        key={notification.id}
                        className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20 border-l-4 border-l-amber-500"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{notification.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {formatTimestamp(notification.timestamp)}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                              {notification.action && (
                                <div className="mt-3">
                                  <Link href={notification.action.href}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-800/20 hover:bg-amber-900/20"
                                    >
                                      {notification.action.label}
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-700 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Unread Notifications</h3>
                    <p className="text-muted-foreground">You&apos;ve read all your notifications!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

