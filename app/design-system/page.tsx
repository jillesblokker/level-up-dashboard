"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useGradient } from '@/app/providers/gradient-provider'
import { HeaderSection } from "@/components/HeaderSection"
import { CreatureCard } from "@/components/creature-card"
import CardWithProgress from "@/components/quest-card"
import { TileVisual } from "@/components/tile-visual"
import { MapGrid } from "@/components/map-grid"
import { TownView } from "@/components/town-view"
import { TileType } from '@/types/tiles'
import styles from './styles.module.css'

type ColorItem = {
  name: string
  class: string
  description: string
  value: string
}

type GradientItem = {
  name: string
  class: string
  description: string
  startColor: string
  endColor: string
  direction: string
}

type TypographyItem = {
  name: string
  class: string
  example: string
  fontSize: string
  fontWeight: string
  fontFamily: string
}

const mockTile = {
  id: 'tile-empty',
  type: 'empty' as TileType,
  name: 'Empty Tile',
  description: 'An empty tile.',
  connections: [],
  rotation: 0 as 0 | 90 | 180 | 270,
  revealed: true,
  isVisited: false,
  ariaLabel: 'Empty tile',
  x: 0,
  y: 0,
  image: '/images/tiles/empty-tile.png'
};

export default function DesignSystemPage() {
  const { toast } = useToast()
  const { startColor, endColor, updateGradient } = useGradient()

  const [colors, setColors] = useState<ColorItem[]>([
    { name: "Primary", class: "bg-amber-500", description: "Main accent color", value: "#f59e0b" },
    { name: "Secondary", class: "bg-amber-900/20", description: "Secondary accent color", value: "#78350f33" },
    { name: "Background", class: "bg-black", description: "Main background color", value: "#000000" },
    { name: "Card Background", class: "bg-gray-900", description: "Card and component background", value: "#111827" },
    { name: "Border", class: "border-amber-800/20", description: "Border color for components", value: "#92400e33" },
    { name: "Text Primary", class: "text-white", description: "Primary text color", value: "#ffffff" },
    { name: "Text Secondary", class: "text-gray-400", description: "Secondary text color", value: "#9ca3af" },
  ])

  const [gradients, setGradients] = useState<GradientItem[]>([
    { 
      name: "Card Gradient", 
      class: "bg-gradient-to-b", 
      description: "Used for card backgrounds",
      startColor: startColor,
      endColor: endColor,
      direction: "to-b"
    },
    { 
      name: "Header Gradient", 
      class: "bg-gradient-to-r from-amber-900/20 to-transparent", 
      description: "Used for section headers",
      startColor: "#78350f33",
      endColor: "transparent",
      direction: "to-r"
    },
  ])

  const [typography, setTypography] = useState<TypographyItem[]>([
    { 
      name: "Heading 1", 
      class: "text-4xl font-serif", 
      example: "Kingdom Overview",
      fontSize: "text-4xl",
      fontWeight: "font-normal",
      fontFamily: "font-serif"
    },
    { 
      name: "Heading 2", 
      class: "text-2xl font-serif", 
      example: "Section Title",
      fontSize: "text-2xl",
      fontWeight: "font-normal",
      fontFamily: "font-serif"
    },
    { 
      name: "Body", 
      class: "text-base", 
      example: "Regular text content",
      fontSize: "text-base",
      fontWeight: "font-normal",
      fontFamily: "font-sans"
    },
    { 
      name: "Small", 
      class: "text-sm", 
      example: "Secondary information",
      fontSize: "text-sm",
      fontWeight: "font-normal",
      fontFamily: "font-sans"
    },
  ])

  const [activeTab, setActiveTab] = useState<string>("colors")

  const handleColorChange = (index: number, newValue: string) => {
    if (!colors[index]) return;
    const newColors = [...colors]
    newColors[index]!.value = newValue
    setColors(newColors)
  }

  const handleGradientChange = (index: number, type: 'startColor' | 'endColor' | 'direction', newValue: string) => {
    if (!gradients[index]) return;
    const newGradients = [...gradients]
    newGradients[index]![type] = newValue
    setGradients(newGradients)

    // Update global gradient if changing the Card Gradient
    if (index === 0) {
      if (type === 'startColor' || type === 'endColor') {
        const g0 = gradients[0];
        if (!g0) return;
        updateGradient(
          type === 'startColor' ? newValue : g0.startColor,
          type === 'endColor' ? newValue : g0.endColor
        )
      }
    }
  }

  const handleTypographyChange = (index: number, type: 'fontSize' | 'fontWeight' | 'fontFamily', newValue: string) => {
    if (!typography[index]) return;
    const newTypography = [...typography]
    newTypography[index]![type] = newValue
    newTypography[index]!.class = `${newTypography[index]!.fontSize} ${newTypography[index]!.fontWeight} ${newTypography[index]!.fontFamily}`
    setTypography(newTypography)
  }

  const showToastExample = () => {
    toast({
      title: "Achievement",
      description: "Behold! A scroll toast appears!",
      variant: "default"
    })
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-4xl py-6">
        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-white">Design System</CardTitle>
            <CardDescription className="text-gray-400">UI components and styling guidelines</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Mobile tab selector */}
              <div className="mb-4 md:hidden">
                <label htmlFor="design-system-tab-select" className="sr-only">Select design system tab</label>
                <select
                  id="design-system-tab-select"
                  aria-label="Design system tab selector"
                  className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                >
                  <option value="colors">Colors</option>
                  <option value="gradients">Gradients</option>
                  <option value="typography">Typography</option>
                  <option value="components">Components</option>
                </select>
              </div>
              <TabsList className="bg-gray-900/50 p-1 gap-1 hidden md:flex">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="gradients">Gradients</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                {colors.map((color: ColorItem, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`${styles['colorBox']} ${styles[`preview-${color.name.toLowerCase()}`]}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{color.name ?? ''}</h3>
                      <p className="text-gray-400 text-sm mb-2">{color.description ?? ''}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={color.value ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(index, e.target.value)}
                          className="w-16 h-8"
                        />
                        <Input
                          type="text"
                          value={color.value ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(index, e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="gradients" className="space-y-4">
                {gradients.map((gradient: GradientItem, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`${styles['gradientBox']} ${styles[`preview-gradient${index+1}`]}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{gradient.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{gradient.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-400">Start Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={gradient.startColor}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGradientChange(index, 'startColor', e.target.value)}
                              className="w-16 h-8"
                            />
                            <Input
                              type="text"
                              value={gradient.startColor}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGradientChange(index, 'startColor', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">End Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={gradient.endColor === 'transparent' ? '#ffffff' : gradient.endColor}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGradientChange(index, 'endColor', e.target.value)}
                              className="w-16 h-8"
                            />
                            <Input
                              type="text"
                              value={gradient.endColor}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGradientChange(index, 'endColor', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label htmlFor="gradient-direction-select" className="text-sm text-gray-400">Direction</Label>
                        <select
                          id="gradient-direction-select"
                          title="Gradient Direction"
                          value={gradient.direction}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleGradientChange(index, 'direction', e.target.value)}
                          className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                        >
                          <option value="to-r">Horizontal</option>
                          <option value="to-b">Vertical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="typography" className="space-y-6">
                {typography.map((type: TypographyItem, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{type.name}</h3>
                        <p className={`${type.class} text-white mt-2`}>{type.example}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`typography-size-select-${index}`} className="text-sm text-gray-400">Size</Label>
                          <select
                            id={`typography-size-select-${index}`}
                            title="Typography Size"
                            value={type.fontSize}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTypographyChange(index, 'fontSize', e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                          >
                            <option value="text-xs">Extra Small</option>
                            <option value="text-sm">Small</option>
                            <option value="text-base">Base</option>
                            <option value="text-lg">Large</option>
                            <option value="text-xl">Extra Large</option>
                            <option value="text-2xl">2XL</option>
                            <option value="text-3xl">3XL</option>
                            <option value="text-4xl">4XL</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`typography-weight-select-${index}`} className="text-sm text-gray-400">Weight</Label>
                          <select
                            id={`typography-weight-select-${index}`}
                            title="Typography Weight"
                            value={type.fontWeight}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTypographyChange(index, 'fontWeight', e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                          >
                            <option value="font-normal">Normal</option>
                            <option value="font-medium">Medium</option>
                            <option value="font-semibold">Semi-Bold</option>
                            <option value="font-bold">Bold</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`typography-family-select-${index}`} className="text-sm text-gray-400">Family</Label>
                          <select
                            id={`typography-family-select-${index}`}
                            title="Typography Family"
                            value={type.fontFamily}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTypographyChange(index, 'fontFamily', e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                          >
                            <option value="font-sans">Sans-Serif</option>
                            <option value="font-serif">Serif</option>
                            <option value="font-mono">Monospace</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="components" className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-white">Components</h3>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">HeaderSection</p>
                      <div className="mb-2">
                        <HeaderSection
                          title="KINGDOM"
                          subtitle="Your realm overview and progress"
                          imageSrc="/images/kingdom-header.jpg"
                          canEdit={false}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>HeaderSection</strong> is used as the main header/banner for most major pages (Kingdom, City, Town, Quests, Collection, etc). It supports a title, optional subtitle, and an optional image. If <code>canEdit</code> is true, an edit button appears for uploading a new banner image. Use this component for consistent, immersive page headers.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">TileVisual</p>
                      <div className="mb-2">
                        <TileVisual
                          tile={{
                            id: 'tile-1',
                            type: 'forest' as TileType,
                            name: 'Forest Tile',
                            description: 'A lush forest tile.',
                            connections: [],
                            rotation: 0 as 0 | 90 | 180 | 270,
                            revealed: true,
                            isVisited: false,
                            ariaLabel: 'Forest tile',
                            x: 0,
                            y: 0,
                            image: '/images/tiles/forest-tile.png'
                          }}
                          isSelected={false}
                          isHovered={false}
                          isCharacterPresent={false}
                          onClick={() => {}}
                          onHover={() => {}}
                          onHoverEnd={() => {}}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>TileVisual</strong> displays tile visuals with proper accessibility attributes. Used for rendering tiles in the realm and map views, with support for selection, hover states, and character presence.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">MapGrid</p>
                      <div className="mb-2">
                        <MapGrid
                          selectedTile={null}
                          grid={[ [
                            { ...mockTile },
                            {
                              ...mockTile,
                              id: 'tile-forest',
                              type: 'forest' as TileType,
                              name: 'Forest Tile',
                              description: 'A lush forest tile.',
                              image: '/images/tiles/forest-tile.png',
                              rotation: 0 as 0 | 90 | 180 | 270
                            },
                            {
                              ...mockTile,
                              id: 'tile-water',
                              type: 'water' as TileType,
                              name: 'Water Tile',
                              description: 'A water tile.',
                              image: '/images/tiles/water-tile.png',
                              rotation: 0 as 0 | 90 | 180 | 270
                            }
                          ],
                          [
                            {
                              ...mockTile,
                              id: 'tile-mountain',
                              type: 'mountain' as TileType,
                              name: 'Mountain Tile',
                              description: 'A mountain tile.',
                              image: '/images/tiles/mountain-tile.png',
                              rotation: 0 as 0 | 90 | 180 | 270
                            },
                            {
                              ...mockTile,
                              id: 'tile-ice',
                              type: 'ice' as TileType,
                              name: 'Ice Tile',
                              description: 'An ice tile.',
                              image: '/images/tiles/ice-tile.png',
                              rotation: 0 as 0 | 90 | 180 | 270
                            },
                            { ...mockTile }
                          ] ]}
                          character={{ x: 1, y: 1 }}
                          onCharacterMove={() => {}}
                          onTileClick={() => {}}
                          onGridUpdate={() => {}}
                          onGoldUpdate={() => {}}
                          onExperienceUpdate={() => {}}
                          onHover={() => {}}
                          onHoverEnd={() => {}}
                          onRotateTile={() => {}}
                          isMovementMode={false}
                          gridRotation={0}
                          hoveredTile={null}
                          setHoveredTile={() => {}}
                          horsePos={null}
                          sheepPos={null}
                          eaglePos={null}
                          penguinPos={null}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>MapGrid</strong> renders the interactive grid for the realm map. The main grid component for the realm, handling tile placement, character movement, and interactions.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">TownView</p>
                      <div className="mb-2">
                        <TownView
                          name="Medieval Town"
                          isTown={true}
                          onReturn={() => {}}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>TownView</strong> displays town-specific content and buildings. Used for rendering town-specific views, including buildings and interactive elements.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">CreatureCard</p>
                      <div className={`mb-2 ${styles['creatureCardBox']}`}>
                        <CreatureCard
                          creature={{
                            id: '001',
                            number: '#001',
                            name: 'Flamio',
                            description: 'A fiery creature awakened by the destruction of forests.',
                            image: '/images/creatures/001.png',
                            category: 'fire',
                            discovered: true,
                            stats: { hp: 64, attack: 16, defense: 8, speed: 12, type: 'Fire' },
                            requirement: 'Destroy 1 forest tile'
                          }}
                          discovered={true}
                          showCard={true}
                          previewMode={false}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>CreatureCard</strong> displays information about a creature, including its name, description, image, rarity, and discovery status. Used in the collection and discovery pages.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">CardWithProgress</p>
                      <div className="flex gap-4 mb-2">
                        <div className={styles['questCardBox']}>
                          <CardWithProgress title="Defeat the Dragon" completed={false} onToggle={() => {}} />
                        </div>
                        <div className={styles['questCardBox']}>
                          <CardWithProgress title="Rescue the Princess" completed={true} onToggle={() => {}} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>CardWithProgress</strong> is used for displaying quests in selection lists. The completed state is indicated by a checkmark.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">Toast Notifications</p>
                      <div className="mb-2">
                        <Button onClick={showToastExample}>Show Toast</Button>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>Toast Notifications</strong> provide user feedback for actions and events. Used throughout the app for notifications and alerts.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}