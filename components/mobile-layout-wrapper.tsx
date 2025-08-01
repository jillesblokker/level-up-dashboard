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
        // Enhanced mobile spacing and touch targets
        isMobile && "space-y-4",
        className
      )}
      style={{
        minHeight: isMobile ? viewportHeight : '100vh',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        // Enhanced mobile touch targets
        ...(isMobile && {
          '--touch-target-size': '44px',
          '--mobile-spacing': '16px',
          '--mobile-padding': '20px'
        })
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

// Enhanced mobile scroll container with better touch handling
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
        // Enhanced mobile scroll behavior
        "scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent",
        "hover:scrollbar-thumb-amber-500/30",
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        // Enhanced mobile scroll performance
        scrollBehavior: 'smooth'
      }}
      aria-label="mobile-scroll-container"
    >
      {children}
    </div>
  )
}

// Enhanced mobile content wrapper with better spacing
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
        padding && "px-5 py-5", // Increased padding for better mobile spacing
        // Enhanced mobile spacing
        "space-y-4", // Consistent spacing between elements
        className
      )}
      aria-label="mobile-content-wrapper"
    >
      {children}
    </div>
  )
}

// New: Mobile-optimized card wrapper
export function MobileCardWrapper({ 
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
        "bg-gradient-to-br from-gray-900 to-gray-800",
        "border border-amber-800/20 rounded-lg",
        "shadow-lg",
        padding && "p-4", // Consistent mobile padding
        // Enhanced mobile card styling
        "touch-manipulation", // Better touch handling
        className
      )}
      aria-label="mobile-card-wrapper"
    >
      {children}
    </div>
  )
}

// New: Mobile-optimized button wrapper
export function MobileButtonWrapper({ 
  children, 
  className,
  fullWidth = false
}: {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}) {
  return (
    <div
      className={cn(
        "min-h-[44px]", // Minimum touch target size
        "flex items-center justify-center",
        fullWidth && "w-full",
        // Enhanced mobile button styling
        "touch-manipulation",
        className
      )}
      aria-label="mobile-button-wrapper"
    >
      {children}
    </div>
  )
} 