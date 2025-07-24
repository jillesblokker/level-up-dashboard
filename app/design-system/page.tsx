"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
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
import { typography as designTokens, spacing, colors as designColors, animation, shadows, borderRadius, createTypographyClass } from '@/lib/design-tokens'
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
    { name: "Primary", class: "bg-amber-500", description: "Main accent color for buttons, links, and highlights", value: "#f59e0b" },
    { name: "Secondary", class: "bg-amber-900/20", description: "Secondary accent for subtle backgrounds", value: "#78350f33" },
    { name: "Background", class: "bg-black", description: "Main application background", value: "#000000" },
    { name: "Card Background", class: "bg-gray-900", description: "Card and component backgrounds", value: "#111827" },
    { name: "Border", class: "border-amber-800/20", description: "Border color for components and dividers", value: "#92400e33" },
    { name: "Text Primary", class: "text-white", description: "Primary text for headings and important content", value: "#ffffff" },
    { name: "Text Secondary", class: "text-gray-400", description: "Secondary text for descriptions and captions", value: "#9ca3af" },
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
        <div className="container max-w-7xl py-12 px-6">
          <div className="text-center space-y-4">
            <h1 className="font-serif text-5xl font-bold text-amber-400 tracking-wide">
              Thrivehaven Design System
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A comprehensive design system for the medieval kingdom management game. 
              Built with consistency, accessibility, and user experience in mind.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <span>🎨 Design Tokens</span>
              <span>📱 Mobile First</span>
              <span>♿ Accessibility</span>
              <span>⚡ Performance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl py-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-gray-900/50 border-amber-800/20">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-400">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "overview" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("colors")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "colors" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Colors
                  </button>
                  <button
                    onClick={() => setActiveTab("typography")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "typography" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Typography
                  </button>
                  <button
                    onClick={() => setActiveTab("spacing")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "spacing" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Spacing
                  </button>
                  <button
                    onClick={() => setActiveTab("tokens")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "tokens" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Design Tokens
                  </button>
                  <button
                    onClick={() => setActiveTab("components")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === "components" 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    Components
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-b from-gray-900/50 to-black border-amber-800/20">
              <CardContent className="p-8">
                {/* Content Sections */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Design System Overview</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gray-900/50 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">🎨 Design Philosophy</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">
                              Our design system emphasizes medieval aesthetics while maintaining modern usability. 
                              We prioritize accessibility, performance, and consistent user experience across all platforms.
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900/50 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">📱 Mobile First</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">
                              Built with mobile devices in mind, ensuring touch-friendly interactions and 
                              responsive layouts that work seamlessly across all screen sizes.
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900/50 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">♿ Accessibility</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">
                              WCAG 2.1 AA compliant with proper keyboard navigation, screen reader support, 
                              and high contrast ratios for inclusive user experience.
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900/50 border-amber-800/20">
                          <CardHeader>
                            <CardTitle className="text-amber-400">⚡ Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">
                              Optimized for speed with efficient animations, lazy loading, and minimal 
                              bundle sizes to ensure smooth gameplay experience.
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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Complete Color System</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our comprehensive color system includes 50+ unique colors across the entire app, 
                        with carefully chosen semantic colors for different states and interactions.
                      </p>
                      
                      {/* Brand Colors */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Primary Brand Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {colors.map((color: ColorItem, index) => (
                            <Card key={index} className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className={`w-8 h-8 rounded-lg ${color.class} border border-gray-700`}></div>
                                  <div>
                                    <h4 className="font-medium text-white">{color.name}</h4>
                                    <p className="text-sm text-gray-400">{color.value}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">{color.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Complete Color Audit */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Complete Color Inventory</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                          Below is a comprehensive overview of all colors used in the app, including usage statistics and consolidation recommendations.
                        </p>
                        
                        {/* Amber/Gold Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">🔴 Amber/Gold Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Primary Amber</h4>
                                    <p className="text-sm text-gray-400">#F59E0B (25+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Quest buttons, dropdown borders, streak bonus text</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core brand color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#D97706] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Amber Hover</h4>
                                    <p className="text-sm text-gray-400">#D97706 (8+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Button hover states</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Proper hover state</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#92400E] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Amber Disabled</h4>
                                    <p className="text-sm text-gray-400">#92400E (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Button disabled states</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Proper disabled state</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Green Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-green-300 mb-3">🟢 Green Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#0D7200] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Primary Green</h4>
                                    <p className="text-sm text-gray-400">#0D7200 (10+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Progress bars, flame icons</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core success color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#7CB342] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Grass Green</h4>
                                    <p className="text-sm text-gray-400">#7CB342 (3 uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Tile backgrounds</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ CONSIDER - Use #0D7200</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#8BC34A] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grass</h4>
                                    <p className="text-sm text-gray-400">#8BC34A (2 uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Tile highlights</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ CONSIDER - Use lighter #0D7200</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Neutral Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-gray-300 mb-3">⚫ Neutral Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#000000] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Pure Black</h4>
                                    <p className="text-sm text-gray-400">#000000 (30+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Card backgrounds, buttons, dropdowns</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core neutral</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#F0F0F0] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grey Text</h4>
                                    <p className="text-sm text-gray-400">#F0F0F0 (15+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Primary text, streak bonus text</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core text color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#f4f4f4] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Light Grey Border</h4>
                                    <p className="text-sm text-gray-400">#f4f4f4 (3+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Card borders, quest card defaults</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Design requirement</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Red Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-red-300 mb-3">🔴 Red Colors (Frequently Used)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#4D0000] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Dark Red Start</h4>
                                    <p className="text-sm text-gray-400">#4D0000 (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Streak card gradients</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core streak color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#3D0000] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Dark Red End</h4>
                                    <p className="text-sm text-gray-400">#3D0000 (5+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Streak card gradients</p>
                                <p className="text-xs text-green-400 mt-2">✅ KEEP - Core streak color</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#240014] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Purple Red</h4>
                                    <p className="text-sm text-gray-400">#240014 (3+ uses)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Quest card backgrounds</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ CONSIDER - Use #4D0000</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Single-Use Colors */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-blue-300 mb-3">🎨 Single-Use Colors (Consolidation Candidates)</h4>
                          <p className="text-gray-300 mb-4 text-sm">
                            These colors are used only once and are good candidates for consolidation with design system colors.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#4CAF50] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Green</h4>
                                    <p className="text-sm text-gray-400">#4CAF50 (1 use)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Special tiles</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ Use #0D7200</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#2196F3] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Blue</h4>
                                    <p className="text-sm text-gray-400">#2196F3 (1 use)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Water tiles</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ Use #1e90ff</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#7E57C2] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Purple</h4>
                                    <p className="text-sm text-gray-400">#7E57C2 (1 use)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Magic tiles</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ Use #9932cc</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#FFA000] border border-gray-700"></div>
                                  <div>
                                    <h4 className="font-medium text-white">Tile Orange</h4>
                                    <p className="text-sm text-gray-400">#FFA000 (1 use)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300">Fire tiles</p>
                                <p className="text-xs text-yellow-400 mt-2">⚠️ Use #F59E0B</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Gradients */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-purple-300 mb-3">🌈 Gradients</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-[#000428] to-[#004E92] mb-3"></div>
                                <h4 className="font-medium text-white mb-1">Page Background</h4>
                                <p className="text-sm text-gray-400">linear-gradient(135deg, #000428 0%, #004E92 100%)</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-[#4D0000] to-[#3D0000] mb-3"></div>
                                <h4 className="font-medium text-white mb-1">Streak Cards</h4>
                                <p className="text-sm text-gray-400">linear-gradient(148.59deg, #4D0000 0%, #3D0000 100%)</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Consolidation Recommendations */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-yellow-300 mb-3">🎯 Consolidation Recommendations</h4>
                          <div className="space-y-4">
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">1. Standardize Greys</h5>
                                <p className="text-sm text-gray-300 mb-2">Replace #6b7280 and #9ca3af with #f4f4f4 for consistency</p>
                                <p className="text-xs text-gray-400">Impact: 13+ color instances</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">2. Consolidate Reds</h5>
                                <p className="text-sm text-gray-300 mb-2">Replace #240014 and #2d1300 with #4D0000 for consistency</p>
                                <p className="text-xs text-gray-400">Impact: 6+ color instances</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <h5 className="font-medium text-white mb-2">3. Consolidate Tile Colors</h5>
                                <p className="text-sm text-gray-300 mb-2">Replace single-use tile colors with design system equivalents</p>
                                <p className="text-xs text-gray-400">Impact: 6+ color instances</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Color Reference System */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-cyan-300 mb-3">📋 Color Reference System</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-medium text-white mb-2">Primary Colors</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">--color-amber-primary:</span>
                                      <span className="text-amber-400">#F59E0B</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">--color-green-primary:</span>
                                      <span className="text-green-400">#0D7200</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">--color-red-primary:</span>
                                      <span className="text-red-400">#4D0000</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">--color-black:</span>
                                      <span className="text-gray-400">#000000</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-white mb-2">Usage Examples</h5>
                                  <div className="space-y-2 text-sm">
                                    <code className="text-amber-400 bg-gray-800 px-2 py-1 rounded">bg-[#F59E0B] hover:bg-[#D97706]</code>
                                    <code className="text-amber-400 bg-gray-800 px-2 py-1 rounded">border-2 border-[#f4f4f4] bg-[#000000]</code>
                                    <code className="text-amber-400 bg-gray-800 px-2 py-1 rounded">text-[#F0F0F0]</code>
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
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Success</h4>
                              <p className="text-sm text-gray-400">Positive actions and achievements</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-amber-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Warning</h4>
                              <p className="text-sm text-gray-400">Important notices and alerts</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Error</h4>
                              <p className="text-sm text-gray-400">Errors and destructive actions</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3"></div>
                              <h4 className="font-medium text-white mb-1">Info</h4>
                              <p className="text-sm text-gray-400">Informational content</p>
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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Typography</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our typography system uses a combination of serif and sans-serif fonts to create 
                        a medieval aesthetic while maintaining excellent readability.
                      </p>
                      
                      {/* Font Scale */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Font Scale</h3>
                        <div className="space-y-4">
                          {[
                            { key: '5xl', value: designTokens['5xl'], label: 'Hero Headings', example: 'Thrivehaven Kingdom' },
                            { key: '4xl', value: designTokens['4xl'], label: 'Page Headings', example: 'Welcome to Your Realm' },
                            { key: '3xl', value: designTokens['3xl'], label: 'Section Headings', example: 'Character Stats' },
                            { key: '2xl', value: designTokens['2xl'], label: 'Subsection Headings', example: 'Achievements' },
                            { key: 'xl', value: designTokens.xl, label: 'Card Titles', example: 'Quest Complete' },
                            { key: 'lg', value: designTokens.lg, label: 'Body Large', example: 'Important game text' },
                            { key: 'base', value: designTokens.base, label: 'Body Text', example: 'Regular content and descriptions' },
                            { key: 'sm', value: designTokens.sm, label: 'Small Text', example: 'Captions and metadata' },
                            { key: 'xs', value: designTokens.xs, label: 'Micro Text', example: 'Tiny labels and notes' },
                          ].map(({ key, value, label, example }) => (
                            <Card key={key} className="bg-gray-900/50 border-amber-800/20">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-white mb-1">{label}</h4>
                                    <p className="text-sm text-gray-400">{key} • {value}</p>
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
                        <h3 className="text-xl font-semibold text-white mb-4">Font Families</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-serif text-2xl text-amber-400 mb-2">Serif</h4>
                              <p className="text-sm text-gray-400">Headings and titles</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-sans text-2xl text-amber-400 mb-2">Sans-Serif</h4>
                              <p className="text-sm text-gray-400">Body text and UI</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-mono text-2xl text-amber-400 mb-2">Monospace</h4>
                              <p className="text-sm text-gray-400">Code and data</p>
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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Spacing System</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our spacing system uses a 4px base unit to create consistent layouts and 
                        maintain visual harmony throughout the application.
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Object.entries(spacing).slice(0, 12).map(([key, value]) => (
                          <Card key={key} className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4 text-center">
                              <div 
                                className="bg-amber-500 rounded mx-auto mb-2"
                                style={{ 
                                  width: value === '0' ? '4px' : value,
                                  height: '16px'
                                }}
                              />
                              <p className="text-sm font-medium text-white">{key}</p>
                              <p className="text-xs text-gray-400">{value}</p>
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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Design Token System</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our design tokens provide a systematic approach to design decisions, 
                        ensuring consistency across all components and platforms.
                      </p>
                      
                      {/* Animation Tokens */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Animation Timing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(animation).map(([key, value]) => {
                            if (value.startsWith('duration-')) {
                              return (
                                <Card key={key} className="bg-gray-900/50 border-amber-800/20">
                                  <CardContent className="p-4">
                                    <h4 className="font-medium text-white mb-1">{key}</h4>
                                    <p className="text-sm text-gray-400">{value}</p>
                                  </CardContent>
                                </Card>
                              )
                            }
                            return null
                          }).filter(Boolean)}
                        </div>
                      </div>

                      {/* Example Usage */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Example Usage</h3>
                        <div className="space-y-4">
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-2">Typography Combination</h4>
                              <code className="text-amber-400 text-sm block bg-gray-800 p-3 rounded">
                                {createTypographyClass('2xl', 'bold', 'serif', 'tight', 'wide')}
                              </code>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-900/50 border-amber-800/20">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-white mb-2">Color & Spacing</h4>
                              <code className="text-amber-400 text-sm block bg-gray-800 p-3 rounded">
                                {`${designColors.success.default} ${spacing[16]}`}
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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Component Library</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our component library showcases the building blocks used throughout the application, 
                        demonstrating consistent design patterns and interactions.
                      </p>
                      
                      {/* Basic UI Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Basic UI Components</h3>
                        
                        {/* Buttons */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Buttons</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
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
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Button</strong> component with multiple variants (default, secondary, outline, ghost, destructive) 
                            and sizes (default, sm, lg, icon). Includes proper accessibility attributes and hover states.
                          </p>
                        </div>

                        {/* Inputs */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Inputs & Forms</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4 space-y-4">
                              <div>
                                <Label htmlFor="example-input">Input Field</Label>
                                <Input id="example-input" placeholder="Enter text..." />
                              </div>
                              <div>
                                <Label htmlFor="example-textarea">Textarea</Label>
                                <textarea 
                                  id="example-textarea" 
                                  placeholder="Enter longer text..."
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Input</strong> and <strong>Textarea</strong> components with consistent styling, 
                            focus states, and proper accessibility labels.
                          </p>
                        </div>

                        {/* Cards */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Cards</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-gray-800/50 border-amber-800/20">
                                  <CardHeader>
                                    <CardTitle>Card Title</CardTitle>
                                    <CardDescription>Card description text</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <p>Card content goes here</p>
                                  </CardContent>
                                </Card>
                                <Card className="bg-gray-800/50 border-amber-800/20">
                                  <CardContent className="p-4">
                                    <p>Simple card with just content</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Card</strong> components with header, content, and footer sections. 
                            Used for displaying content in organized containers throughout the app.
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Badges</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">Default</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">Secondary</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80">Destructive</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">Outline</span>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Badge</strong> components for displaying status, categories, and labels. 
                            Available in default, secondary, destructive, and outline variants.
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Progress Indicators</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
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
                                <div className="animate-pulse rounded-md bg-gray-800/50 h-4 w-full"></div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Progress</strong> bars and loading states for showing completion status 
                            and loading indicators throughout the application.
                          </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Checkboxes</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
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
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Checkbox</strong> components for boolean inputs with proper accessibility 
                            and visual states for checked, unchecked, and disabled states.
                          </p>
                        </div>
                      </div>

                      {/* Navigation Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Navigation Components</h3>
                        
                        {/* Tabs */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Tabs</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 border-amber-800/20 p-1 text-muted-foreground">
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500 data-[state=active]:shadow-sm bg-amber-900/20 text-amber-500">Overview</button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500 data-[state=active]:shadow-sm">Settings</button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500 data-[state=active]:shadow-sm">Profile</button>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Tabs</strong> component for organizing content into sections. 
                            Includes proper keyboard navigation and accessibility features.
                          </p>
                        </div>

                        {/* Scroll Area */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Scroll Area</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="relative overflow-hidden h-32 w-full rounded-[inherit]">
                                <div className="h-full w-full rounded-[inherit]">
                                  <div className="space-y-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                      <div key={i} className="h-8 bg-gray-800 rounded flex items-center px-3">
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
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>ScrollArea</strong> component for custom scrollable content areas 
                            with styled scrollbars and proper overflow handling.
                          </p>
                        </div>
                      </div>

                      {/* Game-Specific Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Game-Specific Components</h3>
                        
                        {/* HeaderSection Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">HeaderSection</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <HeaderSection
                                title="KINGDOM"
                                subtitle="Your realm overview and progress"
                                imageSrc="/images/kingdom-header.jpg"
                                canEdit={false}
                              />
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>HeaderSection</strong> is used as the main header/banner for most major pages. 
                            It supports a title, optional subtitle, and an optional image. If <code>canEdit</code> is true, 
                            an edit button appears for uploading a new banner image.
                          </p>
                        </div>

                        {/* TileVisual Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">TileVisual</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
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
                                    image: '/images/tiles/forest-tile.png'
                                  }}
                                  isSelected={false}
                                  isHovered={false}
                                  isCharacterPresent={false}
                                  onClick={() => {}}
                                  onHover={() => {}}
                                  onHoverEnd={() => {}}
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
                                    image: '/images/tiles/water-tile.png'
                                  }}
                                  isSelected={true}
                                  isHovered={false}
                                  isCharacterPresent={false}
                                  onClick={() => {}}
                                  onHover={() => {}}
                                  onHoverEnd={() => {}}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>TileVisual</strong> displays tile visuals with proper accessibility attributes. 
                            Used for rendering tiles in the realm and map views, with support for selection, 
                            hover states, and character presence.
                          </p>
                        </div>

                        {/* CreatureCard Component */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">CreatureCard</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className={styles['creatureCardBox']}>
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
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>CreatureCard</strong> displays information about a creature, including its name, 
                            description, image, rarity, and discovery status. Used in the collection and discovery pages.
                          </p>
                        </div>

                        {/* Quest Card */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Quest Card</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <CardWithProgress
                                title="Defeat the Dragon"
                                description="A mighty dragon has appeared in the realm"
                                completed={false}
                                onToggle={() => {}}
                                progress={25}
                                xp={100}
                                gold={50}
                              />
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>QuestCard</strong> displays quest information with progress tracking, 
                            completion status, and rewards. Includes interactive elements for toggling completion.
                          </p>
                        </div>
                      </div>

                      {/* Feedback Components */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Feedback Components</h3>
                        
                        {/* Toast Notifications */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Toast Notifications</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <Button onClick={showToastExample}>Show Toast Example</Button>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Toast Notifications</strong> provide user feedback for actions and events. 
                            Used throughout the app for notifications and alerts with consistent styling and behavior.
                          </p>
                        </div>

                        {/* Alerts */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Alerts</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4 space-y-4">
                              <div className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground bg-background text-foreground">
                                <div className="text-sm [&_p]:leading-relaxed">This is a default alert message.</div>
                              </div>
                              <div className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                                <div className="text-sm [&_p]:leading-relaxed">This is a destructive alert message.</div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Alert</strong> components for displaying important messages and warnings. 
                            Available in default and destructive variants with proper iconography.
                          </p>
                        </div>

                        {/* Skeleton Loading */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Skeleton Loading</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="animate-pulse rounded-md bg-gray-800/50 h-4 w-3/4"></div>
                                <div className="animate-pulse rounded-md bg-gray-800/50 h-4 w-1/2"></div>
                                <div className="animate-pulse rounded-md bg-gray-800/50 h-4 w-5/6"></div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Skeleton</strong> loading components for showing loading states 
                            while content is being fetched or processed.
                          </p>
                        </div>

                        {/* Dialog/Modal */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Dialog/Modal</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-background p-6 shadow-lg">
                                  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">Dialog Title</h3>
                                    <p className="text-sm text-muted-foreground">Dialog description and content</p>
                                  </div>
                                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                    <Button variant="outline" size="sm">Cancel</Button>
                                    <Button size="sm">Confirm</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Dialog</strong> components for modal dialogs and overlays. 
                            Includes proper focus management, backdrop, and accessibility features.
                          </p>
                        </div>

                        {/* Select Dropdown */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Select Dropdown</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <span>Select an option</span>
                                <svg className="h-4 w-4 opacity-50 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Select</strong> dropdown components for choosing from predefined options. 
                            Includes keyboard navigation and proper accessibility support.
                          </p>
                        </div>

                        {/* Hover Card */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Hover Card</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Hover over me</span>
                                <div className="relative">
                                  <div className="z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">Hover Card Title</h4>
                                      <p className="text-sm text-muted-foreground">Additional information appears on hover</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>HoverCard</strong> components for displaying additional information 
                            when hovering over elements. Includes proper positioning and animations.
                          </p>
                        </div>

                        {/* Sheet/Sidebar */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Sheet/Sidebar</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="border border-amber-800/20 rounded-lg p-4 bg-gray-800/50">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">Sidebar Content</h3>
                                  <button className="text-gray-400 hover:text-white">×</button>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-700 rounded"></div>
                                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Sheet</strong> components for slide-out panels and sidebars. 
                            Available in different positions (top, right, bottom, left) with smooth animations.
                          </p>
                        </div>

                        {/* Command Palette */}
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-amber-300 mb-3">Command Palette</h4>
                          <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                            <CardContent className="p-4">
                              <div className="rounded-md bg-popover text-popover-foreground p-2">
                                <div className="flex items-center border-b px-3 py-2">
                                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input 
                                    placeholder="Search commands..." 
                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                </div>
                                <div className="py-2">
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Recent</div>
                                  <div className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">Open Kingdom</div>
                                  <div className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">View Quests</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-gray-400 mb-4">
                            <strong>Command</strong> palette for quick actions and navigation. 
                            Includes search functionality and keyboard shortcuts.
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
    </div>
  )
}