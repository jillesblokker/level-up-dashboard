"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, User, Shield, Play } from "lucide-react"
import Link from "next/link"
// import { useSession, signIn, signOut } from "next-auth/react"
import { Switch } from "@/components/ui/switch"
import { useOnboarding } from "@/hooks/use-onboarding"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NavBar } from "@/components/nav-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { CharacterStats } from "@/types/character"


export default function SettingsPage() {
  // const { data: session } = useSession()
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    titles: {
      equipped: "",
      unlocked: 0,
      total: 10
    },
    perks: {
      active: 0,
      total: 5
    }
  })
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [isGithubConnected, setIsGithubConnected] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  const { openOnboarding, resetOnboarding } = useOnboarding()

  // Load user data
  useEffect(() => {
    try {
      // Load character stats
      const savedStats = localStorage.getItem("character-stats")
      if (savedStats) {
        setCharacterStats(JSON.parse(savedStats))
      }

      // Check if we have a saved name
      const savedName = localStorage.getItem("character-name")
      if (savedName) {
        setUserName(savedName)
      }

      // Check if we have a saved email
      const savedEmail = localStorage.getItem("user-email")
      if (savedEmail) {
        setEmail(savedEmail)
      }

      // Check if user is connected to GitHub (placeholder for now)
      setIsGithubConnected(false)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }, [])

  // Polling for settings changes instead of real-time sync
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined;
    if (!userId) return;
    
    const pollInterval = setInterval(() => {
      // Reload settings
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, []);

  const handleSaveProfile = () => {
    try {
      // Save to localStorage
      localStorage.setItem("character-name", userName)
      localStorage.setItem("user-email", email)

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile information.",
        variant: "destructive",
      })
    }
  }

  const handleResetOnboarding = () => {
    try {
      resetOnboarding()
      toast({
        title: "Onboarding Reset",
        description: "The tutorial will be shown again on your next visit.",
      })
    } catch (error) {
      console.error("Error resetting onboarding:", error)
      toast({
        title: "Error",
        description: "Failed to reset onboarding.",
        variant: "destructive",
      })
    }
  }

  const handleShowTutorial = () => {
    openOnboarding()
  }

  const handleGithubToggle = async (checked: boolean) => {
    if (checked) {
      // Connect to GitHub
      // await signIn("github", { callbackUrl: "/settings" })
    } else {
      // Disconnect from GitHub
      // await signOut({ callbackUrl: "/settings" })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>
          <Link href="/kingdom">
            <Button variant="outline" className="text-white border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile tab selector */}
          <div className="mb-4 md:hidden">
            <label htmlFor="settings-tab-select" className="sr-only">Select settings tab</label>
            <select
              id="settings-tab-select"
              aria-label="Settings tab selector"
              className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
            >
              <option value="profile">Profile</option>
              <option value="account">Account</option>
            </select>
          </div>
          <TabsList className="bg-gray-900 border-amber-800/20 hidden md:flex">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-900/20">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="text-white data-[state=active]:bg-amber-900/20">
              <Shield className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif text-white">Character Profile</CardTitle>
                <CardDescription className="text-gray-400">Update your character information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Character Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your character name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-gray-900 border-amber-800/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-amber-800/20 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Your email is used for notifications and account recovery
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                  onClick={handleSaveProfile}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif text-white">Tutorial & Onboarding</CardTitle>
                <CardDescription className="text-gray-400">Manage tutorial and onboarding settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-white">Show the tutorial again to refresh your knowledge of the game.</p>
                    <Button
                      variant="outline"
                      className="text-white border-amber-800/20 hover:bg-amber-900/20"
                      onClick={handleShowTutorial}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Show Tutorial
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-white">Reset the tutorial to show it automatically on your next visit.</p>
                    <Button
                      variant="outline"
                      className="text-white border-amber-800/20 hover:bg-amber-900/20"
                      onClick={handleResetOnboarding}
                    >
                      Reset Tutorial
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">GitHub Connection</h2>
              <p className="text-gray-500">
                {isGithubConnected 
                  ? "Your account is connected to GitHub" 
                  : "Connect your account to GitHub to sync your data"}
              </p>
            </div>
            
            <Switch
              checked={isGithubConnected}
              onCheckedChange={handleGithubToggle}
              className="ml-4"
            />
          </div>

          {isGithubConnected && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">Connected as: GitHub User</p>
              <p className="text-sm text-gray-600">user@example.com</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

