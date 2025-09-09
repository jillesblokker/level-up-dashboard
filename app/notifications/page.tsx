"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bell, CheckCircle, Clock, Coins, Trophy, Trash2, Search, MessageSquare, Scroll, Castle, Crown, Mail } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"


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
        title: "New achievement",
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
          label: "Accept Challenge",
          href: "/challenges",
        },
      },
    ]

    setNotifications(sampleNotifications)
  }, [])

  // Filter notifications based on search and type
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === null || notification.type === selectedType
    return matchesSearch && matchesType
  })

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast({
      title: "All notifications marked as read",
      description: "You've caught up on all your kingdom's news!",
    })
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
    toast({
      title: "Notification deleted",
      description: "The message has been removed from your inbox.",
    })
  }

  const clearAllNotifications = () => {
    setNotifications([])
    toast({
      title: "All notifications cleared",
      description: "Your inbox is now empty and ready for new messages.",
    })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return "Just now"
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
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

  // Enhanced Empty State Component
  const EmptyState = ({ title, message, description, showMailbox = true }: {
    title: string
    message: string
    description: string
    showMailbox?: boolean
  }) => (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden bg-black rounded-xl border border-amber-800/20 shadow-lg">
      {/* Background with medieval theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 via-transparent to-amber-900/5" />
      <div className="absolute inset-0 bg-[url('/images/kingdom-header.jpg')] bg-cover bg-center opacity-5" />
      
      {/* Decorative border elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      
      {/* Animated background elements */}
      <div className="absolute top-8 left-8 w-3 h-3 bg-amber-500/20 rounded-full animate-bounce"></div>
      <div className="absolute top-16 right-12 w-2 h-2 bg-amber-400/30 rounded-full animate-ping"></div>
      <div className="absolute bottom-12 left-12 w-2.5 h-2.5 bg-amber-300/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-8 right-8 w-1.5 h-1.5 bg-amber-400/25 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-2xl mx-auto">
        {/* Medieval illustration */}
        <div className="relative mb-12">
          {showMailbox ? (
            // Enhanced Mailbox Scene
            <div className="w-56 h-56 mx-auto relative">
              {/* Castle background */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-24">
                <div className="absolute bottom-0 left-0 w-10 h-20 bg-gradient-to-b from-gray-600 to-gray-800 rounded-t-lg border border-gray-700"></div>
                <div className="absolute bottom-0 left-10 w-10 h-16 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-lg border border-gray-600"></div>
                <div className="absolute bottom-0 left-20 w-10 h-22 bg-gradient-to-b from-gray-600 to-gray-800 rounded-t-lg border border-gray-700"></div>
                <div className="absolute bottom-0 left-30 w-10 h-18 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-lg border border-gray-600"></div>
                {/* Castle towers */}
                <div className="absolute top-0 left-2 w-6 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-full border border-amber-700"></div>
                <div className="absolute top-0 left-12 w-6 h-10 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-full border border-amber-700"></div>
                <div className="absolute top-0 left-22 w-6 h-9 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-full border border-amber-700"></div>
                <div className="absolute top-0 left-32 w-6 h-7 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-full border border-amber-700"></div>
              </div>
              
              {/* Mailbox */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-28 h-32">
                {/* Mailbox base */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-28 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-lg border-2 border-amber-700 shadow-lg"></div>
                {/* Mailbox door */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-24 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-md border border-amber-500"></div>
                {/* Mailbox post */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-10 bg-gradient-to-b from-gray-700 to-gray-800 rounded"></div>
                {/* Empty interior glow */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-gradient-to-b from-amber-200/20 to-transparent rounded-t-sm"></div>
                {/* Mailbox flag */}
                <div className="absolute top-2 right-2 w-8 h-1 bg-amber-500 rounded-full"></div>
                <div className="absolute top-1 right-2 w-1 h-8 bg-amber-500 rounded-full"></div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-4 left-6 w-1 h-1 bg-amber-300/60 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-8 right-4 w-0.5 h-0.5 bg-amber-400/50 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-12 left-8 w-0.5 h-0.5 bg-amber-500/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-16 right-8 w-1 h-1 bg-amber-300/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
          ) : (
            // Scroll/Message Scene
            <div className="w-56 h-56 mx-auto relative">
              {/* Scroll */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-40 h-48 bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg border-2 border-amber-300 shadow-lg">
                <div className="absolute top-2 left-2 right-2 h-0.5 bg-amber-400 rounded-full"></div>
                <div className="absolute top-6 left-2 right-2 h-0.5 bg-amber-400/60 rounded-full"></div>
                <div className="absolute top-10 left-2 right-2 h-0.5 bg-amber-400/40 rounded-full"></div>
                <div className="absolute top-14 left-2 right-2 h-0.5 bg-amber-400/20 rounded-full"></div>
              </div>
              {/* Scroll handles */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-800 rounded-full border-2 border-amber-700"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-800 rounded-full border-2 border-amber-700"></div>
              
              {/* Floating particles */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-4 left-6 w-1 h-1 bg-amber-300/60 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-8 right-4 w-0.5 h-0.5 bg-amber-400/50 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-12 left-8 w-0.5 h-0.5 bg-amber-500/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Text content */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-4xl font-bold text-amber-400 font-serif tracking-wide drop-shadow-lg">
              {title}
            </h3>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto"></div>
          </div>
          
          <div className="max-w-lg mx-auto space-y-4">
            <p className="text-gray-200 leading-relaxed font-medium text-xl">
              {message}
            </p>
            <p className="text-gray-400 leading-relaxed text-lg">
              {description}
            </p>
          </div>
          
          {/* Call to action */}
          <div className="pt-8">
            <Link href="/quests">
              <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-10 py-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 text-lg">
                <Trophy className="mr-3 h-5 w-5" />
                {showMailbox ? "Embark on Your Quest" : "Continue Your Journey"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar session={undefined} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10 rounded-lg"></div>
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-serif text-amber-400">Notifications</h1>
                <p className="text-gray-400 font-medium">Kingdom Messages & Updates</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline" className="border-amber-800/30 hover:bg-amber-900/20 text-amber-400">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Kingdom
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Enhanced Sidebar */}
          <div className="space-y-6 lg:block hidden">
            <Card className="bg-gradient-to-b from-gray-900/50 to-black/50 border-amber-800/30 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-amber-400 flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Search Messages</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      className="pl-10 bg-gray-900/50 border-amber-800/30 focus:border-amber-500/50"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Message Type</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedType === null ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedType === null 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                      }`}
                      onClick={() => setSelectedType(null)}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={selectedType === "achievement" ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedType === "achievement" 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                      }`}
                      onClick={() => setSelectedType("achievement")}
                    >
                      <Trophy className="w-3 h-3 mr-1" />
                      Achievements
                    </Badge>
                    <Badge
                      variant={selectedType === "quest" ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedType === "quest" 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                      }`}
                      onClick={() => setSelectedType("quest")}
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      Quests
                    </Badge>
                    <Badge
                      variant={selectedType === "friend" ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedType === "friend" 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                      }`}
                      onClick={() => setSelectedType("friend")}
                    >
                      <Bell className="w-3 h-3 mr-1" />
                      Friends
                    </Badge>
                    <Badge
                      variant={selectedType === "system" ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedType === "system" 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                      }`}
                      onClick={() => setSelectedType("system")}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      System
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-gray-900/50 to-black/50 border-amber-800/30 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-amber-400 flex items-center">
                  <Scroll className="w-5 h-5 mr-2" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-amber-800/30 hover:bg-amber-900/20 text-amber-400 transition-all duration-200"
                  onClick={markAllAsRead}
                  disabled={notifications.every((n) => n.read)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-800/30 hover:bg-red-900/20 text-red-400 transition-all duration-200"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Messages
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3 space-y-6 w-full">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Mobile tab selector */}
              <div className="mb-6 md:hidden">
                <label htmlFor="notifications-tab-select" className="sr-only">Select notifications tab</label>
                <select
                  id="notifications-tab-select"
                  aria-label="Notifications tab selector"
                  className="w-full rounded-lg border border-amber-800/30 bg-gray-900/50 text-white p-3 focus:border-amber-500/50"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread Messages</option>
                </select>
              </div>
              
              <TabsList className="w-full hidden md:flex bg-gray-900/50 border-amber-800/30">
                <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-400">
                  All Messages
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-400">
                  Unread Messages
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {notifications.filter((n) => !n.read).length > 99 ? '99+' : notifications.filter((n) => !n.read).length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`bg-gradient-to-b from-gray-900/50 to-black/50 border-amber-800/30 w-full min-h-[120px] md:min-h-[100px] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                          !notification.read ? "border-l-4 border-l-amber-500" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CardContent className="p-6 h-full flex flex-col justify-center">
                          <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-gray-800/50 rounded-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg">{notification.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-amber-800/30 text-amber-400">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {formatTimestamp(notification.timestamp)}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-900/20"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    aria-label={`Delete notification: ${notification.title}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-gray-300 mt-2 leading-relaxed">{notification.message}</p>

                              {notification.action && (
                                <div className="mt-4">
                                  <Link href={notification.action.href}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-800/30 hover:bg-amber-900/20 text-amber-400 transition-all duration-200"
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
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Messages Await"
                    message="The courier has not yet arrived with news from your kingdom."
                    description="Complete quests and explore your realm to receive notifications from your loyal subjects."
                    showMailbox={true}
                  />
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-6">
                {filteredNotifications.filter((n) => !n.read).length > 0 ? (
                  <div className="space-y-4">
                    {filteredNotifications
                      .filter((n) => !n.read)
                      .map((notification) => (
                        <Card
                          key={notification.id}
                          className="bg-gradient-to-b from-gray-900/50 to-black/50 border-amber-800/30 border-l-4 border-l-amber-500 w-full min-h-[120px] md:min-h-[100px] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CardContent className="p-6 h-full flex flex-col justify-center">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 p-2 bg-gray-800/50 rounded-lg">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-semibold text-lg">{notification.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-amber-800/30 text-amber-400">
                                      <Clock className="mr-1 h-3 w-3" />
                                      {formatTimestamp(notification.timestamp)}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-900/20"
                                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        e.stopPropagation()
                                        deleteNotification(notification.id)
                                      }}
                                      aria-label={`Delete notification: ${notification.title}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-gray-300 mt-2 leading-relaxed">{notification.message}</p>

                                {notification.action && (
                                  <div className="mt-4">
                                    <Link href={notification.action.href}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-amber-800/30 hover:bg-amber-900/20 text-amber-400 transition-all duration-200"
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
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="All Messages Read"
                    message="You've caught up on all your kingdom's news and updates."
                    description="Continue your adventures to receive new notifications from your realm."
                    showMailbox={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

