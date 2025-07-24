'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface RealmAnimationWrapperProps {
  children: React.ReactNode
  isAnimating: boolean
  className?: string
}

export function RealmAnimationWrapper({ 
  children, 
  isAnimating, 
  className = "" 
}: RealmAnimationWrapperProps) {
  const [animationState, setAnimationState] = useState<'idle' | 'starting' | 'animating' | 'ending'>('idle')
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout>()

  // Handle animation state changes
  useEffect(() => {
    if (isAnimating && animationState === 'idle') {
      // Save current scroll position
      setScrollPosition(window.scrollY)
      
      // Start animation sequence
      setAnimationState('starting')
      
      // Begin animation after a brief delay
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationState('animating')
        
        // End animation after transition duration
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationState('ending')
          
          // Complete animation
          animationTimeoutRef.current = setTimeout(() => {
            setAnimationState('idle')
          }, 100)
        }, 500)
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
  }, [animationState])

  // Restore scroll position after animation
  useEffect(() => {
    if (animationState === 'idle' && scrollPosition > 0) {
      window.scrollTo(0, scrollPosition)
      setScrollPosition(0)
    }
  }, [animationState, scrollPosition])

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
        "flex flex-col h-screen bg-gray-900 text-white relative",
        getAnimationClasses(),
        className
      )}
      style={getAnimationStyles()}
      aria-label="realm-map-section"
    >
      {/* Animation overlay */}
      {animationState === 'animating' && (
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 pointer-events-none"
          style={{
            animation: 'fadeInOut 0.5s ease-in-out'
          }}
        />
      )}
      
      {children}
      
      {/* Animation indicator */}
      {animationState === 'animating' && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500/90 text-black px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Loading...
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