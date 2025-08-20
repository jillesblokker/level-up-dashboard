"use client"

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('realm')
  const [seedingChallenges, setSeedingChallenges] = useState(false)
  const { getToken } = useAuth()

  const seedChallenges = async () => {
    setSeedingChallenges(true)
    try {
      const token = await getToken()
      const response = await fetch('/api/seed-challenges?key=seed123', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success!',
          description: data.message || 'Challenges seeded successfully',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to seed challenges',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      })
    } finally {
      setSeedingChallenges(false)
    }
  }

  // 🎯 NEW: Sync data FROM Supabase TO localStorage
  const syncDataToLocalStorage = async () => {
    try {
      setSyncLoading(true);
      
      // 1. Sync Quest Completions
      const questResponse = await fetch('/api/quests-simple');
      if (questResponse.ok) {
        const questData = await questResponse.json();
        const completedQuests = questData.completedQuests || [];
        
        // Store in localStorage
        localStorage.setItem('questCompletions', JSON.stringify(completedQuests));
        console.log('[Admin] Synced', completedQuests.length, 'quest completions to localStorage');
      }
      
      // 2. Sync Gold Transactions
      const goldResponse = await fetch('/api/gold-transactions');
      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        const goldTransactions = goldData.data || [];
        
        // Store in localStorage
        localStorage.setItem('goldTransactions', JSON.stringify(goldTransactions));
        console.log('[Admin] Synced', goldTransactions.length, 'gold transactions to localStorage');
      }
      
      // 3. Sync Experience Transactions
      const expResponse = await fetch('/api/experience-transactions');
      if (expResponse.ok) {
        const expData = await expResponse.json();
        const expTransactions = expData.data || [];
        
        // Store in localStorage
        localStorage.setItem('experienceTransactions', JSON.stringify(expTransactions));
        console.log('[Admin] Synced', expTransactions.length, 'experience transactions to localStorage');
      }
      
      // 4. Sync Inventory Items
      const inventoryResponse = await fetch('/api/inventory');
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        const inventoryItems = inventoryData || [];
        
        // Store in localStorage
        localStorage.setItem('inventory', JSON.stringify(inventoryItems));
        console.log('[Admin] Synced', inventoryItems.length, 'inventory items to localStorage');
      }
      
      // Refresh the page to show updated counts
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('[Admin] Error syncing data:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Game Admin Dashboard</h1>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        {/* Mobile tab selector */}
        <div className="mb-4 md:hidden">
          <label htmlFor="admin-tab-select" className="sr-only">Select admin tab</label>
          <select
            id="admin-tab-select"
            aria-label="Admin dashboard tab selector"
            className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
            value={selectedTab}
            onChange={e => setSelectedTab(e.target.value)}
          >
            <option value="realm">Realm Map</option>
            <option value="quests">Daily Quests</option>
            <option value="stats">Player Stats</option>
            <option value="export">Export/Import</option>
          </select>
        </div>
        <TabsList className="grid w-full grid-cols-4 hidden md:grid">
          <TabsTrigger value="realm">Realm Map</TabsTrigger>
          <TabsTrigger value="quests">Daily Quests</TabsTrigger>
          <TabsTrigger value="stats">Player Stats</TabsTrigger>
          <TabsTrigger value="export">Export/Import</TabsTrigger>
        </TabsList>

        <TabsContent value="realm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Realm Map Editor</CardTitle>
              <CardDescription>Edit your realm layout and buildings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Map Grid</Label>
                  <ScrollArea className="h-[500px] w-full border rounded-md p-4">
                    {/* Grid editor will go here */}
                    <div className="grid grid-cols-10 gap-1">
                      {Array(100).fill(0).map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-gray-200 rounded cursor-pointer hover:bg-blue-200" />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Selected Tile</Label>
                    <div className="p-4 border rounded-md">
                      <p>Position: X: 0, Y: 0</p>
                      <p>Type: Grass</p>
                      <p>Building: None</p>
                    </div>
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Quests Manager</CardTitle>
              <CardDescription>Manage and track daily quests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input type="date" />
                  <Button>Load Quests</Button>
                </div>
                <ScrollArea className="h-[400px] w-full border rounded-md p-4">
                  {/* Quest list will go here */}
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="p-4 border rounded-md">
                        <h3 className="font-bold">Quest #{i + 1}</h3>
                        <p>Status: Incomplete</p>
                        <p>Reward: 100 Gold</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>View and edit player stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gold</Label>
                  <Input type="number" placeholder="1000" />
                </div>
                <div>
                  <Label>Experience</Label>
                  <Input type="number" placeholder="500" />
                </div>
                <div>
                  <Label>Level</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <div>
                  <Label>Population</Label>
                  <Input type="number" placeholder="100" />
                </div>
                <div className="col-span-2">
                  <Button className="w-full">Update Stats</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export/Import Data</CardTitle>
              <CardDescription>Backup or restore your game data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Export Data</Label>
                  <div className="flex gap-2">
                    <Button className="w-full">Export as CSV</Button>
                    <Button className="w-full">Export as JSON</Button>
                  </div>
                </div>
                <div>
                  <Label>Import Data</Label>
                  <Input type="file" className="w-full" />
                  <Button className="w-full mt-2">Import Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Seeding</CardTitle>
              <CardDescription>Initialize database with default data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Seed Challenges</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Populate the challenges table with 24 workout challenges across 5 categories
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={seedChallenges}
                    disabled={seedingChallenges}
                  >
                    {seedingChallenges ? 'Seeding...' : 'Seed Workout Challenges'}
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