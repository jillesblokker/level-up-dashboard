"use client"

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Loader2,
  Search,
  User,
  Save,
  Map,
  ScrollText,
  Database,
  BarChart3,
  ShieldAlert,
  PlusCircle,
  Sword,
  BookOpen,
  Crown,
  Trees,
  Mountain,
  Waves,
  Flower2,
  Settings2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Volume2,
  Moon,
  Zap,
  Leaf
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('stats')
  const [seedingChallenges, setSeedingChallenges] = useState(false)
  const { getToken, isLoaded } = useAuth()
  const { user } = useUser();

  // Stats / User Management State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundUsers, setFoundUsers] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<any>(null)

  const [statsForm, setStatsForm] = useState({ gold: 0, experience: 0, level: 1 })
  const [preferencesForm, setPreferencesForm] = useState<Record<string, any>>({})

  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Danger Zone State
  const [actionType, setActionType] = useState<'reset' | 'delete' | null>(null)

  // Quest Manager State
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    category: 'might',
    difficulty: 'medium',
    xp: 50,
    gold: 25
  })
  const [isCreatingQuest, setIsCreatingQuest] = useState(false)

  // Realm / Tile Logic
  const [tileForm, setTileForm] = useState({ tileId: '', userId: '' })
  const [isAssigningTile, setIsAssigningTile] = useState(false)

  // Security Check
  if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-amber-500 w-8 h-8" /></div>

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'jillesblokker@gmail.com';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 space-y-4 bg-zinc-950 text-white">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-red-500 tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground text-lg max-w-md">You do not have the required clearance to view the Royal Administration panel.</p>
        <Button onClick={() => window.location.href = '/'} variant="outline" className="mt-4 border-zinc-700 hover:bg-zinc-800">Return to Kingdom</Button>
      </div>
    );
  }

  // Seeding Function
  const seedChallenges = async () => {
    setSeedingChallenges(true)
    try {
      const token = await getToken()
      const response = await fetch('/api/seed-challenges?key=seed123', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: TEXT_CONTENT.admin.toasts.seedingSuccess.title, description: data.message })
      } else {
        toast({ title: TEXT_CONTENT.admin.toasts.seedingError.title, description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to connect", variant: 'destructive' })
    } finally {
      setSeedingChallenges(false)
    }
  }

  // User Search Function
  const handleSearchUsers = async () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setFoundUsers(data.users || []);
        if (data.users.length === 0) toast({ title: "No users found", description: "Try searching for a different username." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  const selectUser = async (u: any) => {
    // Optimistic set
    setEditingUser(u);
    setFoundUsers([]); // Clear search to focus on edit
    setTileForm(prev => ({ ...prev, userId: u.user_id }));

    // Fetch full details
    try {
      const res = await fetch(`/api/admin/users?userId=${u.user_id}`);
      const data = await res.json();

      if (res.ok && data.user) {
        const detailedUser = data.user;
        setStatsForm({
          gold: detailedUser.gold || 0,
          experience: detailedUser.experience || 0,
          level: detailedUser.level || 1
        });
        setPreferencesForm(detailedUser.preferences || {});
      }
    } catch (e) {
      toast({ title: "Warning", description: "Failed to load detailed preferences", variant: "destructive" });
    }
  }

  const saveStats = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'stats',
          userId: editingUser.user_id,
          updates: statsForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Stats Updated", description: `Updated stats for ${editingUser.display_name}` });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const togglePreference = async (key: string, value: any) => {
    // Optimistic update
    setPreferencesForm(prev => ({ ...prev, [key]: value }));

    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'preference',
          userId: editingUser.user_id,
          updates: { [key]: value }
        })
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to sync preference", variant: "destructive" });
    }
  }

  const performDangerAction = async () => {
    if (!editingUser || !actionType) return;
    setIsProcessingAction(true);

    try {
      const res = await fetch(`/api/admin/users?userId=${editingUser.user_id}&action=${actionType}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: data.message });
        if (actionType === 'delete') {
          setEditingUser(null);
          setStatsForm({ gold: 0, experience: 0, level: 1 });
          setPreferencesForm({});
        } else {
          // Reset stats in UI
          setStatsForm({ gold: 0, experience: 0, level: 1 });
        }
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
      setActionType(null);
    }
  }

  const createQuest = async () => {
    setIsCreatingQuest(true);
    try {
      const res = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questForm)
      });
      if (res.ok) {
        toast({ title: "Quest Created", description: `Created quest "${questForm.title}"` });
        setQuestForm({
          title: '',
          description: '',
          category: 'might',
          difficulty: 'medium',
          xp: 50,
          gold: 25
        });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setIsCreatingQuest(false);
    }
  }

  const assignTile = async () => {
    if (!tileForm.userId || !tileForm.tileId) {
      toast({ title: "Validation Error", description: "Please select a user and tile ID", variant: "destructive" });
      return;
    }
    setIsAssigningTile(true);
    try {
      const res = await fetch('/api/admin/tile-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tileForm)
      });
      if (res.ok) {
        toast({ title: "Tile Assigned", description: `Gave ${tileForm.tileId} to user` });
      } else {
        toast({ title: "Error", description: "Failed to assign", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setIsAssigningTile(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto p-6 max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Game Admin</h1>
            <p className="text-zinc-400">Manage players, economy, and game content.</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-300">Admin: {user.primaryEmailAddress?.emailAddress}</span>
          </div>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">

          {/* Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg gap-2">
            <TabsTrigger value="stats" className="h-12 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-zinc-400 gap-2">
              <BarChart3 className="w-4 h-4" /> Player Stats
            </TabsTrigger>
            <TabsTrigger value="quests" className="h-12 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-zinc-400 gap-2">
              <ScrollText className="w-4 h-4" /> Quest Manager
            </TabsTrigger>
            <TabsTrigger value="realm" className="h-12 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-zinc-400 gap-2">
              <Map className="w-4 h-4" /> Realm Map
            </TabsTrigger>
            <TabsTrigger value="export" className="h-12 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-zinc-400 gap-2">
              <Database className="w-4 h-4" /> Database
            </TabsTrigger>
          </TabsList>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Panel */}
              <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl h-fit">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><Search className="w-5 h-5 text-amber-500" /> Find Player</CardTitle>
                  <CardDescription>Search by username or email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                      className="bg-zinc-950 border-zinc-700 focus:border-amber-500"
                    />
                    <Button onClick={handleSearchUsers} disabled={isSearching} className="bg-zinc-800 hover:bg-zinc-700 text-white">
                      {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="border border-zinc-800 rounded-md bg-zinc-950/50 min-h-[300px] max-h-[500px] overflow-y-auto p-2 space-y-2">
                    {foundUsers.length === 0 && !isSearching && (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                        <User className="w-8 h-8 opacity-20" />
                        <span className="text-sm">Enter a name to search...</span>
                      </div>
                    )}
                    {foundUsers.map(u => (
                      <div
                        key={u.user_id}
                        className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center gap-3 ${editingUser?.user_id === u.user_id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                        onClick={() => selectUser(u)}
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-bold border border-zinc-700">
                          {u.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm text-zinc-100 truncate">{u.display_name || "Unknown"}</p>
                          <p className="text-xs text-zinc-500 font-mono truncate">{u.user_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Editor Panel */}
              <Card className="lg:col-span-2 bg-zinc-900/30 border-zinc-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><User className="w-5 h-5 text-amber-500" /> Player Editor</CardTitle>
                  <CardDescription>Modify currency, experience, and character stats.</CardDescription>
                </CardHeader>
                <CardContent>
                  {editingUser ? (
                    <div className="space-y-8">
                      {/* User Badge */}
                      <div className="flex items-center gap-4 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                          {editingUser.display_name?.[0]?.toUpperCase() || <User />}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{editingUser.display_name}</h3>
                          <p className="text-zinc-500 font-mono text-xs mt-1">{editingUser.user_id}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Level {statsForm.level}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Gold Coins</Label>
                          <div className="relative">
                            <div className="absolute left-3 top-2.5 text-amber-500 font-bold">G</div>
                            <Input
                              type="number"
                              value={statsForm.gold}
                              onChange={(e) => setStatsForm(prev => ({ ...prev, gold: parseInt(e.target.value) || 0 }))}
                              className="pl-8 bg-zinc-950 border-zinc-700 text-lg"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Experience Points (XP)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-blue-500 font-bold">XP</span>
                            <Input
                              type="number"
                              value={statsForm.experience}
                              onChange={(e) => setStatsForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                              className="pl-10 bg-zinc-950 border-zinc-700 text-lg"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Character Level</Label>
                          <Input
                            type="number"
                            value={statsForm.level}
                            onChange={(e) => setStatsForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                            className="bg-zinc-950 border-zinc-700 text-lg"
                          />
                        </div>
                      </div>

                      {/* Settings/Preferences Toggles */}
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h4 className="text-lg font-bold flex items-center gap-2"><Settings2 className="w-5 h-5 text-zinc-400" /> Player Settings</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                              <Leaf className="w-5 h-5 text-green-500" />
                              <Label>Zen Mode</Label>
                            </div>
                            <Switch
                              checked={preferencesForm['zenMode'] || false}
                              onCheckedChange={(val) => togglePreference('zenMode', val)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                              <Volume2 className="w-5 h-5 text-purple-500" />
                              <Label>Sound Effects</Label>
                            </div>
                            <Switch
                              checked={preferencesForm['soundEnabled'] !== false}
                              onCheckedChange={(val) => togglePreference('soundEnabled', val)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                              <Moon className="w-5 h-5 text-blue-500" />
                              <Label>Day/Night Cycle</Label>
                            </div>
                            <Switch
                              checked={preferencesForm['dayNightEnabled'] !== false}
                              onCheckedChange={(val) => togglePreference('dayNightEnabled', val)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-amber-500" />
                              <Label>High Quality Anim</Label>
                            </div>
                            <Switch
                              checked={preferencesForm['animationQuality'] !== 'low'}
                              onCheckedChange={(val) => togglePreference('animationQuality', val ? 'high' : 'low')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h4 className="text-lg font-bold flex items-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /> Danger Zone</h4>
                        <div className="flex gap-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950 hover:text-red-300" onClick={() => setActionType('reset')}>
                                <RefreshCw className="mr-2 w-4 h-4" /> Reset Progress
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reset the user&apos;s level, gold, xp, and inventory. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={performDangerAction}>I understand, reset account</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="bg-red-900 hover:bg-red-800 text-white border border-red-700" onClick={() => setActionType('delete')}>
                                <Trash2 className="mr-2 w-4 h-4" /> Delete User Data
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                                <AlertDialogDescription className="text-red-200">
                                  This will permanently delete ALL data associated with this user (Stats, Inventory, Preferences, Streaks). The user will be fresh upon next login.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-900 hover:bg-red-800 text-white border border-red-700" onClick={performDangerAction}>Yes, delete everything</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-zinc-800">
                        <Button onClick={saveStats} disabled={isSaving} size="lg" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 shadow-lg shadow-green-900/20">
                          {isSaving ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <Save className="mr-2 w-5 h-5" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                      <User className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-lg">Select a player from the search results to edit</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* QUESTS TAB */}
          <TabsContent value="quests" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl max-w-4xl mx-auto">
              <CardHeader className="border-b border-zinc-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg"><ScrollText className="w-6 h-6 text-amber-500" /></div>
                  <div>
                    <CardTitle className="text-2xl">Quest Creator</CardTitle>
                    <CardDescription className="text-base">Design new global quests for all adventurers.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Quest Title</Label>
                      <Input
                        value={questForm.title}
                        onChange={e => setQuestForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Slay the Dragon"
                        className="h-12 bg-zinc-950 border-zinc-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Category</Label>
                      <Select value={questForm.category} onValueChange={(val) => setQuestForm(p => ({ ...p, category: val }))}>
                        <SelectTrigger className="h-12 bg-zinc-950 border-zinc-700">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                          <SelectItem value="might"><div className="flex items-center gap-2"><Sword className="w-4 h-4 text-red-500" /> Might</div></SelectItem>
                          <SelectItem value="knowledge"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Knowledge</div></SelectItem>
                          <SelectItem value="honor"><div className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Honor</div></SelectItem>
                          <SelectItem value="castle"><div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-slate-500" /> Castle</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-blue-400">XP Reward</Label>
                        <Input type="number" value={questForm.xp} onChange={e => setQuestForm(p => ({ ...p, xp: parseInt(e.target.value) }))} className="bg-zinc-950 border-zinc-700 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-amber-400">Gold Reward</Label>
                        <Input type="number" value={questForm.gold} onChange={e => setQuestForm(p => ({ ...p, gold: parseInt(e.target.value) }))} className="bg-zinc-950 border-zinc-700 font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-2 h-full flex flex-col">
                      <Label className="text-base font-medium">Description</Label>
                      <Textarea
                        value={questForm.description}
                        onChange={e => setQuestForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the task in detail..."
                        className="flex-1 min-h-[160px] bg-zinc-950 border-zinc-700 resize-none p-4"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-zinc-950/50 p-6 flex justify-end border-t border-zinc-800">
                <Button onClick={createQuest} disabled={isCreatingQuest} size="lg" className="bg-amber-600 hover:bg-amber-500 text-white font-bold w-full md:w-auto px-10">
                  {isCreatingQuest ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 w-5 h-5" />}
                  Create Global Quest
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* REALM TAB */}
          <TabsContent value="realm" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3"><Map className="w-6 h-6 text-green-500" /> Tile Assigner</CardTitle>
                <CardDescription>Grant special tiles directly to a player&apos;s inventory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                  <div className="mt-1"><ShieldAlert className="w-5 h-5 text-blue-400" /></div>
                  <p className="text-sm text-blue-200">
                    <strong>Admin Tip:</strong> Ensure you have the correct User ID from the &quot;Player Stats&quot; tab. Tiles are added immediately to their inventory.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Target User ID</Label>
                  <Input value={tileForm.userId} onChange={e => setTileForm(p => ({ ...p, userId: e.target.value }))} placeholder="Paste User ID here..." className="bg-zinc-950 border-zinc-700 font-mono" />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Tile Type</Label>
                  <Select value={tileForm.tileId} onValueChange={(val) => setTileForm(p => ({ ...p, tileId: val }))}>
                    <SelectTrigger className="h-12 bg-zinc-950 border-zinc-700">
                      <SelectValue placeholder="Select a Tile..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                      <SelectItem value="grass-1"><div className="flex items-center gap-2"><Trees className="w-4 h-4 text-green-500" /> Grass Tile</div></SelectItem>
                      <SelectItem value="forest-1"><div className="flex items-center gap-2"><Trees className="w-4 h-4 text-emerald-700" /> Forest Tile</div></SelectItem>
                      <SelectItem value="water-1"><div className="flex items-center gap-2"><Waves className="w-4 h-4 text-blue-500" /> Water Tile</div></SelectItem>
                      <SelectItem value="mountain-1"><div className="flex items-center gap-2"><Mountain className="w-4 h-4 text-zinc-500" /> Mountain Tile</div></SelectItem>
                      <SelectItem value="zen-garden-1"><div className="flex items-center gap-2"><Flower2 className="w-4 h-4 text-pink-500" /> Zen Garden (Rare)</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="pt-6 border-t border-zinc-800">
                <Button onClick={assignTile} disabled={isAssigningTile} size="lg" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold">
                  {isAssigningTile ? <Loader2 className="animate-spin mr-2" /> : "Grant Tile to Player"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SEEDING TAB */}
          <TabsContent value="export" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3"><Database className="w-6 h-6 text-purple-500" /> System Maintenance</CardTitle>
                <CardDescription>Database utilities and seeding operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-700 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-amber-500/50 transition-colors group">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors">Seed Challenges</h4>
                      <p className="text-zinc-400 text-sm max-w-md">Populates the global challenge database with the default set of workout and mindset challenges. Safe to run multiple times (upsert).</p>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="shrink-0 border-amber-600/30 text-amber-500 hover:bg-amber-900/20 hover:text-amber-400 font-bold"
                      onClick={seedChallenges}
                      disabled={seedingChallenges}
                    >
                      {seedingChallenges ? <Loader2 className="animate-spin mr-2" /> : "🌱"}
                      {seedingChallenges ? "Seeding..." : " Seed Challenges"}
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}