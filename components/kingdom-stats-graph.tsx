"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollText, Coins, Trophy } from "lucide-react"
import { calculateKingdomStats } from "@/lib/kingdom-stats"
import { db } from "@/lib/database"
import { MapGrid } from "@/types/tiles"

// Mock data for the graphs
const mockQuestData = [
  { day: "Mon", value: 4 },
  { day: "Tue", value: 2 },
  { day: "Wed", value: 6 },
  { day: "Thu", value: 3 },
  { day: "Fri", value: 5 },
  { day: "Sat", value: 8 },
  { day: "Sun", value: 7 },
]

const mockGoldData = [
  { day: "Mon", value: 150 },
  { day: "Tue", value: 75 },
  { day: "Wed", value: 320 },
  { day: "Thu", value: 110 },
  { day: "Fri", value: 250 },
  { day: "Sat", value: 400 },
  { day: "Sun", value: 300 },
]

const mockExpData = [
  { day: "Mon", value: 30 },
  { day: "Tue", value: 20 },
  { day: "Wed", value: 60 },
  { day: "Thu", value: 35 },
  { day: "Fri", value: 45 },
  { day: "Sat", value: 80 },
  { day: "Sun", value: 65 },
]

export function KingdomStatsGraph() {
  const [activeTab, setActiveTab] = useState("quests")
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  
  // Initialize with mock data
  const [questsData, setQuestsData] = useState([
    { day: "Mon", value: 3 },
    { day: "Tue", value: 5 },
    { day: "Wed", value: 2 },
    { day: "Thu", value: 4 },
    { day: "Fri", value: 6 },
    { day: "Sat", value: 3 },
    { day: "Sun", value: 0 },
  ])
  
  const [goldData, setGoldData] = useState([
    { day: "Mon", value: 150 },
    { day: "Tue", value: 75 },
    { day: "Wed", value: 220 },
    { day: "Thu", value: 180 },
    { day: "Fri", value: 90 },
    { day: "Sat", value: 250 },
    { day: "Sun", value: 0 },
  ])
  
  const [expData, setExpData] = useState([
    { day: "Mon", value: 80 },
    { day: "Tue", value: 120 },
    { day: "Wed", value: 95 },
    { day: "Thu", value: 140 },
    { day: "Fri", value: 75 },
    { day: "Sat", value: 110 },
    { day: "Sun", value: 0 },
  ])

  // Load saved stats on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const savedStats = await db.getQuestStats();
        if (savedStats) {
          if (savedStats.quests) setQuestsData(savedStats.quests);
          if (savedStats.gold) setGoldData(savedStats.gold);
          if (savedStats.exp) setExpData(savedStats.exp);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, []);

  // Save stats when they change
  useEffect(() => {
    const saveStats = async () => {
      try {
        await db.saveQuestStats({
          quests: questsData,
          gold: goldData,
          exp: expData
        });
      } catch (error) {
        console.error("Error saving stats:", error);
      }
    };

    saveStats();
  }, [questsData, goldData, expData]);

  // Listen for updates to graph data
  useEffect(() => {
    // When a quest is completed
    const handleQuestComplete = () => {
      setQuestsData(currentData => {
        const newData = [...currentData]
        const todayIndex = newData.findIndex(item => item.day === today)
        if (todayIndex !== -1) {
          newData[todayIndex] = { ...newData[todayIndex], value: newData[todayIndex].value + 1 }
        }
        return newData
      })
    }

    // When gold is earned
    const handleGoldUpdate = (event: CustomEvent) => {
      const amount = event.detail.amount
      setGoldData(currentData => {
        const newData = [...currentData]
        const todayIndex = newData.findIndex(item => item.day === today)
        if (todayIndex !== -1) {
          newData[todayIndex] = { ...newData[todayIndex], value: newData[todayIndex].value + amount }
        }
        return newData
      })
    }

    // When experience is earned
    const handleExpUpdate = (event: CustomEvent) => {
      const amount = event.detail.amount
      setExpData(currentData => {
        const newData = [...currentData]
        const todayIndex = newData.findIndex(item => item.day === today)
        if (todayIndex !== -1) {
          newData[todayIndex] = { ...newData[todayIndex], value: newData[todayIndex].value + amount }
        }
        return newData
      })
    }

    // Add event listeners
    calculateKingdomStats.addEventListener('questComplete', handleQuestComplete)
    calculateKingdomStats.addEventListener('goldUpdate', handleGoldUpdate as EventListener)
    calculateKingdomStats.addEventListener('expUpdate', handleExpUpdate as EventListener)

    // Cleanup
    return () => {
      calculateKingdomStats.removeEventListener('questComplete', handleQuestComplete)
      calculateKingdomStats.removeEventListener('goldUpdate', handleGoldUpdate as EventListener)
      calculateKingdomStats.removeEventListener('expUpdate', handleExpUpdate as EventListener)
    }
  }, [today])

  const getHighestValue = (data: {day: string, value: number}[]) => {
    return Math.max(...data.map(item => item.value), 10)
  }

  const renderGraph = (data: {day: string, value: number}[], color: string, unit: string) => {
    const highestValue = getHighestValue(data)
    return (
      <div className="h-64 flex items-end w-full space-x-1">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full ${color} rounded-t`} 
              style={{ 
                height: `${item.value > 0 ? (item.value / highestValue) * 160 : 0}px`,
                minHeight: item.value > 0 ? '4px' : '0'
              }}
            ></div>
            <div className="mt-2 w-full text-center">
              <div className="text-xs font-medium text-gray-400">{item.day}</div>
              <div className="text-sm font-bold">{item.value}{unit}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border border-amber-800/20 bg-black">
      <CardHeader>
        <CardTitle className="text-xl font-medievalsharp text-amber-500">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quests" onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="exp">Experience</TabsTrigger>
          </TabsList>
          <TabsContent value="quests">
            {renderGraph(questsData, 'bg-purple-600', '')}
          </TabsContent>
          <TabsContent value="gold">
            {renderGraph(goldData, 'bg-yellow-500', 'g')}
          </TabsContent>
          <TabsContent value="exp">
            {renderGraph(expData, 'bg-blue-500', 'xp')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 