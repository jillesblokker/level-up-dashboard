"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DesignSystemPage() {
  const colors = [
    { name: "Primary", class: "bg-amber-500", hex: "#F59E0B" },
    { name: "Secondary", class: "bg-purple-500", hex: "#8B5CF6" },
    { name: "Background", class: "bg-black", hex: "#000000" },
    { name: "Card", class: "bg-gray-900", hex: "#111827" },
    { name: "Border", class: "bg-amber-800/20", hex: "rgba(146, 64, 14, 0.2)" },
    { name: "Text", class: "bg-white", hex: "#FFFFFF" },
    { name: "Muted", class: "bg-gray-500", hex: "#6B7280" },
  ];

  const typography = [
    { name: "Heading 1", class: "text-2xl font-bold font-serif", example: "Main Title" },
    { name: "Heading 2", class: "text-xl font-bold font-serif", example: "Section Title" },
    { name: "Body", class: "text-base", example: "Regular text content" },
    { name: "Small", class: "text-sm", example: "Secondary information" },
    { name: "Tiny", class: "text-xs", example: "Meta information" },
  ];

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
            <CardTitle className="font-serif text-2xl text-white">Design System</CardTitle>
            <CardDescription className="text-gray-400">Colors, typography, and components used in the application</CardDescription>
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

              {/* Typography */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Typography</h3>
                <div className="space-y-4">
                  {typography.map((type) => (
                    <div key={type.name} className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50">
                      <div>
                        <p className="text-sm font-medium mb-1 text-white">{type.name}</p>
                        <p className={`${type.class} text-white`}>{type.example}</p>
                      </div>
                      <Badge variant="outline" className="text-white">{type.class}</Badge>
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
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
      </div>
            </div>
  )
} 