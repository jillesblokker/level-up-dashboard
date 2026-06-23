"use client"

import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { useGradient } from '@/app/providers/gradient-provider'
import { HeaderSection } from "@/components/HeaderSection"
import { CreatureCard } from "@/components/creature-card"
import QuestCard from "@/components/quest-card"
import { TileVisual } from "@/components/tile-visual"
import { MapGrid } from "../components/MapGrid"
import { TownView } from "@/components/town-view"
import { TileType } from '@/types/tiles'
import { typography as designTokens, spacing, colors as designColors, animation, shadows, borderRadius, createTypographyClass } from '@/lib/design-tokens'
import styles from './styles.module.css'
import { TEXT_CONTENT } from "@/lib/text-content"

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
  image: '/images/tiles/empty-tile.webp'
};

export default function DesignSystemPage() {
  const { toast } = useToast()
  const { startColor, endColor, updateGradient } = useGradient()

  const [colors, setColors] = useState<ColorItem[]>([
    { name: "Primary", class: "bg-amber-500", description: "Main accent color for buttons, links, and highlights", value: "#f59e0b" },
    { name: "Secondary", class: "bg-amber-900/20", description: "Secondary accent for subtle backgrounds", value: "#78350f33" },
    { name: "Background", class: "bg-black", description: "Main application background", value: "#000000" },
    { name: "Card Background", class: "bg-zinc-900", description: "Card and component backgrounds", value: "#111827" },
    { name: "Border", class: "border-amber-800/20", description: "Border color for components and dividers", value: "#92400e33" },
    { name: "Text Primary", class: "text-white", description: "Primary text for headings and important content", value: "#ffffff" },
    { name: "Text Secondary", class: "text-zinc-400", description: "Secondary text for descriptions and captions", value: "#9ca3af" },
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

  const [activeTab, setActiveTab] = useState<string>("overview")

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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-amber-900/20 to-black border-b border-amber-800/20">
        <div className="container max-w-7xl py-12">
          <div className="text-center space-y-4">
            <h1 className="font-serif text-5xl font-bold text-amber-400 tracking-wide">
              {TEXT_CONTENT.designSystem.title}
            </h1>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              {TEXT_CONTENT.designSystem.desc}
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-zinc-400">
              {TEXT_CONTENT.designSystem.features.map((feature, index) => (
                <span key={index}>{feature}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-zinc-900 border-amber-800/20">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-400">{TEXT_CONTENT.designSystem.navigation.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "overview"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[0]}
                  </button>
                  <button
                    onClick={() => setActiveTab("colors")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "colors"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[1]}
                  </button>
                  <button
                    onClick={() => setActiveTab("typography")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "typography"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[2]}
                  </button>
                  <button
                    onClick={() => setActiveTab("spacing")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "spacing"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[3]}
                  </button>
                  <button
                    onClick={() => setActiveTab("tokens")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "tokens"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[4]}
                  </button>
                  <button
                    onClick={() => setActiveTab("components")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === "components"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                  >
                    {TEXT_CONTENT.designSystem.navigation.items[5]}
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-b from-zinc-900/50 to-black border-amber-800/20">
              <CardContent className="p-8">
                {/* Content Sections */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.overview.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-zinc-900 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">{TEXT_CONTENT.designSystem.overview.philosophy.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-zinc-300 leading-relaxed">
                              {TEXT_CONTENT.designSystem.overview.philosophy.desc}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">{TEXT_CONTENT.designSystem.overview.mobile.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-zinc-300 leading-relaxed">
                              {TEXT_CONTENT.designSystem.overview.mobile.desc}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">{TEXT_CONTENT.designSystem.overview.accessibility.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-zinc-300 leading-relaxed">
                              {TEXT_CONTENT.designSystem.overview.accessibility.desc}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">{TEXT_CONTENT.designSystem.overview.performance.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-zinc-300 leading-relaxed">
                              {TEXT_CONTENT.designSystem.overview.performance.desc}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "colors" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.colors.title}</h2>
                      <p className="text-zinc-300 mb-8 leading-relaxed">
                        {TEXT_CONTENT.designSystem.colors.desc}
                      </p>

                      {/* Brand Colors */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Primary Brand Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {colors.map((color: ColorItem, index) => (
                            <Card key={index} className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className={`w-8 h-8 rounded-lg ${color.class} border border-zinc-700`}></div>
                                  <div>
                                    <h4 className="font-medium text-white">{color.name}</h4>
                                    <p className="text-sm text-zinc-400">{color.value}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">{color.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Complete Color Audit */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Complete Color Inventory</h3>
                        <p className="text-zinc-300 mb-6 leading-relaxed">
                          Below is a comprehensive overview of all colors used in the app, including usage statistics and consolidation recommendations.
                        </p>

                        {/* Amber/Gold Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">🔴 Amber/Gold Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Primary Amber</h4>
                                    <p className="text-sm text-zinc-400">#F59E0B (25+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Quest buttons, dropdown borders, streak bonus text</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core brand color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#D97706] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Amber Hover</h4>
                                    <p className="text-sm text-zinc-400">#D97706 (8+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Button hover states</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Proper hover state</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#92400E] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Amber Disabled</h4>
                                    <p className="text-sm text-zinc-400">#92400E (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Button disabled states</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Proper disabled state</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Green Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-green-300 mb-3">🟢 Green Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#0D7200] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Primary Green</h4>
                                    <p className="text-sm text-zinc-400">#0D7200 (10+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Progress bars, flame icons</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core success color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#7CB342] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Grass Green</h4>
                                    <p className="text-sm text-zinc-400">#7CB342 (3 uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Tile backgrounds</p>
                                <p className="text-xs text-green-400 mt-2">✅ UPDATED - Now uses #0D7200</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#8BC34A] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grass</h4>
                                    <p className="text-sm text-zinc-400">#8BC34A (2 uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Tile highlights</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ CONSIDER - Use lighter #0D7200</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Neutral Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-zinc-300 mb-3">⚫ Neutral Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#000000] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Pure Black</h4>
                                    <p className="text-sm text-zinc-400">#000000 (30+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Card backgrounds, buttons, dropdowns</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core neutral</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#F0F0F0] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grey Text</h4>
                                    <p className="text-sm text-zinc-400">#F0F0F0 (15+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Primary text, streak bonus text</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core text color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#f4f4f4] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grey Border</h4>
                                    <p className="text-sm text-zinc-400">#f4f4f4 (3+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Card borders, quest card defaults</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Design requirement</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Red Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-red-300 mb-3">🔴 Red Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#4D0000] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Dark Red Start</h4>
                                    <p className="text-sm text-zinc-400">#4D0000 (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Streak card gradients</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core streak color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#3D0000] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Dark Red End</h4>
                                    <p className="text-sm text-zinc-400">#3D0000 (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Streak card gradients</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core streak color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#240014] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Purple Red</h4>
                                    <p className="text-sm text-zinc-400">#240014 (3+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Quest card backgrounds</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ CONSIDER - Use #4D0000</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Consolidated Tile Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-green-300 mb-3">🎨 Consolidated Tile Colors (Updated)</h4>
                          <p className="text-zinc-300 mb-4 text-sm">
                            These colors have been successfully consolidated with design system colors for better consistency.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#0D7200] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Green</h4>
                                    <p className="text-sm text-zinc-400">#0D7200 (Updated)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Special tiles</p>
                                <p className="text-xs text-green-400 mt-2">✅ UPDATED - Now uses #0D7200</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#1e90ff] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Blue</h4>
                                    <p className="text-sm text-zinc-400">#1e90ff (Updated)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Water tiles</p>
                                <p className="text-xs text-green-400 mt-2">✅ UPDATED - Now uses #1e90ff</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#9932cc] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Purple</h4>
                                    <p className="text-sm text-zinc-400">#9932cc (Updated)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Magic tiles</p>
                                <p className="text-xs text-green-400 mt-2">✅ UPDATED - Now uses #9932cc</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] border border-zinc-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Orange</h4>
                                    <p className="text-sm text-zinc-400">#F59E0B (Updated)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300">Fire tiles</p>
                                <p className="text-xs text-green-400 mt-2">✅ UPDATED - Now uses #F59E0B</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Gradients */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-purple-300 mb-3">🌈 Gradients</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-[#000428] to-[#004E92] mb-3"></div>
                                <h4 className="font-medium text-white mb-1">Page Background</h4>
                                <p className="text-sm text-zinc-400">linear-gradient(135deg, #000428 0%, #004E92 100%)</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-[#4D0000] to-[#3D0000] mb-3"></div>
                                <h4 className="font-medium text-white mb-1">Streak Cards</h4>
                                <p className="text-sm text-zinc-400">linear-gradient(148.59deg, #4D0000 0%, #3D0000 100%)</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Consolidation Recommendations */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-yellow-300 mb-3">🎯 Consolidation Recommendations</h4>
                          <div className="space-y-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">1. Standardize Greys ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Replaced #6b7280 and #9ca3af with #f4f4f4 for consistency</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - 13+ color instances updated</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">2. Consolidate Reds ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Replaced #240014 and #2d1300 with #4D0000 for consistency</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - 6+ color instances updated</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">3. Consolidate Tile Colors ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Replaced single-use tile colors with design system equivalents</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - 6+ color instances updated</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Recent UI Improvements */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-green-300 mb-3">🆕 Recent UI Improvements</h4>
                          <div className="space-y-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">1. API Endpoints & Authentication ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Added PUT methods to challenges and milestones APIs, fixed inventory API error handling</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - All completion updates now work properly</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">2. Kingdom Stats Graphs ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed kingdom stats and gains graphs with proper authentication and test data</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Graphs now display data correctly with proper API integration</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">3. Inventory System Updates ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed inventory API to handle missing item properties gracefully</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Kingdom tile items now properly stored in database</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">4. Quest Category Filter ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Added category filter to quests page with proper quest-specific categories</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Quest categories: Might, Knowledge, Honor, Castle, Craft, Vitality, Wellness, Exploration</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">5. Achievements Layout Fix ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed achievements page layout (2 columns on desktop/tablet, 1 on mobile) and removed polling</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Responsive layout with no unintended page reloads</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">6. Dropdown Border Consistency ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Removed double amber borders from all dropdowns (border-2 → border)</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - All quest page dropdowns updated</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">7. Disabled Button Transparency ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed disabled button transparency by removing disabled:opacity-50</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Buttons now use darker backgrounds with lighter text</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">8. Notification Center Updates ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Removed emojis, simplified buttons, changed title to &quot;New achievement&quot;</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Cleaner notification interface with better UX</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">9. Page Padding Optimization ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Removed horizontal padding for better space utilization</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Full-width content with minimal element spacing</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">10. Kingdom Properties System ✅ COMPLETED</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed property placement system to separate placeable buildings from functional reward tiles</p>
                                <p className="text-xs text-green-400">✅ IMPLEMENTED - Properties now stay on map, functional tiles generate rewards properly</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Recent API & Component Updates */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-blue-300 mb-3">🔧 Recent API & Component Updates</h4>
                          <div className="space-y-4">
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">Challenges & Milestones APIs</h5>
                                <p className="text-sm text-zinc-300 mb-2">Added PUT methods to handle completion updates with proper error handling</p>
                                <code className="text-amber-400 text-xs bg-zinc-800 px-2 py-1 rounded">PUT /api/challenges</code>
                                <code className="text-amber-400 text-xs bg-zinc-800 px-2 py-1 rounded ml-2">PUT /api/milestones</code>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">Inventory API Improvements</h5>
                                <p className="text-sm text-zinc-300 mb-2">Enhanced error handling and graceful property handling for missing item data</p>
                                <code className="text-amber-400 text-xs bg-zinc-800 px-2 py-1 rounded">POST /api/inventory</code>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">Kingdom Stats Graph Component</h5>
                                <p className="text-sm text-zinc-300 mb-2">Fixed authentication and data display with proper API integration</p>
                                <code className="text-amber-400 text-xs bg-zinc-800 px-2 py-1 rounded">components/kingdom-stats-graph.tsx</code>
                              </CardContent>
                            </Card>
                            <Card className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">Quest Organization Component</h5>
                                <p className="text-sm text-zinc-300 mb-2">Added category filtering with quest-specific categories</p>
                                <code className="text-amber-400 text-xs bg-zinc-800 px-2 py-1 rounded">components/quest-organization.tsx</code>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Color Reference System */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-cyan-300 mb-3">📋 Color Reference System</h4>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-medium text-white mb-2">Primary Colors</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-300">--color-amber-primary:</span>
                                      <span className="text-amber-400">#F59E0B</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-300">--color-green-primary:</span>
                                      <span className="text-green-400">#0D7200</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-300">--color-red-primary:</span>
                                      <span className="text-red-400">#4D0000</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-300">--color-black:</span>
                                      <span className="text-zinc-400">#000000</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-white mb-2">Usage Examples</h5>
                                  <div className="space-y-2 text-sm">
                                    <code className="text-amber-400 bg-zinc-800 px-2 py-1 rounded">bg-[#F59E0B] hover:bg-[#D97706]</code>
                                    <code className="text-amber-400 bg-zinc-800 px-2 py-1 rounded">border-2 border-[#f4f4f4] bg-[#000000]</code>
                                    <code className="text-amber-400 bg-zinc-800 px-2 py-1 rounded">text-[#F0F0F0]</code>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Semantic Colors */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Semantic Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Success</h4>
                              <p className="text-sm text-zinc-400">Positive actions and achievements</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-amber-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Warning</h4>
                              <p className="text-sm text-zinc-400">Important notices and alerts</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Error</h4>
                              <p className="text-sm text-zinc-400">Errors and destructive actions</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Info</h4>
                              <p className="text-sm text-zinc-400">Informational content</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "typography" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.typography.title}</h2>
                      <p className="text-zinc-300 mb-8 leading-relaxed">
                        {TEXT_CONTENT.designSystem.typography.desc}
                      </p>

                      {/* Font Scale */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.typography.scale.title}</h3>
                        <div className="space-y-4">
                          {[
                            { key: '5xl', value: `text-5xl`, label: TEXT_CONTENT.designSystem.typography.scale.items["5xl"].label, example: TEXT_CONTENT.designSystem.typography.scale.items["5xl"].example },
                            { key: '4xl', value: `text-4xl`, label: TEXT_CONTENT.designSystem.typography.scale.items["4xl"].label, example: TEXT_CONTENT.designSystem.typography.scale.items["4xl"].example },
                            { key: '3xl', value: `text-3xl`, label: TEXT_CONTENT.designSystem.typography.scale.items["3xl"].label, example: TEXT_CONTENT.designSystem.typography.scale.items["3xl"].example },
                            { key: '2xl', value: `text-2xl`, label: TEXT_CONTENT.designSystem.typography.scale.items["2xl"].label, example: TEXT_CONTENT.designSystem.typography.scale.items["2xl"].example },
                            { key: 'xl', value: `text-xl`, label: TEXT_CONTENT.designSystem.typography.scale.items["xl"].label, example: TEXT_CONTENT.designSystem.typography.scale.items["xl"].example },
                            { key: 'lg', value: `text-lg`, label: TEXT_CONTENT.designSystem.typography.scale.items.lg.label, example: TEXT_CONTENT.designSystem.typography.scale.items.lg.example },
                            { key: 'base', value: `text-base`, label: TEXT_CONTENT.designSystem.typography.scale.items.base.label, example: TEXT_CONTENT.designSystem.typography.scale.items.base.example },
                            { key: 'sm', value: `text-sm`, label: TEXT_CONTENT.designSystem.typography.scale.items.sm.label, example: TEXT_CONTENT.designSystem.typography.scale.items.sm.example },
                            { key: 'xs', value: `text-xs`, label: TEXT_CONTENT.designSystem.typography.scale.items.xs.label, example: TEXT_CONTENT.designSystem.typography.scale.items.xs.example },
                          ].map(({ key, value, label, example }) => (
                            <Card key={key} className="bg-zinc-900 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-white mb-1">{label}</h4>
                                    <p className="text-sm text-zinc-400">{key} • {value}</p>
                                  </div>
                                  <div className={`${value} text-white max-w-md`}>{example}</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Font Families */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.typography.families.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-serif text-2xl text-amber-400 mb-2">{TEXT_CONTENT.designSystem.typography.families.serif.title}</h4>
                              <p className="text-sm text-zinc-400">{TEXT_CONTENT.designSystem.typography.families.serif.desc}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-sans text-2xl text-amber-400 mb-2">{TEXT_CONTENT.designSystem.typography.families.sans.title}</h4>
                              <p className="text-sm text-zinc-400">{TEXT_CONTENT.designSystem.typography.families.sans.desc}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-mono text-2xl text-amber-400 mb-2">{TEXT_CONTENT.designSystem.typography.families.mono.title}</h4>
                              <p className="text-sm text-zinc-400">{TEXT_CONTENT.designSystem.typography.families.mono.desc}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "spacing" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.spacing.title}</h2>
                      <p className="text-zinc-300 mb-8 leading-relaxed">
                        {TEXT_CONTENT.designSystem.spacing.desc}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Object.entries(spacing).slice(0, 12).map(([key, value]) => (
                          <Card key={key} className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div
                                className="bg-amber-500 rounded mx-auto mb-2"
                                style={{
                                  width: value === '0' ? '4px' : value,
                                  height: '16px'
                                }}
                              />
                              <p className="text-sm font-medium text-white">{key}</p>
                              <p className="text-xs text-zinc-400">{value}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "tokens" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.tokens.title}</h2>
                      <p className="text-zinc-300 mb-8 leading-relaxed">
                        {TEXT_CONTENT.designSystem.tokens.desc}
                      </p>

                      {/* Animation Tokens - Temporarily disabled */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.tokens.animation.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-1">{TEXT_CONTENT.designSystem.tokens.animation.fast}</h4>
                              <p className="text-sm text-zinc-400">150ms</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-1">{TEXT_CONTENT.designSystem.tokens.animation.normal}</h4>
                              <p className="text-sm text-zinc-400">300ms</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-1">{TEXT_CONTENT.designSystem.tokens.animation.slow}</h4>
                              <p className="text-sm text-zinc-400">500ms</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Example Usage */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.tokens.example.title}</h3>
                        <div className="space-y-4">
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-2">{TEXT_CONTENT.designSystem.tokens.example.typography}</h4>
                              <code className="text-amber-400 text-sm block bg-zinc-800 p-3 rounded">
                                text-2xl font-bold
                              </code>
                            </CardContent>
                          </Card>
                          <Card className="bg-zinc-900 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-2">{TEXT_CONTENT.designSystem.tokens.example.colorSpacing}</h4>
                              <code className="text-amber-400 text-sm block bg-zinc-800 p-3 rounded">
                                text-green-500 p-4
                              </code>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "components" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">{TEXT_CONTENT.designSystem.components.title}</h2>
                      <p className="text-zinc-300 mb-8 leading-relaxed">
                        {TEXT_CONTENT.designSystem.components.desc}
                      </p>

                      {/* Basic UI Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.components.basic.title}</h3>

                        {/* Buttons */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.buttons.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-3">
                                <Button>Default Button</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button size="sm">Small</Button>
                                <Button size="lg">Large</Button>
                                <Button disabled>Disabled</Button>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.buttons.desc}
                          </p>
                        </div>

                        {/* Inputs */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.inputs.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4 space-y-4">
                              <div>
                                <Label htmlFor="example-input">{TEXT_CONTENT.designSystem.components.basic.inputs.inputLabel}</Label>
                                <Input id="example-input" placeholder={TEXT_CONTENT.designSystem.components.basic.inputs.inputPlaceholder} />
                              </div>
                              <div>
                                <Label htmlFor="example-textarea">{TEXT_CONTENT.designSystem.components.basic.inputs.textareaLabel}</Label>
                                <textarea
                                  id="example-textarea"
                                  placeholder={TEXT_CONTENT.designSystem.components.basic.inputs.textareaPlaceholder}
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.inputs.desc}
                          </p>
                        </div>

                        {/* Cards */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.cards.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-zinc-800/50 border-amber-800/20">
                                  <CardHeader>
                                    <CardTitle>Card Title</CardTitle>
                                    <CardDescription>Card description text</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <p>Card content goes here</p>
                                  </CardContent>
                                </Card>
                                <Card className="bg-zinc-800/50 border-amber-800/20">
                                  <CardContent className="p-4">
                                    <p>Simple card with just content</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.cards.desc}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.badges.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">Default</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">Secondary</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80">Destructive</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">Outline</span>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.badges.desc}
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.progress.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4 space-y-4">
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Progress Bar</span>
                                  <span>75%</span>
                                </div>
                                <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                                  <div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-25%)` }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Loading State</span>
                                  <span>Loading...</span>
                                </div>
                                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-full"></div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.progress.desc}
                          </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.basic.checkboxes.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="checkbox-1" className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                                  <label htmlFor="checkbox-1" className="text-sm">Unchecked</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="checkbox-2" checked className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                                  <label htmlFor="checkbox-2" className="text-sm">Checked</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="checkbox-3" disabled className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                                  <label htmlFor="checkbox-3" className="text-sm">Disabled</label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.basic.checkboxes.desc}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.components.navigation.title}</h3>

                        {/* Tabs */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.navigation.tabs.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="settings">Settings</TabsTrigger>
                                  <TabsTrigger value="profile">Profile</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="mt-4">
                                  <p className="text-sm text-zinc-300">Overview content goes here</p>
                                </TabsContent>
                                <TabsContent value="settings" className="mt-4">
                                  <p className="text-sm text-zinc-300">Settings content goes here</p>
                                </TabsContent>
                                <TabsContent value="profile" className="mt-4">
                                  <p className="text-sm text-zinc-300">Profile content goes here</p>
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.navigation.tabs.desc}
                          </p>
                        </div>

                        {/* Tooltips */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.navigation.tooltips.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <TooltipProvider>
                                <div className="flex space-x-4">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline">Hover me</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This is a tooltip</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline">Another tooltip</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Another tooltip example</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.navigation.tooltips.desc}
                          </p>
                        </div>

                        {/* Scroll Area */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.navigation.scrollArea.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="relative overflow-hidden h-32 w-full rounded-[inherit]">
                                <div className="h-full w-full rounded-[inherit]">
                                  <div className="space-y-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                      <div key={i} className="h-8 bg-zinc-800 rounded flex items-center px-3">
                                        Scrollable Item {i + 1}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-2.5 border-l border-l-transparent p-[1px]">
                                  <div className="relative flex-1 rounded-full bg-border w-2"></div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.navigation.scrollArea.desc}
                          </p>
                        </div>
                      </div>

                      {/* Game-Specific Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.components.game.title}</h3>

                        {/* HeaderSection Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.game.header.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <HeaderSection
                                title="KINGDOM"
                                subtitle="Your realm overview and progress"
                                imageSrc="/images/kingdom-header.webp"
                                canEdit={false}
                              />
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.game.header.desc}
                          </p>
                        </div>

                        {/* TileVisual Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.game.tile.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex space-x-4">
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
                                    image: '/images/tiles/forest-tile.webp'
                                  }}
                                  isSelected={false}
                                  isHovered={false}
                                  isCharacterPresent={false}
                                  onClick={() => { }}
                                  onHover={() => { }}
                                  onHoverEnd={() => { }}
                                />
                                <TileVisual
                                  tile={{
                                    id: 'tile-2',
                                    type: 'water' as TileType,
                                    name: 'Water Tile',
                                    description: 'A water tile.',
                                    connections: [],
                                    rotation: 0 as 0 | 90 | 180 | 270,
                                    revealed: true,
                                    isVisited: false,
                                    ariaLabel: 'Water tile',
                                    x: 0,
                                    y: 0,
                                    image: '/images/tiles/water-tile.webp'
                                  }}
                                  isSelected={true}
                                  isHovered={false}
                                  isCharacterPresent={false}
                                  onClick={() => { }}
                                  onHover={() => { }}
                                  onHoverEnd={() => { }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.game.tile.desc}
                          </p>
                        </div>

                        {/* CreatureCard Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.game.creature.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className={styles['creatureCardBox']}>
                                <CreatureCard
                                  creature={{
                                    id: '001',
                                    number: '#001',
                                    name: 'Flamio',
                                    description: 'A fiery creature awakened by the destruction of forests.',
                                    image: '/images/creatures/001.webp',
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
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.game.creature.desc}
                          </p>
                        </div>

                        {/* Quest Card */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.game.quest.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <QuestCard
                                title="Defeat the Dragon"
                                description="A mighty dragon has appeared in the realm"
                                category="might"
                                difficulty="hard"
                                progress={25}
                                maxProgress={100}
                                reward={{
                                  experience: 100,
                                  gold: 50
                                }}
                                status="in-progress"
                                onClick={() => {
                                  logger.debug('Quest card clicked');
                                }}
                                onComplete={() => {
                                  logger.debug('Quest completed');
                                  toast({
                                    title: "Quest Completed!",
                                    description: "You have defeated the dragon!",
                                    variant: "default"
                                  });
                                }}
                              />
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.game.quest.desc}
                          </p>
                        </div>
                      </div>

                      {/* Feedback Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.components.feedback.title}</h3>

                        {/* Toast Notifications */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.feedback.toast.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <Button onClick={showToastExample} aria-label="Show toast notification example">{TEXT_CONTENT.designSystem.components.feedback.toast.button}</Button>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.feedback.toast.desc}
                          </p>
                        </div>

                        {/* Alerts */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.feedback.alerts.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4 space-y-4">
                              <div className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground bg-background text-foreground">
                                <div className="text-sm [&_p]:leading-relaxed">{TEXT_CONTENT.designSystem.components.feedback.alerts.default}</div>
                              </div>
                              <div className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                                <div className="text-sm [&_p]:leading-relaxed">{TEXT_CONTENT.designSystem.components.feedback.alerts.destructive}</div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.feedback.alerts.desc}
                          </p>
                        </div>

                        {/* Skeleton Loading */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.feedback.skeleton.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-3/4"></div>
                                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-1/2"></div>
                                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-5/6"></div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.feedback.skeleton.desc}
                          </p>
                        </div>

                        {/* Dialog/Modal */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.feedback.dialog.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-background p-6 shadow-lg">
                                  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">{TEXT_CONTENT.designSystem.components.feedback.dialog.dialogTitle}</h3>
                                    <p className="text-sm text-muted-foreground">{TEXT_CONTENT.designSystem.components.feedback.dialog.dialogDesc}</p>
                                  </div>
                                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                    <Button variant="outline" size="sm">Cancel</Button>
                                    <Button size="sm">Confirm</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.feedback.dialog.desc}
                          </p>
                        </div>

                        {/* Select Dropdown */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.formExtend.select.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <span>{TEXT_CONTENT.designSystem.components.formExtend.select.placeholder}</span>
                                <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.formExtend.select.desc}
                          </p>
                        </div>

                        {/* Hover Card */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.overlays.hoverCard.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{TEXT_CONTENT.designSystem.components.overlays.hoverCard.trigger}</span>
                                <div className="relative">
                                  <div className="z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">{TEXT_CONTENT.designSystem.components.overlays.hoverCard.cardTitle}</h4>
                                      <p className="text-sm text-muted-foreground">{TEXT_CONTENT.designSystem.components.overlays.hoverCard.cardDesc}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.overlays.hoverCard.desc}
                          </p>
                        </div>

                        {/* Sheet/Sidebar */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.overlays.sheet.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="border border-amber-800/20 rounded-lg p-4 bg-zinc-800/50">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">{TEXT_CONTENT.designSystem.components.overlays.sheet.contentTitle}</h3>
                                  <button className="text-zinc-400 hover:text-white">×</button>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-zinc-700 rounded"></div>
                                  <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                                  <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.overlays.sheet.desc}
                          </p>
                        </div>

                        {/* Command Palette */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.overlays.command.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="rounded-md bg-popover text-popover-foreground p-2">
                                <div className="flex items-center border-b px-3 py-2">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input
                                    placeholder={TEXT_CONTENT.designSystem.components.overlays.command.placeholder}
                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                </div>
                                <div className="py-2">
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{TEXT_CONTENT.designSystem.components.overlays.command.recent}</div>
                                  <div className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">{TEXT_CONTENT.designSystem.components.overlays.command.openKingdom}</div>
                                  <div className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">{TEXT_CONTENT.designSystem.components.overlays.command.viewQuests}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.overlays.command.desc}
                          </p>
                        </div>

                        {/* Kingdom Properties System */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-zinc-300">{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.placeable}</span>
                                  <span className="text-green-400">1</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-zinc-300">{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.functional}</span>
                                  <span className="text-blue-400">20+</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-zinc-300">{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.material}</span>
                                  <span className="text-amber-400">5 Materials</span>
                                </div>
                                <div className="text-xs text-zinc-400 mt-2">
                                  <strong>{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.current}</strong> House (5 logs + 3 planks)
                                </div>
                                <div className="text-xs text-zinc-400">
                                  <strong>{TEXT_CONTENT.designSystem.components.kingdomExtend.properties.materials}</strong> Logs → Planks → Steel → Silver → Gold
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.kingdomExtend.properties.desc}
                          </p>
                        </div>

                        {/* Design System Rules */}
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-white mb-4">{TEXT_CONTENT.designSystem.components.rules.title}</h3>

                          {/* Card Background Guidelines */}
                          <div className="mb-6">
                            <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.rules.backgrounds.title}</h4>
                            <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div className="p-3 bg-black border border-amber-800/20 rounded-lg">
                                      <h5 className="font-semibold text-white">{TEXT_CONTENT.designSystem.components.rules.backgrounds.black.title}</h5>
                                      <p className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.backgrounds.black.desc}</p>
                                    </div>
                                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                                      <h5 className="font-semibold text-white">{TEXT_CONTENT.designSystem.components.rules.backgrounds.red.title}</h5>
                                      <p className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.backgrounds.red.desc}</p>
                                    </div>
                                    <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                      <h5 className="font-semibold text-white">{TEXT_CONTENT.designSystem.components.rules.backgrounds.blue.title}</h5>
                                      <p className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.backgrounds.blue.desc}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="p-3 bg-zinc-900 border border-zinc-700/30 rounded-lg">
                                      <h5 className="font-semibold text-white">{TEXT_CONTENT.designSystem.components.rules.backgrounds.gray.title}</h5>
                                      <p className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.backgrounds.gray.desc}</p>
                                    </div>
                                    <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                                      <h5 className="font-semibold text-white">{TEXT_CONTENT.designSystem.components.rules.backgrounds.amber.title}</h5>
                                      <p className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.backgrounds.amber.desc}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Component Usage Rules */}
                          <div className="mb-6">
                            <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.rules.usage.title}</h4>
                            <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold text-white mb-2">{TEXT_CONTENT.designSystem.components.rules.usage.buttons.title}</h5>
                                    <div className="flex flex-wrap gap-2">
                                      <Button className="bg-amber-600 hover:bg-amber-700">Primary</Button>
                                      <Button className="bg-zinc-700 hover:bg-zinc-600">Secondary</Button>
                                      <Button className="bg-red-600 hover:bg-red-700">Destructive</Button>
                                      <Button disabled className="bg-zinc-600 text-zinc-400">Disabled</Button>
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-white mb-2">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.title}</h5>
                                    <div className="space-y-1 text-sm">
                                      <p className="text-white">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.primary}</p>
                                      <p className="text-zinc-300">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.secondary}</p>
                                      <p className="text-zinc-400">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.muted}</p>
                                      <p className="text-amber-400">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.accent}</p>
                                      <p className="text-green-400">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.success}</p>
                                      <p className="text-red-400">{TEXT_CONTENT.designSystem.components.rules.usage.textColors.error}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-white mb-2">{TEXT_CONTENT.designSystem.components.rules.usage.spacing.title}</h5>
                                    <ul className="text-sm text-zinc-300 space-y-1">
                                      <li><strong>{TEXT_CONTENT.designSystem.components.rules.usage.spacing.cards}</strong> {TEXT_CONTENT.designSystem.components.rules.usage.spacing.cardsVal}</li>
                                      <li><strong>{TEXT_CONTENT.designSystem.components.rules.usage.spacing.sections}</strong> {TEXT_CONTENT.designSystem.components.rules.usage.spacing.sectionsVal}</li>
                                      <li><strong>{TEXT_CONTENT.designSystem.components.rules.usage.spacing.grid}</strong> {TEXT_CONTENT.designSystem.components.rules.usage.spacing.gridVal}</li>
                                    </ul>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Accessibility Guidelines */}
                          <div className="mb-6">
                            <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.rules.accessibility.title}</h4>
                            <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                              <CardContent className="p-4">
                                <ul className="text-sm text-zinc-300 space-y-2">
                                  {TEXT_CONTENT.designSystem.components.rules.accessibility.items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Kingdom Stats Graph Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">{TEXT_CONTENT.designSystem.components.kingdomExtend.stats.title}</h4>
                          <Card className="bg-zinc-900 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex space-x-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-amber-400">📊</div>
                                  <div className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.kingdomExtend.stats.statsGraph}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-amber-400">📈</div>
                                  <div className="text-sm text-zinc-300">{TEXT_CONTENT.designSystem.components.kingdomExtend.stats.gainsGraph}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-zinc-400 mb-4">
                            {TEXT_CONTENT.designSystem.components.kingdomExtend.stats.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
