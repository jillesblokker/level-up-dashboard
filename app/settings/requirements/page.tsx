"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

type RequirementItem = {
  title: string
  description: string
}

export default function RequirementsPage() {
  const requirements: Record<string, RequirementItem[]> = {
    overview: [
      {
        title: "Fantasy Realm-Building Game",
        description: "A medieval fantasy game where players develop their kingdom through strategic decisions, resource management, and character progression. The game combines RPG elements with kingdom management mechanics."
      },
      {
        title: "Quest and Achievement System",
        description: "Players progress through various quests and achievements that unlock new features, rewards, and story elements. Each completed quest contributes to kingdom development and character growth."
      },
      {
        title: "Resource Management",
        description: "Strategic management of kingdom resources including gold, materials, and population. Players start with 1000 gold and can earn more through quests, trading, and kingdom development."
      },
      {
        title: "Local Progress Saving",
        description: "All game progress is saved locally using localStorage, including character stats, kingdom development, quest progress, and achievements. This ensures persistent gameplay across sessions."
      },
    ],
    kingdom: [
      {
        title: "Kingdom Management Hub",
        description: "Central dashboard displaying all kingdom metrics, resources, and management options. Players can view and manage their entire kingdom from this interface."
      },
      {
        title: "Population and Territory Stats",
        description: "Real-time tracking of kingdom population growth and territory expansion. Includes detailed breakdowns of citizen types and land usage."
      },
      {
        title: "Resource Management System",
        description: "Comprehensive resource tracking for wood, stone, food, and other materials. Includes production rates, storage capacity, and consumption metrics."
      },
      {
        title: "Building System",
        description: "Monitor and manage construction projects throughout the kingdom. Includes build times, resource costs, and upgrade paths for various structures."
      },
      {
        title: "Kingdom Customization",
        description: "Personalize kingdom appearance with custom banners, colors, and header images. Reflects the player's chosen aesthetic and achievements."
      },
      {
        title: "Statistical Analysis",
        description: "Interactive graphs and charts showing kingdom growth, resource trends, and other key metrics over time."
      },
    ],
    realm: [
      {
        title: "Interactive Map System",
        description: "Grid-based world map that players can explore and interact with. Each tile represents different terrain types and potential locations."
      },
      {
        title: "Character Movement",
        description: "Strategic movement system allowing characters to traverse the map, with different movement costs based on terrain and mount type."
      },
      {
        title: "Location Discovery",
        description: "Players can discover new areas through exploration, unlocking new opportunities for resources, quests, and expansion."
      },
      {
        title: "Random Encounters",
        description: "Dynamic event system triggering random encounters when exploring mystery tiles, offering challenges, rewards, or story elements."
      },
      {
        title: "Procedural Naming",
        description: "Auto-generation system for medieval-style names for newly discovered locations, ensuring thematic consistency."
      },
      {
        title: "Terrain Variety",
        description: "Different tile types (forests, mountains, plains, etc.) with unique properties affecting resource generation and building options."
      },
    ],
    cities: [
      {
        title: "City Building Types",
        description: "Cities feature full building sets including Tavern, Castle, Merchant, Temple, and Stables, while towns have limited options with Tavern, Stable, and Merchant."
      },
      {
        title: "Mount System",
        description: "Stables offer various mounts for purchase (300-850 gold range) with different speed and carrying capacity attributes."
      },
      {
        title: "General Store",
        description: "Shop system for purchasing general items, equipment, and supplies needed for kingdom development and quests."
      },
      {
        title: "Temple Features",
        description: "Access to magical items, scrolls, and special blessings that provide unique benefits and abilities."
      },
      {
        title: "Castle Functions",
        description: "Royal quest hub offering special missions and unique items only available through castle reputation and standing."
      },
    ],
    character: [
      {
        title: "Level Progression",
        description: "Character advancement system with experience points, level-ups, and increasing capabilities. Each level provides new abilities and kingdom management options."
      },
      {
        title: "Experience System",
        description: "Earn experience through various activities including quests, kingdom management, and exploration. Features multiple paths for advancement."
      },
      {
        title: "Currency Management",
        description: "Gold-based economy system with multiple ways to earn and spend currency, including trading, quests, and kingdom development."
      },
      {
        title: "Title System",
        description: "Earn and unlock prestigious titles through achievements and milestones, each providing unique benefits and recognition."
      },
      {
        title: "Perk System",
        description: "Customizable character development through upgradeable perks affecting various aspects of gameplay and kingdom management."
      },
      {
        title: "Inventory System",
        description: "Comprehensive inventory management for items, equipment, and resources with sorting and filtering options."
      },
      {
        title: "Equipment Management",
        description: "Dedicated storage and management system for character equipment and mounts, including stats and maintenance."
      },
    ],
    quests: [
      {
        title: "Quest Types",
        description: "Various quest categories including daily tasks, milestone achievements, and special events, each with unique rewards and challenges."
      },
      {
        title: "Reward System",
        description: "Structured reward system providing gold, experience, items, and special unlocks for completing quests of varying difficulty."
      },
      {
        title: "Quest Categories",
        description: "Organized quest system with categories for kingdom development, exploration, combat, and special events."
      },
      {
        title: "Progress Tracking",
        description: "Detailed tracking system for all active and completed quests, showing objectives, rewards, and completion status."
      },
      {
        title: "Notification System",
        description: "Real-time notifications for quest updates, completions, and available rewards to keep players informed."
      },
      {
        title: "Special Events",
        description: "Time-limited special quests and events offering unique rewards and challenges."
      },
    ],
    achievements: [
      {
        title: "Progress System",
        description: "Long-term achievement tracking across multiple categories, measuring overall game progression and mastery."
      },
      {
        title: "Achievement Categories",
        description: "Diverse achievement types covering exploration, kingdom development, character progression, and special challenges."
      },
      {
        title: "Collection Goals",
        description: "Special achievements for collecting items, completing sets, and discovering all locations within specific categories."
      },
      {
        title: "Unlock System",
        description: "Achievement-based unlocks providing access to new features, items, and gameplay elements."
      },
      {
        title: "Progress Display",
        description: "Visual representation of achievement progress through charts, progress bars, and statistics."
      },
      {
        title: "Reward Structure",
        description: "Tiered reward system for achievement completion, offering increasingly valuable rewards for more difficult achievements."
      },
    ],
    market: [
      {
        title: "Economic System",
        description: "Dynamic economy for buying and selling items with fluctuating prices based on supply and demand."
      },
      {
        title: "Land Acquisition",
        description: "System for purchasing and developing new territory tiles to expand kingdom boundaries."
      },
      {
        title: "Financial Management",
        description: "Tools for managing kingdom finances, including income tracking, expense management, and budget planning."
      },
      {
        title: "Shopping Interface",
        description: "User-friendly shopping cart system for managing multiple purchases and sales simultaneously."
      },
      {
        title: "Trading Mechanics",
        description: "Player-driven market system for trading items, resources, and equipment with other kingdoms."
      },
      {
        title: "Price Dynamics",
        description: "Dynamic pricing system reflecting market conditions, scarcity, and kingdom events."
      },
    ],
    community: [
      {
        title: "Social Features",
        description: "Comprehensive player interaction system including profiles, friend lists, and social activities."
      },
      {
        title: "Message System",
        description: "Private messaging system for communication between players, including trade negotiations and alliance discussions."
      },
      {
        title: "Chat Functions",
        description: "Real-time chat system with channels for general discussion, trading, and kingdom alliances."
      },
      {
        title: "Kingdom Relations",
        description: "System for forming alliances or rivalries with other kingdoms, affecting trade and interaction options."
      },
      {
        title: "Social Activities",
        description: "Collaborative events and activities that encourage player interaction and community building."
      },
      {
        title: "Community Events",
        description: "Regular community-wide events and challenges with special rewards and recognition."
      },
    ],
  }

  type Category = {
    id: keyof typeof requirements
    name: string
  }

  const categories: Category[] = [
    { id: "overview", name: "Overview" },
    { id: "kingdom", name: "Kingdom" },
    { id: "realm", name: "Realm" },
    { id: "cities", name: "Cities" },
    { id: "character", name: "Character" },
    { id: "quests", name: "Quests" },
    { id: "achievements", name: "Achievements" },
    { id: "market", name: "Market" },
    { id: "community", name: "Community" },
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
            {/* Mobile Dropdown */}
            <div className="md:hidden w-full mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select Category
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)] mx-4">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} className="justify-between">
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="hidden md:block">
                <TabsList className="bg-gray-900/50 p-1 gap-1">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="data-[state=active]:bg-amber-900/20"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  {requirements[category.id].map((requirement, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-amber-900/20 border border-amber-800/20 flex items-center justify-center text-amber-500">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{requirement.title}</h3>
                        <p className="text-gray-400">{requirement.description}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 