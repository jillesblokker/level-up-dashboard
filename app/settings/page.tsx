"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { ArrowLeft, Save, User, Shield, Play, Palette, Bell, HeartPulse, Gamepad2, LogOut, KeyRound, Trash2, AlertTriangle, ShieldCheck } from "lucide-react"
import { setUserPreference, getUserPreference } from "@/lib/user-preferences-manager"
import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { Switch } from "@/components/ui/switch"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TEXT_CONTENT } from "@/lib/text-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { CharacterStats } from "@/types/character"


export default function SettingsPage() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

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
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [vacationShieldDays, setVacationShieldDays] = useState(0)

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

      // Load Sound preference
      const savedSounds = localStorage.getItem("medieval-sounds-enabled")
      if (savedSounds !== null) {
        setSoundsEnabled(savedSounds === "true")
      }

      // Load Vacation Shield Days
      const savedVacation = localStorage.getItem("vacation-shield-days")
      if (savedVacation !== null) {
        setVacationShieldDays(parseInt(savedVacation) || 0)
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

  const handleSaveProfile = () => {
    try {
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
    } else {
      // Disconnect from GitHub
    }
  }

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("skip-auth")
    }
    if (typeof document !== "undefined") {
      document.cookie = "skip-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    }
    try {
      await signOut()
    } catch (e) {
      logger.error("Signout error:", e)
    }
    window.location.href = "/auth/signin"
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      if (typeof window !== 'undefined') {
        localStorage.clear()
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated kingdom data have been permanently removed.",
      })

      setTimeout(() => {
        window.location.href = '/'
      }, 1500)

    } catch (error) {
      logger.error("Error deleting account:", error)
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete account.",
        variant: "destructive"
      })
      setIsDeleting(false)
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
              <ArrowLeft className="h-4 w-4" />
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
              <User className="h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.profile}
            </TabsTrigger>
            <TabsTrigger value="gameplay" className="text-white data-[state=active]:bg-amber-900/20">
              <Gamepad2 className="h-4 w-4" />
              Gameplay
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-white data-[state=active]:bg-amber-900/20">
              <Palette className="h-4 w-4" />
              {TEXT_CONTENT.settings.tabs.appearance}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-white data-[state=active]:bg-amber-900/20">
              <Shield className="h-4 w-4" />
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
                  <Save className="h-4 w-4" />
                  {TEXT_CONTENT.settings.profile.save}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="gameplay" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center">
                  <Gamepad2 className="w-5 h-5 text-amber-500" />
                  Gameplay Features
                </CardTitle>
                <CardDescription className="text-zinc-400">Manage mechanics that affect your daily play.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <HeartPulse className="w-4 h-4 text-pink-500" />
                      Sanctuary Mode
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Activate this when you are sick, on vacation, or need a break. It freezes all your streaks and prevents negative consequences for missing habits.
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

                {/* 3-Day Vacation Shield Control */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      3-Day Vacation Shield
                      {vacationShieldDays > 0 && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Active ({vacationShieldDays}d remaining)</span>}
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Freeze daily habit streak decay for up to 3 days while traveling or taking time off without breaking your streak tokens.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={vacationShieldDays > 0 ? "destructive" : "outline"}
                    className="h-9 font-bold text-xs"
                    onClick={() => {
                      const newDays = vacationShieldDays > 0 ? 0 : 3;
                      setVacationShieldDays(newDays);
                      localStorage.setItem("vacation-shield-days", newDays.toString());
                      setUserPreference("vacation-shield-days", newDays);
                      toast({
                        title: newDays > 0 ? "🛡️ 3-Day Vacation Shield Activated!" : "🛡️ Vacation Shield Deactivated",
                        description: newDays > 0 ? "Your daily habit streaks will remain frozen for 3 days." : "Normal streak tracking resumed.",
                      });
                    }}
                  >
                    {vacationShieldDays > 0 ? "Deactivate Shield" : "Activate 3-Day Shield"}
                  </Button>
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
                      <Palette className="w-4 h-4 text-amber-500" />
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

                      window.dispatchEvent(new CustomEvent('settings:dayNightChanged', { detail: { enabled: checked } }))

                      toast({
                        title: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.title : TEXT_CONTENT.settings.toasts.dayNightDisabled.title,
                        description: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.desc : TEXT_CONTENT.settings.toasts.dayNightDisabled.desc,
                      })
                    }}
                  />
                </div>

                {/* Medieval Audio & Sound FX Control */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-400" />
                      Medieval Audio & Sound Effects
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Enable synthetic Web Audio sound effects for gold harvests, sword strikes, catapult launches, and bard ballads.
                    </p>
                  </div>
                  <Switch
                    checked={soundsEnabled}
                    onCheckedChange={(checked) => {
                      setSoundsEnabled(checked);
                      localStorage.setItem("medieval-sounds-enabled", checked.toString());
                      setUserPreference("medieval-sounds-enabled", checked);
                      toast({
                        title: checked ? "🔊 Sound Effects Enabled" : "🔇 Sound Effects Muted",
                        description: checked ? "Web Audio SFX will play during kingdom actions." : "All sound effects are now muted.",
                      });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center">
                      <Bell className="w-4 h-4 text-amber-500" />
                      Mute Gold Collection Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for minor gold collections (harvesting tiles, citizen gathering, and animals).
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
                      <Bell className="w-4 h-4 text-amber-500" />
                      Mute XP Collection Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for minor experience gains (building activities, event actions, etc.).
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
                      <Bell className="w-4 h-4 text-amber-500" />
                      Mute Quest/Task Actions Alerts
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Mute toast alerts for quest steps or minor task completions.
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
            {/* Account Details Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  Account Information
                </CardTitle>
                <CardDescription className="text-zinc-400">View and manage your login security settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-zinc-900/90 rounded-lg border border-amber-800/10 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Email Address</span>
                    <p className="font-mono text-white text-base">{user?.primaryEmailAddress?.emailAddress || email || "Guest User"}</p>
                  </div>
                  <div className="p-3.5 bg-zinc-900/90 rounded-lg border border-amber-800/10 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">User ID / Username</span>
                    <p className="font-mono text-white text-base">{user?.username || user?.id || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Password Reset Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  Password & Security
                </CardTitle>
                <CardDescription className="text-zinc-400">Change your password or manage multi-factor authentication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-300">
                  You can change your password, update security questions, or manage your email subscriptions directly through your account security portal.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    onClick={() => openUserProfile ? openUserProfile() : (window.location.href = "/sign-in")}
                    className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/40 font-bold"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Manage Password & Security
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session & Logout Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-amber-500" />
                  Account Session
                </CardTitle>
                <CardDescription className="text-zinc-400">Sign out of your active session on this device.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-300">Logged in as <span className="font-bold text-amber-400">{user?.primaryEmailAddress?.emailAddress || userName || "Adventurer"}</span></p>
                  <p className="text-xs text-zinc-400">Signing out will require you to log back in to access your kingdom.</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 font-bold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone: Delete Account */}
            <Card className="bg-gradient-to-b from-red-950/20 via-black to-zinc-950 border-red-900/50 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Danger Zone: Permanent Account Deletion
                </CardTitle>
                <CardDescription className="text-red-300/80">
                  Permanently wipe your account, hero stats, inventory, tiles, and kingdom data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-200 space-y-2">
                  <p className="font-bold text-sm">⚠️ Warning: This action cannot be undone!</p>
                  <p>Deleting your account will permanently purge all your character levels, custom quests, kingdom tiles, resources, items, and streak records from our databases.</p>
                </div>

                <div className="space-y-2 max-w-md pt-2">
                  <Label htmlFor="delete-confirm" className="text-xs text-zinc-300">
                    Type <span className="font-bold text-red-400">DELETE</span> to confirm:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="bg-zinc-950 border-red-900/50 text-red-200 uppercase font-mono"
                    />
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                      variant="destructive"
                      className="bg-red-700 hover:bg-red-600 text-white font-bold shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

