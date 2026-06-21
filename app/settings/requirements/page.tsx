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
        title: "Realm Overview",
        description: "Explore a procedurally generated fantasy world, expand your kingdom, and unlock new features by completing quests and achievements."
      },
      {
        title: "Tile Placement & Destruction",
        description: "Place and remove tiles (forest, water, mountain, ice, etc.) to shape your realm and unlock new creatures. Some creatures are discovered by placing or destroying specific tile types."
      },
      {
        title: "Creature Collection",
        description: "Unlock mythical creatures by meeting specific requirements. See the Hints section for a full unlock guide."
      },
      {
        title: "City & Town Features",
        description: "Visit cities and towns on the map to access shops, special locations, and unique events."
      }
    ],
    events: [
      {
        title: "Mystery Events",
        description: "Trigger random encounters by visiting mystery tiles. Events may include treasure hunts, battles, riddles, or special quests."
      },
      {
        title: "Battle System",
        description: "Engage in strategic battles with unique creatures. Victory may reward you with experience, gold, or special items."
      },
      {
        title: "Event Conditions",
        description: "Some events are triggered by weather, time of day, or kingdom progress."
      },
      {
        title: "Quest Chains",
        description: "Complete connected series of events to unlock major discoveries and rewards."
      }
    ],
    hints: [],
    kingdom: [
      {
        title: "Kingdom Page",
        description: "Manage your kingdom's appearance, view your collection, and access kingdom-wide features."
      },
      {
        title: "Building & Upgrades",
        description: "Unlock new buildings and upgrades by progressing through quests and achievements."
      }
    ],
    realm: [
      {
        title: "Map Exploration",
        description: "Move your character around the map, discover new tiles, and reveal hidden locations."
      },
      {
        title: "Territory Expansion",
        description: "Expand your territory by placing new tiles and unlocking new map areas."
      },
      {
        title: "Initial Grid Layout",
        description: "The realm starts with a 7x13 grid (7 rows, 13 columns). Row 0: [1,1,2,1,1,1,1,1,1,1,1,1,1] (mountain border with one grass tile). Row 1: [1,2,2,5,2,2,2,2,2,2,2,2,1] (city at position 3). Rows 2-5 contain forests, water, towns, and mystery tiles. Row 6: [1,0,0,0,0,0,0,0,0,0,0,0,1] (mountain borders with empty tiles for vertical expansion). Character starts at position (2,0) on the grass tile."
      },
      {
        title: "Supabase Grid Storage",
        description: "Supabase stores modified grids as flattened arrays or non-matrix format due to matrix storage limitations. The system always loads the CSV initial grid first, then applies Supabase modifications only if the stored data contains actual content (non-empty tiles). Empty or invalid Supabase grids are ignored in favor of the CSV baseline."
      }
    ],
    cities: [
      {
        title: "City Features",
        description: "Cities offer unique shops, events, and opportunities for your character."
      },
      {
        title: "Town Features",
        description: "Towns provide access to local shops and special events."
      }
    ],
    character: [
      {
        title: "Character Progression",
        description: "Level up your character by completing quests and achievements."
      },
      {
        title: "Skills & Abilities",
        description: "Unlock new skills and abilities as you progress through the game."
      }
    ],
    quests: [
      {
        title: "Quests",
        description: "Complete quests to earn rewards, unlock new features, and progress the story."
      },
      {
        title: "Special Missions",
        description: "Undertake unique missions for rare rewards and achievements."
      }
    ],
    achievements: [
      {
        title: "Achievements",
        description: "Track your progress and earn rewards by reaching important milestones."
      },
      {
        title: "Milestone Rewards",
        description: "Unlock special rewards for completing major achievements."
      }
    ],
    market: [
      {
        title: "Market Features",
        description: "Buy and sell items and equipment in city and town markets."
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
                    {category.id === "hints" ? null : (
                      requirements[category.id]?.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-none w-8 h-8 rounded-full bg-amber-900/20 border border-amber-800/20 flex items-center justify-center text-amber-500">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{item.title}</h3>
                            <p className="text-gray-400">{item.description}</p>
                          </div>
                        </div>
                      ))
                    )}
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