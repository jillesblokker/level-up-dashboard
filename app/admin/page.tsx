"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTitle } from "@/components/ui/page-title"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function AdminPage() {
  const [gameData, setGameData] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGameData()
  }, [])

  const fetchGameData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/game-data')
      const data = await response.json()
      setGameData(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error fetching game data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch game data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const data = JSON.parse(gameData)
      
      const response = await fetch('/api/game-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save game data')
      }

      toast({
        title: "Success",
        description: "Game data saved successfully",
      })
    } catch (error) {
      console.error('Error saving game data:', error)
      toast({
        title: "Error",
        description: "Failed to save game data. Make sure the JSON is valid.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <PageTitle>Game Data Admin</PageTitle>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Edit Game Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={gameData}
              onChange={(e) => setGameData(e.target.value)}
              className="min-h-[500px] font-mono"
              placeholder="Loading game data..."
              disabled={loading}
            />
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={loading}>
                Save Changes
              </Button>
              <Button onClick={fetchGameData} variant="outline" disabled={loading}>
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 