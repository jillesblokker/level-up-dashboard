"use client"

import { useState, useEffect } from "react"
import { Award, Book, Brain, Coffee, Flame, Moon, Activity, ImageIcon, Sword } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { QuickActionButton } from "@/components/quick-action-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DashboardHeaderProps {
  backgroundImage?: string
}

export function DashboardHeader({ backgroundImage }: DashboardHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(backgroundImage || "")
  const [currentBgImage, setCurrentBgImage] = useState(backgroundImage || "/castle-night.svg")

  // Load saved background image from localStorage on component mount
  useEffect(() => {
    const savedBg = localStorage.getItem("dashboard-background")
    if (savedBg) {
      setCurrentBgImage(savedBg)
    }
  }, [])

  const handleImageUpdate = () => {
    // Save to localStorage
    localStorage.setItem("dashboard-background", imageUrl)
    setCurrentBgImage(imageUrl)
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex-1 relative overflow-hidden medieval-card">
        {currentBgImage && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgImage})` }}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-600/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-600/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-amber-800 text-white">
                    12
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold font-serif ${currentBgImage ? "text-white" : ""}`}>Hail, Sir Alex!</h2>
              <p className={`text-sm ${currentBgImage ? "text-white/80" : "text-muted-foreground"}`}>
                Your quest for greatness continues. Onward to glory!
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`ml-auto ${currentBgImage ? "bg-white/20 hover:bg-white/30 border-white/40" : "border-amber-800/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"}`}
              onClick={() => setIsDialogOpen(true)}
            >
              <ImageIcon className={`h-4 w-4 ${currentBgImage ? "text-white" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Background Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-2 border-amber-800/20" role="dialog" aria-label="update-banner-image-modal">
          <DialogDescription id="update-banner-image-modal-desc">Update your banner image</DialogDescription>
          <DialogHeader>
            <DialogTitle className="font-serif">Update Banner Image</DialogTitle>
            <DialogDescription>Enter an image URL to set as your kingdom banner</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
                className="border-amber-800/20"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
              onClick={handleImageUpdate}
            >
              Update Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        <QuickActionButton
          title="Might"
          icon={<Sword className="h-5 w-5" />}
          color="bg-red-500"
          actions={[
            { icon: <Sword className="h-4 w-4" />, label: "50 Push-ups", xp: 25 },
            { icon: <Sword className="h-4 w-4" />, label: "10 Pull-ups", xp: 30 },
            { icon: <Sword className="h-4 w-4" />, label: "20 Dips", xp: 20 },
          ]}
        />
        <QuickActionButton
          title="Endurance"
          icon={<Activity className="h-5 w-5" />}
          color="bg-blue-500"
          actions={[
            { icon: <Activity className="h-4 w-4" />, label: "5K Run", xp: 40 },
            { icon: <Activity className="h-4 w-4" />, label: "20min HIIT", xp: 30 },
            { icon: <Activity className="h-4 w-4" />, label: "Cycling", xp: 25 },
          ]}
        />
        <QuickActionButton
          title="Wisdom"
          icon={<Book className="h-5 w-5" />}
          color="bg-purple-500"
          actions={[
            { icon: <Book className="h-4 w-4" />, label: "Read 5 pages", xp: 10 },
            { icon: <Book className="h-4 w-4" />, label: "Read 20 pages", xp: 20 },
            { icon: <Book className="h-4 w-4" />, label: "Study spells", xp: 30 },
          ]}
        />
        <QuickActionButton
          title="Vitality"
          icon={<Coffee className="h-5 w-5" />}
          color="bg-green-500"
          actions={[
            { icon: <Coffee className="h-4 w-4" />, label: "Eat hearty meal", xp: 15 },
            { icon: <Coffee className="h-4 w-4" />, label: "Drink water", xp: 10 },
            { icon: <Coffee className="h-4 w-4" />, label: "Prepare rations", xp: 20 },
          ]}
        />
        <QuickActionButton
          title="Resilience"
          icon={<Moon className="h-5 w-5" />}
          color="bg-indigo-500"
          actions={[
            { icon: <Moon className="h-4 w-4" />, label: "8h sleep", xp: 20 },
            { icon: <Moon className="h-4 w-4" />, label: "Meditation", xp: 15 },
            { icon: <Moon className="h-4 w-4" />, label: "Stretching", xp: 15 },
          ]}
        />
        <QuickActionButton
          title="Dexterity"
          icon={<Brain className="h-5 w-5" />}
          color="bg-amber-500"
          actions={[
            { icon: <Brain className="h-4 w-4" />, label: "Crafting", xp: 25 },
            { icon: <Brain className="h-4 w-4" />, label: "Lockpicking", xp: 15 },
            { icon: <Brain className="h-4 w-4" />, label: "Archery", xp: 20 },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="medieval-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <Flame className="h-6 w-6 text-amber-600" />
              <div className="text-xl font-bold">14</div>
              <p className="text-xs text-muted-foreground">Day Quest Streak</p>
            </div>
          </CardContent>
        </Card>
        <Card className="medieval-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <Award className="h-6 w-6 text-yellow-500" />
              <div className="text-xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

