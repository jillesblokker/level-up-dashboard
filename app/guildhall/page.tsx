"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Users, MessageCircle, Sword, Bell, User, UserPlus, Search, Upload, Edit, X } from "lucide-react"
import Image from "next/image"
import { compressImage } from "@/lib/image-utils"
import { toast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/providers"

interface GuildStats {
  rank: number
  rankTitle: string
  contributions: number
  status: string
}

export default function GuildhallPage() {
  const { session, isLoading: isAuthLoading } = useAuth();

  const [goldBalance, setGoldBalance] = useState(1000)
  const [searchQuery, setSearchQuery] = useState("")
  const [guildStats] = useState<GuildStats>({
    rank: 5,
    rankTitle: "Veteran Member",
    contributions: 250,
    status: "Active Member in Good Standing"
  })
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.headerImages?.guildhall || "/images/guildhall-header.jpg"
    }
    return "/images/guildhall-header.jpg"
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load gold balance from localStorage
  useEffect(() => {
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }
  }, [])

  // Load saved cover image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem("guildhall-header-image")
    if (savedImage) {
      setCoverImage(savedImage)
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      // Compress the image before storing
      const compressedImage = await compressImage(file)
      
      setCoverImage(compressedImage)
      try {
        localStorage.setItem("guildhall-header-image", compressedImage)
        // Update global state
        if (typeof window !== 'undefined') {
          window.headerImages.guildhall = compressedImage
        }
      } catch (storageError) {
        console.error("Error storing image:", storageError)
        toast({
          title: "Error",
          description: "Failed to save image. The image might still be too large.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Error processing image:", err)
      toast({
        title: "Error",
        description: "Failed to process image. Please try a smaller image.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setShowUploadModal(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Image */}
      <div 
        className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={coverImage}
          alt="Guildhall"
          fill
          className="object-cover"
          priority
          quality={100}
          sizes="100vw"
          onError={() => {
            setCoverImage("/images/default-guildhall-header.jpg")
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90" />
        
        {/* Edit button that appears on hover */}
        {isHovering && !showUploadModal && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-amber-700 hover:bg-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center"
              size="icon"
              aria-label="Edit banner image"
            >
              <Edit size={20} />
            </Button>
          </div>
        )}
        
        {/* Image upload modal */}
        {showUploadModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="bg-black/90 p-6 rounded-lg border border-amber-500/50 backdrop-blur-md max-w-md relative">
              <Button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                size="icon"
              >
                <X size={16} className="text-gray-400" />
              </Button>
              
              <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Guildhall Banner</h3>
              
              <Button 
                onClick={triggerFileInput}
                className="w-full mb-3 bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                <Upload size={18} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              
              <p className="text-gray-400 text-sm text-center">
                Upload a JPG, PNG or GIF image for your guildhall banner
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageUpload}
                aria-label="Select image for guildhall banner"
              />
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[5] space-y-4">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
            GUILDHALL
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <main className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="guild-stats-overview">
            <Card className="border-amber-800/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-amber-500 text-sm font-medium">Guild Rank</p>
                  <p className="text-2xl font-bold text-white mt-1">{guildStats.rank}</p>
                  <p className="text-amber-300/80 text-xs mt-1">{guildStats.rankTitle}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-800/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-amber-500 text-sm font-medium">Contributions</p>
                  <p className="text-2xl font-bold text-white mt-1">{guildStats.contributions}</p>
                  <p className="text-amber-300/80 text-xs mt-1">This Week</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-800/20 backdrop-blur-sm" aria-label="guild-stats-gold-card">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-amber-500 text-sm font-medium">Gold Balance</p>
                  <p className="text-2xl font-bold text-white mt-1">{isAuthLoading ? 'Loading...' : session?.user ? goldBalance : localStorage.getItem("gold-balance") || 1000}</p>
                  <p className="text-amber-300/80 text-xs mt-1">Available</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-800/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-amber-500 text-sm font-medium">Status</p>
                  <p className="text-2xl font-bold text-white mt-1">Active</p>
                  <p className="text-amber-300/80 text-xs mt-1">Good Standing</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid - Updated for desktop layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Card - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-amber-800/20 backdrop-blur-sm" aria-label="guild-profile-card">
                <CardHeader>
                  <CardTitle className="text-amber-500">Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAuthLoading ? (
                    <div className="text-center text-amber-400">Loading profile...</div>
                  ) : session?.user ? (
                    <div className="flex flex-col items-center text-center">
                      <Avatar 
                        className="h-24 w-24 border-2 border-amber-500 mb-4"
                        style={{ backgroundColor: session.user.user_metadata?.avatar_bg_color || "#1f2937" }}
                      >
                        <AvatarImage 
                          src={session.user.user_metadata?.avatar_url || ""} 
                          alt={session.user.user_metadata?.user_name || session.user.email || ""} 
                        />
                        <AvatarFallback 
                          style={{ color: session.user.user_metadata?.avatar_text_color || "#ffffff" }}
                        >
                          {session.user.user_metadata?.user_name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-medium text-white">
                        {session.user.user_metadata?.user_name || session.user.email || "Adventurer"}
                      </h3>
                      <p className="text-amber-300/80">Level 10</p>
                      {guildStats.status && (
                        <Badge className="mt-2 bg-amber-500/20 text-amber-300 border-amber-500/50">
                          {guildStats.status}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-amber-400">
                      <p>Please sign in to view your profile</p>
                    </div>
                  )}
                  {session?.user && (
                    <div className="space-y-3 pt-4 border-t border-amber-800/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-300/80">Friends</span>
                        <span className="text-white">4</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-300/80">Recent Activity</span>
                        <span className="text-white">Completed "Fetch Quest"</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Social Section - 6 columns */}
            <div className="lg:col-span-6">
              <Card className="border-amber-800/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-amber-500">Social</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="friends" className="space-y-6">
                    <TabsList className="bg-black/40 border border-amber-800/20 p-1">
                      <TabsTrigger 
                        value="friends" 
                        className="text-amber-300 data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Friends
                      </TabsTrigger>
                      <TabsTrigger 
                        value="rivals" 
                        className="text-amber-300 data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200"
                      >
                        <Sword className="h-4 w-4 mr-2" />
                        Rivals
                      </TabsTrigger>
                      <TabsTrigger 
                        value="messages" 
                        className="text-amber-300 data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                        <Badge className="ml-2 bg-amber-500/20 text-amber-300 border-amber-500/50">3</Badge>
                      </TabsTrigger>
                    </TabsList>

                    {/* Full width search bar */}
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search..."
                        className="pl-9 w-full bg-black/40 border-amber-800/20 text-amber-300 placeholder:text-amber-500/50 focus:ring-amber-500/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <TabsContent value="friends" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-amber-800/20" aria-label="friend-card">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Friend's avatar" />
                                  <AvatarFallback>F</AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base text-white">Friend Name</CardTitle>
                                  <CardDescription className="text-gray-300">Level 15</CardDescription>
                                </div>
                              </div>
                              <div>
                                <Badge className="text-amber-300 border-amber-800/20">Online</Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <div className="text-sm font-medium text-white">Recent Activity</div>
                                <p className="text-sm text-gray-300">Completed a workout challenge</p>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">Top Categories</div>
                                <div className="flex gap-2 mt-1">
                                  <Badge className="text-amber-300 bg-amber-900/20">Strength</Badge>
                                  <Badge className="text-amber-300 bg-amber-900/20">Endurance</Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2">
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Message
                              </Button>
                              <Button variant="outline" className="w-full text-white border-amber-800/20 hover:bg-amber-900/20">
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="rivals" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RivalCard
                          name="Sarah Johnson"
                          avatar="/placeholder.svg?height=80&width=80"
                          level={15}
                          winRate="2/3"
                          activeChallenge={1}
                        />
                        <RivalCard
                          name="Michael Chen"
                          avatar="/placeholder.svg?height=80&width=80"
                          level={18}
                          winRate="1/2"
                          activeChallenge={0}
                        />
                        <RivalCard
                          name="Emma Thompson"
                          avatar="/placeholder.svg?height=80&width=80"
                          level={14}
                          winRate="3/5"
                          activeChallenge={2}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <MessagePreview
                          name="Sarah Johnson"
                          avatar="/placeholder.svg?height=80&width=80"
                          message="Great job on your workout yesterday!"
                          time="10:30 AM"
                          unread={true}
                        />
                        <MessagePreview
                          name="Michael Chen"
                          avatar="/placeholder.svg?height=80&width=80"
                          message="Are you joining the challenge?"
                          time="Yesterday"
                          unread={true}
                        />
                        <MessagePreview
                          name="Jessica Patel"
                          avatar="/placeholder.svg?height=80&width=80"
                          message="Thanks for the tips!"
                          time="2 days ago"
                          unread={true}
                        />
                        <MessagePreview
                          name="David Wilson"
                          avatar="/placeholder.svg?height=80&width=80"
                          message="Let's schedule that workout session"
                          time="3 days ago"
                          unread={false}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Fast Travel Section - 3 columns */}
            <div className="lg:col-span-3">
              <Card className="border-amber-800/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-amber-500">Fast Travel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/friends">
                    <Button variant="ghost" className="w-full justify-start text-amber-300 hover:bg-amber-900/20 hover:text-amber-200">
                      <Users className="mr-2 h-4 w-4" />
                      Friends Page
                    </Button>
                  </Link>
                  <Link href="/rivals">
                    <Button variant="ghost" className="w-full justify-start text-amber-300 hover:bg-amber-900/20 hover:text-amber-200">
                      <Sword className="mr-2 h-4 w-4" />
                      Rivals & Challenges
                    </Button>
                  </Link>
                  <Link href="/messaging">
                    <Button variant="ghost" className="w-full justify-start text-amber-300 hover:bg-amber-900/20 hover:text-amber-200">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messaging
                    </Button>
                  </Link>
                  <Link href="/notifications">
                    <Button variant="ghost" className="w-full justify-start text-amber-300 hover:bg-amber-900/20 hover:text-amber-200">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Friend Card Component
function FriendCard({
  name,
  avatar,
  level,
  lastActive,
  online,
  categories,
  recentActivity,
}: {
  name: string
  avatar: string
  level: number
  lastActive: string
  online: boolean
  categories: string[]
  recentActivity: string
}) {
  return (
    <Card className="border-amber-800/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-amber-800/20">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base text-white">{name}</CardTitle>
              <CardDescription className="flex items-center text-gray-300">
                Level {level}
                {online && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
              </CardDescription>
            </div>
          </div>
          <Badge className="text-amber-300 border-amber-800/20">{online ? "Online" : `Last active: ${lastActive}`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">Top Categories</div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Badge key={category} className="text-white bg-amber-900/20">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-white">Recent Activity</div>
            <div className="text-sm text-gray-300">{recentActivity}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex gap-2 w-full">
          <Link href="/messaging" className="w-full">
            <Button variant="outline" className="w-full text-white" size="sm">
              <MessageCircle className="mr-1 h-4 w-4" />
              Message
            </Button>
          </Link>
          <Link href="/friend-stats" className="w-full">
            <Button variant="outline" className="w-full text-white" size="sm">
              <User className="mr-1 h-4 w-4" />
              View Profile
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

// Rival Card Component
function RivalCard({
  name,
  avatar,
  level,
  winRate,
  activeChallenge,
}: {
  name: string
  avatar: string
  level: number
  winRate: string
  activeChallenge: number
}) {
  return (
    <Card className="border-amber-800/20">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 h-16 rounded-full border-2 border-amber-500">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-serif text-white">{name}</CardTitle>
            <CardDescription className="text-gray-300">Level {level}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white">
            <span>Win Rate</span>
            <span>{winRate}</span>
          </div>
          <div className="flex justify-between text-sm text-white">
            <span>Active Challenges</span>
            <span>{activeChallenge}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/rivals" className="w-full">
          <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white">
            <Sword className="mr-2 h-4 w-4" />
            Challenge
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// Message Preview Component
function MessagePreview({
  name,
  avatar,
  message,
  time,
  unread,
}: {
  name: string
  avatar: string
  message: string
  time: string
  unread: boolean
}) {
  return (
    <Link href="/messaging">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${unread ? "bg-amber-900/30 border border-amber-800/30" : "hover:bg-gray-800/50"}`}
      >
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-muted">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="font-medium truncate text-white">{name}</h3>
            <span className="text-xs text-gray-300">{time}</span>
          </div>
          <p className="text-sm text-gray-300 truncate">{message}</p>
        </div>
        {unread && (
          <div className="min-w-[20px] h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-xs font-medium text-white">1</span>
          </div>
        )}
      </div>
    </Link>
  )
}

