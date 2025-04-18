"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type RequirementItem = {
  title: string
  description: string
}

type Category = {
  id: string
  name: string
}

export default function RequirementsPage() {
  const requirements: Record<string, RequirementItem[]> = {
    overview: [
      {
        title: "Fantasy Realm-Building Game",
        description: "A medieval fantasy game where players develop their kingdom through strategic decisions, resource management, and character progression."
      },
      {
        title: "Quest and Achievement System",
        description: "Players progress through various quests and achievements that unlock new features, rewards, and story elements."
      },
      {
        title: "Resource Management",
        description: "Strategic management of kingdom resources including gold, materials, and population."
      }
    ],
    events: [
      {
        title: "Mystery Events",
        description: "Random encounters on mystery tiles offering various challenges and rewards. Includes treasure hunts, battles, riddles, and special quests."
      },
      {
        title: "Battle System",
        description: "Strategic combat system with unique creatures, each having their own abilities and stats. Victory rewards include experience, gold, and special items."
      },
      {
        title: "Reward Types",
        description: "Various reward categories including gold, experience, scrolls, artifacts, and special items that contribute to kingdom development."
      },
      {
        title: "Event Conditions",
        description: "Special events triggered by weather conditions, time of day, or kingdom development status, offering unique opportunities and challenges."
      },
      {
        title: "Quest Chains",
        description: "Connected series of events forming larger storylines and quest chains, leading to major discoveries and rewards."
      }
    ],
    hints: [
      {
        title: "Creature #000 - Necrion",
        description: "The first creature you'll encounter, a mysterious poisonous being that appears when exploring the realm. Unlocked by navigating to the realm map."
      },
      {
        title: "Fire Creatures (#001-#003)",
        description: "Flamio, Embera, and Vulcana - powerful fire creatures that appear when destroying forest tiles. Unlock them by destroying 1, 5, and 10 forest tiles respectively."
      },
      {
        title: "Water Creatures (#004-#006)",
        description: "Dolphio, Divero, and Flippur - aquatic creatures that emerge when expanding water territories. Place 1, 5, and 10 water tiles to discover them."
      },
      {
        title: "Grass Creatures (#007-#009)",
        description: "Leaf, Oaky, and Seqoio - forest guardians that appear when planting new forests. Place 1, 5, and 10 forest tiles to encounter these woodland spirits."
      },
      {
        title: "Special Creatures",
        description: "Additional creatures including Rock, Ice, Electric, and Dragon types can be discovered through special actions and achievements in your kingdom."
      }
    ],
    kingdom: [
      {
        title: "Kingdom Management",
        description: "Central dashboard for managing all aspects of your kingdom including resources, buildings, and population."
      },
      {
        title: "Building System",
        description: "Construct and upgrade various buildings to improve your kingdom's capabilities and efficiency."
      }
    ],
    realm: [
      {
        title: "Map Exploration",
        description: "Explore a vast realm filled with mysteries, resources, and opportunities for expansion."
      },
      {
        title: "Territory Management",
        description: "Strategically expand your territory by purchasing and developing new tiles."
      }
    ],
    cities: [
      {
        title: "City Development",
        description: "Build and manage cities with various buildings including taverns, temples, and markets."
      },
      {
        title: "Town Management",
        description: "Establish and grow smaller towns with essential services and facilities."
      }
    ],
    character: [
      {
        title: "Character Progression",
        description: "Level up your character through experience gained from quests and achievements."
      },
      {
        title: "Skills and Abilities",
        description: "Develop various skills and unlock new abilities as you progress."
      }
    ],
    quests: [
      {
        title: "Daily Quests",
        description: "Complete daily tasks to earn rewards and track your habits."
      },
      {
        title: "Special Missions",
        description: "Undertake unique quests that advance your kingdom's story and development."
      }
    ],
    achievements: [
      {
        title: "Achievement System",
        description: "Track your progress and earn rewards through various achievements."
      },
      {
        title: "Milestone Rewards",
        description: "Unlock special rewards and recognition for reaching important milestones."
      }
    ],
    market: [
      {
        title: "Trading System",
        description: "Buy and sell resources, items, and equipment through various markets."
      },
      {
        title: "Economy Management",
        description: "Manage your kingdom's economy through strategic trading and resource allocation."
      }
    ]
  }

  const categories: Category[] = [
    { id: "overview", name: "Overview" },
    { id: "events", name: "Events" },
    { id: "hints", name: "Hints" },
    { id: "kingdom", name: "Kingdom" },
    { id: "realm", name: "Realm" },
    { id: "cities", name: "Cities" },
    { id: "character", name: "Character" },
    { id: "quests", name: "Quests" },
    { id: "achievements", name: "Achievements" },
    { id: "market", name: "Market" }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/kingdom">
            <Button variant="outline" size="sm" className="text-white border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-white">Requirements</CardTitle>
            <CardDescription className="text-gray-400">Core features and functionality of the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {categories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">
                    {category.name}
                    {category.id === "events" && (
                      <Link href="/settings/events" className="text-sm ml-2 text-amber-500 hover:text-amber-400">
                        View Details →
                      </Link>
                    )}
                    {category.id === "hints" && (
                      <Link href="/settings/hints" className="text-sm ml-2 text-amber-500 hover:text-amber-400">
                        View Details →
                      </Link>
                    )}
                  </h2>
                  <div className="space-y-4">
                    {requirements[category.id].map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-amber-900/20 border border-amber-800/20 flex items-center justify-center text-amber-500">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{item.title}</h3>
                          <p className="text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 