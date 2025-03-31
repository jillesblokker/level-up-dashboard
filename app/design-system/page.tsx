"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"

export default function DesignSystemPage() {
  const colors = [
    { name: "Primary", class: "bg-amber-500", hex: "#F59E0B" },
    { name: "Secondary", class: "bg-purple-500", hex: "#8B5CF6" },
    { name: "Background", class: "bg-[#0C0C0C]", hex: "#0C0C0C" },
    { name: "Card", class: "bg-gray-900", hex: "#111827" },
    { name: "Border", class: "bg-amber-800/20", hex: "rgba(146, 64, 14, 0.2)" },
    { name: "Text", class: "bg-white", hex: "#fdfdfd" },
    { name: "Muted", class: "bg-gray-500", hex: "#6B7280" },
  ];

  const gradients = [
    { 
      name: "Dark Blue Gradient", 
      class: "bg-gradient-to-b from-blue-950 via-blue-900 to-black", 
      description: "Used for special sections and cards" 
    },
    { 
      name: "Card Gradient", 
      class: "bg-gradient-to-b from-black to-gray-900", 
      description: "Used for card backgrounds" 
    },
  ];

  const fonts = [
    { 
      name: "Cardo", 
      class: "font-cardo",
      weights: ["Regular (400)", "Bold (700)"],
      description: "Primary font used for headings and body text, providing a medieval aesthetic",
      example: "The quick brown fox jumps over the lazy dog"
  },
  {
    name: "Inter",
      class: "font-inter",
      weights: ["Regular (400)"],
      description: "Secondary font used for UI elements and small text",
      example: "The quick brown fox jumps over the lazy dog"
    }
  ];

  const typography = [
    { name: "Heading 1", class: "text-3xl font-bold font-cardo", example: "Chronicles of the Realm" },
    { name: "Heading 2", class: "text-2xl font-bold font-cardo", example: "Tales of Adventure" },
    { name: "Heading 3", class: "text-xl font-bold font-cardo", example: "Mystical Quests" },
    { name: "Body", class: "text-base font-cardo", example: "Embark on epic journeys through enchanted lands" },
    { name: "Small", class: "text-sm font-cardo", example: "Discover hidden treasures and ancient lore" },
    { name: "Tiny", class: "text-xs font-cardo", example: "In the depths of forgotten dungeons" },
  ];

  const showToastExample = () => {
    showScrollToast('achievement', undefined, "Behold! A scroll toast appears!");
  };

  const showWarningToastExample = () => {
    showScrollToast('warning', undefined, "Caution! A warning message appears!");
  };

  const showErrorToastExample = () => {
    showScrollToast('error', undefined, "Alas! An error has occurred!");
  };

  const showRegularToastExample = () => {
    toast({
      title: "Regular Toast",
      description: "This is a regular toast notification",
    });
  };

  return (
    <div className="container max-w-4xl py-6 text-white">
      <div className="mb-6">
        <Link href="/kingdom">
          <Button variant="outline" size="sm" className="text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Kingdom
              </Button>
            </Link>
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-cardo text-2xl text-white">Design System</CardTitle>
            <CardDescription className="text-gray-400 font-cardo">Colors, typography, and components used in the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Colors */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colors.map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div className={`h-16 rounded-lg ${color.class}`} />
            <div>
                        <p className="font-medium text-white">{color.name}</p>
                        <p className="text-sm text-gray-400">{color.hex}</p>
            </div>
          </div>
                  ))}
          </div>
        </div>

              {/* Gradients */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Gradients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gradients.map((gradient) => (
                    <div key={gradient.name} className="space-y-2">
                      <div className={`h-24 rounded-lg ${gradient.class}`} />
                      <div>
                        <p className="font-medium text-white">{gradient.name}</p>
                        <p className="text-sm text-gray-400">{gradient.description}</p>
                      </div>
                    </div>
              ))}
            </div>
                          </div>

              {/* Fonts */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Fonts</h3>
                <div className="space-y-4">
                  {fonts.map((font) => (
                    <div key={font.name} className="p-4 rounded-lg bg-gray-900/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-white">{font.name}</p>
                          <p className="text-sm text-gray-400">{font.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Available weights:</p>
                          {font.weights.map((weight) => (
                            <span key={weight} className="text-sm text-white">{weight}</span>
                          ))}
                        </div>
                      </div>
                      <p className={`text-xl ${font.class} text-white`}>{font.example}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Typography</h3>
                <div className="space-y-4">
                  {typography.map((type) => (
                    <div key={type.name} className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white">{type.name}</p>
                        <p className={`${type.class} text-white`}>{type.example}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-white mb-2">{type.class}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Components */}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 