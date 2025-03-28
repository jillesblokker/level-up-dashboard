"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Smartphone, Tablet, Monitor } from "lucide-react"

/**
 * A component for previewing the application on different devices.
 * Currently a stub implementation as we're developing it.
 */
export function DevicePreview() {
  const [currentDevice, setCurrentDevice] = useState<"web" | "ipad" | "iphone">("web")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if we're on an iPhone
    const isIPhone = /iPhone/.test(navigator.userAgent)
    if (isIPhone) {
      setCurrentDevice("iphone")
      document.documentElement.className = "device-iphone"
    }

    // Check if we're on an iPad
    const isIPad =
      /iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document)
    if (isIPad) {
      setCurrentDevice("ipad")
      document.documentElement.className = "device-ipad"
    }

    // Fix for iPhone 11 horizontal scroll issues
    if (isIPhone) {
      document.body.style.width = "100%"
      document.body.style.overflowX = "hidden"

      // Fix container widths
      const containers = document.querySelectorAll(".container")
      containers.forEach((container) => {
        ;(container as HTMLElement).style.width = "100%"
        ;(container as HTMLElement).style.maxWidth = "100%"
        ;(container as HTMLElement).style.paddingLeft = "12px"
        ;(container as HTMLElement).style.paddingRight = "12px"
      })

      // Fix buttons that might overflow
      const buttons = document.querySelectorAll("button")
      buttons.forEach((button) => {
        ;(button as HTMLElement).style.maxWidth = "100%"
        ;(button as HTMLElement).style.overflow = "hidden"
        ;(button as HTMLElement).style.textOverflow = "ellipsis"
        ;(button as HTMLElement).style.whiteSpace = "nowrap"
      })
    }
  }, [])

  const changeDevice = (device: "web" | "ipad" | "iphone") => {
    setCurrentDevice(device)
    document.documentElement.className = `device-${device}`

    // Apply specific fixes for iPhone 11
    if (device === "iphone") {
      document.body.style.width = "100%"
      document.body.style.overflowX = "hidden"

      // Fix container widths
      const containers = document.querySelectorAll(".container")
      containers.forEach((container) => {
        ;(container as HTMLElement).style.width = "100%"
        ;(container as HTMLElement).style.maxWidth = "100%"
        ;(container as HTMLElement).style.paddingLeft = "12px"
        ;(container as HTMLElement).style.paddingRight = "12px"
      })

      // Fix buttons that might overflow
      const buttons = document.querySelectorAll("button")
      buttons.forEach((button) => {
        ;(button as HTMLElement).style.maxWidth = "100%"
        ;(button as HTMLElement).style.overflow = "hidden"
        ;(button as HTMLElement).style.textOverflow = "ellipsis"
        ;(button as HTMLElement).style.whiteSpace = "nowrap"
      })
    } else {
      // Reset styles for other devices
      document.body.style.width = ""
      document.body.style.overflowX = ""
    }
  }

  if (!isClient) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background shadow-md hover-scale">
            {currentDevice === "web" && <Monitor className="h-5 w-5" />}
            {currentDevice === "ipad" && <Tablet className="h-5 w-5" />}
            {currentDevice === "iphone" && <Smartphone className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <div className="py-4">
            <h3 className="text-lg font-medieval mb-4">Preview Device</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={currentDevice === "web" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-3 hover-scale btn-click-effect"
                onClick={() => changeDevice("web")}
              >
                <Monitor className="h-8 w-8" />
                <span>Desktop</span>
              </Button>
              <Button
                variant={currentDevice === "ipad" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-3 hover-scale btn-click-effect"
                onClick={() => changeDevice("ipad")}
              >
                <Tablet className="h-8 w-8" />
                <span>iPad</span>
              </Button>
              <Button
                variant={currentDevice === "iphone" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-3 hover-scale btn-click-effect"
                onClick={() => changeDevice("iphone")}
              >
                <Smartphone className="h-8 w-8" />
                <span>iPhone</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

