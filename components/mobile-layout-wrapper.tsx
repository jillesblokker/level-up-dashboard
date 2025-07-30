"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutWrapperProps {
  children: React.ReactNode
  className?: string
  showSafeArea?: boolean
  enableScroll?: boolean
}

export function MobileLayoutWrapper({ 
  children, 
  className,
  showSafeArea = true,
  enableScroll = true 
}: MobileLayoutWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [viewportHeight, setViewportHeight] = useState('100vh')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      
      // Handle mobile viewport height issues
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      setViewportHeight(`${vh * 100}px`)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  useEffect(() => {
    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0
    const preventZoom = (event: TouchEvent) => {
      const now = new Date().getTime()
      const timeSinceLastTouch = now - lastTouchEnd
      if (timeSinceLastTouch <= 300 && timeSinceLastTouch > 0) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    if (isMobile) {
      document.addEventListener('touchend', preventZoom, false)
    }

    return () => {
      document.removeEventListener('touchend', preventZoom, false)
    }
  }, [isMobile])

  return (
    <div 
      className={cn(
        "relative w-full",
        showSafeArea && "pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right",
        enableScroll && "overflow-y-auto",
        !enableScroll && "overflow-hidden",
        "scroll-smooth",
        isMobile && "touch-pan-y",
        className
      )}
      style={{
        minHeight: isMobile ? viewportHeight : '100vh',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      aria-label="mobile-layout-container"
    >
      {children}
    </div>
  )
}

// Safe area utility classes
export const safeAreaClasses = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom', 
  left: 'pl-safe-left',
  right: 'pr-safe-right',
  all: 'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right'
}

// Mobile-specific scroll container
export function MobileScrollContainer({ 
  children, 
  className,
  direction = 'vertical'
}: {
  children: React.ReactNode
  className?: string
  direction?: 'vertical' | 'horizontal' | 'both'
}) {
  return (
    <div
      className={cn(
        "overflow-auto",
        direction === 'vertical' && "overflow-y-auto overflow-x-hidden",
        direction === 'horizontal' && "overflow-x-auto overflow-y-hidden", 
        direction === 'both' && "overflow-auto",
        "scroll-smooth",
        "touch-pan-y",
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      aria-label="mobile-scroll-container"
    >
      {children}
    </div>
  )
}

// Mobile-safe content wrapper
export function MobileContentWrapper({ 
  children, 
  className,
  padding = true
}: {
  children: React.ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        "w-full",
        padding && "px-4 py-4",
        className
      )}
      aria-label="mobile-content-wrapper"
    >
      {children}
    </div>
  )
} 