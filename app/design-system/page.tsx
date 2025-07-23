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
                      <h2 className="text-3xl font-bold text-amber-400 mb-6">Color Palette</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Our color system is built around a medieval amber theme with carefully chosen 
                        semantic colors for different states and interactions.
                      </p>
                      
                      {/* Brand Colors */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Brand Colors</h3>
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
                                {createTypographyClass('2xl', 'bold', 'serif', 'lineTight', 'letterWide')}
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
                      
                      {/* HeaderSection Component */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">HeaderSection</h3>
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
                        <p className="text-sm text-gray-400">
                          <strong>HeaderSection</strong> is used as the main header/banner for most major pages. 
                          It supports a title, optional subtitle, and an optional image. If <code>canEdit</code> is true, 
                          an edit button appears for uploading a new banner image.
                        </p>
                      </div>

                      {/* TileVisual Component */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">TileVisual</h3>
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
                        <p className="text-sm text-gray-400">
                          <strong>TileVisual</strong> displays tile visuals with proper accessibility attributes. 
                          Used for rendering tiles in the realm and map views, with support for selection, 
                          hover states, and character presence.
                        </p>
                      </div>

                      {/* CreatureCard Component */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">CreatureCard</h3>
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
                        <p className="text-sm text-gray-400">
                          <strong>CreatureCard</strong> displays information about a creature, including its name, 
                          description, image, rarity, and discovery status. Used in the collection and discovery pages.
                        </p>
                      </div>

                      {/* Toast Notifications */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Toast Notifications</h3>
                        <Card className="bg-gray-900/50 border-amber-800/20 mb-4">
                          <CardContent className="p-4">
                            <Button onClick={showToastExample}>Show Toast Example</Button>
                          </CardContent>
                        </Card>
                        <p className="text-sm text-gray-400">
                          <strong>Toast Notifications</strong> provide user feedback for actions and events. 
                          Used throughout the app for notifications and alerts with consistent styling and behavior.
                        </p>
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