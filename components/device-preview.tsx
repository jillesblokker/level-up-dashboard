"use client"

import React, { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Smartphone, Tablet, Monitor } from "lucide-react"

export type DeviceType = 'web' | 'ipad' | 'iphone'

/**
 * A component for previewing the application on different devices.
 * Currently a stub implementation as we're developing it.
 */
export default function DevicePreview() {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>("web")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Clear any existing device preview state
    localStorage.removeItem("device-preview")
    // Set default device type
    setCurrentDevice("web")
    document.documentElement.setAttribute("data-device", "web")
  }, [])

  const handleDeviceChange = (device: DeviceType) => {
    setCurrentDevice(device)
    document.documentElement.setAttribute("data-device", device)
    localStorage.setItem("device-preview", device)
    setIsOpen(false)
  }

  const getDeviceIcon = () => {
    switch (currentDevice) {
      case "web":
        return <Monitor className="h-4 w-4" />
      case "ipad":
        return <Tablet className="h-4 w-4" />
      case "iphone":
        return <Smartphone className="h-4 w-4" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="border-amber-800/20 text-amber-500"
          data-device-preview-trigger
        >
          {getDeviceIcon()}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Device Preview</SheetTitle>
          <SheetDescription>
            Choose a device to preview the application.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant={currentDevice === "web" ? "default" : "outline"}
            onClick={() => handleDeviceChange("web")}
            className="w-full"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Web
          </Button>
          <Button
            variant={currentDevice === "ipad" ? "default" : "outline"}
            onClick={() => handleDeviceChange("ipad")}
            className="w-full"
          >
            <Tablet className="mr-2 h-4 w-4" />
            iPad
          </Button>
          <Button
            variant={currentDevice === "iphone" ? "default" : "outline"}
            onClick={() => handleDeviceChange("iphone")}
            className="w-full"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            iPhone
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

