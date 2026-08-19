"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { ArrowLeft, Save, User, Shield, Play, Palette, Bell, HeartPulse, Gamepad2, LogOut, KeyRound, Trash2, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react"
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


import { getAppThemeSync, setAppTheme, AppTheme } from "@/lib/theme-manager"

export default function SettingsPage() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>('medieval')
  const [showCompanionHints, setShowCompanionHints] = useState(true)

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
  const [showCompanionNecrion, setShowCompanionNecrion] = useState(true)
  const [showGuardianPartner, setShowGuardianPartner] = useState(true)
  const [muteGoldToasts, setMuteGoldToasts] = useState(false)
  const [muteXpToasts, setMuteXpToasts] = useState(false)
  const [muteQuestToasts, setMuteQuestToasts] = useState(false)
  const [sanctuaryModeActive, setSanctuaryModeActive] = useState(false)
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [vacationShieldDays, setVacationShieldDays] = useState(0)
  const [activeSeasonalEvent, setActiveSeasonalEvent] = useState('auto')

  // Load user data
  useEffect(() => {
    try {
      const savedEvent = localStorage.getItem("active-seasonal-event-override")
      if (savedEvent) {
        setActiveSeasonalEvent(savedEvent)
      } else {
        setActiveSeasonalEvent('auto')
      }
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

      // Load Companion, Guardian & Hints visibility
      const savedCompanion = localStorage.getItem("show-companion-necrion")
      if (savedCompanion !== null) {
        setShowCompanionNecrion(savedCompanion === "true")
      }
      const savedGuardian = localStorage.getItem("show-guardian-partner")
      if (savedGuardian !== null) {
        setShowGuardianPartner(savedGuardian === "true")
      }
      const savedHints = localStorage.getItem("show-companion-hints")
      if (savedHints !== null) {
        setShowCompanionHints(savedHints === "true")
      }

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

      // Load Theme preference
      setSelectedTheme(getAppThemeSync())

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
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">Global Application Settings</h1>
            <p className="text-zinc-400">Manage Your Hero Profile, Gameplay Features, Theme Aesthetics, And Security Preferences</p>
          </div>
          <Link href="/kingdom">
            <Button variant="outline" className="text-white border-amber-800/20 hover:bg-amber-900/20 flex items-center gap-2.5">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back To Kingdom
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile tab selector */}
          <div className="mb-4 md:hidden">
            <label htmlFor="settings-tab-select" className="sr-only">Select Settings Tab</label>
            <select
              id="settings-tab-select"
              aria-label="Settings Tab Selector"
              className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2 font-bold text-sm"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
            >
              <option value="profile">Hero Profile</option>
              <option value="gameplay">Gameplay Features</option>
              <option value="appearance">Theme & Aesthetics</option>
              <option value="account">Account Security</option>
            </select>
          </div>
          <TabsList className="bg-zinc-900 border-amber-800/20 hidden md:flex gap-2 p-1">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-900/20 flex items-center gap-2.5 px-4 py-2 font-bold text-xs">
              <User className="h-4 w-4 shrink-0 text-amber-400" />
              Hero Profile
            </TabsTrigger>
            <TabsTrigger value="gameplay" className="text-white data-[state=active]:bg-amber-900/20 flex items-center gap-2.5 px-4 py-2 font-bold text-xs">
              <Gamepad2 className="h-4 w-4 shrink-0 text-amber-400" />
              Gameplay Features
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-white data-[state=active]:bg-amber-900/20 flex items-center gap-2.5 px-4 py-2 font-bold text-xs">
              <Palette className="h-4 w-4 shrink-0 text-amber-400" />
              Theme & Aesthetics
            </TabsTrigger>
            <TabsTrigger value="account" className="text-white data-[state=active]:bg-amber-900/20 flex items-center gap-2.5 px-4 py-2 font-bold text-xs">
              <Shield className="h-4 w-4 shrink-0 text-amber-400" />
              Account Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-500 shrink-0" />
                  Hero Character Profile
                </CardTitle>
                <CardDescription className="text-zinc-400">Update Your Hero Name And Primary Account Email Address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-bold">Hero Character Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter Character Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-zinc-900 border-amber-800/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-bold">Primary Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter Primary Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-amber-800/20 text-white"
                  />
                  <p className="text-xs text-zinc-400">
                    Used for kingdom recovery and reward milestone receipts.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold flex items-center gap-2.5"
                  onClick={handleSaveProfile}
                >
                  <Save className="h-4 w-4 shrink-0" />
                  Save Profile Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="gameplay" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-amber-500 shrink-0" />
                  Gameplay Features & Mechanics
                </CardTitle>
                <CardDescription className="text-zinc-400">Manage Core Game Mechanics That Affect Your Daily Adventure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <HeartPulse className="w-4 h-4 text-pink-500 shrink-0" />
                      Sanctuary Mode Protection
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Activate Sanctuary Mode when sick, traveling, or taking a rest. Freezes habit streaks and prevents tax penalties.
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
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                      3-Day Vacation Shield
                      {vacationShieldDays > 0 && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold ml-2">Active ({vacationShieldDays}d Remaining)</span>}
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Freeze daily habit streak decay for up to 3 days while traveling without breaking your streak tokens.
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

                {/* Local Timezone Reset Engine */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      Local Timezone Reset Engine
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Daily quests reset strictly at local midnight to present un-checked daily habits every morning.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-xl">
                    🌐 {typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Local Time'}
                  </span>
                </div>

                {/* Active Seasonal Hide & Seek Event Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all gap-4">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      Active Seasonal Hide & Seek Event
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Select which seasonal item hunt (e.g. Easter Egg Hunt, Halloween Pumpkin Hunt) is active across your kingdom.
                    </p>
                  </div>
                  <select
                    value={activeSeasonalEvent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveSeasonalEvent(val);
                      if (val === 'auto') {
                        localStorage.setItem("active-seasonal-event-override", "auto");
                      } else {
                        localStorage.setItem("active-seasonal-event-override", val);
                      }
                      window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'));
                      toast({
                        title: "🎉 Seasonal Event Updated!",
                        description: val === 'auto' ? "Reverted to automatic real-time seasonal event!" : `Activated ${val.toUpperCase()} Hide & Seek hunt & seasonal tiles!`,
                      });
                    }}
                    className="bg-black border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl p-2.5 outline-none cursor-pointer shrink-0"
                  >
                    <option value="auto">🌐 Automatic (Real-Time Season/Month)</option>
                    <option value="christmas">🎄 Christmas Present Hunt (Winter)</option>
                    <option value="newyear">🎆 New Year Sparkler Hunt</option>
                    <option value="easter">🥚 Easter Egg Hunt (Spring)</option>
                    <option value="halloween">🎃 Halloween Pumpkin Hunt (Autumn)</option>
                    <option value="valentine">❤️ Valentine Heart Hunt</option>
                    <option value="spring">🍀 Spring Clover Hunt</option>
                    <option value="harvest">🌾 Harvest Wheat Hunt</option>
                    <option value="solstice">☀️ Solstice Sun Hunt</option>
                    <option value="firefly">🏮 Firefly Lantern Hunt</option>
                    <option value="forge_fire">⚒️ Forge Iron Ingot Hunt</option>
                    <option value="remembrance">📜 Heritage Scroll Hunt</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <Palette className="w-5 h-5 text-amber-500 shrink-0" />
                  Theme & Visual Aesthetics Options
                </CardTitle>
                <CardDescription className="text-zinc-400">Customize Visual Themes, Companion Displays, Speech Hints, And Audio Alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Theme Selection */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-500/30 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-bold flex items-center gap-3">
                      <Palette className="w-5 h-5 text-amber-400 shrink-0" />
                      Visual Aesthetic Theme Selection
                    </Label>
                    <p className="text-xs text-zinc-400 max-w-md">
                      Switch between Classic Dark mode and the rich Medieval RPG theme with ornate gold filigree and classical typography.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme('classic');
                        setAppTheme('classic');
                        toast({
                          title: "Theme Set to Classic Dark 🌑",
                          description: "Clean dark mode with gold accent highlights active."
                        });
                      }}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                        selectedTheme === 'classic'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-2xl shrink-0">🌑</div>
                      <div>
                        <div className="font-bold text-sm text-white">Classic Dark Mode</div>
                        <div className="text-[11px] text-zinc-400">Clean modern dark interface</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme('medieval');
                        setAppTheme('medieval');
                        toast({
                          title: "Theme Set to Medieval RPG ⚔️",
                          description: "Rich Sword & Staff aesthetic with gold filigree active."
                        });
                      }}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                        selectedTheme === 'medieval'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-2xl shrink-0">⚔️</div>
                      <div>
                        <div className="font-bold text-sm text-amber-300">Medieval RPG Theme (Default)</div>
                        <div className="text-[11px] text-amber-400/80">Sword & Staff gold filigree style</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Palette className="w-4 h-4 text-amber-500 shrink-0" />
                      Day & Night Lighting Cycle
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Automatically adjust ambient lighting for morning sunlight, warm evening dusk, and nocturnal night cycles.
                    </p>
                  </div>
                  <Switch
                    checked={dayNightEnabled}
                    onCheckedChange={(checked) => {
                      setDayNightEnabled(checked)
                      localStorage.setItem("day-night-cycle-enabled", checked.toString())
                      setUserPreference("day-night-cycle-enabled", checked)

                      if (!checked) {
                        document.documentElement.classList.remove('medieval-night')
                        document.body.classList.remove('medieval-night')
                      }

                      window.dispatchEvent(new CustomEvent('settings:dayNightChanged', { detail: { enabled: checked } }))

                      toast({
                        title: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.title : TEXT_CONTENT.settings.toasts.dayNightDisabled.title,
                        description: checked ? TEXT_CONTENT.settings.toasts.dayNightEnabled.desc : TEXT_CONTENT.settings.toasts.dayNightDisabled.desc,
                      })
                    }}
                  />
                </div>

                {/* Show Companion (Necrion) Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      Show Realm Companion (Necrion)
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Display Necrion standing at the bottom right corner as your realm mentor guide.
                    </p>
                  </div>
                  <Switch
                    checked={showCompanionNecrion}
                    onCheckedChange={(checked) => {
                      setShowCompanionNecrion(checked)
                      localStorage.setItem("show-companion-necrion", checked.toString())
                      setUserPreference("show-companion-necrion", checked)
                      window.dispatchEvent(new CustomEvent('settings:companionVisibilityChanged'))
                      toast({
                        title: checked ? "Companion Shown" : "Companion Hidden",
                        description: checked ? "Necrion is standing by on main pages." : "Necrion is resting in the realm shadows.",
                      })
                    }}
                  />
                </div>

                {/* Show Guardian / Companion Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                      Show Active Guardian & Companion Pet
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Display your active habit guardian (e.g. Ember Drake, Sage Owl) or creature companion beside Necrion.
                    </p>
                  </div>
                  <Switch
                    checked={showGuardianPartner}
                    onCheckedChange={(checked) => {
                      setShowGuardianPartner(checked)
                      localStorage.setItem("show-guardian-partner", checked.toString())
                      setUserPreference("show-guardian-partner", checked)
                      window.dispatchEvent(new CustomEvent('settings:companionVisibilityChanged'))
                      toast({
                        title: checked ? "Guardian Shown" : "Guardian Hidden",
                        description: checked ? "Your active guardian stands beside Necrion." : "Guardian is resting in the sanctuary.",
                      })
                    }}
                  />
                </div>

                {/* NEW TOGGLE: Show Companion & Pet Hints (Speech Bulbs) */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                      Show Companion & Pet Hints (Speech Bulbs)
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Display interactive wisdom tips, habit quotes, and speech bubbles above Necrion and your active pet.
                    </p>
                  </div>
                  <Switch
                    checked={showCompanionHints}
                    onCheckedChange={(checked) => {
                      setShowCompanionHints(checked)
                      localStorage.setItem("show-companion-hints", checked.toString())
                      setUserPreference("show-companion-hints", checked)
                      window.dispatchEvent(new CustomEvent('settings:companionVisibilityChanged'))
                      toast({
                        title: checked ? "Companion Hints Enabled 💬" : "Companion Hints Hidden 🤫",
                        description: checked ? "Interactive wisdom tips will pop up above companions." : "Companion speech bulbs muted.",
                      })
                    }}
                  />
                </div>

                {/* Holiday Mode / Streak Protection Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                      Holiday Mode (Streak Protection)
                    </Label>
                    <p className="text-sm text-zinc-400 max-w-md">
                      Pause daily quest reset tracking during sickness or vacation so you never lose your hard-earned habit streaks.
                    </p>
                  </div>
                  <Switch
                    checked={sanctuaryModeActive}
                    onCheckedChange={(checked) => {
                      setSanctuaryModeActive(checked);
                      localStorage.setItem("holiday-mode-active", checked.toString());
                      setUserPreference("holiday-mode-active", checked);
                      toast({
                        title: checked ? "Holiday Mode Enabled 🏖️" : "Holiday Mode Disabled ⚔️",
                        description: checked ? "Your habit streaks are protected while you rest." : "Daily quest reset tracking is active.",
                      });
                    }}
                  />
                </div>

                {/* Medieval Audio & Sound FX Control */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                  <div className="space-y-1">
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Bell className="w-4 h-4 text-purple-400 shrink-0" />
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
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Bell className="w-4 h-4 text-amber-500 shrink-0" />
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
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                      Mute Experience Points Alerts
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
                    <Label className="text-white text-base font-medium flex items-center gap-3">
                      <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                      Mute Quest Action Alerts
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
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-500 shrink-0" />
                  Account Security & Login Information
                </CardTitle>
                <CardDescription className="text-zinc-400">View And Manage Your Login Security Settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-zinc-900/90 rounded-lg border border-amber-800/10 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Primary Email Address</span>
                    <p className="font-mono text-white text-base">{user?.primaryEmailAddress?.emailAddress || email || "Guest User"}</p>
                  </div>
                  <div className="p-3.5 bg-zinc-900/90 rounded-lg border border-amber-800/10 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Account User ID</span>
                    <p className="font-mono text-white text-base">{user?.username || user?.id || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Password Reset Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-amber-500 shrink-0" />
                  Password & Security Settings
                </CardTitle>
                <CardDescription className="text-zinc-400">Manage Password Security And Multi-Factor Authentication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-300">
                  Update password settings and security questions through your authenticated account portal.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    onClick={() => openUserProfile ? openUserProfile() : (window.location.href = "/sign-in")}
                    className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/40 font-bold flex items-center gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Manage Password & Security Portal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session & Logout Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-amber-500 shrink-0" />
                  Account Session & Logout
                </CardTitle>
                <CardDescription className="text-zinc-400">Sign Out Of Your Active Session On This Device.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-300">Logged In As <span className="font-bold text-amber-400">{user?.primaryEmailAddress?.emailAddress || userName || "Adventurer"}</span></p>
                  <p className="text-xs text-zinc-400">Signing out will require logging back in to access your kingdom.</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 font-bold flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign Out Of Account
                </Button>
              </CardContent>
            </Card>

            {/* System Sync Status Card */}
            <Card className="bg-gradient-to-b from-black to-zinc-900 border-amber-800/20 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-white flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                  System Sync Status & Database Health
                </CardTitle>
                <CardDescription className="text-zinc-400">Server Verification Timestamps Per Core Game System.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-900/20 flex justify-between items-center">
                    <span className="text-zinc-300">Quests Completion Sync</span>
                    <span className="text-xs font-mono text-amber-400">Server Verified</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-900/20 flex justify-between items-center">
                    <span className="text-zinc-300">Character Level Stats</span>
                    <span className="text-xs font-mono text-amber-400">Server Verified</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-900/20 flex justify-between items-center">
                    <span className="text-zinc-300">Kingdom Sandbox Grid</span>
                    <span className="text-xs font-mono text-amber-400">Server Verified</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-900/20 flex justify-between items-center">
                    <span className="text-zinc-300">Property Tax Timers</span>
                    <span className="text-xs font-mono text-amber-400">Server Verified</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">All client updates push directly to Supabase authenticated API routes.</p>
              </CardContent>
            </Card>

            {/* Danger Zone: Delete Account */}
            <Card className="bg-gradient-to-b from-red-950/20 via-black to-zinc-950 border-red-900/50 text-white">
              <CardHeader>
                <CardTitle className="font-serif text-red-400 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  Danger Zone: Permanent Account Deletion
                </CardTitle>
                <CardDescription className="text-red-300/80">
                  Permanently Wipe Your Account, Hero Stats, Inventory, Tiles, And Kingdom Progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-200 space-y-2">
                  <p className="font-bold text-sm">⚠️ Warning: This Action Cannot Be Undone!</p>
                  <p>Deleting your account will permanently purge all character levels, custom quests, kingdom tiles, and streak records.</p>
                </div>

                <div className="space-y-2 max-w-md pt-2">
                  <Label htmlFor="delete-confirm" className="text-xs text-zinc-300">
                    Type <span className="font-bold text-red-400">DELETE</span> To Confirm Deletion:
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
                      className="bg-red-700 hover:bg-red-600 text-white font-bold shrink-0 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
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

