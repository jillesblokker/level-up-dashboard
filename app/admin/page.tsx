"use client"

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TEXT_CONTENT } from "@/lib/text-content"
import { Search, User, Save, Loader2 } from 'lucide-react'

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('realm')
  const [seedingChallenges, setSeedingChallenges] = useState(false)
  const { getToken } = useAuth()
  const { user } = useUser();

  // Stats / User Management State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundUsers, setFoundUsers] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<any>(null)
  const [statsForm, setStatsForm] = useState({ gold: 0, experience: 0, level: 1 })
  const [isSaving, setIsSaving] = useState(false)

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
        if (data.users.length === 0) toast({ title: "No users found" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  const selectUser = (u: any) => {
    setEditingUser(u);
    if (u.stats) {
      setStatsForm({
        gold: u.stats.gold || 0,
        experience: u.stats.experience || 0,
        level: u.stats.level || 1
      });
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
          userId: editingUser.user_id,
          updates: statsForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Stats Updated", description: `Updated stats for ${editingUser.display_name}` });
        // Update local list
        setEditingUser((prev: any) => ({ ...prev, stats: { ...prev.stats, ...statsForm } }));
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{TEXT_CONTENT.admin.title}</h1>
        {user && <p className="text-muted-foreground">Admin: {user.primaryEmailAddress?.emailAddress}</p>}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realm">{TEXT_CONTENT.admin.tabs.realm}</TabsTrigger>
          <TabsTrigger value="quests">{TEXT_CONTENT.admin.tabs.quests}</TabsTrigger>
          <TabsTrigger value="stats">{TEXT_CONTENT.admin.tabs.stats}</TabsTrigger>
          <TabsTrigger value="export">{TEXT_CONTENT.admin.tabs.export}</TabsTrigger>
        </TabsList>

        {/* REALM TAB (Placeholder) */}
        <TabsContent value="realm">
          <Card>
            <CardHeader><CardTitle>Realm Editor</CardTitle><CardDescription>Coming soon...</CardDescription></CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
              Map editing features will appear here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTS TAB (Placeholder) */}
        <TabsContent value="quests">
          <Card>
            <CardHeader><CardTitle>Quest Manager</CardTitle><CardDescription>Coming soon...</CardDescription></CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
              Daily Quest management features will appear here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATS TAB - FUNCTIONAL */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.stats.title}</CardTitle>
              <CardDescription>Search for a user to edit their currency and levels.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                </div>
                <Button onClick={handleSearchUsers} disabled={isSearching}>
                  {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : "Search"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Results List */}
                <div className="border rounded-md p-2 h-[400px] overflow-y-auto space-y-2">
                  {foundUsers.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm">No users found.</p>}
                  {foundUsers.map(u => (
                    <div
                      key={u.user_id}
                      className={`p-3 rounded cursor-pointer border hover:bg-zinc-900 transition-colors ${editingUser?.user_id === u.user_id ? 'bg-zinc-900 border-yellow-500' : 'border-transparent'}`}
                      onClick={() => selectUser(u)}
                    >
                      <p className="font-bold text-sm">{u.display_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.user_id}</p>
                    </div>
                  ))}
                </div>

                {/* Editor */}
                <div className="md:col-span-2 border rounded-md p-6 bg-zinc-950/50">
                  {editingUser ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center"><User /></div>
                        <div>
                          <h3 className="text-xl font-bold">{editingUser.display_name}</h3>
                          <p className="text-xs text-muted-foreground">{editingUser.user_id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gold</Label>
                          <Input
                            type="number"
                            value={statsForm.gold}
                            onChange={(e) => setStatsForm(prev => ({ ...prev, gold: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Input
                            type="number"
                            value={statsForm.level}
                            onChange={(e) => setStatsForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Experience</Label>
                          <Input
                            type="number"
                            value={statsForm.experience}
                            onChange={(e) => setStatsForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button onClick={saveStats} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                          {isSaving ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Select a user to edit stats
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEEDING TAB - FUNCTIONAL */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.seeding.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.seeding.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 bg-zinc-950 p-6 rounded-md border border-zinc-800">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-lg">{TEXT_CONTENT.admin.sections.seeding.challenges.label}</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      {TEXT_CONTENT.admin.sections.seeding.challenges.description}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-yellow-500/50 hover:bg-yellow-900/20"
                    onClick={seedChallenges}
                    disabled={seedingChallenges}
                  >
                    {seedingChallenges ? <Loader2 className="animate-spin mr-2" /> : "🌱"}
                    {seedingChallenges ? TEXT_CONTENT.admin.sections.seeding.challenges.seeding : "Seed Challenges"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}