"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useGradient } from '@/app/providers/gradient-provider'

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

type FontItem = {
  name: string
  class: string
  description: string
  options: string[]
  currentOption: string
}

type TypographyItem = {
  name: string
  class: string
  example: string
  fontSize: string
  fontWeight: string
  fontFamily: string
}

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

  const [fonts, setFonts] = useState<FontItem[]>([
    { 
      name: "Primary", 
      class: "font-sans", 
      description: "Inter font for general text",
      options: ["font-sans", "font-serif", "font-mono"],
      currentOption: "font-sans"
    },
    { 
      name: "Display", 
      class: "font-serif", 
      description: "Cinzel font for headings",
      options: ["font-sans", "font-serif", "font-mono"],
      currentOption: "font-serif"
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

  const handleColorChange = (index: number, newValue: string) => {
    const newColors = [...colors]
    newColors[index].value = newValue
    setColors(newColors)
  }

  const handleGradientChange = (index: number, type: 'startColor' | 'endColor' | 'direction', newValue: string) => {
    const newGradients = [...gradients]
    newGradients[index][type] = newValue
    setGradients(newGradients)

    // Update global gradient if changing the Card Gradient
    if (index === 0) {
      if (type === 'startColor' || type === 'endColor') {
        updateGradient(
          type === 'startColor' ? newValue : gradients[0].startColor,
          type === 'endColor' ? newValue : gradients[0].endColor
        )
      }
    }
  }

  const handleFontChange = (index: number, newValue: string) => {
    const newFonts = [...fonts]
    newFonts[index].currentOption = newValue
    newFonts[index].class = newValue
    setFonts(newFonts)
  }

  const handleTypographyChange = (index: number, type: 'fontSize' | 'fontWeight' | 'fontFamily', newValue: string) => {
    const newTypography = [...typography]
    newTypography[index][type] = newValue
    newTypography[index].class = `${newTypography[index].fontSize} ${newTypography[index].fontWeight} ${newTypography[index].fontFamily}`
    setTypography(newTypography)
  }

  const showToastExample = () => {
    toast({
      title: "Achievement",
      description: "Behold! A scroll toast appears!",
      variant: "default"
    })
  }

  const showWarningToastExample = () => {
    toast({
      title: "Warning",
      description: "Caution! A warning message appears!",
      variant: "default"
    })
  }

  const showErrorToastExample = () => {
    toast({
      title: "Error",
      description: "Alas! An error has occurred!",
      variant: "destructive"
    })
  }

  const showRegularToastExample = () => {
    toast({
      title: "Regular Toast",
      description: "This is a regular toast notification",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-4xl py-6">
        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-white">Design System</CardTitle>
            <CardDescription className="text-gray-400">UI components and styling guidelines</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors" className="space-y-6">
              <TabsList className="bg-gray-900/50 p-1 gap-1">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="gradients">Gradients</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg ${color.class}`} style={{ backgroundColor: color.value }} />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{color.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{color.description}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={color.value}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="w-16 h-8"
                        />
                        <Input
                          type="text"
                          value={color.value}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="gradients" className="space-y-4">
                {gradients.map((gradient, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div 
                      className={`w-32 h-16 rounded-lg`} 
                      style={{ 
                        background: `linear-gradient(${gradient.direction === 'to-b' ? '180deg' : '90deg'}, ${gradient.startColor}, ${gradient.endColor})` 
                      }} 
                    />
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
                              onChange={(e) => handleGradientChange(index, 'startColor', e.target.value)}
                              className="w-16 h-8"
                            />
                            <Input
                              type="text"
                              value={gradient.startColor}
                              onChange={(e) => handleGradientChange(index, 'startColor', e.target.value)}
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
                              onChange={(e) => handleGradientChange(index, 'endColor', e.target.value)}
                              className="w-16 h-8"
                            />
                            <Input
                              type="text"
                              value={gradient.endColor}
                              onChange={(e) => handleGradientChange(index, 'endColor', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-sm text-gray-400">Direction</Label>
                        <select
                          value={gradient.direction}
                          onChange={(e) => handleGradientChange(index, 'direction', e.target.value)}
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
                {typography.map((type, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{type.name}</h3>
                        <p className={`${type.class} text-white mt-2`}>{type.example}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-gray-400">Size</Label>
                          <select
                            value={type.fontSize}
                            onChange={(e) => handleTypographyChange(index, 'fontSize', e.target.value)}
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
                          <Label className="text-sm text-gray-400">Weight</Label>
                          <select
                            value={type.fontWeight}
                            onChange={(e) => handleTypographyChange(index, 'fontWeight', e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                          >
                            <option value="font-normal">Normal</option>
                            <option value="font-medium">Medium</option>
                            <option value="font-semibold">Semibold</option>
                            <option value="font-bold">Bold</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Font</Label>
                          <select
                            value={type.fontFamily}
                            onChange={(e) => handleTypographyChange(index, 'fontFamily', e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-md text-white p-2"
                          >
                            <option value="font-sans">Sans</option>
                            <option value="font-serif">Serif</option>
                            <option value="font-mono">Mono</option>
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
                      <p className="text-sm font-medium mb-2 text-white">Buttons</p>
                      <div className="flex flex-wrap gap-2">
                        <Button className="text-white">Primary</Button>
                        <Button variant="secondary" className="text-white">Secondary</Button>
                        <Button variant="outline" className="text-white">Outline</Button>
                        <Button variant="ghost" className="text-white">Ghost</Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">Badges</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="text-white">Default</Badge>
                        <Badge variant="secondary" className="text-white">Secondary</Badge>
                        <Badge variant="outline" className="text-white">Outline</Badge>
                        <Badge variant="destructive" className="text-white">Destructive</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">Toast Notifications</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={showToastExample} className="text-white">
                          Show Regular Toast
                        </Button>
                        <Button onClick={showWarningToastExample} variant="secondary" className="text-white">
                          Show Warning Toast
                        </Button>
                        <Button onClick={showErrorToastExample} variant="destructive" className="text-white">
                          Show Error Toast
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Scroll toasts have medieval styling with different variants for regular messages, warnings, and errors
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