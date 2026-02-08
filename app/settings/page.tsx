"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, User, Shield, Play, Palette } from "lucide-react"
import { setUserPreference, getUserPreference } from "@/lib/user-preferences-manager"
import Link from "next/link"
// import { useSession, signIn, signOut } from "next-auth/react"
import { Switch } from "@/components/ui/switch"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NavBar } from "@/components/nav-bar"
import { TEXT_CONTENT } from "@/lib/text-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { CharacterStats } from "@/types/character"
import { useOnboarding } from "@/hooks/use-onboarding"


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
  const [dayNightEnabled, setDayNightEnabled] = useState(true)

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

      // Load Day/Night preference
      const savedDayNight = localStorage.getItem("day-night-cycle-enabled")
      if (savedDayNight !== null) {
        setDayNightEnabled(savedDayNight === "true")
      }

      // Sync from Supabase
      getUserPreference("day-night-cycle-enabled").then(val => {
        if (val !== null && val !== undefined) {
          const isEnabled = Boolean(val)
          setDayNightEnabled(isEnabled)
          localStorage.setItem("day-night-cycle-enabled", String(isEnabled))
        }
      })
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
        title: TEXT_CONTENT.settings.toasts.profileUpdated.title,
        description: TEXT_CONTENT.settings.toasts.profileUpdated.desc,
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: TEXT_CONTENT.settings.toasts.saveError.title,
        description: TEXT_CONTENT.settings.toasts.saveError.desc,
        variant: "destructive",
      })
    }
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
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">{TEXT_CONTENT.settings.header.title}</h1>
            <p className="text-gray-400">{TEXT_CONTENT.settings.header.subtitle}</p>
          </div>
          <Link href="/kingdom">
            <Button variant="outline" className="text-white border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.settings.header.back}
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
              <option value="profile">{TEXT_CONTENT.settings.tabs.profile}</option>
              <option value="appearance">{TEXT_CONTENT.settings.tabs.appearance}</option>
              <option value="account">{TEXT_CONTENT.settings.tabs.account}</option>
            </select>
          </div>
          <TabsList className="bg-gray-900 border-amber-800/20 hidden md:flex">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-900/20">
              <User className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.profile}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-white data-[state=active]:bg-amber-900/20">
              <Palette className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.appearance}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-white data-[state=active]:bg-amber-900/20">
              <Shield className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.account}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif text-white">{TEXT_CONTENT.settings.profile.title}</CardTitle>
                <CardDescription className="text-gray-400">{TEXT_CONTENT.settings.profile.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">{TEXT_CONTENT.settings.profile.nameLabel}</Label>
                  <Input
                    id="name"
                    placeholder={TEXT_CONTENT.settings.profile.namePlaceholder}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-gray-900 border-amber-800/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">{TEXT_CONTENT.settings.profile.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={TEXT_CONTENT.settings.profile.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-amber-800/20 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    {TEXT_CONTENT.settings.profile.emailNote}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                  onClick={handleSaveProfile}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {TEXT_CONTENT.settings.profile.save}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white">{TEXT_CONTENT.settings.appearance.title}</CardTitle>
                <CardDescription className="text-gray-400">{TEXT_CONTENT.settings.appearance.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Palette className="w-4 h-4 mr-2 text-amber-500" />
                      {TEXT_CONTENT.settings.appearance.dayNight.label}
                    </Label>
                    <p className="text-sm text-gray-400 max-w-md">
                      {TEXT_CONTENT.settings.appearance.dayNight.description}
                    </p>
                  </div>
                  <Switch
                    checked={dayNightEnabled}
                    onCheckedChange={(checked) => {
                      setDayNightEnabled(checked)
                      localStorage.setItem("day-night-cycle-enabled", checked.toString())
                      setUserPreference("day-night-cycle-enabled", checked)

                      // Dispatch event for components to react
                      window.dispatchEvent(new CustomEvent('settings:dayNightChanged', { detail: { enabled: checked } }))

                      toast({
                        title: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.title : TEXT_CONTENT.settings.toasts.dayNightDisabled.title,
                        description: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.desc : TEXT_CONTENT.settings.toasts.dayNightDisabled.desc,
                      })
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">

          </TabsContent>
        </Tabs>

        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{TEXT_CONTENT.settings.account.github.title}</h2>
              <p className="text-gray-500">
                {isGithubConnected
                  ? TEXT_CONTENT.settings.account.github.connected
                  : TEXT_CONTENT.settings.account.github.disconnected}
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
              <p className="font-medium">{TEXT_CONTENT.settings.account.github.userInfo}</p>
              <p className="text-sm text-gray-600">user@example.com</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

