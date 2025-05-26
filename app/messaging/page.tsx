"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  Search,
  Phone,
  Video,
  MoreVertical,
  User,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavBar } from "@/components/nav-bar"

interface Friend {
  id: number
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  online: boolean
  unreadCount: number
}

interface Message {
  id: number
  senderId: number | "me"
  text: string
  timestamp: string
  read: boolean
}

export default function MessagingPage() {
  const searchParams = useSearchParams()
  const friendId = searchParams?.get("id") || "1"
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [goldBalance, setGoldBalance] = useState(1000)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load friends and messages data
  useEffect(() => {
    // In a real app, this would come from an API or database
    const sampleFriends: Friend[] = [
      {
        id: 1,
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=80&width=80",
        lastMessage: "Great job on your workout yesterday!",
        lastMessageTime: "10:30 AM",
        online: true,
        unreadCount: 2,
      },
      {
        id: 2,
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=80&width=80",
        lastMessage: "Are you joining the challenge?",
        lastMessageTime: "Yesterday",
        online: true,
        unreadCount: 0,
      },
      {
        id: 3,
        name: "Jessica Patel",
        avatar: "/placeholder.svg?height=80&width=80",
        lastMessage: "Thanks for the tips!",
        lastMessageTime: "2 days ago",
        online: false,
        unreadCount: 0,
      },
      {
        id: 4,
        name: "David Wilson",
        avatar: "/placeholder.svg?height=80&width=80",
        lastMessage: "Let's schedule that workout session",
        lastMessageTime: "3 days ago",
        online: false,
        unreadCount: 0,
      },
    ]

    setFriends(sampleFriends)

    // Find selected friend
    const friend = sampleFriends.find((f) => f.id.toString() === friendId) || sampleFriends[0]
    setSelectedFriend(friend)

    // Generate sample messages for the selected friend
    const sampleMessages: Message[] = [
      {
        id: 1,
        senderId: friend.id,
        text: "Hey there! How's your training going?",
        timestamp: "10:00 AM",
        read: true,
      },
      {
        id: 2,
        senderId: "me",
        text: "It's going well! I hit a new personal record yesterday.",
        timestamp: "10:05 AM",
        read: true,
      },
      {
        id: 3,
        senderId: friend.id,
        text: "That's awesome! What was the record?",
        timestamp: "10:10 AM",
        read: true,
      },
      {
        id: 4,
        senderId: "me",
        text: "I managed to do 50 push-ups in a row!",
        timestamp: "10:15 AM",
        read: true,
      },
      {
        id: 5,
        senderId: friend.id,
        text: "Wow, that's impressive! I'm still working on getting to 30.",
        timestamp: "10:20 AM",
        read: true,
      },
      {
        id: 6,
        senderId: "me",
        text: "You'll get there soon! It took me months of consistent practice.",
        timestamp: "10:25 AM",
        read: true,
      },
      {
        id: 7,
        senderId: friend.id,
        text: "Great job on your workout yesterday!",
        timestamp: "10:30 AM",
        read: false,
      },
    ]

    setMessages(sampleMessages)

    // Load gold balance
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }

    // No onboarding needed
  }, [friendId])

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleCloseOnboarding = (dontShowAgain: boolean, disableAll = false) => {
    setShowOnboarding(false)
    if (dontShowAgain) {
      localStorage.setItem("messaging-onboarding-shown", "true")
    }
    if (disableAll) {
      localStorage.setItem("all-onboarding-disabled", "true")
    }
  }

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Send a new message
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedFriend) return

    const newMsg: Message = {
      id: messages.length + 1,
      senderId: "me",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: true,
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate friend reply after a delay
    setTimeout(() => {
      const replies = [
        "That's great!",
        "Interesting, tell me more.",
        "I see what you mean.",
        "Let's talk about this more later.",
        "Thanks for sharing!",
        "I'll keep that in mind.",
        "Good to know!",
      ]

      const replyMsg: Message = {
        id: messages.length + 2,
        senderId: selectedFriend.id,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
      }

      setMessages((prev) => [...prev, replyMsg])
    }, 2000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar goldBalance={1000} session={undefined} />

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">Messages</h1>
            <p className="text-gray-300">Chat with your allies and rivals</p>
          </div>
          <Link href="/community">
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Community
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Friends List */}
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader className="pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  className="pl-8 bg-gray-900 border-amber-800/20 text-white placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-2">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <Link key={friend.id} href={`/messaging?id=${friend.id}`} className="block">
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer ${
                            selectedFriend?.id === friend.id
                              ? "bg-amber-900/30 border border-amber-800/30"
                              : "hover:bg-gray-800/50"
                          }`}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                              <AvatarImage src={friend.avatar} alt={friend.name} />
                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {friend.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium truncate text-white">{friend.name}</h3>
                              <span className="text-xs text-gray-400">{friend.lastMessageTime}</span>
                            </div>
                            <p className="text-sm text-gray-300 truncate">{friend.lastMessage}</p>
                          </div>
                          {friend.unreadCount > 0 && (
                            <div className="min-w-[20px] h-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">{friend.unreadCount}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-300">No friends found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20 md:col-span-2 h-full flex flex-col">
            {selectedFriend ? (
              <>
                <CardHeader className="pb-2 border-b border-gray-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-amber-800/20">
                        <AvatarImage src={selectedFriend.avatar} alt={selectedFriend.name} />
                        <AvatarFallback>{selectedFriend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-serif text-white">{selectedFriend.name}</CardTitle>
                        <CardDescription className="text-xs text-gray-300">
                          {selectedFriend.online ? "Online" : "Offline"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-amber-900/20">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-amber-900/20">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-amber-900/20">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4" ref={messagesEndRef}>
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.senderId === "me"
                                ? "bg-amber-900/30 text-white"
                                : "bg-gray-900 text-white"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <span className="text-xs text-gray-400 mt-1 block">
                              {message.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-300">No messages yet</p>
                          <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t border-gray-800">
                  <form className="flex w-full gap-2" onSubmit={sendMessage}>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-gray-900 border-amber-800/20 text-white placeholder:text-gray-400"
                    />
                    <Button variant="ghost" type="button" size="icon" className="text-white hover:bg-amber-900/20">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" type="button" size="icon" className="text-white hover:bg-amber-900/20">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button type="submit" size="icon" className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Select a Conversation</h3>
                <p className="text-gray-300 text-center max-w-sm">
                  Choose a friend from the list to start chatting
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

