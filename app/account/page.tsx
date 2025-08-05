"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Monitor, 
  Database, 
  Settings, 
  BookOpen, 
  ArrowLeft,
  ChevronRight
} from "lucide-react"


export default function AccountPage() {
  const accountMenuItems = [
    { 
      href: "/profile", 
      label: "Profile", 
      icon: User, 
      description: "Manage your profile and personal information",
      color: "from-blue-500 to-blue-600"
    },
    { 
      href: "/account/monitoring", 
      label: "Monitoring", 
      icon: Monitor, 
      description: "View performance metrics and system health",
      color: "from-green-500 to-green-600"
    },
    { 
      href: "/stored-data", 
      label: "Stored Data", 
      icon: Database, 
      description: "Manage your local data and preferences",
      color: "from-purple-500 to-purple-600"
    },
    { 
      href: "/settings", 
      label: "Settings", 
      icon: Settings, 
      description: "Configure app preferences and options",
      color: "from-amber-500 to-amber-600"
    },
  ]

  const handleGuideClick = () => {
    console.log('Onboarding guide temporarily disabled');
  }

  return (
    <div className="container mx-auto p-6 space-y-6" aria-label="account-settings-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400">Manage your profile and preferences</p>
        </div>
      </div>

      {/* Account Menu Items */}
      <div className="space-y-4">
        {accountMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 cursor-pointer touch-manipulation">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {/* Guide Button */}
        <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 cursor-pointer touch-manipulation">
          <CardContent className="p-6">
            <button
              onClick={handleGuideClick}
              className="w-full flex items-center justify-between"
              aria-label="Show guide"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Guide</h3>
                  <p className="text-sm text-gray-400">Open tutorial and learn the basics</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 