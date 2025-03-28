"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RequirementsPage() {
  const requirements = [
    'User should be able to add daily quests and easily check them off to track his habits.',
    'Quests give you gold and exp.',
    'Gold can be used to buy tiles.',
    'Tiles can be placed on the realm map.',
    'The user can move his character on the realm map.',
    'When user character moves into a mystery tile there are a few events (Discovered: a city, a town, a dungeon, a monster encounter, a grass tile basically the empty version of finding nothing, or a treasure chest with a random gift like 25-250 gold the higher the more rare the outcome of a lot of gold.',
    'When you discover a town or city is should have an auto name in the medieval rpg style.',
    'In a city you can visit different buildings (Tavern, Castle, Merchant, temple and the stable.',
    'In a town you only have the buildings tavern stable and merchant.',
    'For each building you have a separate page where you can buy stuff.',
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/kingdom">
            <Button variant="outline" size="sm" className="text-white border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-white">Requirements</CardTitle>
            <CardDescription className="text-gray-400">Core features and functionality of the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-amber-900/20 border border-amber-800/20 flex items-center justify-center text-amber-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 