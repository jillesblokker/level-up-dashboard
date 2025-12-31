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
import { TEXT_CONTENT } from "@/lib/text-content"

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

      const data = await response.json()
      if (response.ok) {
        if (data.message) {
          toast({
            title: TEXT_CONTENT.admin.toasts.seedingSuccess.title,
            description: data.message || TEXT_CONTENT.admin.toasts.seedingSuccess.description,
          })
        }
      } else {
        const error = await response.json()
        toast({
          title: TEXT_CONTENT.admin.toasts.seedingError.title,
          description: error.error || TEXT_CONTENT.admin.toasts.seedingError.description,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: TEXT_CONTENT.admin.toasts.networkError.title,
        description: TEXT_CONTENT.admin.toasts.networkError.description,
        variant: 'destructive',
      })
    } finally {
      setSeedingChallenges(false)
    }
  }



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">{TEXT_CONTENT.admin.title}</h1>

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
          <TabsTrigger value="realm">{TEXT_CONTENT.admin.tabs.realm}</TabsTrigger>
          <TabsTrigger value="quests">{TEXT_CONTENT.admin.tabs.quests}</TabsTrigger>
          <TabsTrigger value="stats">{TEXT_CONTENT.admin.tabs.stats}</TabsTrigger>
          <TabsTrigger value="export">{TEXT_CONTENT.admin.tabs.export}</TabsTrigger>
        </TabsList>

        <TabsContent value="realm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.realm.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.realm.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.realm.gridLabel}</Label>
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
                    <Label>{TEXT_CONTENT.admin.sections.realm.selectedTile}</Label>
                    <div className="p-4 border rounded-md">
                      <p>Position: X: 0, Y: 0</p>
                      <p>Type: Grass</p>
                      <p>Building: None</p>
                    </div>
                  </div>
                  <Button>{TEXT_CONTENT.admin.sections.realm.save}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.quests.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.quests.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input type="date" />
                  <Button>{TEXT_CONTENT.admin.sections.quests.load}</Button>
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
              <CardTitle>{TEXT_CONTENT.admin.sections.stats.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.stats.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.stats.labels.gold}</Label>
                  <Input type="number" placeholder="1000" />
                </div>
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.stats.labels.experience}</Label>
                  <Input type="number" placeholder="500" />
                </div>
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.stats.labels.level}</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.stats.labels.population}</Label>
                  <Input type="number" placeholder="100" />
                </div>
                <div className="col-span-2">
                  <Button className="w-full">{TEXT_CONTENT.admin.sections.stats.update}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.export.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.export.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.export.exportLabel}</Label>
                  <div className="flex gap-2">
                    <Button className="w-full">{TEXT_CONTENT.admin.sections.export.exportCsv}</Button>
                    <Button className="w-full">{TEXT_CONTENT.admin.sections.export.exportJson}</Button>
                  </div>
                </div>
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.export.importLabel}</Label>
                  <Input type="file" className="w-full" />
                  <Button className="w-full mt-2">{TEXT_CONTENT.admin.sections.export.importButton}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{TEXT_CONTENT.admin.sections.seeding.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.admin.sections.seeding.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{TEXT_CONTENT.admin.sections.seeding.challenges.label}</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    {TEXT_CONTENT.admin.sections.seeding.challenges.description}
                  </p>
                  <Button
                    className="w-full"
                    onClick={seedChallenges}
                    disabled={seedingChallenges}
                  >
                    {seedingChallenges ? TEXT_CONTENT.admin.sections.seeding.challenges.seeding : TEXT_CONTENT.admin.sections.seeding.challenges.button}
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