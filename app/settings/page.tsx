"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { ArrowLeft, Save, User, Shield, Play, Palette, Bell, HeartPulse, Gamepad2 } from "lucide-react"
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
  const [muteGoldToasts, setMuteGoldToasts] = useState(false)
  const [muteXpToasts, setMuteXpToasts] = useState(false)
  const [muteQuestToasts, setMuteQuestToasts] = useState(false)
  const [sanctuaryModeActive, setSanctuaryModeActive] = useState(false)

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

      // Load Gold Toast preference
      const savedMuteGold = localStorage.getItem("mute-gold-toasts")
      if (savedMuteGold !== null) {
        setMuteGoldToasts(savedMuteGold === "true")
      }

      // Load XP Toast preference
      const savedMuteXp = localStorage.getItem("mute-xp-toasts")
      if (savedMuteXp !== null) {
        setMuteXpToasts(savedMuteXp === "true")
      }

      // Load Quest Toast preference
      const savedMuteQuest = localStorage.getItem("mute-quest-toasts")
      if (savedMuteQuest !== null) {
        setMuteQuestToasts(savedMuteQuest === "true")
      }

      // Sync from Supabase
      getUserPreference("day-night-cycle-enabled").then(val => {
        if (val !== null && val !== undefined) {
          const isEnabled = Boolean(val)
          setDayNightEnabled(isEnabled)
          localStorage.setItem("day-night-cycle-enabled", String(isEnabled))
        }
      })

      getUserPreference("sanctuary_mode_active").then(val => {
        if (val !== null && val !== undefined) {
          setSanctuaryModeActive(Boolean(val))
        }
      })

      getUserPreference("mute-gold-toasts").then(val => {
        if (val !== null && val !== undefined) {
          const isMuted = Boolean(val)
          setMuteGoldToasts(isMuted)
          localStorage.setItem("mute-gold-toasts", String(isMuted))
        }
      })

      getUserPreference("mute-xp-toasts").then(val => {
        if (val !== null && val !== undefined) {
          const isMuted = Boolean(val)
          setMuteXpToasts(isMuted)
          localStorage.setItem("mute-xp-toasts", String(isMuted))
        }
      })

      getUserPreference("mute-quest-toasts").then(val => {
        if (val !== null && val !== undefined) {
          const isMuted = Boolean(val)
          setMuteQuestToasts(isMuted)
          localStorage.setItem("mute-quest-toasts", String(isMuted))
        }
      })
    } catch (error) {
      logger.error("Error loading user data:", error)
    }
  }, [])

  // Removed aggressive polling that reloaded the page every 5 seconds and disrupted typing/editing settings.

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
      logger.error("Error saving profile:", error)
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
            <p className="text-zinc-400">{TEXT_CONTENT.settings.header.subtitle}</p>
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
              <option value="gameplay">Gameplay</option>
              <option value="appearance">{TEXT_CONTENT.settings.tabs.appearance}</option>
              <option value="account">{TEXT_CONTENT.settings.tabs.account}</option>
            </select>
          </div>
          <TabsList className="bg-zinc-900 border-amber-800/20 hidden md:flex">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-900/20">
              <User className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.profile}
            </TabsTrigger>
            <TabsTrigger value="gameplay" className="text-white data-[state=active]:bg-amber-900/20">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Gameplay
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
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif text-white">{TEXT_CONTENT.settings.profile.title}</CardTitle>
                <CardDescription className="text-zinc-400">{TEXT_CONTENT.settings.profile.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">{TEXT_CONTENT.settings.profile.nameLabel}</Label>
                  <Input
                    id="name"
                    placeholder={TEXT_CONTENT.settings.profile.namePlaceholder}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-zinc-900 border-amber-800/20 text-white"
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
                    className="bg-zinc-900 border-amber-800/20 text-white"
                  />
                  <p className="text-xs text-zinc-400">
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

          <TabsContent value="gameplay" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-2 text-amber-500" />
                  Gameplay Features
                </CardTitle>
                <CardDescription className="text-zinc-400">Manage mechanics that affect your daily play.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <HeartPulse className="w-4 h-4 mr-2 text-pink-500" />
                      Sanctuary Mode
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Activate this when you are sick, on vacation, or need a break. It freezes all your streaks and prevents negative consequences (like Chaos Rifts) for missing habits.
                    </p>
                  </div>
                  <Switch
                    checked={sanctuaryModeActive}
                    onCheckedChange={(checked) => {
                      setSanctuaryModeActive(checked)
                      localStorage.setItem("pref:sanctuary_mode_active", checked.toString())
                      setUserPreference("sanctuary_mode_active", checked)

                      toast({
                        title: checked ? "Sanctuary Mode Enabled 🛡️" : "Sanctuary Mode Disabled",
                        description: checked ? "Your streaks and kingdom are safe." : "Welcome back to the journey!",
                      })
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white">{TEXT_CONTENT.settings.appearance.title}</CardTitle>
                <CardDescription className="text-zinc-400">{TEXT_CONTENT.settings.appearance.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Palette className="w-4 h-4 mr-2 text-amber-500" />
                      {TEXT_CONTENT.settings.appearance.dayNight.label}
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
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

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-amber-500" />
                      Mute Gold Collection Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for minor gold collections (harvesting tiles, citizen gathering, and animals) to reduce notifications clutter. Milestone alerts will still show.
                    </p>
                  </div>
                  <Switch
                    checked={muteGoldToasts}
                    onCheckedChange={(checked) => {
                      setMuteGoldToasts(checked)
                      localStorage.setItem("mute-gold-toasts", checked.toString())
                      setUserPreference("mute-gold-toasts", checked)

                      toast({
                        title: checked ? "Gold Alerts Muted 🔕" : "Gold Alerts Enabled 🔔",
                        description: checked 
                          ? "Minor gold collections will no longer trigger popups." 
                          : "All gold collections will trigger notifications.",
                      })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-amber-500" />
                      Mute XP Collection Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for minor experience gains (building activities, event actions, etc.) to reduce screen clutter. Milestone level-ups will still display.
                    </p>
                  </div>
                  <Switch
                    checked={muteXpToasts}
                    onCheckedChange={(checked) => {
                      setMuteXpToasts(checked)
                      localStorage.setItem("mute-xp-toasts", checked.toString())
                      setUserPreference("mute-xp-toasts", checked)

                      toast({
                        title: checked ? "XP Alerts Muted 🔕" : "XP Alerts Enabled 🔔",
                        description: checked 
                          ? "Minor experience gains will no longer trigger popups." 
                          : "All experience gains will trigger notifications.",
                      })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-amber-500" />
                      Mute Quest/Task Actions Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for quest steps or minor task completions. Major achievements and tier transitions will still notify.
                    </p>
                  </div>
                  <Switch
                    checked={muteQuestToasts}
                    onCheckedChange={(checked) => {
                      setMuteQuestToasts(checked)
                      localStorage.setItem("mute-quest-toasts", checked.toString())
                      setUserPreference("mute-quest-toasts", checked)

                      toast({
                        title: checked ? "Quest Alerts Muted 🔕" : "Quest Alerts Enabled 🔔",
                        description: checked 
                          ? "Quest action steps will no longer trigger popups." 
                          : "All quest actions will trigger notifications.",
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
              <p className="text-zinc-500">
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
            <div className="mt-4 p-4 bg-zinc-100 rounded-lg">
              <p className="font-medium">{TEXT_CONTENT.settings.account.github.userInfo}</p>
              <p className="text-sm text-zinc-600">user@example.com</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

