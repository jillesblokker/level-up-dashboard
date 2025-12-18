'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface RealmAnimationWrapperProps {
  children: React.ReactNode
  isAnimating: boolean
  className?: string
  onImageReveal?: (shouldReveal: boolean) => void
}

export function RealmAnimationWrapper({
  children,
  isAnimating,
  className = "",
  onImageReveal
}: RealmAnimationWrapperProps) {
  const [animationState, setAnimationState] = useState<'idle' | 'starting' | 'animating' | 'ending'>('idle')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [hasScrolledToTop, setHasScrolledToTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout>()

  // Smooth scroll to top function
  const smoothScrollToTop = (duration: number = 1000) => {
    const startPosition = window.scrollY
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const easedProgress = easeInOutCubic(progress)

      const newPosition = startPosition - (startPosition * easedProgress)
      window.scrollTo(0, newPosition)

      // Update scroll progress for visual feedback
      setScrollProgress(progress * 100)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        setHasScrolledToTop(true)
        setScrollProgress(100)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // Scroll to show header function (scrolls to just show the header, not all the way to top)
  const scrollToShowHeader = (duration: number = 800) => {
    const startPosition = window.scrollY
    const targetPosition = 0 // Scroll to very top to show header image
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const easedProgress = easeInOutCubic(progress)

      const newPosition = startPosition + (targetPosition - startPosition) * easedProgress
      window.scrollTo(0, newPosition)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // Scroll down to show content function
  const scrollDownToContent = (duration: number = 500) => {
    const headerHeight = 400 // Approximate header height
    const startPosition = window.scrollY
    const targetPosition = headerHeight
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const easedProgress = easeInOutCubic(progress)

      const newPosition = startPosition + (targetPosition - startPosition) * easedProgress
      window.scrollTo(0, newPosition)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // Handle animation state changes
  useEffect(() => {
    if (isAnimating && animationState === 'idle') {
      // Save current scroll position
      setScrollPosition(window.scrollY)

      // Start animation sequence
      setAnimationState('starting')

      // Begin smooth scroll to top
      smoothScrollToTop(500)

      // Begin animation after scroll starts
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationState('animating')

        // End animation after transition duration
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationState('ending')

          // Complete animation and trigger image reveal
          animationTimeoutRef.current = setTimeout(() => {
            setAnimationState('idle')

            // Trigger image reveal immediately so header image is visible
            onImageReveal?.(true)

            // First, scroll down to show content (buttons and grid)
            scrollDownToContent(600)

            // After 0.4 seconds, scroll to show header image
            setTimeout(() => {
              scrollToShowHeader(800)
            }, 400)
          }, 100)
        }, 800)
      }, 50)
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [isAnimating, animationState])

  // Prevent scrolling during animation
  useEffect(() => {
    if (animationState === 'animating') {
      // Store current scroll position
      const currentScroll = window.scrollY

      // Prevent scrolling
      const preventScroll = (e: Event) => {
        e.preventDefault()
        window.scrollTo(0, currentScroll)
      }

      // Add event listeners
      document.addEventListener('wheel', preventScroll, { passive: false })
      document.addEventListener('touchmove', preventScroll, { passive: false })
      document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
          e.preventDefault()
        }
      })

      return () => {
        document.removeEventListener('wheel', preventScroll)
        document.removeEventListener('touchmove', preventScroll)
      }
    }

    // Return empty cleanup function when not animating
    return () => { }
  }, [animationState])

  // Restore scroll position after animation (only if not scrolled to top)
  useEffect(() => {
    if (animationState === 'idle' && scrollPosition > 0 && !hasScrolledToTop) {
      window.scrollTo(0, scrollPosition)
      setScrollPosition(0)
    }
  }, [animationState, scrollPosition, hasScrolledToTop])

  const getAnimationClasses = () => {
    switch (animationState) {
      case 'starting':
        return 'transition-all duration-300 ease-out'
      case 'animating':
        return 'overflow-hidden pointer-events-none transition-all duration-500 ease-in-out'
      case 'ending':
        return 'transition-all duration-200 ease-in'
      default:
        return ''
    }
  }

  const getAnimationStyles = () => {
    if (animationState === 'animating') {
      return {
        transform: 'scale(0.98)',
        filter: 'brightness(0.95)',
        transition: 'all 0.5s ease-in-out'
      }
    }
    return {
      transform: 'scale(1)',
      filter: 'brightness(1)',
      transition: 'all 0.3s ease-out'
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col min-h-screen text-white relative",
        getAnimationClasses(),
        className
      )}
      style={getAnimationStyles()}
      aria-label="realm-map-section"
    >
      {/* Animation overlay */}
      {animationState === 'animating' && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] pointer-events-none"
          style={{
            animation: 'fadeInOut 0.5s ease-in-out'
          }}
        />
      )}

      {children}

      {/* Animation indicator */}
      {animationState === 'animating' && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500/90 text-black px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Revealing Realm... {Math.round(scrollProgress)}%
        </div>
      )}

      {/* Scroll progress bar */}
      {animationState === 'animating' && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
          <div
            className="h-full bg-amber-500 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Add CSS animation for the overlay
const animationStyles = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
`

// Inject styles if not already present
if (typeof document !== 'undefined') {
  const styleId = 'realm-animation-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = animationStyles
    document.head.appendChild(style)
  }
} 