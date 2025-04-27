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
import { HeaderSection } from "../../components/HeaderSection"
import { CreatureCard } from "../../components/creature-card"
import { Toggle } from "@/components/ui/toggle"
import { Switch } from "@/components/ui/switch"
import { Minimap } from "../../components/Minimap"
import QuestCard from "../../components/quest-card"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
                      <p className="text-sm font-medium mb-2 text-white">Buttons</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Button variant="default">Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">Amber</Button>
                        <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white">Amber Gradient</Button>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>Button</strong> components are used for all interactive actions. Use the appropriate variant for the context: primary for main actions, secondary for less prominent actions, outline for bordered buttons, ghost for minimal buttons. The <strong>Amber</strong> and <strong>Amber Gradient</strong> buttons are used for special actions and call-to-action areas throughout the app.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">CreatureCard</p>
                      <div className="mb-2" style={{ maxWidth: 180 }}>
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
                      <p className="text-sm font-medium mb-2 text-white">Toggle & Switch</p>
                      <div className="flex flex-wrap gap-4 mb-2">
                        <Toggle aria-label="Toggle Example">Toggle</Toggle>
                        <Switch aria-label="Switch Example" />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>Toggle</strong> and <strong>Switch</strong> components are used for binary on/off settings and preferences throughout the app.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">Card</p>
                      <div className="mb-2" style={{ maxWidth: 320 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Card Title</CardTitle>
                            <CardDescription>This is a simple card component.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300">Cards are used for grouping related content and actions in a visually distinct container.</p>
                          </CardContent>
                        </Card>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>Card</strong> is a flexible container used for grouping content, forms, or actions. Use it for dashboards, modals, and feature sections.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">QuestCard</p>
                      <div className="flex gap-4 mb-2">
                        <div style={{ width: 180 }}>
                          <QuestCard title="Defeat the Dragon" isSelected={false} />
                        </div>
                        <div style={{ width: 180 }}>
                          <QuestCard title="Rescue the Princess" isSelected={true} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>QuestCard</strong> is used for displaying quests in selection lists. The selected state is highlighted with an amber ring.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50">
                      <p className="text-sm font-medium mb-2 text-white">Minimap</p>
                      <div className="mb-2">
                        <Minimap
                          grid={[
                            [ { type: 'empty' }, { type: 'forest' }, { type: 'water' } ],
                            [ { type: 'mountain' }, { type: 'ice' }, { type: 'empty' } ]
                          ]}
                          playerPosition={{ x: 1, y: 1 }}
                          playerDirection={0}
                          entities={[]}
                          zoom={1}
                          onZoomChange={() => {}}
                          rotationMode="static"
                          onRotationModeChange={() => {}}
                          onClose={() => {}}
                          className="relative static"
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <strong>Minimap</strong> provides a compact, interactive overview of the current map area, showing the character's position and tile types. Used in the main realm and exploration pages.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900/50 space-y-8">
                      <p className="text-sm font-medium mb-2 text-white">UI Primitives & Overlays</p>
                      {/* Dialog Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Dialog</CardTitle>
                          <CardDescription>Modal overlays for forms and confirmations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline">Open Dialog</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>Dialog Title</DialogTitle>
                              <DialogDescription>This is a dialog. Use for confirmations, forms, or important info.</DialogDescription>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                      {/* Alert Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Alert</CardTitle>
                          <CardDescription>Inline alerts for feedback and warnings</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Alert>
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>This is an alert. Use for warnings, errors, or important feedback.</AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                      {/* Tabs Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Tabs</CardTitle>
                          <CardDescription>Tabbed navigation for content sections</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="tab1">
                            <TabsList>
                              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                            </TabsList>
                            <TabsContent value="tab1">Content for Tab 1</TabsContent>
                            <TabsContent value="tab2">Content for Tab 2</TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                      {/* Tooltip Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Tooltip</CardTitle>
                          <CardDescription>Hover/focus tooltips for extra info</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline">Hover me</Button>
                              </TooltipTrigger>
                              <TooltipContent>Tooltip content goes here.</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardContent>
                      </Card>
                      {/* Progress Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Progress</CardTitle>
                          <CardDescription>Progress bars for loading and completion</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress value={60} className="w-64" />
                          <p className="text-xs text-gray-400 mt-2">Progress bars show loading or completion status for tasks and achievements.</p>
                        </CardContent>
                      </Card>
                      {/* Sheet Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Sheet</CardTitle>
                          <CardDescription>Slide-in panels for menus and sidebars</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline">Open Sheet</Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Sheet Title</SheetTitle>
                                <SheetDescription>This is a sheet. Use for menus, sidebars, or additional content.</SheetDescription>
                              </SheetHeader>
                              <div className="mt-4">Sheet content goes here.</div>
                            </SheetContent>
                          </Sheet>
                        </CardContent>
                      </Card>
                      {/* Drawer Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Drawer</CardTitle>
                          <CardDescription>Persistent or temporary side panels</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button variant="outline">Open Drawer</Button>
                            </DrawerTrigger>
                            <DrawerContent>
                              <div className="p-4">Drawer content goes here.</div>
                            </DrawerContent>
                          </Drawer>
                        </CardContent>
                      </Card>
                      {/* Accordion Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Accordion</CardTitle>
                          <CardDescription>Expand/collapse content sections</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                              <AccordionTrigger>Section 1</AccordionTrigger>
                              <AccordionContent>Content for section 1.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                              <AccordionTrigger>Section 2</AccordionTrigger>
                              <AccordionContent>Content for section 2.</AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                      {/* Badge Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Badge</CardTitle>
                          <CardDescription>Status and label indicators</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                          </div>
                          <p className="text-xs text-gray-400">Badges are used for status, categories, and labels.</p>
                        </CardContent>
                      </Card>
                      {/* Skeleton Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Skeleton</CardTitle>
                          <CardDescription>Loading placeholders</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col gap-2 w-48">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Skeletons are used to indicate loading content.</p>
                        </CardContent>
                      </Card>
                      {/* Popover Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Popover</CardTitle>
                          <CardDescription>Floating content overlays</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline">Open Popover</Button>
                            </PopoverTrigger>
                            <PopoverContent>Popover content goes here.</PopoverContent>
                          </Popover>
                        </CardContent>
                      </Card>
                      {/* Slider Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Slider</CardTitle>
                          <CardDescription>Range and value selection</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Slider defaultValue={[50]} max={100} step={1} className="w-64" />
                          <p className="text-xs text-gray-400 mt-2">Sliders are used for selecting a value or range.</p>
                        </CardContent>
                      </Card>
                      {/* Pagination Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Pagination</CardTitle>
                          <CardDescription>Page navigation controls</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious href="#" />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#" isActive>2</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">3</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">5</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationNext href="#" />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                          <p className="text-xs text-gray-400 mt-2">Pagination is used for navigating between pages of content.</p>
                        </CardContent>
                      </Card>
                      {/* Table Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Table</CardTitle>
                          <CardDescription>Data display and manipulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Alice</TableCell>
                                <TableCell><Badge>Active</Badge></TableCell>
                                <TableCell>Admin</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Bob</TableCell>
                                <TableCell><Badge variant="secondary">Inactive</Badge></TableCell>
                                <TableCell>User</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <p className="text-xs text-gray-400 mt-2">Tables are used for displaying and managing data.</p>
                        </CardContent>
                      </Card>
                      {/* Calendar Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Calendar</CardTitle>
                          <CardDescription>Date selection and display</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Calendar mode="single" selected={new Date()} onSelect={() => {}} className="rounded-md border" />
                          <p className="text-xs text-gray-400 mt-2">Calendars are used for picking and displaying dates.</p>
                        </CardContent>
                      </Card>
                      {/* Radio/Checkbox/Toggle/Switch Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Form Controls</CardTitle>
                          <CardDescription>Radio, Checkbox, Toggle, Switch</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col gap-4">
                            <RadioGroup defaultValue="option1" className="flex gap-4">
                              <RadioGroupItem value="option1" id="r1" />
                              <label htmlFor="r1" className="text-gray-300">Option 1</label>
                              <RadioGroupItem value="option2" id="r2" />
                              <label htmlFor="r2" className="text-gray-300">Option 2</label>
                            </RadioGroup>
                            <div className="flex items-center gap-2">
                              <Checkbox id="c1" />
                              <label htmlFor="c1" className="text-gray-300">Checkbox</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Toggle aria-label="Toggle Example">Toggle</Toggle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch aria-label="Switch Example" />
                              <span className="text-gray-300">Switch</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Form controls for selecting options and toggling settings.</p>
                        </CardContent>
                      </Card>
                      {/* Input/Select/Textarea Preview */}
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Form Fields</CardTitle>
                          <CardDescription>Input, Select, Textarea</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col gap-4 w-64">
                            <div>
                              <label htmlFor="input1" className="text-gray-300 text-sm mb-1 block">Input</label>
                              <Input id="input1" placeholder="Type here..." />
                            </div>
                            <div>
                              <label htmlFor="select1" className="text-gray-300 text-sm mb-1 block">Select</label>
                              <Select>
                                <SelectTrigger id="select1">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="a">Option A</SelectItem>
                                  <SelectItem value="b">Option B</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label htmlFor="textarea1" className="text-gray-300 text-sm mb-1 block">Textarea</label>
                              <Textarea id="textarea1" placeholder="Write something..." />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Form fields for user input and selection.</p>
                        </CardContent>
                      </Card>
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