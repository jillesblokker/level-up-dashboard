"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Item {
  id: string
  name: string
  type: string
  slot: string | null
  imageUrl: string
  equipped: boolean
}

interface EquipmentProps {
  equippedItems: Item[]
  onEquipItem?: (slot: string, itemId: string) => void
}

// Define available equipment options
const helmets = [
  { id: "helmet-1", name: "Iron Helmet", type: "helmet", slot: "head" },
  { id: "helmet-2", name: "Steel Helmet", type: "helmet", slot: "head" },
  { id: "helmet-3", name: "Golden Crown", type: "helmet", slot: "head" },
]

const weapons = [
  { id: "weapon-1", name: "Iron Sword", type: "weapon", slot: "weapon" },
  { id: "weapon-2", name: "Steel Broadsword", type: "weapon", slot: "weapon" },
  { id: "weapon-3", name: "Enchanted Blade", type: "weapon", slot: "weapon" },
]

const shields = [
  { id: "shield-1", name: "Wooden Shield", type: "shield", slot: "offhand" },
  { id: "shield-2", name: "Iron Shield", type: "shield", slot: "offhand" },
  { id: "shield-3", name: "Royal Guard Shield", type: "shield", slot: "offhand" },
]

export function Equipment({ equippedItems = [], onEquipItem }: EquipmentProps) {
  const [selectedHelmet, setSelectedHelmet] = useState<string>(
    equippedItems.find((item) => item.slot === "head")?.id || helmets[0].id,
  )
  const [selectedWeapon, setSelectedWeapon] = useState<string>(
    equippedItems.find((item) => item.slot === "weapon")?.id || weapons[0].id,
  )
  const [selectedShield, setSelectedShield] = useState<string>(
    equippedItems.find((item) => item.slot === "offhand")?.id || shields[0].id,
  )

  const handleEquipHelmet = (value: string) => {
    setSelectedHelmet(value)
    if (onEquipItem) onEquipItem("head", value)
  }

  const handleEquipWeapon = (value: string) => {
    setSelectedWeapon(value)
    if (onEquipItem) onEquipItem("weapon", value)
  }

  const handleEquipShield = (value: string) => {
    setSelectedShield(value)
    if (onEquipItem) onEquipItem("offhand", value)
  }

  // Get the selected equipment details
  const helmet = helmets.find((h) => h.id === selectedHelmet) || helmets[0]
  const weapon = weapons.find((w) => w.id === selectedWeapon) || weapons[0]
  const shield = shields.find((s) => s.id === selectedShield) || shields[0]

  return (
    <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
      <CardHeader>
        <CardTitle className="font-serif">Equipment</CardTitle>
        <CardDescription>Customize your character's appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[400px]">
          <svg viewBox="0 0 300 500" className="w-full h-full">
            {/* Background - medieval style */}
            <defs>
              <pattern id="chainmail" patternUnits="userSpaceOnUse" width="10" height="10">
                <circle cx="5" cy="5" r="2" fill="none" stroke="#555" strokeWidth="0.5" />
              </pattern>

              {/* Clip paths for equipment */}
              <clipPath id="headClip">
                <circle cx="150" cy="55" r="25" />
              </clipPath>

              <clipPath id="bodyClip">
                <path d="M150,130 C170,130 180,140 180,160 C180,180 170,200 170,220 C170,240 160,250 150,250 C140,250 130,240 130,220 C130,200 120,180 120,160 C120,140 130,130 150,130" />
              </clipPath>

              <clipPath id="shieldClip">
                <path d="M90,180 C70,170 70,190 70,200 C70,220 80,230 90,240 C100,230 110,220 110,200 C110,190 110,170 90,180" />
              </clipPath>

              <clipPath id="weaponClip">
                <rect x="195" y="160" width="15" height="100" />
              </clipPath>

              <clipPath id="mountClip">
                <ellipse cx="150" cy="425" rx="100" ry="50" />
              </clipPath>

              <clipPath id="accessoryClip">
                <circle cx="150" cy="115" r="15" />
              </clipPath>
            </defs>

            {/* Mount (if equipped) */}
            {equippedItems.find((item) => item.slot === "mount") && (
              <g>
                <ellipse cx="150" cy="425" rx="100" ry="50" fill="#8B4513" opacity="0.7" />
                <ellipse cx="150" cy="425" rx="90" ry="45" fill="#A0522D" />
                <ellipse cx="150" cy="425" rx="80" ry="40" fill="#CD853F" />
                <text x="150" y="430" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                  {equippedItems.find((item) => item.slot === "mount")?.name || "Mount"}
                </text>
              </g>
            )}

            {/* Knight silhouette base */}
            <path
              d="M150,50 C180,50 200,70 200,90 C200,110 190,120 190,130 C190,140 195,145 195,150 C195,155 190,160 190,165 C190,170 200,175 200,190 C200,205 180,220 180,230 C180,240 190,250 190,260 C190,270 180,280 180,290 C180,300 190,320 190,340 C190,360 170,380 170,400 C170,420 180,440 180,460 C180,480 160,490 150,490 C140,490 120,480 120,460 C120,440 130,420 130,400 C130,380 110,360 110,340 C110,320 120,300 120,290 C120,280 110,270 110,260 C110,250 120,240 120,230 C120,220 100,205 100,190 C100,175 110,170 110,165 C110,160 105,155 105,150 C105,145 110,140 110,130 C110,120 100,110 100,90 C100,70 120,50 150,50"
              fill="#333"
              opacity="0.8"
            />

            {/* Chainmail texture overlay */}
            <path
              d="M150,50 C180,50 200,70 200,90 C200,110 190,120 190,130 C190,140 195,145 195,150 C195,155 190,160 190,165 C190,170 200,175 200,190 C200,205 180,220 180,230 C180,240 190,250 190,260 C190,270 180,280 180,290 C180,300 190,320 190,340 C190,360 170,380 170,400 C170,420 180,440 180,460 C180,480 160,490 150,490 C140,490 120,480 120,460 C120,440 130,420 130,400 C130,380 110,360 110,340 C110,320 120,300 120,290 C120,280 110,270 110,260 C110,250 120,240 120,230 C120,220 100,205 100,190 C100,175 110,170 110,165 C110,160 105,155 105,150 C105,145 110,140 110,130 C110,120 100,110 100,90 C100,70 120,50 150,50"
              fill="url(#chainmail)"
              opacity="0.5"
            />

            {/* Body Armor */}
            <path
              d="M150,130 C170,130 180,140 180,160 C180,180 170,200 170,220 C170,240 160,250 150,250 C140,250 130,240 130,220 C130,200 120,180 120,160 C120,140 130,130 150,130"
              fill="#8B4513"
              stroke="#5e4c36"
              strokeWidth="1"
            />
            <path
              d="M150,130 C165,130 175,140 175,160 C175,180 165,200 165,220 C165,235 155,245 150,245 C145,245 135,235 135,220 C135,200 125,180 125,160 C125,140 135,130 150,130"
              fill="#A0522D"
            />

            {/* Head Item (Helmet) */}
            {helmet.id === "helmet-3" ? (
              // Crown
              <g>
                <circle cx="150" cy="55" r="25" fill="#FFD700" stroke="#5e4c36" strokeWidth="1" />
                <path d="M125,55 L175,55 L175,45 L125,45 Z" fill="#FFD700" />
                <path d="M130,45 L140,30 L150,45 L160,30 L170,45 Z" fill="#FFD700" stroke="#5e4c36" strokeWidth="1" />
                <circle cx="140" cy="35" r="3" fill="#FF0000" />
                <circle cx="150" cy="30" r="3" fill="#0000FF" />
                <circle cx="160" cy="35" r="3" fill="#00FF00" />
              </g>
            ) : helmet.id === "helmet-2" ? (
              // Steel Helmet
              <g>
                <circle cx="150" cy="55" r="25" fill="#A9A9A9" stroke="#5e4c36" strokeWidth="1" />
                <circle cx="150" cy="55" r="20" fill="#D3D3D3" />
                <path d="M135,55 L165,55 L165,65 L135,65 Z" fill="#444" />
                <path d="M140,45 L160,45 L155,55 L145,55 Z" fill="#A9A9A9" stroke="#444" strokeWidth="1" />
              </g>
            ) : (
              // Iron Helmet (default)
              <g>
                <circle cx="150" cy="55" r="25" fill="#C0C0C0" stroke="#5e4c36" strokeWidth="1" />
                <circle cx="150" cy="55" r="20" fill="#D3D3D3" />
                <path d="M135,55 L165,55 L165,65 L135,65 Z" fill="#444" />
              </g>
            )}

            {/* Shoulder plates */}
            <ellipse cx="110" cy="110" rx="20" ry="15" fill="#666" />
            <ellipse cx="190" cy="110" rx="20" ry="15" fill="#666" />

            {/* Arms */}
            <path d="M110,110 C100,120 90,140 85,170 C80,200 90,220 90,220" fill="none" stroke="#555" strokeWidth="8" />
            <path
              d="M190,110 C200,120 210,140 215,170 C220,200 210,220 210,220"
              fill="none"
              stroke="#555"
              strokeWidth="8"
            />

            {/* Hands */}
            <circle cx="90" cy="220" r="10" fill="#A0522D" />
            <circle cx="210" cy="220" r="10" fill="#A0522D" />

            {/* Legs */}
            <path d="M140,250 C135,300 130,350 125,400" fill="none" stroke="#555" strokeWidth="12" />
            <path d="M160,250 C165,300 170,350 175,400" fill="none" stroke="#555" strokeWidth="12" />

            {/* Feet */}
            <ellipse cx="125" cy="410" rx="15" ry="10" fill="#8B4513" />
            <ellipse cx="175" cy="410" rx="15" ry="10" fill="#8B4513" />

            {/* Shield */}
            {shield.id === "shield-3" ? (
              // Royal Guard Shield
              <g>
                <path
                  d="M90,180 C70,170 70,190 70,200 C70,220 80,230 90,240 C100,230 110,220 110,200 C110,190 110,170 90,180"
                  fill="#FFD700"
                  stroke="#333"
                  strokeWidth="2"
                />
                <path
                  d="M90,185 C75,175 75,190 75,200 C75,215 82,225 90,235 C98,225 105,215 105,200 C105,190 105,175 90,185"
                  fill="#DAA520"
                />
                <circle cx="90" cy="210" r="10" fill="#B22222" stroke="#333" strokeWidth="1" />
                <path d="M85,205 L95,215 M95,205 L85,215" stroke="#FFD700" strokeWidth="2" />
              </g>
            ) : shield.id === "shield-2" ? (
              // Iron Shield
              <g>
                <path
                  d="M90,180 C70,170 70,190 70,200 C70,220 80,230 90,240 C100,230 110,220 110,200 C110,190 110,170 90,180"
                  fill="#A9A9A9"
                  stroke="#333"
                  strokeWidth="2"
                />
                <path
                  d="M90,185 C75,175 75,190 75,200 C75,215 82,225 90,235 C98,225 105,215 105,200 C105,190 105,175 90,185"
                  fill="#C0C0C0"
                />
                <circle cx="90" cy="210" r="10" fill="#696969" stroke="#333" strokeWidth="1" />
              </g>
            ) : (
              // Wooden Shield (default)
              <g>
                <path
                  d="M90,180 C70,170 70,190 70,200 C70,220 80,230 90,240 C100,230 110,220 110,200 C110,190 110,170 90,180"
                  fill="#8B4513"
                  stroke="#333"
                  strokeWidth="2"
                />
                <path
                  d="M90,185 C75,175 75,190 75,200 C75,215 82,225 90,235 C98,225 105,215 105,200 C105,190 105,175 90,185"
                  fill="#A0522D"
                />
                <circle cx="90" cy="210" r="10" fill="#D2B48C" stroke="#333" strokeWidth="1" />
              </g>
            )}

            {/* Weapon */}
            {weapon.id === "weapon-3" ? (
              // Enchanted Blade
              <g>
                <rect x="200" y="160" width="5" height="80" fill="#4169E1" />
                <rect x="195" y="160" width="15" height="10" fill="#8B4513" />
                <path d="M202.5,240 L195,260 L210,260 Z" fill="#4169E1" />
                <circle cx="202.5" cy="200" r="2" fill="#00FFFF" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="202.5" cy="220" r="2" fill="#00FFFF" opacity="0.5">
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>
            ) : weapon.id === "weapon-2" ? (
              // Steel Broadsword
              <g>
                <rect x="198" y="160" width="9" height="90" fill="#A9A9A9" />
                <rect x="193" y="160" width="19" height="10" fill="#8B4513" />
                <path d="M202.5,250 L193,270 L212,270 Z" fill="#A9A9A9" />
              </g>
            ) : (
              // Iron Sword (default)
              <g>
                <rect x="200" y="160" width="5" height="80" fill="#C0C0C0" />
                <rect x="195" y="160" width="15" height="10" fill="#8B4513" />
                <path d="M202.5,240 L195,260 L210,260 Z" fill="#C0C0C0" />
              </g>
            )}

            {/* Decorative elements */}
            <path d="M150,390 L160,420 L140,420 Z" fill="#666" />
            <rect x="145" y="420" width="10" height="30" fill="#666" />
          </svg>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="space-y-2">
            <label className="text-sm font-medium">Helmet</label>
            <Select value={selectedHelmet} onValueChange={handleEquipHelmet}>
              <SelectTrigger>
                <SelectValue placeholder="Select helmet" />
              </SelectTrigger>
              <SelectContent>
                {helmets.map((helmet) => (
                  <SelectItem key={helmet.id} value={helmet.id}>
                    {helmet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Weapon</label>
            <Select value={selectedWeapon} onValueChange={handleEquipWeapon}>
              <SelectTrigger>
                <SelectValue placeholder="Select weapon" />
              </SelectTrigger>
              <SelectContent>
                {weapons.map((weapon) => (
                  <SelectItem key={weapon.id} value={weapon.id}>
                    {weapon.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Shield</label>
            <Select value={selectedShield} onValueChange={handleEquipShield}>
              <SelectTrigger>
                <SelectValue placeholder="Select shield" />
              </SelectTrigger>
              <SelectContent>
                {shields.map((shield) => (
                  <SelectItem key={shield.id} value={shield.id}>
                    {shield.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
          Save Equipment
        </Button>
      </CardFooter>
    </Card>
  )
}

