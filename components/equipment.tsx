"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Sword, Crown } from "lucide-react"

interface EquipmentItem {
  id: string
  name: string
  type: "weapon" | "helmet" | "shield"
  stats: {
    attack?: number
    defense?: number
    magic?: number
    health?: number
  }
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  description: string
  image?: string
}

export function Equipment() {
  // Available equipment
  const [availableEquipment] = useState<EquipmentItem[]>([
    // Weapons
    {
      id: "iron-sword",
      name: "Iron Sword",
      type: "weapon",
      stats: { attack: 5 },
      rarity: "common",
      description: "A simple but reliable iron sword.",
    },
    {
      id: "steel-broadsword",
      name: "Steel Broadsword",
      type: "weapon",
      stats: { attack: 12 },
      rarity: "uncommon",
      description: "A well-crafted steel broadsword with good balance.",
    },
    {
      id: "enchanted-blade",
      name: "Enchanted Blade",
      type: "weapon",
      stats: { attack: 18, magic: 10 },
      rarity: "rare",
      description: "A blade imbued with magical energy that glows faintly.",
    },

    // Helmets
    {
      id: "iron-helmet",
      name: "Iron Helmet",
      type: "helmet",
      stats: { defense: 4 },
      rarity: "common",
      description: "A basic iron helmet that provides decent protection.",
    },
    {
      id: "steel-helmet",
      name: "Steel Helmet",
      type: "helmet",
      stats: { defense: 8, health: 5 },
      rarity: "uncommon",
      description: "A sturdy steel helmet with reinforced plating.",
    },
    {
      id: "golden-crown",
      name: "Golden Crown",
      type: "helmet",
      stats: { defense: 6, magic: 15 },
      rarity: "epic",
      description: "A royal crown that enhances magical abilities.",
    },

    // Shields
    {
      id: "wooden-shield",
      name: "Wooden Shield",
      type: "shield",
      stats: { defense: 3 },
      rarity: "common",
      description: "A simple wooden shield reinforced with iron bands.",
    },
    {
      id: "iron-shield",
      name: "Iron Shield",
      type: "shield",
      stats: { defense: 10 },
      rarity: "uncommon",
      description: "A heavy iron shield that provides excellent protection.",
    },
    {
      id: "royal-guard-shield",
      name: "Royal Guard Shield",
      type: "shield",
      stats: { defense: 15, health: 10 },
      rarity: "rare",
      description: "A shield emblazoned with the royal crest, used by elite guards.",
    },
  ])

  // Currently equipped items
  const [equippedItems, setEquippedItems] = useState<{
    weapon: string | null
    helmet: string | null
    shield: string | null
  }>({
    weapon: "iron-sword",
    helmet: null,
    shield: null,
  })

  // Get equipped items as full objects
  const getEquippedItem = (type: "weapon" | "helmet" | "shield"): EquipmentItem | null => {
    const itemId = equippedItems[type]
    if (!itemId) return null
    return availableEquipment.find((item) => item.id === itemId) || null
  }

  // Calculate total stats from equipped items
  const calculateStats = () => {
    const stats = {
      attack: 0,
      defense: 0,
      magic: 0,
      health: 0,
    }

    const equippedItemObjects = [
      getEquippedItem("weapon"),
      getEquippedItem("helmet"),
      getEquippedItem("shield"),
    ].filter(Boolean) as EquipmentItem[]

    equippedItemObjects.forEach((item) => {
      if (item.stats.attack) stats.attack += item.stats.attack
      if (item.stats.defense) stats.defense += item.stats.defense
      if (item.stats.magic) stats.magic += item.stats.magic
      if (item.stats.health) stats.health += item.stats.health
    })

    return stats
  }

  // Handle equipping an item
  const equipItem = (item: EquipmentItem) => {
    setEquippedItems((prev) => ({
      ...prev,
      [item.type]: item.id,
    }))
  }

  // Handle unequipping an item
  const unequipItem = (type: "weapon" | "helmet" | "shield") => {
    setEquippedItems((prev) => ({
      ...prev,
      [type]: null,
    }))
  }

  // Get color for rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-200"
      case "uncommon":
        return "text-green-400"
      case "rare":
        return "text-blue-400"
      case "epic":
        return "text-purple-400"
      case "legendary":
        return "text-amber-400"
      default:
        return "text-gray-200"
    }
  }

  // Get icon for equipment type
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "weapon":
        return <Sword className="h-6 w-6" />
      case "helmet":
        return <Crown className="h-6 w-6" />
      case "shield":
        return <Shield className="h-6 w-6" />
      default:
        return null
    }
  }

  // Calculate total stats
  const totalStats = calculateStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight font-serif">Equipment</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character Preview */}
        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20 col-span-1">
          <CardHeader>
            <CardTitle className="font-serif">Character</CardTitle>
            <CardDescription>Your equipped items and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square relative bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-amber-800/20 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Character silhouette */}
                <div className="w-32 h-64 relative">
                  {/* Body */}
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-20 h-32 bg-gray-700 rounded-lg"></div>

                  {/* Head */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gray-700 rounded-full">
                    {/* Helmet */}
                    {getEquippedItem("helmet") && (
                      <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 rounded-full border-amber-500/70"></div>
                    )}
                  </div>

                  {/* Arms */}
                  <div className="absolute top-16 left-0 w-6 h-24 bg-gray-700 rounded-lg"></div>
                  <div className="absolute top-16 right-0 w-6 h-24 bg-gray-700 rounded-lg"></div>

                  {/* Legs */}
                  <div className="absolute top-48 left-6 w-8 h-24 bg-gray-700 rounded-lg"></div>
                  <div className="absolute top-48 right-6 w-8 h-24 bg-gray-700 rounded-lg"></div>

                  {/* Weapon */}
                  {getEquippedItem("weapon") && (
                    <div className="absolute top-24 -left-8 w-4 h-28 bg-amber-600 rounded-sm"></div>
                  )}

                  {/* Shield */}
                  {getEquippedItem("shield") && (
                    <div className="absolute top-24 -right-10 w-16 h-20 bg-amber-800/70 rounded-lg border-2 border-amber-600/70"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/50 p-2 rounded-md">
                  <div className="text-sm text-muted-foreground">Attack</div>
                  <div className="text-lg font-medium text-amber-500">{totalStats.attack}</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-md">
                  <div className="text-sm text-muted-foreground">Defense</div>
                  <div className="text-lg font-medium text-amber-500">{totalStats.defense}</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-md">
                  <div className="text-sm text-muted-foreground">Magic</div>
                  <div className="text-lg font-medium text-amber-500">{totalStats.magic}</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-md">
                  <div className="text-sm text-muted-foreground">Health</div>
                  <div className="text-lg font-medium text-amber-500">{totalStats.health}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Equipped Items</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Sword className="h-5 w-5 text-amber-500" />
                    <span>
                      {getEquippedItem("weapon") ? (
                        <span className={getRarityColor(getEquippedItem("weapon")!.rarity)}>
                          {getEquippedItem("weapon")!.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No weapon equipped</span>
                      )}
                    </span>
                  </div>
                  {getEquippedItem("weapon") && (
                    <Button variant="ghost" size="sm" onClick={() => unequipItem("weapon")} className="h-7 text-xs">
                      Remove
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <span>
                      {getEquippedItem("helmet") ? (
                        <span className={getRarityColor(getEquippedItem("helmet")!.rarity)}>
                          {getEquippedItem("helmet")!.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No helmet equipped</span>
                      )}
                    </span>
                  </div>
                  {getEquippedItem("helmet") && (
                    <Button variant="ghost" size="sm" onClick={() => unequipItem("helmet")} className="h-7 text-xs">
                      Remove
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    <span>
                      {getEquippedItem("shield") ? (
                        <span className={getRarityColor(getEquippedItem("shield")!.rarity)}>
                          {getEquippedItem("shield")!.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No shield equipped</span>
                      )}
                    </span>
                  </div>
                  {getEquippedItem("shield") && (
                    <Button variant="ghost" size="sm" onClick={() => unequipItem("shield")} className="h-7 text-xs">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment List */}
        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20 col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif">Available Equipment</CardTitle>
            <CardDescription>Select items to equip your character</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {["weapon", "helmet", "shield"].map((type) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {getEquipmentIcon(type)}
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableEquipment
                      .filter((item) => item.type === type)
                      .map((item) => (
                        <Card
                          key={item.id}
                          className={`cursor-pointer hover:bg-gray-800/30 transition-colors ${
                            equippedItems[item.type] === item.id ? "border-amber-500" : "border-gray-800"
                          }`}
                          onClick={() => equipItem(item)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-medium ${getRarityColor(item.rarity)}`}>{item.name}</h4>
                              {equippedItems[item.type] === item.id && (
                                <span className="text-xs bg-amber-800/50 px-2 py-0.5 rounded-full text-amber-200">
                                  Equipped
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(item.stats).map(([stat, value]) => (
                                <span key={stat} className="text-xs bg-gray-800/70 px-2 py-0.5 rounded-full">
                                  {stat.charAt(0).toUpperCase() + stat.slice(1)}: +{value}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Complete quests to discover more powerful equipment for your character.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

